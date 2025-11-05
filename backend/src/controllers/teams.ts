import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const teamsController = {
  // Get all teams in user's organization
  async getTeams(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;

      // Get user's organization
      const orgMember = await prisma.organizationMember.findFirst({
        where: { userId },
      });

      if (!orgMember) {
        return res.status(404).json({ success: false, error: 'User not in any organization' });
      }

      const teams = await prisma.team.findMany({
        where: { organizationId: orgMember.organizationId },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
          },
          _count: { select: { members: true, boards: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: teams });
    } catch (error) {
      console.error('Get teams error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch teams' });
    }
  },

  // Get team by ID
  async getTeam(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const team = await prisma.team.findUnique({
        where: { id },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
          },
          boards: { include: { board: true } },
        },
      });

      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found' });
      }

      res.json({ success: true, data: team });
    } catch (error) {
      console.error('Get team error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch team' });
    }
  },

  // Create team
  async createTeam(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Team name is required' });
      }

      // Get user's organization
      const orgMember = await prisma.organizationMember.findFirst({
        where: { userId },
      });

      if (!orgMember) {
        return res.status(404).json({ success: false, error: 'User not in any organization' });
      }

      const team = await prisma.team.create({
        data: {
          name,
          description,
          organizationId: orgMember.organizationId,
          members: {
            create: {
              userId,
              role: 'OWNER',
            },
          },
        },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
          },
        },
      });

      res.json({ success: true, data: team });
    } catch (error) {
      console.error('Create team error:', error);
      res.status(500).json({ success: false, error: 'Failed to create team' });
    }
  },

  // Update team
  async updateTeam(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const team = await prisma.team.update({
        where: { id },
        data: { name, description },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
          },
        },
      });

      res.json({ success: true, data: team });
    } catch (error) {
      console.error('Update team error:', error);
      res.status(500).json({ success: false, error: 'Failed to update team' });
    }
  },

  // Delete team
  async deleteTeam(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.team.delete({ where: { id } });

      res.json({ success: true, message: 'Team deleted successfully' });
    } catch (error) {
      console.error('Delete team error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete team' });
    }
  },

  // Add member to team
  async addMember(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { userId, role = 'MEMBER' } = req.body;

      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
      }

      const member = await prisma.teamMember.create({
        data: {
          teamId: id,
          userId,
          role,
        },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      });

      res.json({ success: true, data: member });
    } catch (error) {
      console.error('Add member error:', error);
      res.status(500).json({ success: false, error: 'Failed to add member' });
    }
  },

  // Remove member from team
  async removeMember(req: AuthRequest, res: Response) {
    try {
      const { id, memberId } = req.params;

      await prisma.teamMember.delete({ where: { id: memberId } });

      res.json({ success: true, message: 'Member removed successfully' });
    } catch (error) {
      console.error('Remove member error:', error);
      res.status(500).json({ success: false, error: 'Failed to remove member' });
    }
  },

  // Update member role
  async updateMemberRole(req: AuthRequest, res: Response) {
    try {
      const { memberId } = req.params;
      const { role } = req.body;

      if (!role || !['OWNER', 'MEMBER'].includes(role)) {
        return res.status(400).json({ success: false, error: 'Invalid role specified' });
      }

      const updatedMember = await prisma.teamMember.update({
        where: { id: memberId },
        data: { role },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      });

      res.json({ success: true, data: updatedMember });
    } catch (error) {
      console.error('Update member role error:', error);
      res.status(500).json({ success: false, error: 'Failed to update member role' });
    }
  },

  // Add board to team
  async addBoard(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { boardId, access = 'EDIT' } = req.body;

      if (!boardId) {
        return res.status(400).json({ success: false, error: 'Board ID is required' });
      }

      const boardTeam = await prisma.boardTeam.create({
        data: {
          teamId: id,
          boardId,
          access,
        },
        include: { board: true },
      });

      res.json({ success: true, data: boardTeam });
    } catch (error) {
      console.error('Add board error:', error);
      res.status(500).json({ success: false, error: 'Failed to add board' });
    }
  },

  // Remove board from team
  async removeBoard(req: AuthRequest, res: Response) {
    try {
      const { id, boardId } = req.params;

      await prisma.boardTeam.deleteMany({
        where: { teamId: id, boardId },
      });

      res.json({ success: true, message: 'Board removed successfully' });
    } catch (error) {
      console.error('Remove board error:', error);
      res.status(500).json({ success: false, error: 'Failed to remove board' });
    }
  },
};

