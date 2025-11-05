import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const workdocController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;

      // Get user's organizations
      const orgMemberships = await prisma.organizationMember.findMany({
        where: { userId },
        select: { organizationId: true }
      });

      const orgIds = orgMemberships.map(m => m.organizationId);

      const workdocs = await prisma.workdoc.findMany({
        where: {
          organizationId: { in: orgIds }
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      res.json({ success: true, data: workdocs });
    } catch (error: any) {
      console.error('Get workdocs error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const workdoc = await prisma.workdoc.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      });

      if (!workdoc) {
        return res.status(404).json({ success: false, error: 'Workdoc not found' });
      }

      res.json({ success: true, data: workdoc });
    } catch (error: any) {
      console.error('Get workdoc error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { title, content, organizationId } = req.body;
      const userId = req.userId!;

      const workdoc = await prisma.workdoc.create({
        data: {
          title,
          content: content || '',
          organizationId,
          createdById: userId
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      });

      res.status(201).json({ success: true, data: workdoc });
    } catch (error: any) {
      console.error('Create workdoc error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title, content } = req.body;

      const workdoc = await prisma.workdoc.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(content !== undefined && { content }),
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      });

      res.json({ success: true, data: workdoc });
    } catch (error: any) {
      console.error('Update workdoc error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.workdoc.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Workdoc deleted' });
    } catch (error: any) {
      console.error('Delete workdoc error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};



