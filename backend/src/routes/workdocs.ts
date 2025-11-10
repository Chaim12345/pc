import express from 'express';
import { workdocController } from '../controllers/workdocs';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', workdocController.getAll);
router.get('/:id', workdocController.getById);
router.post('/', workdocController.create);
router.put('/:id', workdocController.update);
router.delete('/:id', workdocController.delete);

// Share endpoints
router.post('/:id/share', workdocController.share);
router.post('/:id/share-link', workdocController.generateShareLink);
router.get('/:id/shares', workdocController.getShares);
router.delete('/:id/shares/:shareId', workdocController.revokeShare);

export default router;

