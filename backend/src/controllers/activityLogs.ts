import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const activityLogsController = {
  // Log activity (utility function - can be called internally)
  async log(data: {
    userId?: string;
    organizationId: string;
    boardId?: string;
    itemId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }) {
    try {
      return await prisma.activityLog.create({ data });
    } catch (error) {
      console.error('Activity log error:', error);
    }
  },

  // Get activity logs with filters
  async getAll(req: AuthRequest, res: Response) {
    try {
      const { 
        organizationId,
        boardId,
        itemId,
        userId,
        action,
        entityType,
        startDate,
        endDate,
        page = 1,
        limit = 50
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const where: any = {};
      
      if (organizationId) where.organizationId = organizationId as string;
      if (boardId) where.boardId = boardId as string;
      if (itemId) where.itemId = itemId as string;
      if (userId) where.userId = userId as string;
      if (action) where.action = action as string;
      if (entityType) where.entityType = entityType as string;
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
          where,
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
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * limitNum,
          take: limitNum
        }),
        prisma.activityLog.count({ where })
      ]);

      res.json({
        success: true,
        data: logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error: any) {
      console.error('Get activity logs error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get logs for a specific board
  async getByBoard(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;
      const { page = 1, limit = 50, action, entityType } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const where: any = { boardId };
      if (action) where.action = action as string;
      if (entityType) where.entityType = entityType as string;

      const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
          where,
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
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * limitNum,
          take: limitNum
        }),
        prisma.activityLog.count({ where })
      ]);

      res.json({
        success: true,
        data: logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error: any) {
      console.error('Get board activity logs error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get logs for a specific item
  async getByItem(req: AuthRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
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
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * limitNum,
          take: limitNum
        }),
        prisma.activityLog.count({ where: { itemId } })
      ]);

      res.json({
        success: true,
        data: logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error: any) {
      console.error('Get item activity logs error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Export activity logs
  async export(req: AuthRequest, res: Response) {
    try {
      const { organizationId, boardId, startDate, endDate, format = 'json' } = req.query;

      const where: any = {};
      if (organizationId) where.organizationId = organizationId as string;
      if (boardId) where.boardId = boardId as string;
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const logs = await prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10000 // Limit to 10k records for export
      });

      if (format === 'csv') {
        // Convert to CSV
        const csv = convertToCSV(logs);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=activity_logs_${Date.now()}.csv`);
        res.send(csv);
      } else {
        // Return JSON
        res.json({ success: true, data: logs });
      }
    } catch (error: any) {
      console.error('Export activity logs error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

function convertToCSV(logs: any[]): string {
  const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Board ID', 'Item ID'];
  const rows = logs.map(log => [
    log.createdAt.toISOString(),
    log.user?.name || 'System',
    log.action,
    log.entityType,
    log.entityId || '',
    log.boardId || '',
    log.itemId || ''
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
}





