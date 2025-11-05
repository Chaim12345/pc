import { Router } from 'express';
import { dashboardController } from '../controllers/dashboards';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', dashboardController.getAll);
router.post('/', dashboardController.create);
router.get('/:id', dashboardController.getById);
router.put('/:id', dashboardController.update);
router.delete('/:id', dashboardController.delete);

export default router;

