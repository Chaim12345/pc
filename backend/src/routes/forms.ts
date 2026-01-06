import express from 'express';
import { formsController } from '../controllers/forms';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes (no auth)
router.get('/public/:token', formsController.getByToken);
router.post('/public/:token/submit', formsController.submit);

// Protected routes
router.use(authenticate);

router.get('/board/:boardId', formsController.getByBoard);
router.get('/:id', formsController.getById);
router.post('/', formsController.create);
router.put('/:id', formsController.update);
router.delete('/:id', formsController.delete);
router.get('/:id/submissions', formsController.getSubmissions);
router.get('/:id/analytics', formsController.getAnalytics);

export default router;








