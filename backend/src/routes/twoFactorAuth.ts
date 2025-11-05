import { Router } from 'express';
import { twoFactorAuthController } from '../controllers/twoFactorAuthController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Route to generate a 2FA secret and QR code
router.post('/generate', twoFactorAuthController.generateSecret);

// Route to verify the token and enable 2FA
router.post('/verify-enable', twoFactorAuthController.verifyAndEnable);

// Route to disable 2FA
router.post('/disable', twoFactorAuthController.disableTwoFactorAuth);

export default router;


