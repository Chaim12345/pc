import { Router } from 'express';
import { automationController } from '../controllers/automations';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/board/:boardId', automationController.getByBoard);
router.get('/:id', automationController.getById);
router.post('/', automationController.create);
router.put('/:id', automationController.update);
router.delete('/:id', automationController.delete);
router.post('/:id/execute', automationController.execute);

export default router;

