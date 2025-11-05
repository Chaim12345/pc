import { Router } from 'express';
import { itemController } from '../controllers/items';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/board/:boardId', itemController.getByBoard);
router.post('/', itemController.create);
router.get('/:id', itemController.getById);
router.put('/:id', itemController.update);
router.delete('/:id', itemController.delete);

export default router;

