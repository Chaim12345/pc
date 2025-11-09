import { api } from './api'

export interface GenerateTasksParams {
  boardId: string
  groupId?: string
}

export interface SuggestItemNameParams {
  boardId: string
  groupId?: string
  description: string
}

export const aiService = {
  /**
   * Generate task suggestions based on board/group context
   */
  async generateTasks(params: GenerateTasksParams) {
    const response = await api.post('/ai/generate-tasks', params)
    return response.data.data
  },

  /**
   * Summarize board content
   */
  async summarizeBoard(boardId: string) {
    const response = await api.get(`/ai/summarize-board/${boardId}`)
    return response.data.data
  },

  /**
   * Suggest item name based on description
   */
  async suggestItemName(params: SuggestItemNameParams) {
    const response = await api.post('/ai/suggest-item-name', params)
    return response.data.data
  },

  /**
   * Check if AI service is available
   */
  async checkAvailability() {
    try {
      const response = await api.get('/ai/status')
      return response.data.available
    } catch (error) {
      return false
    }
  }
}

export default aiService





