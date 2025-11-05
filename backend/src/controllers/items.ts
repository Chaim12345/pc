import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { executeAutomations } from '../services/automationService';
import { AutomationTriggerType } from '@monday-clone/shared';

const prisma = new PrismaClient();

export const itemController = {
  async getByBoard(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;

      const items = await prisma.item.findMany({
        where: { boardId },
        include: {
          columnValues: {
            include: {
              column: true
            }
          },
          comments: {
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
          }
        },
        orderBy: { position: 'asc' }
      });

      res.json({ success: true, data: items });
    } catch (error: any) {
      console.error('Get items error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const item = await prisma.item.findUnique({
        where: { id },
        include: {
          columnValues: {
            include: {
              column: true
            }
          },
          comments: {
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
          }
        }
      });

      if (!item) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }

      res.json({ success: true, data: item });
    } catch (error: any) {
      console.error('Get item error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { boardId, groupId, name, position, columnValues } = req.body;

      // Get max position if not provided
      let itemPosition = position;
      if (itemPosition === undefined) {
        const maxItem = await prisma.item.findFirst({
          where: { groupId },
          orderBy: { position: 'desc' }
        });
        itemPosition = maxItem ? maxItem.position + 1 : 0;
      }

      const item = await prisma.item.create({
        data: {
          boardId,
          groupId,
          name,
          position: itemPosition,
          columnValues: columnValues ? {
            create: columnValues.map((cv: any) => ({
              columnId: cv.columnId,
              value: cv.value
            }))
          } : undefined
        },
        include: {
          columnValues: {
            include: {
              column: true
            }
          }
        }
      });

      // Trigger automations
      executeAutomations(boardId, AutomationTriggerType.ITEM_CREATED, {
        itemId: item.id
      }).catch(err => console.error('Automation error:', err));

      res.status(201).json({ success: true, data: item });
    } catch (error: any) {
      console.error('Create item error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, groupId, position, columnValues } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (groupId !== undefined) updateData.groupId = groupId;
      if (position !== undefined) updateData.position = position;

      const item = await prisma.item.update({
        where: { id },
        data: updateData,
        include: {
          columnValues: {
            include: {
              column: true
            }
          }
        }
      });

      // Update column values if provided
      if (columnValues) {
        for (const cv of columnValues) {
          await prisma.columnValue.upsert({
            where: {
              itemId_columnId: {
                itemId: id,
                columnId: cv.columnId
              }
            },
            update: { value: cv.value },
            create: {
              itemId: id,
              columnId: cv.columnId,
              value: cv.value
            }
          });
        }
      }

      const updatedItem = await prisma.item.findUnique({
        where: { id },
        include: {
          columnValues: {
            include: {
              column: true
            }
          }
        }
      });

      // Trigger automations
      executeAutomations(item.boardId, AutomationTriggerType.ITEM_UPDATED, {
        itemId: item.id
      }).catch(err => console.error('Automation error:', err));

      res.json({ success: true, data: updatedItem });
    } catch (error: any) {
      console.error('Update item error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const item = await prisma.item.findUnique({
        where: { id },
        select: { boardId: true }
      });

      await prisma.item.delete({
        where: { id }
      });

      // Trigger automations
      if (item) {
        executeAutomations(item.boardId, AutomationTriggerType.ITEM_DELETED, {
          itemId: id
        }).catch(err => console.error('Automation error:', err));
      }

      res.json({ success: true, message: 'Item deleted' });
    } catch (error: any) {
      console.error('Delete item error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

