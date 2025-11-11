import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const organizationController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;

      const memberships = await prisma.organizationMember.findMany({
        where: { userId },
        include: {
          organization: true
        }
      });

      const organizations = memberships.map(m => m.organization);

      res.json({ success: true, data: organizations });
    } catch (error: any) {
      logger.error('Get organizations error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const membership = await prisma.organizationMember.findFirst({
        where: {
          organizationId: id,
          userId
        },
        include: {
          organization: true
        }
      });

      if (!membership) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      res.json({ success: true, data: membership.organization });
    } catch (error: any) {
      logger.error('Get organization error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      const userId = req.userId!;

      const organization = await prisma.organization.create({
        data: {
          name,
          members: {
            create: {
              userId,
              role: 'OWNER'
            }
          }
        }
      });

      res.status(201).json({ success: true, data: organization });
    } catch (error: any) {
      logger.error('Create organization error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const organization = await prisma.organization.update({
        where: { id },
        data: { name }
      });

      res.json({ success: true, data: organization });
    } catch (error: any) {
      logger.error('Update organization error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.organization.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Organization deleted' });
    } catch (error: any) {
      logger.error('Delete organization error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

