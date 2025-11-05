import { Router } from 'express';
import { groupController } from '../controllers/groups';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/board/:boardId', groupController.getByBoard);
router.post('/', groupController.create);
router.put('/:id', groupController.update);
router.delete('/:id', groupController.delete);

export default router;

