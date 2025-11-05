import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './auth';

const prisma = new PrismaClient();

// Check if user has access to organization
export const checkOrganizationAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { organizationId } = req.params;

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (!membership) {
      return res.status(403).json({ success: false, error: 'Access denied to this organization' });
    }

    // Attach membership to request
    (req as any).orgMembership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

// Check if user has admin access to organization
export const checkOrganizationAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { organizationId } = req.params;

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId,
        organizationId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!membership) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    (req as any).orgMembership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

// Check if user has access to board
export const checkBoardAccess = (minRole: 'VIEW' | 'EDIT' | 'ADMIN' = 'VIEW') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      const boardId = req.params.boardId || req.params.id;

      // Get board with organization membership
      const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: {
          organization: {
            include: {
              members: {
                where: { userId },
              },
            },
          },
          teams: {
            include: {
              team: {
                include: {
                  members: {
                    where: { userId },
                  },
                },
              },
            },
          },
        },
      });

      if (!board) {
        return res.status(404).json({ success: false, error: 'Board not found' });
      }

      // Check if user is board creator (full access)
      if (board.createdById === userId) {
        (req as any).board = board;
        (req as any).accessLevel = 'ADMIN';
        return next();
      }

      // Check if user is organization member
      const orgMembership = board.organization.members[0];
      if (orgMembership) {
        // Organization admins have full board access
        if (orgMembership.role === 'OWNER' || orgMembership.role === 'ADMIN') {
          (req as any).board = board;
          (req as any).accessLevel = 'ADMIN';
          return next();
        }

        // Check team-based access
        const teamAccess = board.teams.find((bt) => bt.team.members.length > 0);
        if (teamAccess) {
          const accessLevel = teamAccess.access;
          
          // Check if user has required access level
          const accessLevels = ['VIEW', 'EDIT', 'ADMIN'];
          const userAccessIndex = accessLevels.indexOf(accessLevel);
          const requiredAccessIndex = accessLevels.indexOf(minRole);

          if (userAccessIndex >= requiredAccessIndex) {
            (req as any).board = board;
            (req as any).accessLevel = accessLevel;
            return next();
          }
        }

        // Organization members have at least view access by default
        if (minRole === 'VIEW') {
          (req as any).board = board;
          (req as any).accessLevel = 'VIEW';
          return next();
        }
      }

      return res.status(403).json({ success: false, error: 'Access denied to this board' });
    } catch (error) {
      next(error);
    }
  };
};

// Check if user has access to item (through board access)
export const checkItemAccess = (minRole: 'VIEW' | 'EDIT' | 'ADMIN' = 'VIEW') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      const itemId = req.params.itemId || req.params.id;

      // Get item with board
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        include: { board: true },
      });

      if (!item) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }

      // Set boardId in params and call checkBoardAccess
      req.params.boardId = item.boardId;
      return checkBoardAccess(minRole)(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// Check if user is team owner or admin
export const checkTeamAccess = (minRole: 'MEMBER' | 'ADMIN' | 'OWNER' = 'MEMBER') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      const teamId = req.params.teamId || req.params.id;

      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId,
        },
      });

      if (!teamMember) {
        return res.status(403).json({ success: false, error: 'Access denied to this team' });
      }

      // Check role level
      const roleLevels = ['MEMBER', 'ADMIN', 'OWNER'];
      const userRoleIndex = roleLevels.indexOf(teamMember.role);
      const requiredRoleIndex = roleLevels.indexOf(minRole);

      if (userRoleIndex < requiredRoleIndex) {
        return res.status(403).json({ success: false, error: 'Insufficient permissions' });
      }

      (req as any).teamMember = teamMember;
      next();
    } catch (error) {
      next(error);
    }
  };
};

