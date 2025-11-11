import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { notificationService } from '../services/notificationService';
import { parseMentions, findUsersFromMentions } from '../utils/mentionParser';
import { cacheService } from '../services/cacheService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const commentController = {
  async getByItem(req: AuthRequest, res: Response) {
    try {
      const { itemId } = req.params;

      // Try to get from cache first
      const cacheKey = `comments:item:${itemId}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached });
      }

      const comments = await prisma.comment.findMany({
        where: {
          itemId,
          parentId: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          replies: {
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
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Cache for 1 minute (comments change frequently)
      await cacheService.set(cacheKey, comments, 60);

      res.json({ success: true, data: comments });
    } catch (error: any) {
      logger.error('Get comments error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { itemId, text, parentId, mentions } = req.body;
      const userId = req.userId!;

      // Get item and user info for notifications
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        include: {
          board: {
            include: {
              organization: true,
            },
          },
        },
      });

      const commenter = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      });

      if (!item || !commenter) {
        return res.status(404).json({ success: false, error: 'Item or user not found' });
      }

      // Parse mentions from text if not provided
      let mentionUserIds: string[] = [];
      if (mentions && mentions.length > 0) {
        mentionUserIds = mentions;
      } else {
        // Parse mentions from text
        const parsedMentions = parseMentions(text);
        if (parsedMentions.length > 0 && item.board.organizationId) {
          mentionUserIds = await findUsersFromMentions(
            parsedMentions,
            item.board.organizationId,
            prisma
          );
        }
      }

      const comment = await prisma.comment.create({
        data: {
          itemId,
          userId,
          text,
          parentId,
          mentions: mentionUserIds
        },
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
      });

      // Send notifications for mentions
      if (mentionUserIds.length > 0) {
        logger.log(`Sending mention notifications to ${mentionUserIds.length} user(s)`);
        for (const mentionedUserId of mentionUserIds) {
          // Don't notify the commenter themselves
          if (mentionedUserId !== userId) {
            try {
              logger.log(`Sending mention notification to user ${mentionedUserId}`);
              await notificationService.notifyMention(
                mentionedUserId,
                commenter.name,
                itemId,
                item.name,
                item.boardId
              );
              logger.log(`Mention notification sent successfully to user ${mentionedUserId}`);
            } catch (error) {
              logger.error('Failed to send mention notification:', error);
            }
          } else {
            logger.log(`Skipping mention notification for commenter ${userId}`);
          }
        }
      } else {
        logger.log('No mentions found in comment');
      }

      // Send notification to item assignees (if any)
      // Get all PERSON column values for this item in a single query
      const personColumns = await prisma.column.findMany({
        where: {
          boardId: item.boardId,
          type: 'PEOPLE',
        },
        select: {
          id: true,
        },
      });

      if (personColumns.length > 0) {
        const columnIds = personColumns.map(col => col.id);
        const assigneeUserIds = new Set<string>();
        
        // Fetch all column values at once instead of one by one
        const columnValues = await prisma.columnValue.findMany({
          where: {
            itemId,
            columnId: { in: columnIds },
          },
        });

        for (const columnValue of columnValues) {
          if (columnValue?.value) {
            const assignees = Array.isArray(columnValue.value) 
              ? columnValue.value 
              : [columnValue.value];
            
            for (const assignee of assignees) {
              const assigneeObj = assignee as any;
              if (assigneeObj?.id && assigneeObj.id !== userId) {
                assigneeUserIds.add(assigneeObj.id);
              }
            }
          }
        }

        // Notify assignees about the comment
        for (const assigneeId of assigneeUserIds) {
          // Don't notify if they were already mentioned
          if (!mentionUserIds.includes(assigneeId)) {
            try {
              await notificationService.notifyComment(
                assigneeId,
                commenter.name,
                itemId,
                item.name,
                item.boardId
              );
            } catch (error) {
              logger.error('Failed to send comment notification:', error);
            }
          }
        }
      }

      res.status(201).json({ success: true, data: comment });
      
      // Invalidate cache
      await cacheService.invalidateItem(itemId);
    } catch (error: any) {
      logger.error('Create comment error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { text } = req.body;

      const comment = await prisma.comment.update({
        where: { id },
        data: { text },
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
      });

      res.json({ success: true, data: comment });
      
      // Invalidate cache - need to get itemId first
      const updatedComment = await prisma.comment.findUnique({
        where: { id },
        select: { itemId: true }
      });
      if (updatedComment) {
        await cacheService.invalidateItem(updatedComment.itemId);
      }
    } catch (error: any) {
      logger.error('Update comment error:', { error, userId: req.userId, commentId: req.params.id });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Get itemId before deleting for cache invalidation
      const comment = await prisma.comment.findUnique({
        where: { id },
        select: { itemId: true }
      });

      await prisma.comment.delete({
        where: { id }
      });

      // Invalidate cache
      if (comment) {
        await cacheService.invalidateItem(comment.itemId);
      }

      res.json({ success: true, message: 'Comment deleted' });
    } catch (error: any) {
      logger.error('Delete comment error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

