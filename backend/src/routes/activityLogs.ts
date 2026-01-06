import express from 'express';
import { activityLogsController } from '../controllers/activityLogs';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', activityLogsController.getAll);
router.get('/board/:boardId', activityLogsController.getByBoard);
router.get('/item/:itemId', activityLogsController.getByItem);
router.get('/export', activityLogsController.export);

export default router;








