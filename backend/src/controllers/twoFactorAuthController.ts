import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper function to generate recovery codes
function generateRecoveryCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate a random 8-character code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

export const twoFactorAuthController = {
  async generateSecret(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const secret = authenticator.generateSecret();
      // I will use "MondayClone" as the app name for the OTP authenticator URI.
      const otpauth = authenticator.keyuri(user.email, 'MondayClone', secret);

      // Temporarily store the secret before it's verified and enabled.
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorSecret: secret },
      });

      const qrCodeDataURL = await qrcode.toDataURL(otpauth);

      res.json({
        success: true,
        data: {
          secret, // For manual entry in authenticator apps
          qrCodeDataURL,
        },
      });
    } catch (error) {
      console.error('2FA secret generation error:', error);
      res.status(500).json({ success: false, error: 'Failed to generate 2FA secret' });
    }
  },

  async verifyAndEnable(req: AuthRequest, res: Response) {
    try {
        const userId = req.userId;
        const { token } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        if (!token) {
            return res.status(400).json({ success: false, error: 'Token is required' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorSecret) {
            return res.status(400).json({ success: false, error: '2FA setup has not been initiated or secret is missing.' });
        }

        const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });

        if (isValid) {
            // Generate recovery codes
            const recoveryCodes = generateRecoveryCodes(10);
            
            await prisma.user.update({
                where: { id: userId },
                data: { 
                    isTwoFactorEnabled: true,
                    twoFactorRecoveryCodes: recoveryCodes
                },
            });
            
            res.json({ 
                success: true, 
                message: '2FA has been enabled successfully.',
                data: {
                    recoveryCodes // Return these to the user once so they can save them
                }
            });
        } else {
            res.status(400).json({ success: false, error: 'Invalid token. Please try again.' });
        }
    } catch (error) {
        console.error('2FA verification error:', error);
        res.status(500).json({ success: false, error: 'Failed to verify 2FA token' });
    }
  },

  async disableTwoFactorAuth(req: AuthRequest, res: Response) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                isTwoFactorEnabled: false,
                twoFactorSecret: null,
                twoFactorRecoveryCodes: [],
            },
        });

        res.json({ success: true, message: '2FA has been disabled.' });
    } catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({ success: false, error: 'Failed to disable 2FA' });
    }
  },
};


