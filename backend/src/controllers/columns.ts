import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { executeAutomations } from '../services/automationService';
import { AutomationTriggerType } from '@monday-clone/shared';

const prisma = new PrismaClient();

export const columnController = {
  async getByBoard(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;

      const columns = await prisma.column.findMany({
        where: { boardId },
        orderBy: { position: 'asc' }
      });

      res.json({ success: true, data: columns });
    } catch (error: any) {
      console.error('Get columns error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { boardId, title, type, position, settings } = req.body;

      // Get max position if not provided
      let columnPosition = position;
      if (columnPosition === undefined) {
        const maxColumn = await prisma.column.findFirst({
          where: { boardId },
          orderBy: { position: 'desc' }
        });
        columnPosition = maxColumn ? maxColumn.position + 1 : 0;
      }

      const column = await prisma.column.create({
        data: {
          boardId,
          title,
          type,
          position: columnPosition,
          settings: settings || {}
        }
      });

      res.status(201).json({ success: true, data: column });
    } catch (error: any) {
      console.error('Create column error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title, type, position, settings } = req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (type !== undefined) updateData.type = type;
      if (position !== undefined) updateData.position = position;
      if (settings !== undefined) updateData.settings = settings;

      const column = await prisma.column.update({
        where: { id },
        data: updateData
      });

      res.json({ success: true, data: column });
    } catch (error: any) {
      console.error('Update column error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.column.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Column deleted' });
    } catch (error: any) {
      console.error('Delete column error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateValue(req: AuthRequest, res: Response) {
    try {
      const { id: columnId } = req.params;
      const { itemId, value } = req.body;

      const columnValue = await prisma.columnValue.upsert({
        where: {
          itemId_columnId: {
            itemId,
            columnId
          }
        },
        update: { value },
        create: {
          itemId,
          columnId,
          value
        },
        include: {
          column: true,
          item: {
            select: { boardId: true }
          }
        }
      });

      // Trigger automations
      if (columnValue.item.boardId) {
        const oldValue = await prisma.columnValue.findUnique({
          where: {
            itemId_columnId: {
              itemId,
              columnId
            }
          }
        });

        executeAutomations(columnValue.item.boardId, AutomationTriggerType.COLUMN_VALUE_CHANGED, {
          itemId,
          columnId,
          oldValue: oldValue?.value,
          newValue: value
        }).catch(err => console.error('Automation error:', err));

        // Also trigger status changed if it's a status column
        if (columnValue.column.type === 'STATUS') {
          executeAutomations(columnValue.item.boardId, AutomationTriggerType.STATUS_CHANGED, {
            itemId,
            columnId,
            oldValue: oldValue?.value,
            newValue: value
          }).catch(err => console.error('Automation error:', err));
        }
      }

      res.json({ success: true, data: columnValue });
    } catch (error: any) {
      console.error('Update column value error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

