import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { notificationService } from '../services/notificationService';
import { parseMentions, findUsersFromMentions } from '../utils/mentionParser';

const prisma = new PrismaClient();

export const commentController = {
  async getByItem(req: AuthRequest, res: Response) {
    try {
      const { itemId } = req.params;

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

      res.json({ success: true, data: comments });
    } catch (error: any) {
      console.error('Get comments error:', error);
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
        for (const mentionedUserId of mentionUserIds) {
          // Don't notify the commenter themselves
          if (mentionedUserId !== userId) {
            try {
              await notificationService.notifyMention(
                mentionedUserId,
                commenter.name,
                itemId,
                item.name,
                item.boardId
              );
            } catch (error) {
              console.error('Failed to send mention notification:', error);
            }
          }
        }
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
              if (assignee?.id && assignee.id !== userId) {
                assigneeUserIds.add(assignee.id);
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
              console.error('Failed to send comment notification:', error);
            }
          }
        }
      }

      res.status(201).json({ success: true, data: comment });
    } catch (error: any) {
      console.error('Create comment error:', error);
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
    } catch (error: any) {
      console.error('Update comment error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.comment.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Comment deleted' });
    } catch (error: any) {
      console.error('Delete comment error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

