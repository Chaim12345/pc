import express from 'express';
import { aiController } from '../controllers/ai';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

// AI endpoints
router.post('/suggestions/:boardId', aiController.getSuggestions);
router.post('/suggest-assignee/:itemId', aiController.suggestAssignee);
router.post('/predict-due-date/:boardId', aiController.predictDueDate);
router.post('/categorize', aiController.categorizeItem);
router.post('/generate-description', aiController.generateDescription);

export default router;
