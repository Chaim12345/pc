import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'
import ConfirmationDialog from '../components/ConfirmationDialog'
import VibeButton from '../components/VibeButton'

interface Workdoc {
  id: string
  title: string
  content: string
  organizationId: string
  createdById: string
  createdAt: string
  updatedAt: string
  creator: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export default function Workdocs() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newWorkdocTitle, setNewWorkdocTitle] = useState('')
  const [deleteWorkdocId, setDeleteWorkdocId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: workdocs, isLoading } = useQuery<Workdoc[]>({
    queryKey: ['workdocs'],
    queryFn: async () => {
      const response = await api.get('/workdocs')
      return response.data.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      const orgs = await api.get('/organizations')
      const orgId = orgs.data.data[0]?.id
      if (!orgId) throw new Error('No organization found')

      const response = await api.post('/workdocs', {
        title,
        content: '',
        organizationId: orgId,
      })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workdocs'] })
      showToast('Workdoc created successfully!', 'success')
      setShowCreateModal(false)
      setNewWorkdocTitle('')
      navigate(`/workdocs/${data.id}`)
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to create workdoc', 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workdocs/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workdocs'] })
      showToast('Workdoc deleted successfully', 'success')
      setDeleteWorkdocId(null)
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to delete workdoc', 'error')
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkdocTitle.trim()) return
    createMutation.mutate(newWorkdocTitle)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60))
        return diffMinutes === 0 ? 'Just now' : `${diffMinutes}m ago`
      }
      return `${diffHours}h ago`
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  const filteredWorkdocs = workdocs?.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.creator.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full bg-[var(--vibe-bg-secondary)]">
      {/* Page Header */}
      <div className="bg-[var(--vibe-bg-primary)] border-b border-[var(--vibe-border-light)] px-6 py-4">
        <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--vibe-primary-text)]">Workdocs</h1>
              <p className="text-sm text-[var(--vibe-secondary-text)] mt-1">
              Create and collaborate on rich documents
            </p>
          </div>
            <VibeButton
              onClick={() => setShowCreateModal(true)}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              New Workdoc
            </VibeButton>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
              <input
                type="text"
                placeholder="Search workdocs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-4 text-[var(--vibe-primary-text)] bg-[var(--vibe-bg-primary)] border border-[var(--vibe-border-light)] rounded-lg focus:outline-none focus:border-[var(--vibe-primary)] focus:ring-2 focus:ring-[var(--vibe-primary-light)] transition-all"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--vibe-icon-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Workdocs Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[var(--vibe-bg-primary)] rounded-xl p-4 animate-pulse shadow-sm">
                  <div className="h-4 bg-[var(--vibe-bg-hover)] rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-[var(--vibe-bg-hover)] rounded w-1/2 mb-4"></div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-[var(--vibe-bg-hover)] rounded-full"></div>
                    <div className="h-3 bg-[var(--vibe-bg-hover)] rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredWorkdocs && filteredWorkdocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredWorkdocs.map((workdoc) => (
                <div
                  key={workdoc.id}
                  className="bg-[var(--vibe-bg-primary)] rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group border border-[var(--vibe-border-light)] overflow-hidden"
                  onClick={() => navigate(`/workdocs/${workdoc.id}`)}
                >
                  {/* Document Icon Header */}
                  <div className="h-32 bg-gradient-to-br from-[var(--vibe-primary)] to-[var(--vibe-primary-selected)] relative p-4 flex items-center justify-center">
                  <svg className="w-16 h-16 text-white/90" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteWorkdocId(workdoc.id)
                      }}
                      className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                      title="Delete workdoc"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                  {/* Document Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-[var(--vibe-primary-text)] mb-1 truncate group-hover:text-[var(--vibe-primary)] transition-colors">
                    {workdoc.title || 'Untitled'}
                  </h3>
                    <p className="text-xs text-[var(--vibe-secondary-text)] mb-3">
                    {formatDate(workdoc.updatedAt)}
                  </p>
                  
                    {/* Creator Info */}
                    <div className="flex items-center space-x-2 pt-3 border-t border-[var(--vibe-border-light)]">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--vibe-primary)] to-[var(--vibe-primary-selected)] flex items-center justify-center text-white text-xs font-bold">
                      {workdoc.creator.name.charAt(0).toUpperCase()}
                    </div>
                      <span className="text-xs text-[var(--vibe-secondary-text)] truncate">
                      {workdoc.creator.name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-[var(--vibe-bg-primary)] rounded-xl p-12 shadow-sm">
            <svg className="w-24 h-24 text-[var(--vibe-border-medium)] mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-[var(--vibe-primary-text)] mb-2">
              {searchTerm ? 'No workdocs found' : 'No workdocs yet'}
            </h3>
            <p className="text-[var(--vibe-secondary-text)] mb-6 text-center max-w-md">
              {searchTerm 
                ? `No workdocs match "${searchTerm}". Try a different search term.`
                : 'Create your first workdoc to start collaborating on rich documents with your team.'}
            </p>
            {!searchTerm && (
              <VibeButton
                onClick={() => setShowCreateModal(true)}
                size="large"
              >
                Create Your First Workdoc
              </VibeButton>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--vibe-bg-primary)] rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-[var(--vibe-primary-text)] mb-2">Create New Workdoc</h2>
              <p className="text-sm text-[var(--vibe-secondary-text)] mb-6">
                Give your workdoc a title to get started
              </p>
              
              <form onSubmit={handleCreate}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[var(--vibe-primary-text)] mb-2">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={newWorkdocTitle}
                    onChange={(e) => setNewWorkdocTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-[var(--vibe-border-light)] rounded-lg bg-[var(--vibe-bg-primary)] text-[var(--vibe-primary-text)] placeholder-[var(--vibe-placeholder-text)] focus:outline-none focus:border-[var(--vibe-primary)] focus:ring-2 focus:ring-[var(--vibe-primary-light)] transition-all"
                    placeholder="e.g., Project Proposal, Meeting Notes..."
                    autoFocus
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <VibeButton
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowCreateModal(false)
                      setNewWorkdocTitle('')
                    }}
                  >
                    Cancel
                  </VibeButton>
                  <VibeButton
                    type="submit"
                    disabled={!newWorkdocTitle.trim() || createMutation.isPending}
                    loading={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Workdoc'}
                  </VibeButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteWorkdocId && (
        <ConfirmationDialog
          isOpen={!!deleteWorkdocId}
          title="Delete Workdoc"
          message="Are you sure you want to delete this workdoc? This action cannot be undone and all content will be permanently lost."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => deleteMutation.mutate(deleteWorkdocId)}
          onCancel={() => setDeleteWorkdocId(null)}
          variant="danger"
        />
      )}
    </div>
  )
}





