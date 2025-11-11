import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const notificationsController = {
  // Get all notifications for the current user
  async getNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      const total = await prisma.notification.count({
        where: { userId },
      });

      res.json({
        success: true,
        data: {
          notifications,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      logger.error('Get notifications error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
    }
  },

  // Get unread notification count
  async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;

      const count = await prisma.notification.count({
        where: {
          userId,
          read: false,
        },
      });

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      logger.error('Get unread count error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch unread count' });
    }
  },

  // Mark notification as read
  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const { id } = req.params;

      // Verify the notification belongs to the user
      const notification = await prisma.notification.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!notification) {
        return res.status(404).json({ success: false, error: 'Notification not found' });
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { read: true },
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      logger.error('Mark as read error:', error);
      res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
    }
  },

  // Mark all notifications as read
  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;

      await prisma.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: { read: true },
      });

      res.json({
        success: true,
        data: { message: 'All notifications marked as read' },
      });
    } catch (error) {
      logger.error('Mark all as read error:', error);
      res.status(500).json({ success: false, error: 'Failed to mark all notifications as read' });
    }
  },

  // Delete notification
  async deleteNotification(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const { id } = req.params;

      // Verify the notification belongs to the user
      const notification = await prisma.notification.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!notification) {
        return res.status(404).json({ success: false, error: 'Notification not found' });
      }

      await prisma.notification.delete({
        where: { id },
      });

      res.json({
        success: true,
        data: { message: 'Notification deleted' },
      });
    } catch (error) {
      logger.error('Delete notification error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete notification' });
    }
  },

  // Create notification (for internal use by services)
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    metadata?: any
  ) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          metadata: metadata || {},
        },
      });

      return notification;
    } catch (error) {
      logger.error('Create notification error:', error);
      throw error;
    }
  },
};

