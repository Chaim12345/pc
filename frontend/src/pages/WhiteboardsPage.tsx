import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'
import ConfirmationDialog from '../components/ConfirmationDialog'

interface Whiteboard {
  id: string
  name: string
  organizationId: string
  createdById: string
  createdAt: string
  updatedAt: string
}

export default function WhiteboardsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newWhiteboardName, setNewWhiteboardName] = useState('')
  const [deleteWhiteboardId, setDeleteWhiteboardId] = useState<string | null>(null)

  const { data: whiteboards, isLoading } = useQuery<Whiteboard[]>({
    queryKey: ['whiteboards', user?.organizationId],
    queryFn: async () => {
      const response = await api.get(`/whiteboards/organization/${user?.organizationId}`)
      return response.data.data
    },
    enabled: !!user?.organizationId
  })

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await api.post('/whiteboards', {
        name,
        organizationId: user?.organizationId,
        content: { objects: [] }
      })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whiteboards'] })
      showToast('Whiteboard created', 'success')
      navigate(`/whiteboards/${data.id}`)
    },
    onError: () => {
      showToast('Failed to create whiteboard', 'error')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/whiteboards/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboards'] })
      showToast('Whiteboard deleted', 'success')
      setDeleteWhiteboardId(null)
    },
    onError: () => {
      showToast('Failed to delete whiteboard', 'error')
    }
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (newWhiteboardName.trim()) {
      createMutation.mutate(newWhiteboardName)
      setNewWhiteboardName('')
      setShowCreateModal(false)
    }
  }

  return (
    <div className="min-h-screen bg-monday-background dark:bg-monday-dark p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="mb-4 text-monday-textLight dark:text-gray-400 hover:text-monday-text dark:hover:text-white transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-3xl font-bold text-monday-text dark:text-white mb-2">Whiteboards</h1>
            <p className="text-monday-textLight dark:text-gray-400">
              Collaborate visually with your team
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-monday-primary hover:bg-monday-primary/90 text-white rounded-lg font-medium transition-all hover:scale-105 shadow-md flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Whiteboard</span>
          </button>
        </div>

        {/* Whiteboards Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-monday-primary border-t-transparent"></div>
          </div>
        ) : whiteboards && whiteboards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {whiteboards.map((whiteboard) => (
              <div
                key={whiteboard.id}
                className="bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-lg p-6 hover:shadow-monday-hover transition-all group cursor-pointer"
                onClick={() => navigate(`/whiteboards/${whiteboard.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-monday-text dark:text-white mb-1">
                      {whiteboard.name}
                    </h3>
                    <p className="text-sm text-monday-textLight dark:text-gray-400">
                      Updated {new Date(whiteboard.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteWhiteboardId(whiteboard.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-all"
                    title="Delete"
                  >
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded border border-monday-border dark:border-gray-700 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-lg">
            <svg className="w-16 h-16 text-monday-textLight dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <h3 className="text-lg font-semibold text-monday-text dark:text-white mb-2">No whiteboards yet</h3>
            <p className="text-monday-textLight dark:text-gray-400 mb-4">Create your first whiteboard to start collaborating</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-monday-primary hover:bg-monday-primary/90 text-white rounded-lg font-medium transition-all"
            >
              Create Whiteboard
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-monday-text dark:text-white mb-4">Create New Whiteboard</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                  Whiteboard Name
                </label>
                <input
                  type="text"
                  value={newWhiteboardName}
                  onChange={(e) => setNewWhiteboardName(e.target.value)}
                  className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                  placeholder="Enter whiteboard name"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-monday-border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-monday-text dark:text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-monday-primary hover:bg-monday-primary/90 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteWhiteboardId && (
        <ConfirmationDialog
          isOpen={!!deleteWhiteboardId}
          title="Delete Whiteboard"
          message="Are you sure you want to delete this whiteboard? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => deleteMutation.mutate(deleteWhiteboardId)}
          onCancel={() => setDeleteWhiteboardId(null)}
          variant="danger"
        />
      )}
    </div>
  )
}



