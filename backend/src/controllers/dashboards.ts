import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const dashboardController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;

      // Get user's organizations
      const orgMemberships = await prisma.organizationMember.findMany({
        where: { userId },
        select: { organizationId: true }
      });

      const orgIds = orgMemberships.map(m => m.organizationId);

      const dashboards = await prisma.dashboard.findMany({
        where: {
          organizationId: { in: orgIds }
        },
        include: {
          widgets: true
        },
        orderBy: { updatedAt: 'desc' }
      });

      res.json({ success: true, data: dashboards });
    } catch (error: any) {
      console.error('Get dashboards error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const dashboard = await prisma.dashboard.findUnique({
        where: { id },
        include: {
          widgets: true
        }
      });

      if (!dashboard) {
        return res.status(404).json({ success: false, error: 'Dashboard not found' });
      }

      res.json({ success: true, data: dashboard });
    } catch (error: any) {
      console.error('Get dashboard error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { organizationId, name, widgets } = req.body;

      const dashboard = await prisma.dashboard.create({
        data: {
          organizationId,
          name,
          widgets: widgets ? {
            create: widgets
          } : undefined
        },
        include: {
          widgets: true
        }
      });

      res.status(201).json({ success: true, data: dashboard });
    } catch (error: any) {
      console.error('Create dashboard error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, widgets } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;

      const dashboard = await prisma.dashboard.update({
        where: { id },
        data: updateData,
        include: {
          widgets: true
        }
      });

      // Update widgets if provided
      if (widgets) {
        // Delete existing widgets
        await prisma.widget.deleteMany({
          where: { dashboardId: id }
        });

        // Create new widgets
        await prisma.widget.createMany({
          data: widgets.map((w: any) => ({
            ...w,
            dashboardId: id
          }))
        });
      }

      const updatedDashboard = await prisma.dashboard.findUnique({
        where: { id },
        include: {
          widgets: true
        }
      });

      res.json({ success: true, data: updatedDashboard });
    } catch (error: any) {
      console.error('Update dashboard error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.dashboard.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Dashboard deleted' });
    } catch (error: any) {
      console.error('Delete dashboard error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

