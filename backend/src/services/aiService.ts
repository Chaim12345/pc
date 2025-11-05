import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AIService {
  private apiKey: string;
  private baseURL: string = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  /**
   * Generate task suggestions based on board context
   */
  async suggestTasks(boardId: string, context?: string): Promise<string[]> {
    try {
      // Fetch board data for context
      const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: {
          items: {
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
              columnValues: true,
            },
          },
          columns: true,
          groups: true,
        },
      });

      if (!board) {
        throw new Error('Board not found');
      }

      // Build context from recent items
      const recentTasks = board.items.map(item => item.name).join(', ');
      const boardContext = `Board: ${board.name}\nRecent tasks: ${recentTasks}`;

      const prompt = `You are a project management AI assistant. Based on the following board context, suggest 5 relevant and actionable tasks that would logically follow:

${boardContext}

${context ? `Additional context: ${context}` : ''}

Generate 5 specific, actionable task suggestions. Return ONLY a JSON array of task names, no other text:
["task 1", "task 2", "task 3", "task 4", "task 5"]`;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful project management assistant that suggests relevant tasks.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 200,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const content = response.data.choices[0].message.content;
      const suggestions = JSON.parse(content);
      return suggestions;
    } catch (error: any) {
      console.error('AI suggestion error:', error.response?.data || error.message);
      // Fallback suggestions if AI fails
      return [
        'Review and update task priorities',
        'Schedule team sync meeting',
        'Document progress and blockers',
        'Plan next sprint activities',
        'Update stakeholders on status',
      ];
    }
  }

  /**
   * Smart assignment based on workload and skills
   */
  async suggestAssignee(itemId: string, itemName: string): Promise<{ userId: string; confidence: number } | null> {
    try {
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        include: {
          board: {
            include: {
              members: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!item || !item.board) {
        return null;
      }

      // Get workload for each team member
      const members = item.board.members;
      const workloadPromises = members.map(async (member) => {
        const assignedItems = await prisma.item.count({
          where: {
            assignees: {
              has: member.userId,
            },
            boardId: item.boardId,
          },
        });

        return {
          userId: member.userId,
          userName: member.user.name,
          workload: assignedItems,
        };
      });

      const workloads = await Promise.all(workloadPromises);

      // Simple algorithm: assign to person with lowest workload
      const sorted = workloads.sort((a, b) => a.workload - b.workload);
      
      if (sorted.length > 0) {
        const confidence = sorted.length > 1 
          ? Math.max(0.5, 1 - (sorted[0].workload / (sorted[sorted.length - 1].workload + 1)))
          : 0.8;

        return {
          userId: sorted[0].userId,
          confidence,
        };
      }

      return null;
    } catch (error) {
      console.error('Smart assignment error:', error);
      return null;
    }
  }

  /**
   * Predict due date based on similar completed tasks
   */
  async predictDueDate(itemName: string, boardId: string): Promise<{ days: number; confidence: number }> {
    try {
      // Fetch completed items with similar names
      const completedItems = await prisma.item.findMany({
        where: {
          boardId,
          completedAt: { not: null },
        },
        select: {
          name: true,
          createdAt: true,
          completedAt: true,
        },
        take: 50,
      });

      if (completedItems.length === 0) {
        return { days: 7, confidence: 0.3 }; // Default 1 week
      }

      // Calculate average completion time
      const durations = completedItems.map(item => {
        if (!item.completedAt) return 0;
        const diff = item.completedAt.getTime() - item.createdAt.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24)); // Convert to days
      });

      const avgDays = Math.ceil(
        durations.reduce((sum, days) => sum + days, 0) / durations.length
      );

      const confidence = Math.min(0.9, completedItems.length / 50);

      return {
        days: Math.max(1, Math.min(avgDays, 90)), // Between 1-90 days
        confidence,
      };
    } catch (error) {
      console.error('Due date prediction error:', error);
      return { days: 7, confidence: 0.3 };
    }
  }

  /**
   * Auto-categorize items using AI
   */
  async categorizeItem(itemName: string, description?: string): Promise<string[]> {
    try {
      if (!this.apiKey) {
        return ['Uncategorized'];
      }

      const prompt = `Categorize this task into 1-3 relevant categories from: [Bug, Feature, Enhancement, Documentation, Testing, Design, Backend, Frontend, DevOps, Research, Planning, Review]

Task: ${itemName}
${description ? `Description: ${description}` : ''}

Return ONLY a JSON array of category names, no other text:`;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 50,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const content = response.data.choices[0].message.content;
      const categories = JSON.parse(content);
      return categories;
    } catch (error) {
      console.error('Categorization error:', error);
      return ['Uncategorized'];
    }
  }

  /**
   * Generate item description using AI
   */
  async generateDescription(itemName: string, context?: string): Promise<string> {
    try {
      if (!this.apiKey) {
        return '';
      }

      const prompt = `Generate a brief, professional task description (2-3 sentences) for this item:

Task: ${itemName}
${context ? `Context: ${context}` : ''}

Description:`;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 150,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Description generation error:', error);
      return '';
    }
  }
}

export const aiService = new AIService();
