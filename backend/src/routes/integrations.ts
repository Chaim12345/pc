import express from 'express';
import { integrationsController } from '../controllers/integrations';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

// CRUD routes for integrations
router.get('/organization/:organizationId', integrationsController.getByOrganization);
router.get('/board/:boardId', integrationsController.getByBoard);
router.post('/', integrationsController.create);
router.put('/:integrationId', integrationsController.update);
router.delete('/:integrationId', integrationsController.delete);

// Slack-specific routes
router.post('/slack/test', integrationsController.testSlackWebhook);
router.post('/slack/notify', integrationsController.sendSlackNotification);

// Teams-specific routes
router.post('/teams/test', integrationsController.testTeamsWebhook);
router.post('/teams/notify', integrationsController.sendTeamsNotification);

export default router;

