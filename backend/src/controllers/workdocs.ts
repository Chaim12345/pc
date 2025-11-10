import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

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
      logger.error('Get workdocs error:', error);
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
      logger.error('Get workdoc error:', error);
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
      logger.error('Create workdoc error:', error);
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
      logger.error('Update workdoc error:', error);
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
      logger.error('Delete workdoc error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async share(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { email, accessLevel } = req.body;
      const userId = req.userId!;

      // Verify workdoc exists and user has access
      const workdoc = await prisma.workdoc.findUnique({
        where: { id },
        include: {
          organization: {
            include: {
              members: {
                where: { userId }
              }
            }
          }
        }
      });

      if (!workdoc) {
        return res.status(404).json({ success: false, error: 'Workdoc not found' });
      }

      // Check if user has access to organization
      if (!workdoc.organization.members.length) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      // For now, return success with a share token
      // In a full implementation, you'd store this in a WorkdocShare table
      const shareToken = `wd_${id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const shareLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/workdocs/shared/${shareToken}`;

      res.json({
        success: true,
        data: {
          email,
          accessLevel: accessLevel || 'view',
          shareLink,
          token: shareToken
        }
      });
    } catch (error: any) {
      logger.error('Share workdoc error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async generateShareLink(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const workdoc = await prisma.workdoc.findUnique({
        where: { id },
        include: {
          organization: {
            include: {
              members: {
                where: { userId }
              }
            }
          }
        }
      });

      if (!workdoc) {
        return res.status(404).json({ success: false, error: 'Workdoc not found' });
      }

      if (!workdoc.organization.members.length) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const shareToken = `wd_${id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const shareLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/workdocs/shared/${shareToken}`;

      res.json({
        success: true,
        data: {
          shareLink,
          token: shareToken
        }
      });
    } catch (error: any) {
      logger.error('Generate share link error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getShares(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const workdoc = await prisma.workdoc.findUnique({
        where: { id },
        include: {
          organization: {
            include: {
              members: {
                where: { userId }
              }
            }
          }
        }
      });

      if (!workdoc) {
        return res.status(404).json({ success: false, error: 'Workdoc not found' });
      }

      if (!workdoc.organization.members.length) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      // Return empty array for now - in full implementation, query WorkdocShare table
      res.json({ success: true, data: [] });
    } catch (error: any) {
      logger.error('Get shares error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async revokeShare(req: AuthRequest, res: Response) {
    try {
      const { id, shareId } = req.params;
      const userId = req.userId!;

      const workdoc = await prisma.workdoc.findUnique({
        where: { id },
        include: {
          organization: {
            include: {
              members: {
                where: { userId }
              }
            }
          }
        }
      });

      if (!workdoc) {
        return res.status(404).json({ success: false, error: 'Workdoc not found' });
      }

      if (!workdoc.organization.members.length) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      // In full implementation, delete from WorkdocShare table
      res.json({ success: true, message: 'Share revoked' });
    } catch (error: any) {
      logger.error('Revoke share error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};



