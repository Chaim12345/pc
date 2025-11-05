import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'

interface Template {
  id: string
  name: string
  description: string
  category: string
  icon: string
}

export default function Templates() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [boardName, setBoardName] = useState('')

  // Fetch templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await api.get('/templates')
      return response.data.data
    },
  })

  const templates: Template[] = templatesData || []

  // Get categories
  const categories = Array.from(new Set(templates.map((t) => t.category)))

  // Filter templates
  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : templates.filter((t) => t.category === selectedCategory)

  // Create board from template mutation
  const createBoardMutation = useMutation({
    mutationFn: async ({ templateId, name }: { templateId: string; name: string }) => {
      const response = await api.post(`/templates/${templateId}/create-board`, {
        name,
        organizationId: user?.organizationId,
      })
      return response.data.data
    },
    onSuccess: (board) => {
      showToast('Board created successfully!', 'success')
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      navigate(`/boards/${board.id}`)
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to create board', 'error')
    },
  })

  const handleCreateBoard = () => {
    if (!selectedTemplate || !boardName.trim()) {
      showToast('Please enter a board name', 'warning')
      return
    }

    createBoardMutation.mutate({
      templateId: selectedTemplate.id,
      name: boardName,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-monday-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg text-monday-textLight dark:text-gray-400">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-monday-background dark:bg-monday-dark p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-monday-text dark:text-white mb-2">
            Board Templates
          </h1>
          <p className="text-lg text-monday-textLight dark:text-gray-400">
            Start with a pre-built template to get up and running quickly
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-monday-primary text-white shadow-md'
                : 'bg-white dark:bg-monday-darkLight text-monday-text dark:text-white border border-monday-border dark:border-gray-700 hover:border-monday-primary'
            }`}
          >
            All Templates
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-monday-primary text-white shadow-md'
                  : 'bg-white dark:bg-monday-darkLight text-monday-text dark:text-white border border-monday-border dark:border-gray-700 hover:border-monday-primary'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-xl p-6 hover:shadow-2xl hover:border-monday-primary transition-all cursor-pointer group"
              onClick={() => {
                setSelectedTemplate(template)
                setBoardName(template.name)
              }}
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-monday-blue to-monday-purple rounded-2xl flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform">
                {template.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-monday-text dark:text-white mb-2 group-hover:text-monday-primary transition-colors">
                {template.name}
              </h3>
              <p className="text-sm text-monday-textLight dark:text-gray-400 mb-4">
                {template.description}
              </p>

              {/* Category Badge */}
              <span className="inline-block px-3 py-1 bg-monday-background dark:bg-gray-800 text-monday-primary text-xs font-medium rounded-full">
                {template.category}
              </span>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-16">
            <svg
              className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg text-monday-textLight dark:text-gray-400">
              No templates found in this category
            </p>
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-monday-text dark:text-white">
                Create Board from Template
              </h2>
              <button
                onClick={() => {
                  setSelectedTemplate(null)
                  setBoardName('')
                }}
                className="w-8 h-8 flex items-center justify-center text-monday-textLight hover:text-monday-text dark:hover:text-white hover:bg-monday-background dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Template Info */}
            <div className="mb-6 p-4 bg-monday-background dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-3xl">{selectedTemplate.icon}</span>
                <div>
                  <h3 className="font-semibold text-monday-text dark:text-white">
                    {selectedTemplate.name}
                  </h3>
                  <p className="text-sm text-monday-textLight dark:text-gray-400">
                    {selectedTemplate.category}
                  </p>
                </div>
              </div>
              <p className="text-sm text-monday-textLight dark:text-gray-400">
                {selectedTemplate.description}
              </p>
            </div>

            {/* Board Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                Board Name
              </label>
              <input
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="Enter board name"
                className="w-full px-4 py-3 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:ring-2 focus:ring-monday-primary focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedTemplate(null)
                  setBoardName('')
                }}
                className="flex-1 px-4 py-3 border border-monday-border dark:border-gray-700 text-monday-text dark:text-white rounded-lg font-medium hover:bg-monday-background dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBoard}
                disabled={createBoardMutation.isPending || !boardName.trim()}
                className="flex-1 px-4 py-3 bg-monday-primary text-white rounded-lg font-medium hover:bg-monday-primaryHover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {createBoardMutation.isPending ? 'Creating...' : 'Create Board'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

