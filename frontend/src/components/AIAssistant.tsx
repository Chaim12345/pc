import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'

interface AIAssistantProps {
  boardId: string
  groupId?: string
  isOpen: boolean
  onClose: () => void
  context?: 'board' | 'group'
}

export default function AIAssistant({ boardId, groupId, isOpen, onClose, context = 'board' }: AIAssistantProps) {
  const { showToast } = useToast()
  const [activeFeature, setActiveFeature] = useState<'tasks' | 'summary' | 'name' | null>(null)
  const [description, setDescription] = useState('')
  const [result, setResult] = useState<any>(null)

  const generateTasksMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/ai/generate-tasks', { boardId, groupId })
      return response.data.data
    },
    onSuccess: (data) => {
      setResult(data)
      showToast('AI generated task suggestions!', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'AI service unavailable. Please configure OPENAI_API_KEY.', 'error')
    },
  })

  const summarizeBoardMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get(`/ai/summarize-board/${boardId}`)
      return response.data.data
    },
    onSuccess: (data) => {
      setResult(data)
      showToast('Board summarized!', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'AI service unavailable. Please configure OPENAI_API_KEY.', 'error')
    },
  })

  const suggestNameMutation = useMutation({
    mutationFn: async (desc: string) => {
      const response = await api.post('/ai/suggest-item-name', {
        boardId,
        groupId,
        description: desc,
      })
      return response.data.data
    },
    onSuccess: (data) => {
      setResult(data)
      showToast('Name suggestion generated!', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'AI service unavailable. Please configure OPENAI_API_KEY.', 'error')
    },
  })

  const handleFeatureSelect = (feature: 'tasks' | 'summary' | 'name') => {
    setActiveFeature(feature)
    setResult(null)
    setDescription('')
  }

  const handleGenerate = () => {
    if (activeFeature === 'tasks' && groupId) {
      generateTasksMutation.mutate()
    } else if (activeFeature === 'summary') {
      summarizeBoardMutation.mutate()
    } else if (activeFeature === 'name' && description.trim()) {
      suggestNameMutation.mutate(description)
    }
  }

  const handleClose = () => {
    setActiveFeature(null)
    setResult(null)
    setDescription('')
    onClose()
  }

  if (!isOpen) return null

  const isLoading = generateTasksMutation.isPending || summarizeBoardMutation.isPending || suggestNameMutation.isPending

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-monday-darkLight rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-monday-border dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-monday-text dark:text-white">AI Assistant</h2>
              <p className="text-sm text-monday-textLight dark:text-gray-400">Let AI help with your work</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-monday-textLight dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!activeFeature ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Generate Tasks */}
              {groupId && (
                <button
                  onClick={() => handleFeatureSelect('tasks')}
                  className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg hover:shadow-md transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-monday-text dark:text-white mb-2">Generate Tasks</h3>
                  <p className="text-sm text-monday-textLight dark:text-gray-400">
                    AI will suggest tasks based on your board and group context
                  </p>
                </button>
              )}

              {/* Summarize Board */}
              <button
                onClick={() => handleFeatureSelect('summary')}
                className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg hover:shadow-md transition-all text-left group"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-monday-text dark:text-white mb-2">Summarize Board</h3>
                <p className="text-sm text-monday-textLight dark:text-gray-400">
                  Get an AI-generated summary of your board's current state
                </p>
              </button>

              {/* Suggest Item Name */}
              {groupId && (
                <button
                  onClick={() => handleFeatureSelect('name')}
                  className="p-6 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-lg hover:shadow-md transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-monday-text dark:text-white mb-2">Suggest Item Name</h3>
                  <p className="text-sm text-monday-textLight dark:text-gray-400">
                    Describe your task and AI will suggest a concise name
                  </p>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Back Button */}
              <button
                onClick={() => setActiveFeature(null)}
                className="flex items-center space-x-2 text-monday-textLight dark:text-gray-400 hover:text-monday-text dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to features</span>
              </button>

              {/* Active Feature UI */}
              {activeFeature === 'name' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                      Describe your task
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={4}
                      placeholder="E.g., Create a feature that allows users to upload profile pictures..."
                    />
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isLoading || (activeFeature === 'name' && !description.trim())}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Generate with AI</span>
                  </>
                )}
              </button>

              {/* Result */}
              {result && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h4 className="font-semibold text-monday-text dark:text-white mb-2 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>AI Result</span>
                  </h4>
                  <div className="text-monday-text dark:text-white whitespace-pre-wrap">
                    {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-monday-border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
          <div className="flex items-start space-x-2 text-sm text-monday-textLight dark:text-gray-400">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>
              AI features require an OpenAI API key to be configured in the backend environment variables. 
              If you see errors, contact your administrator to set up OPENAI_API_KEY.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}






