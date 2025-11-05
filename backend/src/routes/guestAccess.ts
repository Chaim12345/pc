import express from 'express';
import { guestAccessController } from '../controllers/guestAccess';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes (no auth)
router.get('/public/:token', guestAccessController.getByToken);

// Protected routes
router.use(authenticate);

router.post('/', guestAccessController.create);
router.get('/board/:boardId', guestAccessController.getByBoard);
router.get('/board/:boardId/analytics', guestAccessController.getAnalytics);
router.put('/:id', guestAccessController.update);
router.post('/:id/revoke', guestAccessController.revoke);
router.delete('/:id', guestAccessController.delete);

export default router;



