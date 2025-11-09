import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const boardController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;

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

      res.json({ success: true, data: boards });
    } catch (error: any) {
      console.error('Get boards error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId!;

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

      res.json({ success: true, data: board });
    } catch (error: any) {
      console.error('Get board error:', error);
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
    } catch (error: any) {
      console.error('Create board error:', error);
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
    } catch (error: any) {
      console.error('Update board error:', error);
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
      console.error('Search boards error:', error);
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
    } catch (error: any) {
      console.error('Delete board error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

