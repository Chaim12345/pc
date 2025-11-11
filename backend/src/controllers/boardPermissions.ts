import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const boardPermissionsController = {
  async getByBoard(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;

      const permissions = await prisma.boardPermission.findMany({
        where: { boardId },
        include: {
          team: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      res.json({ success: true, data: permissions });
    } catch (error: any) {
      logger.error('Get board permissions error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { boardId, userId, teamId, role } = req.body;

      if (!boardId || !role) {
        return res.status(400).json({ success: false, error: 'Board ID and role are required' });
      }

      if (!userId && !teamId) {
        return res.status(400).json({ success: false, error: 'Either userId or teamId is required' });
      }

      const permission = await prisma.boardPermission.create({
        data: {
          boardId,
          ...(userId && { userId }),
          ...(teamId && { teamId }),
          role,
        },
      });

      res.json({ success: true, data: permission });
    } catch (error: any) {
      logger.error('Create board permission error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { permissionId } = req.params;
      const { role } = req.body;

      const permission = await prisma.boardPermission.update({
        where: { id: permissionId },
        data: { role },
      });

      res.json({ success: true, data: permission });
    } catch (error: any) {
      logger.error('Update board permission error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { permissionId } = req.params;

      await prisma.boardPermission.delete({
        where: { id: permissionId },
      });

      res.json({ success: true });
    } catch (error: any) {
      logger.error('Delete board permission error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

