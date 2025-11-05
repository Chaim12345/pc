import { Router } from 'express';
import { commentController } from '../controllers/comments';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/item/:itemId', commentController.getByItem);
router.post('/', commentController.create);
router.put('/:id', commentController.update);
router.delete('/:id', commentController.delete);

export default router;

