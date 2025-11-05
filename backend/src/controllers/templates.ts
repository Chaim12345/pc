import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { boardTemplates } from '../data/boardTemplates';

const prisma = new PrismaClient();

export const templatesController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      // Return all available templates
      res.json({ success: true, data: boardTemplates });
    } catch (error: any) {
      console.error('Get templates error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getByCategory(req: AuthRequest, res: Response) {
    try {
      const { category } = req.params;
      
      const filtered = boardTemplates.filter(
        (template) => template.category.toLowerCase() === category.toLowerCase()
      );

      res.json({ success: true, data: filtered });
    } catch (error: any) {
      console.error('Get templates by category error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { templateId } = req.params;
      
      const template = boardTemplates.find((t) => t.id === templateId);

      if (!template) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }

      res.json({ success: true, data: template });
    } catch (error: any) {
      console.error('Get template by ID error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async createBoardFromTemplate(req: AuthRequest, res: Response) {
    try {
      const { templateId } = req.params;
      const { name, organizationId } = req.body;
      const userId = req.user!.id;

      if (!name || !organizationId) {
        return res.status(400).json({ success: false, error: 'Name and organizationId are required' });
      }

      const template = boardTemplates.find((t) => t.id === templateId);

      if (!template) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }

      // Create board
      const board = await prisma.board.create({
        data: {
          name: name || template.name,
          organizationId,
          createdById: userId,
        },
      });

      // Create groups
      const createdGroups = [];
      for (const [index, groupTemplate] of template.groups.entries()) {
        const group = await prisma.group.create({
          data: {
            title: groupTemplate.name,
            boardId: board.id,
            position: index,
          },
        });
        createdGroups.push(group);
      }

      // Create columns
      const createdColumns = [];
      for (const [index, columnTemplate] of template.columns.entries()) {
        const column = await prisma.column.create({
          data: {
            title: columnTemplate.name,
            type: columnTemplate.type as any,
            boardId: board.id,
            position: index,
            settings: columnTemplate.settings || {},
          },
        });
        createdColumns.push(column);
      }

      // Fetch the complete board with relationships
      const completedBoard = await prisma.board.findUnique({
        where: { id: board.id },
        include: {
          groups: {
            include: {
              items: true,
            },
            orderBy: { position: 'asc' },
          },
          columns: {
            orderBy: { position: 'asc' },
          },
        },
      });

      res.json({ success: true, data: completedBoard });
    } catch (error: any) {
      console.error('Create board from template error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

