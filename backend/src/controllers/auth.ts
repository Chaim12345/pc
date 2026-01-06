import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { authenticator } from 'otplib';
import { validatePasswordStrength } from '../utils/passwordValidation';
import { recordLoginAttempt, isAccountLocked, getRemainingAttempts, clearLoginAttempts } from '../utils/accountLockout';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { emailService } from '../services/emailService';

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

      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User already exists'
        });
      }

      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Password does not meet requirements',
          details: passwordValidation.errors
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          emailVerificationToken,
        },
      });
      
      // Send verification email
      await emailService.sendVerificationEmail(user.email, user.name, emailVerificationToken);

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

      // Get the user's organization membership to include organizationId and role
      const orgMember = await prisma.organizationMember.findFirst({
        where: { userId: user.id, organizationId: organization.id },
        select: { organizationId: true, role: true }
      });

      const updatedUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: orgMember?.role,
        organizationId: orgMember?.organizationId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isTwoFactorEnabled: user.isTwoFactorEnabled
      };

      const token = jwt.sign(
        { userId: updatedUser.id },
        env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        data: {
          user: updatedUser,
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
        await recordLoginAttempt(email, false);
        const remainingAttempts = getRemainingAttempts(email);
        
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0
        });
      }

      await recordLoginAttempt(email, true);
      clearLoginAttempts(email);
      
      if (user.isTwoFactorEnabled) {
        const tempToken = jwt.sign(
          { userId: user.id, twoFactorRequired: true },
          env.JWT_SECRET,
          { expiresIn: '5m' } 
        );

        return res.json({
          success: true,
          data: {
            twoFactorRequired: true,
            tempToken: tempToken,
          }
        });
      }

      // Get the user's organization membership to include organizationId and role
      const orgMember = await prisma.organizationMember.findFirst({
        where: { userId: user.id },
        select: { organizationId: true, role: true }
      });

      const token = jwt.sign(
        { userId: user.id },
        env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: orgMember?.role,
            organizationId: orgMember?.organizationId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            isTwoFactorEnabled: user.isTwoFactorEnabled
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

      let decoded: any;

      try {
        decoded = jwt.verify(tempToken, env.JWT_SECRET);
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

      // Get the user's organization membership to include organizationId and role
      const orgMember = await prisma.organizationMember.findFirst({
        where: { userId: user.id },
        select: { organizationId: true, role: true }
      });

      const fullAccessToken = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' });

      res.json({
        success: true,
        data: {
           user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: orgMember?.role,
            organizationId: orgMember?.organizationId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            isTwoFactorEnabled: user.isTwoFactorEnabled
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
      
      if (!authReq.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized - No user data found on request' });
      }

      res.json({ success: true, data: authReq.user });
      
    } catch (error: any) {
      logger.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  },

  async requestPasswordReset(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const user = await prisma.user.findUnique({
        where: { email }
      });

      // Don't reveal if user exists or not (security best practice)
      if (!user) {
        return res.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

      // Invalidate any existing reset tokens for this user
      await prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          used: false,
        },
        data: {
          used: true,
        },
      });

      // Create new reset token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt,
        },
      });

      // Send password reset email
      await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    } catch (error: any) {
      logger.error('Request password reset error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process password reset request'
      });
    }
  },

  async verifyPasswordResetToken(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token is required'
        });
      }

      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token'
        });
      }

      res.json({
        success: true,
        message: 'Token is valid'
      });
    } catch (error: any) {
      logger.error('Verify password reset token error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify reset token'
      });
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Token and new password are required'
        });
      }

      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Password does not meet requirements',
          details: passwordValidation.errors
        });
      }

      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password and mark token as used
      await prisma.$transaction([
        prisma.user.update({
          where: { id: resetToken.userId },
          data: { password: hashedPassword },
        }),
        prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { used: true },
        }),
      ]);

      res.json({
        success: true,
        message: 'Password has been reset successfully'
      });
    } catch (error: any) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset password'
      });
    }
  },

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Verification token is required'
        });
      }

      const user = await prisma.user.findFirst({
        where: {
          emailVerificationToken: token,
          emailVerified: false,
        },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired verification token'
        });
      }

      // Verify email
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          emailVerificationToken: null,
        },
      });

      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error: any) {
      logger.error('Verify email error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify email'
      });
    }
  },

  async testEmail(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email address is required'
        });
      }

      // Test email connection first
      const connectionOk = await emailService.verifyConnection();
      
      if (!connectionOk) {
        return res.status(500).json({
          success: false,
          error: 'SMTP connection failed. Please check your SMTP configuration.',
          smtpConfigured: !!env.SMTP_HOST
        });
      }

      // Send test email
      const testHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0073ea; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .success { color: #28a745; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">Monday Clone</h1>
          </div>
          <div class="content">
            <h2>Email Service Test</h2>
            <p class="success">✅ Success!</p>
            <p>This is a test email from your Monday Clone application.</p>
            <p>If you received this email, your SMTP configuration is working correctly!</p>
            <hr>
            <p><strong>Test Details:</strong></p>
            <ul>
              <li>SMTP Host: ${env.SMTP_HOST || 'Not configured'}</li>
              <li>SMTP Port: ${env.SMTP_PORT || 'Not configured'}</li>
              <li>From Address: ${env.FROM_ADDRESS || env.SMTP_USER || 'Not configured'}</li>
              <li>Timestamp: ${new Date().toISOString()}</li>
            </ul>
          </div>
        </body>
        </html>
      `;

      const sent = await emailService.sendEmail({
        to: email,
        subject: 'Test Email - Monday Clone Email Service',
        html: testHtml,
      });

      if (sent) {
        res.json({
          success: true,
          message: `Test email sent successfully to ${email}`,
          smtpConfig: {
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE,
            from: env.FROM_ADDRESS || env.SMTP_USER,
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to send test email. Check server logs for details.'
        });
      }
    } catch (error: any) {
      logger.error('Test email error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send test email'
      });
    }
  },
};