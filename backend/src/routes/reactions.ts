import express from 'express';
import { reactionsController } from '../controllers/reactions';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.post('/', reactionsController.addReaction);
router.post('/toggle', reactionsController.toggleReaction);
router.delete('/:reactionId', reactionsController.removeReaction);
router.get('/comment/:commentId', reactionsController.getReactionsByComment);
router.get('/item/:itemId', reactionsController.getReactionsByItem);

export default router;

