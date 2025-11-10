import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticator } from 'otplib';
import { validatePasswordStrength } from '../utils/passwordValidation';
import { recordLoginAttempt, isAccountLocked, getRemainingAttempts, clearLoginAttempts } from '../utils/accountLockout';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          error: 'Email, password, and name are required'
        });
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User already exists'
        });
      }

      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Password does not meet requirements',
          details: passwordValidation.errors
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // Create default organization
      const organization = await prisma.organization.create({
        data: {
          name: `${name}'s Workspace`,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER'
            }
          }
        }
      });

      // Generate JWT
      const jwtSecret: Secret = process.env.JWT_SECRET ?? 'secret';
      const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];
      const signOptions: SignOptions = { expiresIn: jwtExpiresIn };

      const token = jwt.sign(
        { userId: user.id },
        jwtSecret,
        signOptions
      );

      res.status(201).json({
        success: true,
        data: {
          user,
          organization,
          token
        }
      });
    } catch (error: any) {
      logger.error('Register error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  },
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      // Check if account is locked
      const lockoutStatus = isAccountLocked(email);
      if (lockoutStatus.locked) {
        const minutesRemaining = Math.ceil(
          (lockoutStatus.unlockTime!.getTime() - Date.now()) / (60 * 1000)
        );
        return res.status(429).json({
          success: false,
          error: `Account locked due to too many failed login attempts. Please try again in ${minutesRemaining} minute(s).`
        });
      }

      const user = await prisma.user.findUnique({
        where: { email }
      });

      const isPasswordValid = user && await bcrypt.compare(password, user.password);

      if (!user || !isPasswordValid) {
        // Record failed attempt
        await recordLoginAttempt(email, false);
        const remainingAttempts = getRemainingAttempts(email);
        
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0
        });
      }

      // Record successful attempt and clear failed attempts
      await recordLoginAttempt(email, true);
      clearLoginAttempts(email);
      
      if (user.isTwoFactorEnabled) {
        // User has 2FA enabled, so we need to prompt for a token
        // Issue a temporary token that's only valid for 2FA verification
        const jwtSecret: Secret = process.env.JWT_SECRET ?? 'secret';
        const tempToken = jwt.sign(
          { userId: user.id, twoFactorRequired: true },
          jwtSecret,
          { expiresIn: '5m' } // Short expiry for the temp token
        );

        return res.json({
          success: true,
          data: {
            twoFactorRequired: true,
            tempToken: tempToken,
          }
        });
      }

      // 2FA is not enabled, proceed with normal login
      const jwtSecret: Secret = process.env.JWT_SECRET ?? 'secret';
      const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];
      const signOptions: SignOptions = { expiresIn: jwtExpiresIn };

      const token = jwt.sign(
        { userId: user.id },
        jwtSecret,
        signOptions
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            isTwoFactorEnabled: user.isTwoFactorEnabled,
          },
          token
        }
      });
    } catch (error: any) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  },

  async verifyTwoFactor(req: Request, res: Response) {
    try {
      const { tempToken, token } = req.body;

      if (!tempToken || !token) {
        return res.status(400).json({ success: false, error: 'Temporary token and 2FA token are required.' });
      }

      const jwtSecret: Secret = process.env.JWT_SECRET ?? 'secret';
      let decoded: any;

      try {
        decoded = jwt.verify(tempToken, jwtSecret);
      } catch (error) {
        return res.status(401).json({ success: false, error: 'Invalid or expired temporary token.' });
      }

      if (!decoded.userId || !decoded.twoFactorRequired) {
        return res.status(401).json({ success: false, error: 'Invalid temporary token.' });
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

      if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
        return res.status(400).json({ success: false, error: '2FA is not enabled for this user.' });
      }

      const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });

      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid 2FA token.' });
      }

      // 2FA token is valid, issue a full-access JWT
      const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];
      const signOptions: SignOptions = { expiresIn: jwtExpiresIn };
      const fullAccessToken = jwt.sign({ userId: user.id }, jwtSecret, signOptions);

      res.json({
        success: true,
        data: {
           user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            isTwoFactorEnabled: user.isTwoFactorEnabled,
          },
          token: fullAccessToken,
        },
      });

    } catch (error) {
      logger.error('2FA verification error:', error);
      res.status(500).json({ success: false, error: 'Failed to verify 2FA token.' });
    }
  },

  async getCurrentUser(req: Request, res: Response) {
    try {
      const authReq = req as any;
      const userId = authReq.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          isTwoFactorEnabled: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error: any) {
      logger.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }
};

