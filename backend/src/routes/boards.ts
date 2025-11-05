import { Router } from 'express';
import { boardController } from '../controllers/boards';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', boardController.getAll);
router.get('/search', boardController.search);
router.post('/', boardController.create);
router.get('/:id', boardController.getById);
router.put('/:id', boardController.update);
router.delete('/:id', boardController.delete);

export default router;

