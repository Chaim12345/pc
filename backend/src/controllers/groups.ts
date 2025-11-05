import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const groupController = {
  async getByBoard(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;

      const groups = await prisma.group.findMany({
        where: { boardId },
        include: {
          items: {
            include: {
              columnValues: {
                include: {
                  column: true
                }
              }
            },
            orderBy: { position: 'asc' }
          }
        },
        orderBy: { position: 'asc' }
      });

      res.json({ success: true, data: groups });
    } catch (error: any) {
      console.error('Get groups error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { boardId, title, position } = req.body;

      let groupPosition = position;
      if (groupPosition === undefined) {
        const maxGroup = await prisma.group.findFirst({
          where: { boardId },
          orderBy: { position: 'desc' }
        });
        groupPosition = maxGroup ? maxGroup.position + 1 : 0;
      }

      const group = await prisma.group.create({
        data: {
          boardId,
          title,
          position: groupPosition
        }
      });

      res.status(201).json({ success: true, data: group });
    } catch (error: any) {
      console.error('Create group error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title, position } = req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (position !== undefined) updateData.position = position;

      const group = await prisma.group.update({
        where: { id },
        data: updateData
      });

      res.json({ success: true, data: group });
    } catch (error: any) {
      console.error('Update group error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.group.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Group deleted' });
    } catch (error: any) {
      console.error('Delete group error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

