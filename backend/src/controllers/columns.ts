import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { executeAutomations } from '../services/automationService';
import { AutomationTriggerType } from '@monday-clone/shared';
import { notificationService } from '../services/notificationService';

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
                console.error('Failed to send assignment notification:', error);
              }
            }
          }
        }

        // STATUS column - notify item assignees about status change
        if (columnValue.column.type === 'STATUS') {
          const oldStatus = oldColumnValue?.value?.label || oldColumnValue?.value || 'Unset';
          const newStatus = value?.label || value || 'Unset';

          if (oldStatus !== newStatus) {
            // Get all assignees from PERSON columns
            const personColumns = await prisma.column.findMany({
              where: {
                boardId: columnValue.item.boardId,
                type: { in: ['PEOPLE', 'PERSON'] },
              },
            });

            const assigneeUserIds = new Set<string>();
            for (const column of personColumns) {
              const cv = await prisma.columnValue.findUnique({
                where: {
                  itemId_columnId: {
                    itemId,
                    columnId: column.id,
                  },
                },
              });

              if (cv?.value) {
                const assignees = Array.isArray(cv.value) ? cv.value : [cv.value];
                for (const assignee of assignees) {
                  if (assignee?.id) {
                    assigneeUserIds.add(assignee.id);
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
                  console.error('Failed to send status change notification:', error);
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
        }).catch(err => console.error('Automation error:', err));

        // Also trigger status changed if it's a status column
        if (columnValue.column.type === 'STATUS') {
          executeAutomations(columnValue.item.boardId, AutomationTriggerType.STATUS_CHANGED, {
            itemId,
            columnId,
            oldValue: oldColumnValue?.value,
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

