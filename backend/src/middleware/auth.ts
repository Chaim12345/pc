import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { errorReportingService } from '../utils/errorReporting';
import { env } from '../config/env';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    
    // Fetch the user object from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        avatar: true, 
        createdAt: true, 
        updatedAt: true, 
        isTwoFactorEnabled: true 
      }
    });
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    
    // Get the user's organization membership to include organizationId and role
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      select: { organizationId: true, role: true }
    });
    
    // Combine user data with organization info
    req.user = {
      ...user,
      role: orgMember?.role,
      organizationId: orgMember?.organizationId
    };
    
    // Set user context in Sentry for error tracking
    errorReportingService.setUser(decoded.userId);
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

export const requireAuth = authenticate;
