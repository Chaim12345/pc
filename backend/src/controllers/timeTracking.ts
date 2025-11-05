import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const timeTrackingController = {
  async getByItem(req: AuthRequest, res: Response) {
    try {
      const { itemId } = req.params;

      const entries = await prisma.timeEntry.findMany({
        where: { itemId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: entries });
    } catch (error: any) {
      console.error('Get time entries error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async start(req: AuthRequest, res: Response) {
    try {
      const { itemId } = req.body;
      const userId = req.userId!;

      // Check if there's an active timer
      const activeEntry = await prisma.timeEntry.findFirst({
        where: {
          itemId,
          userId,
          endTime: null
        }
      });

      if (activeEntry) {
        return res.status(400).json({
          success: false,
          error: 'Timer already running for this item'
        });
      }

      const entry = await prisma.timeEntry.create({
        data: {
          itemId,
          userId,
          startTime: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      });

      res.status(201).json({ success: true, data: entry });
    } catch (error: any) {
      console.error('Start timer error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async stop(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const entry = await prisma.timeEntry.findUnique({
        where: { id }
      });

      if (!entry || entry.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Time entry not found'
        });
      }

      if (entry.endTime) {
        return res.status(400).json({
          success: false,
          error: 'Timer already stopped'
        });
      }

      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - entry.startTime.getTime()) / 1000);

      const updatedEntry = await prisma.timeEntry.update({
        where: { id },
        data: {
          endTime,
          duration
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      });

      res.json({ success: true, data: updatedEntry });
    } catch (error: any) {
      console.error('Stop timer error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async createManual(req: AuthRequest, res: Response) {
    try {
      const { itemId, duration, description, startTime } = req.body;
      const userId = req.userId!;

      const entry = await prisma.timeEntry.create({
        data: {
          itemId,
          userId,
          startTime: startTime ? new Date(startTime) : new Date(),
          endTime: startTime && duration ? new Date(new Date(startTime).getTime() + duration * 1000) : undefined,
          duration,
          description
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      });

      res.status(201).json({ success: true, data: entry });
    } catch (error: any) {
      console.error('Create manual entry error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { duration, description } = req.body;

      const entry = await prisma.timeEntry.update({
        where: { id },
        data: {
          duration,
          description
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      });

      res.json({ success: true, data: entry });
    } catch (error: any) {
      console.error('Update time entry error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.timeEntry.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Time entry deleted' });
    } catch (error: any) {
      console.error('Delete time entry error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

