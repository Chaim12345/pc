import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const commentController = {
  async getByItem(req: AuthRequest, res: Response) {
    try {
      const { itemId } = req.params;

      const comments = await prisma.comment.findMany({
        where: {
          itemId,
          parentId: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          replies: {
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
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      res.json({ success: true, data: comments });
    } catch (error: any) {
      console.error('Get comments error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { itemId, text, parentId, mentions } = req.body;
      const userId = req.userId!;

      const comment = await prisma.comment.create({
        data: {
          itemId,
          userId,
          text,
          parentId,
          mentions: mentions || []
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

      res.status(201).json({ success: true, data: comment });
    } catch (error: any) {
      console.error('Create comment error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { text } = req.body;

      const comment = await prisma.comment.update({
        where: { id },
        data: { text },
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

      res.json({ success: true, data: comment });
    } catch (error: any) {
      console.error('Update comment error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.comment.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Comment deleted' });
    } catch (error: any) {
      console.error('Delete comment error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

