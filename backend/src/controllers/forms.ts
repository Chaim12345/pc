import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const formsController = {
  // Get all forms for a board
  async getByBoard(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;

      const forms = await prisma.form.findMany({
        where: { boardId },
        include: {
          _count: {
            select: { submissions: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: forms });
    } catch (error: any) {
      console.error('Get forms error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get single form
  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const form = await prisma.form.findUnique({
        where: { id },
        include: {
          _count: {
            select: { submissions: true }
          }
        }
      });

      if (!form) {
        return res.status(404).json({ success: false, error: 'Form not found' });
      }

      res.json({ success: true, data: form });
    } catch (error: any) {
      console.error('Get form error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get form by public token (no auth required)
  async getByToken(req: any, res: Response) {
    try {
      const { token } = req.params;

      const form = await prisma.form.findUnique({
        where: { publicToken: token },
        select: {
          id: true,
          name: true,
          description: true,
          fields: true,
          settings: true,
          isPublic: true
        }
      });

      if (!form) {
        return res.status(404).json({ success: false, error: 'Form not found' });
      }

      if (!form.isPublic) {
        return res.status(403).json({ success: false, error: 'Form is not public' });
      }

      res.json({ success: true, data: form });
    } catch (error: any) {
      console.error('Get form by token error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Create form
  async create(req: AuthRequest, res: Response) {
    try {
      const { boardId, groupId, name, description, fields, settings } = req.body;

      const form = await prisma.form.create({
        data: {
          boardId,
          groupId,
          name,
          description,
          fields: fields || [],
          settings: settings || {}
        }
      });

      res.status(201).json({ success: true, data: form });
    } catch (error: any) {
      console.error('Create form error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Update form
  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, fields, settings, isPublic } = req.body;

      const form = await prisma.form.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(fields !== undefined && { fields }),
          ...(settings !== undefined && { settings }),
          ...(isPublic !== undefined && { isPublic })
        }
      });

      res.json({ success: true, data: form });
    } catch (error: any) {
      console.error('Update form error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Delete form
  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.form.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Form deleted' });
    } catch (error: any) {
      console.error('Delete form error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Submit form (public endpoint)
  async submit(req: any, res: Response) {
    try {
      const { token } = req.params;
      const { data, submitterEmail, submitterName } = req.body;

      // Get form
      const form = await prisma.form.findUnique({
        where: { publicToken: token }
      });

      if (!form) {
        return res.status(404).json({ success: false, error: 'Form not found' });
      }

      if (!form.isPublic) {
        return res.status(403).json({ success: false, error: 'Form is not accepting submissions' });
      }

      // Create board item from form data
      const itemName = data.name || data.title || `Form submission - ${new Date().toLocaleDateString()}`;
      
      const item = await prisma.item.create({
        data: {
          boardId: form.boardId,
          groupId: form.groupId,
          name: itemName
        }
      });

      // Create form submission
      const submission = await prisma.formSubmission.create({
        data: {
          formId: form.id,
          itemId: item.id,
          data,
          submitterEmail,
          submitterName,
          ipAddress: req.ip || req.connection.remoteAddress
        }
      });

      // Create column values from form data
      const board = await prisma.board.findUnique({
        where: { id: form.boardId },
        include: { columns: true }
      });

      if (board) {
        for (const column of board.columns) {
          const fieldData = data[column.title] || data[column.id];
          if (fieldData !== undefined) {
            await prisma.columnValue.create({
              data: {
                itemId: item.id,
                columnId: column.id,
                value: fieldData
              }
            });
          }
        }
      }

      res.status(201).json({ 
        success: true, 
        data: submission,
        message: 'Form submitted successfully'
      });
    } catch (error: any) {
      console.error('Submit form error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get form submissions
  async getSubmissions(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const [submissions, total] = await Promise.all([
        prisma.formSubmission.findMany({
          where: { formId: id },
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * limitNum,
          take: limitNum
        }),
        prisma.formSubmission.count({
          where: { formId: id }
        })
      ]);

      res.json({ 
        success: true, 
        data: submissions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error: any) {
      console.error('Get submissions error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get form analytics
  async getAnalytics(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const [
        totalSubmissions,
        recentSubmissions,
        submissionsByDay
      ] = await Promise.all([
        prisma.formSubmission.count({ where: { formId: id } }),
        prisma.formSubmission.findMany({
          where: { formId: id },
          orderBy: { createdAt: 'desc' },
          take: 10
        }),
        prisma.$queryRaw`
          SELECT DATE(created_at) as date, COUNT(*) as count
          FROM form_submissions
          WHERE form_id = ${id}
          AND created_at >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `
      ]);

      res.json({
        success: true,
        data: {
          totalSubmissions,
          recentSubmissions,
          submissionsByDay
        }
      });
    } catch (error: any) {
      console.error('Get analytics error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

