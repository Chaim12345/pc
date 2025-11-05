import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const whiteboardsController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const { organizationId } = req.query;

      const whiteboards = await prisma.whiteboard.findMany({
        where: organizationId ? { organizationId: organizationId as string } : undefined,
        orderBy: { updatedAt: 'desc' }
      });

      res.json({ success: true, data: whiteboards });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const whiteboard = await prisma.whiteboard.findUnique({
        where: { id }
      });

      if (!whiteboard) {
        return res.status(404).json({ success: false, error: 'Whiteboard not found' });
      }

      res.json({ success: true, data: whiteboard });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { name, organizationId, content } = req.body;
      const userId = req.userId!;

      const whiteboard = await prisma.whiteboard.create({
        data: {
          name,
          organizationId,
          createdById: userId,
          content: content || {}
        }
      });

      res.status(201).json({ success: true, data: whiteboard });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, content } = req.body;

      const whiteboard = await prisma.whiteboard.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(content && { content })
        }
      });

      res.json({ success: true, data: whiteboard });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.whiteboard.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Whiteboard deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

