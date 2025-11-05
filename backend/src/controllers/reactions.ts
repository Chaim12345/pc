import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const reactionsController = {
  async addReaction(req: AuthRequest, res: Response) {
    try {
      const { emoji, commentId, itemId } = req.body;
      const userId = req.user!.id;

      if (!emoji) {
        return res.status(400).json({ success: false, error: 'Emoji is required' });
      }

      if (!commentId && !itemId) {
        return res.status(400).json({ success: false, error: 'Either commentId or itemId is required' });
      }

      // Check if reaction already exists
      const existingReaction = await prisma.reaction.findFirst({
        where: {
          userId,
          emoji,
          ...(commentId && { commentId }),
          ...(itemId && { itemId }),
        },
      });

      if (existingReaction) {
        return res.status(400).json({ success: false, error: 'Reaction already exists' });
      }

      const reaction = await prisma.reaction.create({
        data: {
          emoji,
          userId,
          ...(commentId && { commentId }),
          ...(itemId && { itemId }),
        },
      });

      res.json({ success: true, data: reaction });
    } catch (error: any) {
      console.error('Add reaction error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async removeReaction(req: AuthRequest, res: Response) {
    try {
      const { reactionId } = req.params;
      const userId = req.user!.id;

      const reaction = await prisma.reaction.findUnique({
        where: { id: reactionId },
      });

      if (!reaction) {
        return res.status(404).json({ success: false, error: 'Reaction not found' });
      }

      if (reaction.userId !== userId) {
        return res.status(403).json({ success: false, error: 'Not authorized to remove this reaction' });
      }

      await prisma.reaction.delete({
        where: { id: reactionId },
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Remove reaction error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getReactionsByComment(req: AuthRequest, res: Response) {
    try {
      const { commentId } = req.params;

      const reactions = await prisma.reaction.findMany({
        where: { commentId },
        include: {
          // We can include user info if needed
        },
      });

      // Group by emoji for easier display
      const groupedReactions = reactions.reduce((acc: any, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = {
            emoji: reaction.emoji,
            count: 0,
            users: [],
            reactionIds: [],
          };
        }
        acc[reaction.emoji].count++;
        acc[reaction.emoji].users.push(reaction.userId);
        acc[reaction.emoji].reactionIds.push(reaction.id);
        return acc;
      }, {});

      res.json({ 
        success: true, 
        data: {
          reactions: Object.values(groupedReactions),
          currentUserReactions: reactions.filter(r => r.userId === req.user!.id)
        }
      });
    } catch (error: any) {
      console.error('Get reactions error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getReactionsByItem(req: AuthRequest, res: Response) {
    try {
      const { itemId } = req.params;

      const reactions = await prisma.reaction.findMany({
        where: { itemId },
      });

      // Group by emoji
      const groupedReactions = reactions.reduce((acc: any, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = {
            emoji: reaction.emoji,
            count: 0,
            users: [],
            reactionIds: [],
          };
        }
        acc[reaction.emoji].count++;
        acc[reaction.emoji].users.push(reaction.userId);
        acc[reaction.emoji].reactionIds.push(reaction.id);
        return acc;
      }, {});

      res.json({ 
        success: true, 
        data: {
          reactions: Object.values(groupedReactions),
          currentUserReactions: reactions.filter(r => r.userId === req.user!.id)
        }
      });
    } catch (error: any) {
      console.error('Get reactions error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async toggleReaction(req: AuthRequest, res: Response) {
    try {
      const { emoji, commentId, itemId } = req.body;
      const userId = req.user!.id;

      if (!emoji) {
        return res.status(400).json({ success: false, error: 'Emoji is required' });
      }

      if (!commentId && !itemId) {
        return res.status(400).json({ success: false, error: 'Either commentId or itemId is required' });
      }

      // Check if reaction exists
      const existingReaction = await prisma.reaction.findFirst({
        where: {
          userId,
          emoji,
          ...(commentId && { commentId }),
          ...(itemId && { itemId }),
        },
      });

      if (existingReaction) {
        // Remove reaction
        await prisma.reaction.delete({
          where: { id: existingReaction.id },
        });
        res.json({ success: true, action: 'removed', data: null });
      } else {
        // Add reaction
        const reaction = await prisma.reaction.create({
          data: {
            emoji,
            userId,
            ...(commentId && { commentId }),
            ...(itemId && { itemId }),
          },
        });
        res.json({ success: true, action: 'added', data: reaction });
      }
    } catch (error: any) {
      console.error('Toggle reaction error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

