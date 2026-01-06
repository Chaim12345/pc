import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { executeAutomations } from '../services/automationService';
import { AutomationTriggerType } from '@monday-clone/shared';
import { cacheService } from '../services/cacheService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const itemController = {
  async getByBoard(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;

      const items = await prisma.item.findMany({
        where: { boardId, parentId: null },
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
          },
          subitems: {
            include: {
              columnValues: {
                include: {
                  column: true
                }
              }
            }
          }
        },
        orderBy: { position: 'asc' }
      });

      res.json({ success: true, data: items });
    } catch (error: any) {
      logger.error('Get items error:', { error, userId: req.userId, boardId: req.params.boardId });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Try to get from cache first
      const cacheKey = `item:${id}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached });
      }

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

      // Cache for 2 minutes
      await cacheService.set(cacheKey, item, 120);

      res.json({ success: true, data: item });
    } catch (error: any) {
      logger.error('Get item error:', { error, userId: req.userId, itemId: req.params.id });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { boardId, groupId, name, position, columnValues, parentId } = req.body;

      // Get max position if not provided
      let itemPosition = position;
      if (itemPosition === undefined) {
        const maxItem = await prisma.item.findFirst({
          where: { groupId, parentId },
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
          parentId,
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
      }).catch(err => logger.error('Automation error:', { error: err, itemId: item.id, trigger: AutomationTriggerType.ITEM_CREATED }));

      // Invalidate cache
      await cacheService.invalidateItem(item.id);
      await cacheService.invalidateBoard(boardId);

      res.status(201).json({ success: true, data: item });
    } catch (error: any) {
      logger.error('Create item error:', { error, userId: req.userId, boardId: req.body.boardId });
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

      // Update column values if provided (do this before updating item to avoid extra query)
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

      // Update item and fetch with all relations in one query
      const updatedItem = await prisma.item.update({
        where: { id },
        data: updateData,
        include: {
          columnValues: {
            include: {
              column: true
            }
          },
          board: {
            select: {
              id: true
            }
          }
        }
      });

      // Trigger automations
      executeAutomations(updatedItem.boardId, AutomationTriggerType.ITEM_UPDATED, {
        itemId: updatedItem.id
      }).catch(err => logger.error('Automation error:', { error: err, itemId: updatedItem.id, trigger: AutomationTriggerType.ITEM_UPDATED }));

      // Invalidate cache
      await cacheService.invalidateItem(id);
      await cacheService.invalidateBoard(updatedItem.boardId);

      res.json({ success: true, data: updatedItem });
    } catch (error: any) {
      logger.error('Update item error:', { error, userId: req.userId, itemId: req.params.id });
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
        }).catch(err => logger.error('Automation error:', { error: err, itemId: id, trigger: AutomationTriggerType.ITEM_DELETED }));
        
        // Invalidate cache
        await cacheService.invalidateItem(id);
        await cacheService.invalidateBoard(item.boardId);
      }

      res.json({ success: true, message: 'Item deleted' });
    } catch (error: any) {
      logger.error('Delete item error:', { error, userId: req.userId, itemId: req.params.id });
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

