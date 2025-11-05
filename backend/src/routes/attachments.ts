import { Router } from 'express';
import { attachmentController } from '../controllers/attachments';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/item/:itemId', attachmentController.getByItem);
router.get('/:id/download', attachmentController.download);
router.post('/', upload.single('file'), attachmentController.upload);
router.delete('/:id', attachmentController.delete);

export default router;

