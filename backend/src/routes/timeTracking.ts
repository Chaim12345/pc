import { Router } from 'express';
import { timeTrackingController } from '../controllers/timeTracking';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/item/:itemId', timeTrackingController.getByItem);
router.post('/start', timeTrackingController.start);
router.post('/stop/:id', timeTrackingController.stop);
router.post('/manual', timeTrackingController.createManual);
router.put('/:id', timeTrackingController.update);
router.delete('/:id', timeTrackingController.delete);

export default router;

