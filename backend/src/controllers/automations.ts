import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const automationController = {
  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const automation = await prisma.automation.findUnique({
        where: { id }
      });

      if (!automation) {
        return res.status(404).json({ success: false, error: 'Automation not found' });
      }

      res.json({ success: true, data: automation });
    } catch (error: any) {
      logger.error('Get automation error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getByBoard(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;

      const automations = await prisma.automation.findMany({
        where: { boardId },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: automations });
    } catch (error: any) {
      logger.error('Get automations error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { boardId, name, trigger, actions, enabled } = req.body;

      const automation = await prisma.automation.create({
        data: {
          boardId,
          name,
          trigger,
          actions,
          enabled: enabled !== undefined ? enabled : true
        }
      });

      res.status(201).json({ success: true, data: automation });
    } catch (error: any) {
      logger.error('Create automation error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, trigger, actions, enabled } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (trigger !== undefined) updateData.trigger = trigger;
      if (actions !== undefined) updateData.actions = actions;
      if (enabled !== undefined) updateData.enabled = enabled;

      const automation = await prisma.automation.update({
        where: { id },
        data: updateData
      });

      res.json({ success: true, data: automation });
    } catch (error: any) {
      logger.error('Update automation error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.automation.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Automation deleted' });
    } catch (error: any) {
      logger.error('Delete automation error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async execute(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const automation = await prisma.automation.findUnique({
        where: { id }
      });

      if (!automation || !automation.enabled) {
        return res.status(400).json({
          success: false,
          error: 'Automation not found or disabled'
        });
      }

      // Execute automation logic here
      // This would check triggers and execute actions
      // For now, just return success

      res.json({ success: true, message: 'Automation executed' });
    } catch (error: any) {
      logger.error('Execute automation error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

