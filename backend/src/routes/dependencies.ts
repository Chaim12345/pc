import express from 'express';
import { dependenciesController } from '../controllers/dependencies';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.post('/', dependenciesController.create);
router.get('/item/:itemId', dependenciesController.getByItem);
router.get('/board/:boardId', dependenciesController.getByBoard);
router.get('/board/:boardId/critical-path', dependenciesController.getCriticalPath);
router.get('/board/:boardId/blocked', dependenciesController.getBlockedItems);
router.delete('/:id', dependenciesController.delete);

export default router;



