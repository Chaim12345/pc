import express from 'express';
import { templatesController } from '../controllers/templates';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', templatesController.getAll);
router.get('/category/:category', templatesController.getByCategory);
router.get('/:templateId', templatesController.getById);
router.post('/:templateId/create-board', templatesController.createBoardFromTemplate);

export default router;

