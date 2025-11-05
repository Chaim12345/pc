import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SocketEvent } from '@monday-clone/shared';
import { notificationService } from '../services/notificationService';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  boardId?: string;
}

export function setupSocket(io: Server) {
  // Initialize notification service with socket.io instance
  notificationService.setSocketIO(io);

  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected`);

    // Join user's personal notification room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    socket.on(SocketEvent.JOIN_BOARD, (boardId: string) => {
      socket.boardId = boardId;
      socket.join(`board:${boardId}`);
      io.to(`board:${boardId}`).emit(SocketEvent.USER_JOINED, {
        userId: socket.userId,
        boardId
      });
    });

    socket.on(SocketEvent.LEAVE_BOARD, (boardId: string) => {
      socket.leave(`board:${boardId}`);
      io.to(`board:${boardId}`).emit(SocketEvent.USER_LEFT, {
        userId: socket.userId,
        boardId
      });
    });

    socket.on(SocketEvent.ITEM_UPDATED, (data: any) => {
      if (socket.boardId) {
        io.to(`board:${socket.boardId}`).emit(SocketEvent.ITEM_CHANGED, {
          ...data,
          updatedBy: socket.userId,
          timestamp: new Date()
        });
      }
    });

    socket.on(SocketEvent.COLUMN_UPDATED, (data: any) => {
      if (socket.boardId) {
        io.to(`board:${socket.boardId}`).emit(SocketEvent.COLUMN_CHANGED, {
          ...data,
          updatedBy: socket.userId,
          timestamp: new Date()
        });
      }
    });

    socket.on(SocketEvent.GROUP_UPDATED, (data: any) => {
      if (socket.boardId) {
        io.to(`board:${socket.boardId}`).emit(SocketEvent.GROUP_CHANGED, {
          ...data,
          updatedBy: socket.userId,
          timestamp: new Date()
        });
      }
    });

    socket.on(SocketEvent.COMMENT_ADDED, (data: any) => {
      if (socket.boardId) {
        io.to(`board:${socket.boardId}`).emit(SocketEvent.COMMENT_CREATED, {
          ...data,
          userId: socket.userId,
          timestamp: new Date()
        });
      }
    });

    socket.on('disconnect', () => {
      if (socket.boardId) {
        io.to(`board:${socket.boardId}`).emit(SocketEvent.USER_LEFT, {
          userId: socket.userId,
          boardId: socket.boardId
        });
      }
      console.log(`User ${socket.userId} disconnected`);
    });
  });
}

