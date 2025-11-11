import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { aiService } from '../services/aiService';
import { logger } from '../utils/logger';

export const aiController = {
  // Get AI task suggestions
  async getSuggestions(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;
      const { context } = req.body;

      const suggestions = await aiService.suggestTasks(boardId, context);

      res.json({
        success: true,
        data: { suggestions },
      });
    } catch (error: any) {
      logger.error('AI suggestions error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate suggestions',
      });
    }
  },

  // Smart assignee suggestion
  async suggestAssignee(req: AuthRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const { itemName } = req.body;

      const suggestion = await aiService.suggestAssignee(itemId, itemName);

      res.json({
        success: true,
        data: suggestion,
      });
    } catch (error: any) {
      logger.error('Smart assignment error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to suggest assignee',
      });
    }
  },

  // Predict due date
  async predictDueDate(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;
      const { itemName } = req.body;

      const prediction = await aiService.predictDueDate(itemName, boardId);

      res.json({
        success: true,
        data: prediction,
      });
    } catch (error: any) {
      logger.error('Due date prediction error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to predict due date',
      });
    }
  },

  // Auto-categorize item
  async categorizeItem(req: AuthRequest, res: Response) {
    try {
      const { itemName, description } = req.body;

      const categories = await aiService.categorizeItem(itemName, description);

      res.json({
        success: true,
        data: { categories },
      });
    } catch (error: any) {
      logger.error('Categorization error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to categorize item',
      });
    }
  },

  // Generate description
  async generateDescription(req: AuthRequest, res: Response) {
    try {
      const { itemName, context } = req.body;

      const description = await aiService.generateDescription(itemName, context);

      res.json({
        success: true,
        data: { description },
      });
    } catch (error: any) {
      logger.error('Description generation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate description',
      });
    }
  },
};
