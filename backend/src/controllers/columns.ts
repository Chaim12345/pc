import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { executeAutomations } from '../services/automationService';
import { AutomationTriggerType } from '@monday-clone/shared';
import { notificationService } from '../services/notificationService';
import { cacheService } from '../services/cacheService';
import { logger } from '../utils/logger';

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
      logger.error('Get columns error:', { error, userId: req.userId, boardId: req.params.boardId });
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
      
      // Invalidate cache
      await cacheService.invalidateBoard(boardId);
    } catch (error: any) {
      logger.error('Create column error:', { error, userId: req.userId, boardId: req.body.boardId });
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
        data: updateData,
        select: { boardId: true }
      });

      const updatedColumn = await prisma.column.findUnique({
        where: { id }
      });

      res.json({ success: true, data: updatedColumn });
      
      // Invalidate cache
      await cacheService.invalidateBoard(column.boardId);
    } catch (error: any) {
      logger.error('Update column error:', { error, userId: req.userId, columnId: req.params.id });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Get boardId before deleting
      const column = await prisma.column.findUnique({
        where: { id },
        select: { boardId: true }
      });

      await prisma.column.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Column deleted' });
      
      // Invalidate cache
      if (column) {
        await cacheService.invalidateBoard(column.boardId);
      }
    } catch (error: any) {
      logger.error('Delete column error:', { error, userId: req.userId, columnId: req.params.id });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateValue(req: AuthRequest, res: Response) {
    try {
      const { id: columnId } = req.params;
      const { itemId, value } = req.body;
      const userId = req.userId!;

      // Get old value before update
      const oldColumnValue = await prisma.columnValue.findUnique({
        where: {
          itemId_columnId: {
            itemId,
            columnId
          }
        },
      });

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
            include: {
              board: true,
            }
          }
        }
      });

      // Get updater info
      const updater = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true },
      });

      // Handle notifications based on column type
      if (columnValue.item.boardId && updater) {
        // PERSON/PEOPLE column - notify assigned users
        if (columnValue.column.type === 'PEOPLE' || columnValue.column.type === 'PERSON') {
          const oldAssignees = oldColumnValue?.value 
            ? (Array.isArray(oldColumnValue.value) ? oldColumnValue.value : [oldColumnValue.value])
            : [];
          const newAssignees = value 
            ? (Array.isArray(value) ? value : [value])
            : [];

          // Find newly assigned users
          const oldAssigneeIds = new Set(
            oldAssignees.map((a: any) => a?.id).filter(Boolean)
          );
          const newAssigneeIds = newAssignees
            .map((a: any) => a?.id)
            .filter((id: string) => id && !oldAssigneeIds.has(id));

          // Notify newly assigned users
          for (const assigneeId of newAssigneeIds) {
            if (assigneeId !== userId) {
              try {
                await notificationService.notifyAssignment(
                  assigneeId,
                  updater.name,
                  itemId,
                  columnValue.item.name,
                  columnValue.item.boardId
                );
              } catch (error) {
                logger.error('Failed to send assignment notification:', { error, assigneeId, itemId });
              }
            }
          }
        }

        // STATUS column - notify item assignees about status change
        if (columnValue.column.type === 'STATUS') {
          const oldValue = oldColumnValue?.value as any;
          const newValue = value as any;
          const oldStatus = oldValue?.label || oldValue || 'Unset';
          const newStatus = newValue?.label || newValue || 'Unset';

          if (oldStatus !== newStatus) {
            // Get all assignees from PERSON columns in a single query
            const personColumns = await prisma.column.findMany({
              where: {
                boardId: columnValue.item.boardId,
                type: { in: ['PEOPLE', 'PERSON'] },
              },
              select: {
                id: true,
              },
            });

            const columnIds = personColumns.map(col => col.id);
            const assigneeUserIds = new Set<string>();
            
            // Fetch all column values at once
            const columnValues = await prisma.columnValue.findMany({
              where: {
                itemId,
                columnId: { in: columnIds },
              },
            });

            for (const cv of columnValues) {
              if (cv?.value) {
                const assignees = Array.isArray(cv.value) ? cv.value : [cv.value];
                for (const assignee of assignees) {
                  const assigneeObj = assignee as any;
                  if (assigneeObj?.id) {
                    assigneeUserIds.add(assigneeObj.id);
                  }
                }
              }
            }

            // Notify assignees about status change
            for (const assigneeId of assigneeUserIds) {
              if (assigneeId !== userId) {
                try {
                  await notificationService.notifyStatusChange(
                    assigneeId,
                    itemId,
                    columnValue.item.name,
                    oldStatus,
                    newStatus,
                    columnValue.item.boardId
                  );
                } catch (error) {
                  logger.error('Failed to send status change notification:', { error, assigneeId, itemId });
                }
              }
            }
          }
        }

        // Trigger automations
        executeAutomations(columnValue.item.boardId, AutomationTriggerType.COLUMN_VALUE_CHANGED, {
          itemId,
          columnId,
          oldValue: oldColumnValue?.value,
          newValue: value
        }).catch(err => logger.error('Automation error:', { error: err, itemId, trigger: AutomationTriggerType.ITEM_UPDATED }));

        // Also trigger status changed if it's a status column
        if (columnValue.column.type === 'STATUS') {
          executeAutomations(columnValue.item.boardId, AutomationTriggerType.STATUS_CHANGED, {
            itemId,
            columnId,
            oldValue: oldColumnValue?.value,
            newValue: value
          }).catch(err => logger.error('Automation error:', { error: err, itemId, trigger: AutomationTriggerType.STATUS_CHANGED }));
        }
      }

      res.json({ success: true, data: columnValue });
      
      // Invalidate cache
      await cacheService.invalidateItem(itemId);
      await cacheService.invalidateBoard(columnValue.item.boardId);
    } catch (error: any) {
      logger.error('Update column value error:', { error, userId: req.userId, columnId: req.params.id, itemId: req.body.itemId });
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

