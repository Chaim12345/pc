import { Express } from 'express';
import authRoutes from './auth';
import organizationRoutes from './organizations';
import boardRoutes from './boards';
import groupRoutes from './groups';
import itemRoutes from './items';
import columnRoutes from './columns';
import commentRoutes from './comments';
import attachmentRoutes from './attachments';
import automationRoutes from './automations';
import dashboardRoutes from './dashboards';
import timeTrackingRoutes from './timeTracking';
import webhookRoutes from './webhooks';
import notificationRoutes from './notifications';
import usersRoutes from './users';
import teamsRoutes from './teams';

export function setupRoutes(app: Express) {
  app.use('/api/auth', authRoutes);
  app.use('/api/organizations', organizationRoutes);
  app.use('/api/boards', boardRoutes);
  app.use('/api/groups', groupRoutes);
  app.use('/api/items', itemRoutes);
  app.use('/api/columns', columnRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/attachments', attachmentRoutes);
  app.use('/api/automations', automationRoutes);
  app.use('/api/dashboards', dashboardRoutes);
  app.use('/api/time-tracking', timeTrackingRoutes);
  app.use('/api/webhooks', webhookRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/teams', teamsRoutes);
}

