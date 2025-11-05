import { Router } from 'express';
import { webhookController } from '../controllers/webhooks';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', webhookController.create);
router.post('/trigger', webhookController.trigger);

export default router;



