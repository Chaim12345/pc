import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';

const prisma = new PrismaClient();

export class NotificationService {
  private io: SocketIOServer | null = null;

  setSocketIO(io: SocketIOServer) {
    this.io = io;
  }

  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    metadata?: any
  ) {
    try {
      // Build link from metadata
      let link: string | undefined;
      if (metadata?.itemId && metadata?.boardId) {
        link = `/board/${metadata.boardId}?item=${metadata.itemId}`;
      } else if (metadata?.itemId) {
        // Try to get boardId from item
        const item = await prisma.item.findUnique({
          where: { id: metadata.itemId },
          select: { boardId: true },
        });
        if (item) {
          link = `/board/${item.boardId}?item=${metadata.itemId}`;
        }
      } else if (metadata?.boardId) {
        link = `/board/${metadata.boardId}`;
      }

      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          metadata: {
            ...metadata,
            link,
          },
        },
      });

      // Emit socket event to the user
      if (this.io) {
        this.io.to(`user:${userId}`).emit('NOTIFICATION_NEW', { notification });
      }

      return notification;
    } catch (error) {
      console.error('Create notification error:', error);
      throw error;
    }
  }

  // Create notification for item mention
  async notifyMention(mentionedUserId: string, mentionerName: string, itemId: string, itemName: string, boardId?: string) {
    return this.createNotification(
      mentionedUserId,
      'mention',
      'You were mentioned',
      `${mentionerName} mentioned you in "${itemName}"`,
      { itemId, itemName, boardId }
    );
  }

  // Create notification for comment
  async notifyComment(userId: string, commenterName: string, itemId: string, itemName: string, boardId?: string) {
    return this.createNotification(
      userId,
      'comment',
      'New comment',
      `${commenterName} commented on "${itemName}"`,
      { itemId, itemName, boardId }
    );
  }

  // Create notification for assignment
  async notifyAssignment(userId: string, assignerName: string, itemId: string, itemName: string, boardId?: string) {
    return this.createNotification(
      userId,
      'assignment',
      'You were assigned',
      `${assignerName} assigned you to "${itemName}"`,
      { itemId, itemName, boardId }
    );
  }

  // Create notification for status change
  async notifyStatusChange(
    userId: string,
    itemId: string,
    itemName: string,
    oldStatus: string,
    newStatus: string,
    boardId?: string
  ) {
    return this.createNotification(
      userId,
      'status_change',
      'Status changed',
      `"${itemName}" status changed from ${oldStatus} to ${newStatus}`,
      { itemId, itemName, oldStatus, newStatus, boardId }
    );
  }

  // Create notification for due date reminder
  async notifyDueDate(userId: string, itemId: string, itemName: string, dueDate: Date) {
    return this.createNotification(
      userId,
      'due_date',
      'Due date reminder',
      `"${itemName}" is due soon`,
      { itemId, itemName, dueDate }
    );
  }

  // Create notification for board invitation
  async notifyBoardInvite(userId: string, inviterName: string, boardId: string, boardName: string) {
    return this.createNotification(
      userId,
      'board_invite',
      'Board invitation',
      `${inviterName} invited you to "${boardName}"`,
      { boardId, boardName }
    );
  }

  // Create system notification
  async notifySystem(userId: string, title: string, message: string, metadata?: any) {
    return this.createNotification(userId, 'system', title, message, metadata);
  }

  // Bulk notify users
  async notifyMultiple(
    userIds: string[],
    type: string,
    title: string,
    message: string,
    metadata?: any
  ) {
    const notifications = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        title,
        message,
        metadata: metadata || {},
      })),
    });

    // Emit socket events to all users
    if (this.io) {
      userIds.forEach((userId) => {
        this.io!.to(`user:${userId}`).emit('NOTIFICATION_NEW', {});
      });
    }

    return notifications;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

