import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { cacheService } from '../services/cacheService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const boardController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;

      // Try to get from cache first
      const cacheKey = `boards:user:${userId}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached });
      }

      // Get user's organizations
      const orgMemberships = await prisma.organizationMember.findMany({
        where: { userId },
        select: { organizationId: true }
      });

      const orgIds = orgMemberships.map(m => m.organizationId);

      const boards = await prisma.board.findMany({
        where: {
          organizationId: { in: orgIds }
        },
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
                },
                orderBy: { position: 'asc' },
                take: 100 // Limit items per group to prevent loading too much data
              }
            },
            orderBy: { position: 'asc' }
          },
          columns: {
            orderBy: { position: 'asc' }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      // Cache for 5 minutes
      await cacheService.set(cacheKey, boards, 300);

      res.json({ success: true, data: boards });
    } catch (error: any) {
      logger.error('Get boards error:', { error, userId: req.userId });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      // Try to get from cache first
      const cacheKey = `board:${id}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached });
      }

      const board = await prisma.board.findUnique({
        where: { id },
        include: {
          groups: {
            include: {
              items: {
                where: { parentId: null },
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
                    },
                    orderBy: { createdAt: 'asc' }
                  },
                  subitems: {
                    include: {
                      columnValues: {
                        include: {
                          column: true
                        }
                      }
                    },
                    orderBy: { position: 'asc' }
                  }
                },
                orderBy: { position: 'asc' }
              }
            },
            orderBy: { position: 'asc' }
          },
          columns: {
            orderBy: { position: 'asc' }
          }
        }
      });

      if (!board) {
        return res.status(404).json({ success: false, error: 'Board not found' });
      }

      // Cache for 5 minutes
      await cacheService.set(cacheKey, board, 300);

      res.json({ success: true, data: board });
    } catch (error: any) {
      logger.error('Get board error:', { error, userId: req.userId, boardId: req.params.id });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { name, description, organizationId } = req.body;
      const userId = req.userId!;

      const board = await prisma.board.create({
        data: {
          name,
          description,
          organizationId,
          createdById: userId,
          groups: {
            create: {
              title: 'New Group',
              position: 0
            }
          },
          columns: {
            create: [
              {
                title: 'Name',
                type: 'TEXT',
                position: 0
              },
              {
                title: 'Status',
                type: 'STATUS',
                position: 1,
                settings: {
                  labels: [
                    { id: '1', label: 'Working on it', color: '#FDAB3D' },
                    { id: '2', label: 'Done', color: '#00C875' },
                    { id: '3', label: 'Stuck', color: '#E2445C' }
                  ]
                }
              }
            ]
          }
        },
        include: {
          groups: true,
          columns: true
        }
      });

      res.status(201).json({ success: true, data: board });
      
      // Invalidate cache
      await cacheService.invalidateBoard(board.id);
    } catch (error: any) {
      logger.error('Create board error:', { error, userId: req.userId, boardName: req.body.name });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const board = await prisma.board.update({
        where: { id },
        data: { name, description }
      });

      res.json({ success: true, data: board });
      
      // Invalidate cache
      await cacheService.invalidateBoard(id);
    } catch (error: any) {
      logger.error('Update board error:', { error, userId: req.userId, boardId: req.params.id });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async search(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ success: false, error: 'Query parameter required' });
      }

      // Get user's organizations
      const orgMemberships = await prisma.organizationMember.findMany({
        where: { userId },
        select: { organizationId: true }
      });

      const orgIds = orgMemberships.map(m => m.organizationId);

      const boards = await prisma.board.findMany({
        where: {
          organizationId: { in: orgIds },
          name: {
            contains: q,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true
        },
        take: 20,
        orderBy: { updatedAt: 'desc' }
      });

      res.json({ success: true, data: boards });
    } catch (error: any) {
      logger.error('Search boards error:', { error, userId: req.userId, query: req.query.search });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.board.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Board deleted' });
      
      // Invalidate cache
      await cacheService.invalidateBoard(id);
    } catch (error: any) {
      logger.error('Delete board error:', { error, userId: req.userId, boardId: req.params.id });
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

