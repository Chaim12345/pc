import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { SlackService } from '../services/slackService';
import { TeamsService } from '../services/teamsService';

const prisma = new PrismaClient();

export const integrationsController = {
  // Get all integrations for an organization
  async getByOrganization(req: AuthRequest, res: Response) {
    try {
      const { organizationId } = req.params;

      const integrations = await prisma.integrationConfig.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: integrations });
    } catch (error: any) {
      console.error('Get integrations error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get integrations for a specific board
  async getByBoard(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;

      const integrations = await prisma.integrationConfig.findMany({
        where: { boardId },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: integrations });
    } catch (error: any) {
      console.error('Get board integrations error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Create new integration
  async create(req: AuthRequest, res: Response) {
    try {
      const { boardId, organizationId, type, webhookUrl, enabled, events } = req.body;

      if (!organizationId || !type || !webhookUrl) {
        return res.status(400).json({ 
          success: false, 
          error: 'Organization ID, type, and webhook URL are required' 
        });
      }

      const integration = await prisma.integrationConfig.create({
        data: {
          boardId,
          organizationId,
          type,
          webhookUrl,
          enabled: enabled ?? true,
          events: events || []
        }
      });

      res.status(201).json({ success: true, data: integration });
    } catch (error: any) {
      console.error('Create integration error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Update integration
  async update(req: AuthRequest, res: Response) {
    try {
      const { integrationId } = req.params;
      const { webhookUrl, enabled, events } = req.body;

      const integration = await prisma.integrationConfig.update({
        where: { id: integrationId },
        data: {
          ...(webhookUrl && { webhookUrl }),
          ...(enabled !== undefined && { enabled }),
          ...(events && { events })
        }
      });

      res.json({ success: true, data: integration });
    } catch (error: any) {
      console.error('Update integration error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Delete integration
  async delete(req: AuthRequest, res: Response) {
    try {
      const { integrationId } = req.params;

      await prisma.integrationConfig.delete({
        where: { id: integrationId }
      });

      res.json({ success: true, message: 'Integration deleted successfully' });
    } catch (error: any) {
      console.error('Delete integration error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async testSlackWebhook(req: AuthRequest, res: Response) {
    try {
      const { webhookUrl } = req.body;

      if (!webhookUrl) {
        return res.status(400).json({ success: false, error: 'Webhook URL is required' });
      }

      await SlackService.sendNotification(
        webhookUrl,
        '✅ Slack integration is working! Monday Clone is now connected to your workspace.'
      );

      res.json({ success: true, message: 'Test notification sent successfully' });
    } catch (error: any) {
      console.error('Test Slack webhook error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async sendSlackNotification(req: AuthRequest, res: Response) {
    try {
      const { webhookUrl, type, data } = req.body;

      if (!webhookUrl) {
        return res.status(400).json({ success: false, error: 'Webhook URL is required' });
      }

      switch (type) {
        case 'item_created':
          await SlackService.notifyItemCreated(webhookUrl, data);
          break;
        case 'status_changed':
          await SlackService.notifyStatusChanged(webhookUrl, data);
          break;
        case 'comment_added':
          await SlackService.notifyCommentAdded(webhookUrl, data);
          break;
        default:
          await SlackService.sendNotification(webhookUrl, data.message);
      }

      res.json({ success: true, message: 'Notification sent successfully' });
    } catch (error: any) {
      console.error('Send Slack notification error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async testTeamsWebhook(req: AuthRequest, res: Response) {
    try {
      const { webhookUrl } = req.body;

      if (!webhookUrl) {
        return res.status(400).json({ success: false, error: 'Webhook URL is required' });
      }

      await TeamsService.sendNotification(
        webhookUrl,
        '✅ Teams integration is working! Monday Clone is now connected to your workspace.'
      );

      res.json({ success: true, message: 'Test notification sent successfully' });
    } catch (error: any) {
      console.error('Test Teams webhook error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async sendTeamsNotification(req: AuthRequest, res: Response) {
    try {
      const { webhookUrl, type, data } = req.body;

      if (!webhookUrl) {
        return res.status(400).json({ success: false, error: 'Webhook URL is required' });
      }

      switch (type) {
        case 'item_created':
          await TeamsService.notifyItemCreated(webhookUrl, data);
          break;
        case 'status_changed':
          await TeamsService.notifyStatusChanged(webhookUrl, data);
          break;
        case 'comment_added':
          await TeamsService.notifyCommentAdded(webhookUrl, data);
          break;
        default:
          await TeamsService.sendNotification(webhookUrl, data.message);
      }

      res.json({ success: true, message: 'Notification sent successfully' });
    } catch (error: any) {
      console.error('Send Teams notification error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

