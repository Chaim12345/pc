import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: any, file, cb) => {
    const userId = req.userId;
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb: any) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

export const uploadMiddleware = upload.single('avatar');

export const usersController = {
  // Get current user profile
  async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      res.json({ success: true, data: user });
    } catch (error) {
      logger.error('Get profile error:', { error, userId: req.userId });
      res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
  },

  // Update user profile
  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const { name, email, bio } = req.body;

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            NOT: { id: userId },
          },
        });

        if (existingUser) {
          return res.status(400).json({ success: false, error: 'Email already in use' });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: name || undefined,
          email: email || undefined,
          // Note: bio field doesn't exist in schema yet, would need migration
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json({ success: true, data: updatedUser });
    } catch (error) {
      logger.error('Update profile error:', { error, userId: req.userId });
      res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
  },

  // Change password
  async changePassword(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'Current and new passwords are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
      }

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      logger.error('Change password error:', { error, userId: req.userId });
      res.status(500).json({ success: false, error: 'Failed to change password' });
    }
  },

  // Upload avatar
  async uploadAvatar(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      // Get old avatar to delete it
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatar: true },
      });

      // Delete old avatar file if it exists
      if (user?.avatar) {
        const oldAvatarPath = path.join(process.cwd(), 'uploads', 'avatars', path.basename(user.avatar));
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      // Update user with new avatar path
      const avatarUrl = `/uploads/avatars/${file.filename}`;
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatar: avatarUrl },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
        },
      });

      res.json({ success: true, data: updatedUser });
    } catch (error) {
      logger.error('Upload avatar error:', { error, userId: req.userId });
      res.status(500).json({ success: false, error: 'Failed to upload avatar' });
    }
  },

  // Search users (for mentions, assignments, etc.)
  async searchUsers(req: AuthRequest, res: Response) {
    try {
      const { query } = req.query;
      const userId = req.userId;

      // Handle empty query gracefully - return empty array instead of error
      if (!query || typeof query !== 'string' || query.trim() === '') {
        return res.json({ success: true, data: [] });
      }

      // Get user's organization to only search within same org
      const orgMembership = await prisma.organizationMember.findFirst({
        where: { userId },
      });

      if (!orgMembership) {
        return res.json({ success: true, data: [] });
      }

      // Search users in the same organization
      const users = await prisma.user.findMany({
        where: {
          organizationMemberships: {
            some: {
              organizationId: orgMembership.organizationId,
            },
          },
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
        take: 10,
      });

      res.json({ success: true, data: users });
    } catch (error) {
      logger.error('Search users error:', { error, userId: req.userId });
      res.status(500).json({ success: false, error: 'Failed to search users' });
    }
  },

  // Get user by ID
  async getUserById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      res.json({ success: true, data: user });
    } catch (error) {
      logger.error('Get user error:', { error, userId: req.userId, targetUserId: req.params.id });
      res.status(500).json({ success: false, error: 'Failed to fetch user' });
    }
  },

  // Get all users in the organization
  async getUsersInOrganization(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;

      // Get user's organization to only search within same org
      const orgMembership = await prisma.organizationMember.findFirst({
        where: { userId },
      });

      if (!orgMembership) {
        return res.json({ success: true, data: [] });
      }

      // Find all users in the same organization
      const users = await prisma.user.findMany({
        where: {
          organizationMemberships: {
            some: {
              organizationId: orgMembership.organizationId,
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
        orderBy: {
          name: 'asc'
        }
      });

      res.json({ success: true, data: users });
    } catch (error) {
      logger.error('Get users in organization error:', { error, userId: req.userId, organizationId: req.params.organizationId });
      res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
  },

  // Get all users with pagination and filters
  async getAllUsers(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string || '';
      const status = req.query.status as string;
      const role = req.query.role as string;
      const skip = (page - 1) * limit;

      // Get user's organization
      const orgMembership = await prisma.organizationMember.findFirst({
        where: { userId },
        select: { organizationId: true },
      });

      if (!orgMembership) {
        return res.json({
          success: true,
          data: [],
          total: 0,
          totalPages: 0,
        });
      }

      // Build where clause
      const where: any = {
        organizationMemberships: {
          some: {
            organizationId: orgMembership.organizationId,
          },
        },
      };

      // Add search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Add status filter
      if (status && status !== 'ALL') {
        where.status = status.toUpperCase();
      }

      // Add role filter (need to check organizationMemberships)
      if (role && role !== 'ALL') {
        where.organizationMemberships = {
          some: {
            organizationId: orgMembership.organizationId,
            role: role.toUpperCase(),
          },
        };
      }

      // Get users with pagination
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true,
            lastSeenAt: true,
            createdAt: true,
            organizationMemberships: {
              where: {
                organizationId: orgMembership.organizationId,
              },
              select: {
                role: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.user.count({ where }),
      ]);

      // Map users to include role from organizationMembership
      const mappedUsers = users.map((user) => ({
        ...user,
        role: user.organizationMemberships[0]?.role || 'MEMBER',
      }));

      res.json({
        success: true,
        data: mappedUsers,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      logger.error('Get all users error:', { error, userId: req.userId });
      res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
  },

  // Invite user
  async inviteUser(req: AuthRequest, res: Response) {
    try {
      const { email, name, role } = req.body;
      const inviterId = req.userId!;

      if (!email || !name) {
        return res.status(400).json({ success: false, error: 'Email and name are required' });
      }

      // Get inviter's organization
      const orgMembership = await prisma.organizationMember.findFirst({
        where: { userId: inviterId },
        include: { 
          organization: true,
          user: true, // Include inviter user data
        },
      });

      if (!orgMembership) {
        return res.status(403).json({ success: false, error: 'You must be part of an organization to invite users' });
      }

      const inviter = orgMembership.user;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: {
          organizationMemberships: {
            where: {
              organizationId: orgMembership.organizationId,
            },
          },
        },
      });

      if (existingUser) {
        // Check if user is already in the organization
        if (existingUser.organizationMemberships.length > 0) {
          return res.status(400).json({ success: false, error: 'User is already a member of this organization' });
        }

        // Add user to organization
        await prisma.organizationMember.create({
          data: {
            userId: existingUser.id,
            organizationId: orgMembership.organizationId,
            role: (role || 'MEMBER').toUpperCase(),
          },
        });

        // Send notification to user
        const { notificationService } = await import('../services/notificationService');
        await notificationService.notifySystem(
          existingUser.id,
          'Welcome to the team!',
          `You've been added to ${orgMembership.organization.name}`,
          { organizationId: orgMembership.organizationId }
        );

        return res.json({
          success: true,
          data: {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            message: 'User added to organization',
          },
        });
      }

      // Generate temporary password
      const tempPassword = crypto.randomBytes(12).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          status: 'PENDING',
          invitedById: inviterId,
          invitedAt: new Date(),
          organizationMemberships: {
            create: {
              organizationId: orgMembership.organizationId,
              role: (role || 'MEMBER').toUpperCase(),
            },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          createdAt: true,
        },
      });

      // Send invitation email with temporary password
      const { emailService } = await import('../services/emailService');
      await emailService.sendInvitationEmail(
        email,
        inviter.name,
        orgMembership.organization.name,
        tempPassword,
        role || 'MEMBER'
      );

      res.status(201).json({
        success: true,
        data: {
          ...newUser,
          message: 'User invited successfully. They will receive an email with setup instructions.',
          // In development, return the temp password for testing
          tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined,
        },
      });
    } catch (error: any) {
      logger.error('Invite user error:', { error, userId: req.userId, email: req.body.email });
      if (error.code === 'P2002') {
        return res.status(400).json({ success: false, error: 'Email already exists' });
      }
      res.status(500).json({ success: false, error: 'Failed to invite user' });
    }
  },

  // Update user status
  async updateUserStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'].includes(status.toUpperCase())) {
        return res.status(400).json({ success: false, error: 'Valid status is required' });
      }

      // Verify user is in same organization
      const currentUserOrg = await prisma.organizationMember.findFirst({
        where: { userId: req.userId },
      });

      if (!currentUserOrg) {
        return res.status(403).json({ success: false, error: 'You must be part of an organization' });
      }

      const targetUserOrg = await prisma.organizationMember.findFirst({
        where: {
          userId: id,
          organizationId: currentUserOrg.organizationId,
        },
      });

      if (!targetUserOrg) {
        return res.status(403).json({ success: false, error: 'User not found in your organization' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { status: status.toUpperCase() },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
        },
      });

      res.json({ success: true, data: updatedUser });
    } catch (error) {
      logger.error('Update user status error:', { error, userId: req.userId, targetUserId: req.params.id, status: req.body.status });
      res.status(500).json({ success: false, error: 'Failed to update user status' });
    }
  },

  // Update user role
  async updateUserRole(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'].includes(role.toUpperCase())) {
        return res.status(400).json({ success: false, error: 'Valid role is required' });
      }

      // Verify user is in same organization
      const currentUserOrg = await prisma.organizationMember.findFirst({
        where: { userId: req.userId },
      });

      if (!currentUserOrg) {
        return res.status(403).json({ success: false, error: 'You must be part of an organization' });
      }

      const updatedMembership = await prisma.organizationMember.updateMany({
        where: {
          userId: id,
          organizationId: currentUserOrg.organizationId,
        },
        data: {
          role: role.toUpperCase(),
        },
      });

      if (updatedMembership.count === 0) {
        return res.status(404).json({ success: false, error: 'User not found in your organization' });
      }

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          organizationMemberships: {
            where: {
              organizationId: currentUserOrg.organizationId,
            },
            select: {
              role: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: {
          ...user,
          role: user?.organizationMemberships[0]?.role,
        },
      });
    } catch (error) {
      logger.error('Update user role error:', { error, userId: req.userId, targetUserId: req.params.id, role: req.body.role });
      res.status(500).json({ success: false, error: 'Failed to update user role' });
    }
  },

  // Delete user
  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      if (id === req.userId) {
        return res.status(400).json({ success: false, error: 'You cannot delete your own account' });
      }

      // Verify user is in same organization
      const currentUserOrg = await prisma.organizationMember.findFirst({
        where: { userId: req.userId },
      });

      if (!currentUserOrg) {
        return res.status(403).json({ success: false, error: 'You must be part of an organization' });
      }

      const targetUserOrg = await prisma.organizationMember.findFirst({
        where: {
          userId: id,
          organizationId: currentUserOrg.organizationId,
        },
      });

      if (!targetUserOrg) {
        return res.status(403).json({ success: false, error: 'User not found in your organization' });
      }

      // Remove user from organization (don't delete the user account itself)
      await prisma.organizationMember.delete({
        where: {
          organizationId_userId: {
            organizationId: currentUserOrg.organizationId,
            userId: id,
          },
        },
      });

      res.json({ success: true, message: 'User removed from organization' });
    } catch (error) {
      logger.error('Delete user error:', { error, userId: req.userId, targetUserId: req.params.id });
      res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
  },

  // Bulk update users
  async bulkUpdateUsers(req: AuthRequest, res: Response) {
    try {
      const { userIds, action, value } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ success: false, error: 'User IDs array is required' });
      }

      if (!action) {
        return res.status(400).json({ success: false, error: 'Action is required' });
      }

      // Verify user is in same organization
      const currentUserOrg = await prisma.organizationMember.findFirst({
        where: { userId: req.userId },
      });

      if (!currentUserOrg) {
        return res.status(403).json({ success: false, error: 'You must be part of an organization' });
      }

      // Verify all users are in the same organization
      const targetUsers = await prisma.organizationMember.findMany({
        where: {
          userId: { in: userIds },
          organizationId: currentUserOrg.organizationId,
        },
      });

      if (targetUsers.length !== userIds.length) {
        return res.status(403).json({ success: false, error: 'Some users are not in your organization' });
      }

      if (action === 'delete') {
        // Remove users from organization
        await prisma.organizationMember.deleteMany({
          where: {
            userId: { in: userIds },
            organizationId: currentUserOrg.organizationId,
          },
        });
      } else if (action === 'updateStatus' && value) {
        // Update user statuses
        await prisma.user.updateMany({
          where: {
            id: { in: userIds },
          },
          data: {
            status: value.toUpperCase(),
          },
        });
      } else if (action === 'updateRole' && value) {
        // Update user roles
        await prisma.organizationMember.updateMany({
          where: {
            userId: { in: userIds },
            organizationId: currentUserOrg.organizationId,
          },
          data: {
            role: value.toUpperCase(),
          },
        });
      } else {
        return res.status(400).json({ success: false, error: 'Invalid action or missing value' });
      }

      res.json({ success: true, message: `Bulk ${action} completed successfully` });
    } catch (error) {
      logger.error('Bulk update users error:', { error, userId: req.userId, count: req.body.userIds?.length });
      res.status(500).json({ success: false, error: 'Failed to perform bulk operation' });
    }
  },
};

