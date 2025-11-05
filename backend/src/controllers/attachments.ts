import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export const attachmentController = {
  async getByItem(req: AuthRequest, res: Response) {
    try {
      const { itemId } = req.params;

      const attachments = await prisma.attachment.findMany({
        where: { itemId },
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
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: attachments });
    } catch (error: any) {
      console.error('Get attachments error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async upload(req: AuthRequest, res: Response) {
    try {
      const { itemId } = req.body;
      const userId = req.userId!;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, error: 'No file provided' });
      }

      const attachment = await prisma.attachment.create({
        data: {
          itemId,
          userId,
          filename: file.originalname,
          filepath: file.path,
          mimeType: file.mimetype,
          size: file.size
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

      res.status(201).json({ success: true, data: attachment });
    } catch (error: any) {
      console.error('Upload attachment error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async download(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const attachment = await prisma.attachment.findUnique({
        where: { id }
      });

      if (!attachment) {
        return res.status(404).json({ success: false, error: 'Attachment not found' });
      }

      if (!fs.existsSync(attachment.filepath)) {
        return res.status(404).json({ success: false, error: 'File not found' });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
      res.setHeader('Content-Type', attachment.mimeType);
      res.sendFile(path.resolve(attachment.filepath));
    } catch (error: any) {
      console.error('Download attachment error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const attachment = await prisma.attachment.findUnique({
        where: { id }
      });

      if (attachment) {
        // Delete file from filesystem
        if (fs.existsSync(attachment.filepath)) {
          fs.unlinkSync(attachment.filepath);
        }
      }

      await prisma.attachment.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Attachment deleted' });
    } catch (error: any) {
      console.error('Delete attachment error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

