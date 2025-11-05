import { Router } from 'express';
import { columnController } from '../controllers/columns';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/board/:boardId', columnController.getByBoard);
router.post('/', columnController.create);
router.put('/:id', columnController.update);
router.delete('/:id', columnController.delete);
router.post('/:id/values', columnController.updateValue);

export default router;

