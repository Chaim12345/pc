import express from 'express';
import { importExportController } from '../controllers/importExport';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

router.use(authenticate);

// Export routes
router.get('/export/:boardId/excel', importExportController.exportToExcel);
router.get('/export/:boardId/csv', importExportController.exportToCSV);
router.get('/export/:boardId/pdf', importExportController.exportToPDF);

// Template download
router.get('/template/:boardId', importExportController.downloadTemplate);

// Import route (with file upload)
router.post('/import/:boardId', upload.single('file'), importExportController.importData);

export default router;





