import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const webhookController = {
  async create(req: AuthRequest, res: Response) {
    try {
      const { boardId, url, events } = req.body;
      const userId = req.userId!;

      // For now, store webhooks in a simple way
      // In production, you'd want a Webhook table
      const webhook = {
        id: `webhook_${Date.now()}`,
        boardId,
        url,
        events: events || ['item.created', 'item.updated'],
        userId,
        createdAt: new Date()
      };

      res.status(201).json({ success: true, data: webhook });
    } catch (error: any) {
      logger.error('Create webhook error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async trigger(req: AuthRequest, res: Response) {
    try {
      const { boardId, event, data } = req.body;

      // In production, fetch webhooks from database
      // For now, just return success
      // The actual webhook triggering would happen in event handlers

      res.json({ success: true, message: 'Webhook triggered' });
    } catch (error: any) {
      logger.error('Trigger webhook error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

// Helper function to trigger webhooks (called from other controllers)
export async function triggerWebhooks(boardId: string, event: string, data: any) {
  try {
    // In production, fetch webhooks from database and send HTTP requests
    // For now, this is a placeholder
  } catch (error) {
    logger.error('Error triggering webhooks:', { error, boardId, event });
  }
}

