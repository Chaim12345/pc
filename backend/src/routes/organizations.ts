import { Router } from 'express';
import { organizationController } from '../controllers/organizations';
import { dashboardController } from '../controllers/dashboards';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', organizationController.getAll);
router.get('/:id', organizationController.getById);
router.post('/', organizationController.create);
router.put('/:id', organizationController.update);
router.delete('/:id', organizationController.delete);

// Organization dashboards route
router.get('/:organizationId/dashboards', dashboardController.getAll);

export default router;

