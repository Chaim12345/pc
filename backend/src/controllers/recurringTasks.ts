import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const recurringTasksController = {
  // Create recurring task
  async create(req: AuthRequest, res: Response) {
    try {
      const { boardId, groupId, itemTemplate, frequency, interval, daysOfWeek, dayOfMonth, startDate, endDate } = req.body;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const nextRunDate = calculateNextRunDate(new Date(startDate), frequency, interval, daysOfWeek, dayOfMonth);

      const recurringTask = await prisma.recurringTask.create({
        data: {
          boardId,
          groupId,
          itemTemplate,
          frequency,
          interval: interval || 1,
          daysOfWeek: daysOfWeek || [],
          dayOfMonth,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          nextRunDate,
          createdById: userId
        }
      });

      res.status(201).json({ success: true, data: recurringTask });
    } catch (error: any) {
      console.error('Create recurring task error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get recurring tasks for a board
  async getByBoard(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;

      const tasks = await prisma.recurringTask.findMany({
        where: { boardId },
        orderBy: { nextRunDate: 'asc' }
      });

      res.json({ success: true, data: tasks });
    } catch (error: any) {
      console.error('Get recurring tasks error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Update recurring task
  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { itemTemplate, frequency, interval, daysOfWeek, dayOfMonth, startDate, endDate, isActive } = req.body;

      const task = await prisma.recurringTask.update({
        where: { id },
        data: {
          ...(itemTemplate !== undefined && { itemTemplate }),
          ...(frequency !== undefined && { frequency }),
          ...(interval !== undefined && { interval }),
          ...(daysOfWeek !== undefined && { daysOfWeek }),
          ...(dayOfMonth !== undefined && { dayOfMonth }),
          ...(startDate !== undefined && { startDate: new Date(startDate) }),
          ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
          ...(isActive !== undefined && { isActive })
        }
      });

      res.json({ success: true, data: task });
    } catch (error: any) {
      console.error('Update recurring task error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Delete recurring task
  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.recurringTask.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Recurring task deleted' });
    } catch (error: any) {
      console.error('Delete recurring task error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Run recurring tasks (called by scheduler)
  async runDue(req: any, res: Response) {
    try {
      const now = new Date();

      const dueTasks = await prisma.recurringTask.findMany({
        where: {
          isActive: true,
          nextRunDate: {
            lte: now
          }
        }
      });

      const results = [];

      for (const task of dueTasks) {
        try {
          // Create item from template
          const itemData = typeof task.itemTemplate === 'object' ? task.itemTemplate as any : {};
          
          const item = await prisma.item.create({
            data: {
              boardId: task.boardId,
              groupId: task.groupId,
              name: itemData.name || 'Recurring Task',
              position: 0
            }
          });

          // Calculate next run date
          const nextRunDate = calculateNextRunDate(
            task.nextRunDate,
            task.frequency,
            task.interval,
            task.daysOfWeek,
            task.dayOfMonth
          );

          // Update task
          await prisma.recurringTask.update({
            where: { id: task.id },
            data: {
              lastRunDate: now,
              nextRunDate,
              // Deactivate if past end date
              ...(task.endDate && nextRunDate > task.endDate && { isActive: false })
            }
          });

          results.push({ taskId: task.id, itemId: item.id, success: true });
        } catch (error: any) {
          results.push({ taskId: task.id, success: false, error: error.message });
        }
      }

      res.json({ success: true, data: { processed: results.length, results } });
    } catch (error: any) {
      console.error('Run recurring tasks error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

function calculateNextRunDate(
  currentDate: Date,
  frequency: string,
  interval: number,
  daysOfWeek: number[],
  dayOfMonth: number | null
): Date {
  const next = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + interval);
      break;

    case 'weekly':
      if (daysOfWeek && daysOfWeek.length > 0) {
        // Find next day of week
        const currentDay = next.getDay();
        const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
        
        let found = false;
        for (const day of sortedDays) {
          if (day > currentDay) {
            next.setDate(next.getDate() + (day - currentDay));
            found = true;
            break;
          }
        }
        
        if (!found) {
          // Go to next week
          const firstDay = sortedDays[0];
          next.setDate(next.getDate() + (7 - currentDay + firstDay));
        }
      } else {
        next.setDate(next.getDate() + (7 * interval));
      }
      break;

    case 'monthly':
      if (dayOfMonth) {
        next.setMonth(next.getMonth() + interval);
        next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
      } else {
        next.setMonth(next.getMonth() + interval);
      }
      break;

    default:
      next.setDate(next.getDate() + 1);
  }

  return next;
}



