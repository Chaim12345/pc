import express from 'express';
import { boardPermissionsController } from '../controllers/boardPermissions';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/board/:boardId', boardPermissionsController.getByBoard);
router.post('/', boardPermissionsController.create);
router.put('/:permissionId', boardPermissionsController.update);
router.delete('/:permissionId', boardPermissionsController.delete);

export default router;

