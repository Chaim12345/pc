import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const guestAccessController = {
  // Create guest access
  async create(req: AuthRequest, res: Response) {
    try {
      const { boardId, email, name, accessLevel, expiresAt } = req.body;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Verify user has access to the board
      const board = await prisma.board.findUnique({
        where: { id: boardId }
      });

      if (!board) {
        return res.status(404).json({ success: false, error: 'Board not found' });
      }

      const guestAccess = await prisma.guestAccess.create({
        data: {
          boardId,
          email,
          name,
          accessLevel: accessLevel || 'view',
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          createdById: userId
        }
      });

      const shareLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/guest/board/${guestAccess.token}`;

      res.status(201).json({ 
        success: true, 
        data: { ...guestAccess, shareLink }
      });
    } catch (error: any) {
      console.error('Create guest access error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get all guest accesses for a board
  async getByBoard(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;

      const guestAccesses = await prisma.guestAccess.findMany({
        where: { boardId },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: guestAccesses });
    } catch (error: any) {
      console.error('Get guest accesses error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get guest access by token (public)
  async getByToken(req: any, res: Response) {
    try {
      const { token } = req.params;

      const guestAccess = await prisma.guestAccess.findUnique({
        where: { token },
        include: {
          board: {
            include: {
              groups: {
                include: {
                items: {
                  include: {
                    columnValues: {
                      include: {
                        column: true
                      }
                    }
                  }
                }
                }
              },
              columns: true
            }
          }
        }
      });

      if (!guestAccess) {
        return res.status(404).json({ success: false, error: 'Guest access not found' });
      }

      if (!guestAccess.isActive) {
        return res.status(403).json({ success: false, error: 'Guest access has been revoked' });
      }

      if (guestAccess.expiresAt && new Date(guestAccess.expiresAt) < new Date()) {
        return res.status(403).json({ success: false, error: 'Guest access has expired' });
      }

      // Update access tracking
      await prisma.guestAccess.update({
        where: { id: guestAccess.id },
        data: {
          lastAccessedAt: new Date(),
          accessCount: { increment: 1 }
        }
      });

      // Generate a guest JWT token for this session
      const guestToken = jwt.sign(
        { 
          guestAccessId: guestAccess.id,
          boardId: guestAccess.boardId,
          accessLevel: guestAccess.accessLevel,
          type: 'guest'
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );

      res.json({ 
        success: true, 
        data: {
          board: guestAccess.board,
          accessLevel: guestAccess.accessLevel,
          guestToken
        }
      });
    } catch (error: any) {
      console.error('Get guest access by token error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Update guest access
  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { accessLevel, expiresAt, isActive } = req.body;

      const guestAccess = await prisma.guestAccess.update({
        where: { id },
        data: {
          ...(accessLevel !== undefined && { accessLevel }),
          ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
          ...(isActive !== undefined && { isActive })
        }
      });

      res.json({ success: true, data: guestAccess });
    } catch (error: any) {
      console.error('Update guest access error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Revoke guest access
  async revoke(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.guestAccess.update({
        where: { id },
        data: { isActive: false }
      });

      res.json({ success: true, message: 'Guest access revoked' });
    } catch (error: any) {
      console.error('Revoke guest access error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Delete guest access
  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.guestAccess.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Guest access deleted' });
    } catch (error: any) {
      console.error('Delete guest access error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get guest access analytics
  async getAnalytics(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;

      const [
        totalGuests,
        activeGuests,
        expiredGuests,
        recentAccesses
      ] = await Promise.all([
        prisma.guestAccess.count({ where: { boardId } }),
        prisma.guestAccess.count({ where: { boardId, isActive: true } }),
        prisma.guestAccess.count({ 
          where: { 
            boardId, 
            expiresAt: { lt: new Date() } 
          } 
        }),
        prisma.guestAccess.findMany({
          where: { boardId },
          orderBy: { lastAccessedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            name: true,
            email: true,
            accessLevel: true,
            lastAccessedAt: true,
            accessCount: true
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalGuests,
          activeGuests,
          expiredGuests,
          recentAccesses
        }
      });
    } catch (error: any) {
      console.error('Get guest analytics error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};





