import express from 'express';
import { recurringTasksController } from '../controllers/recurringTasks';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public endpoint for scheduler
router.post('/run-due', recurringTasksController.runDue);

// Protected routes
router.use(authenticate);

router.post('/', recurringTasksController.create);
router.get('/board/:boardId', recurringTasksController.getByBoard);
router.put('/:id', recurringTasksController.update);
router.delete('/:id', recurringTasksController.delete);

export default router;



