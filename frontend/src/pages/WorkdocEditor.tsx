import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CollaborativePresence from '../components/CollaborativePresence'
import ConfirmationDialog from '../components/ConfirmationDialog'
import LexicalEditor from '../components/LexicalEditor'
import ShareWorkdocModal from '../components/ShareWorkdocModal'
import VibeButton from '../components/VibeButton'
import { useSocket } from '../contexts/SocketContext'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'

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

export default function WorkdocEditor() {
  const { workdocId } = useParams<{ workdocId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const { socket: socketInstance } = useSocket()
  const { theme, toggleTheme } = useTheme()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showCoverImage, setShowCoverImage] = useState(false)
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [emoji, setEmoji] = useState('📄')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [collaborators, setCollaborators] = useState<any[]>([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  const { data: workdoc, isLoading } = useQuery<Workdoc>({
    queryKey: ['workdoc', workdocId],
    queryFn: async () => {
      const response = await api.get(`/workdocs/${workdocId}`)
      return response.data.data
    },
    enabled: !!workdocId,
  })

  useEffect(() => {
    if (workdoc) {
      setTitle(workdoc.title)
      setContent(workdoc.content || '')
      setHasUnsavedChanges(false)
    }
  }, [workdoc])

  // Socket connection for collaborative features
  useEffect(() => {
    // Check if socketInstance exists and has emit method
    if (!socketInstance || typeof socketInstance.emit !== 'function' || !workdocId) return

    // Join workdoc room
    socketInstance.emit('join-workdoc', { workdocId })

    // Listen for collaborator updates
    socketInstance.on('collaborator-joined', (user: any) => {
      setCollaborators(prev => [...prev.filter(c => c.id !== user.id), user])
    })

    socketInstance.on('collaborator-left', (userId: string) => {
      setCollaborators(prev => prev.filter(c => c.id !== userId))
    })

    socketInstance.on('workdoc-updated', (data: any) => {
      if (data.userId !== socketInstance.id) {
        // Update from another user
        queryClient.invalidateQueries({ queryKey: ['workdoc', workdocId] })
      }
    })

    return () => {
      if (socketInstance && typeof socketInstance.emit === 'function') {
        socketInstance.emit('leave-workdoc', { workdocId })
        socketInstance.off('collaborator-joined')
        socketInstance.off('collaborator-left')
        socketInstance.off('workdoc-updated')
      }
    }
  }, [socketInstance, workdocId, queryClient])

  const updateMutation = useMutation({
    mutationFn: async (data: { title?: string; content?: string }) => {
      const response = await api.put(`/workdocs/${workdocId}`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workdoc', workdocId] })
      queryClient.invalidateQueries({ queryKey: ['workdocs'] })
      setHasUnsavedChanges(false)
      showToast('Workdoc saved', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to save workdoc', 'error')
    },
  })

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges || !workdoc) return

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    // Set new timeout for auto-save
    const timeout = setTimeout(() => {
      updateMutation.mutate({ title, content })
    }, 2000) // Auto-save after 2 seconds of no changes

    setSaveTimeout(timeout)

    return () => {
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, hasUnsavedChanges, workdoc])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    setHasUnsavedChanges(true)
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setHasUnsavedChanges(true)
  }

  const handleManualSave = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    updateMutation.mutate({ title, content })
  }

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/workdocs/${workdocId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workdocs'] })
      showToast('Workdoc deleted', 'success')
      navigate('/workdocs')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to delete workdoc', 'error')
    },
  })

  const handleDelete = () => {
    deleteMutation.mutate()
    setShowDeleteDialog(false)
  }

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false)
      }
    }

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoreMenu])

  // Common emojis for quick selection
  const commonEmojis = ['📄', '📝', '📋', '📑', '📊', '📈', '📉', '💡', '🎯', '✅', '❌', '⭐', '🔥', '💎', '🚀']

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--vibe-bg-primary)]">
        <div className="animate-pulse">
          <div className="h-4 bg-[var(--vibe-bg-hover)] rounded w-32 mb-4"></div>
          <div className="h-2 bg-[var(--vibe-bg-hover)] rounded w-24"></div>
        </div>
      </div>
    )
  }

    if (!workdoc) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[var(--vibe-bg-primary)] text-[var(--vibe-secondary-text)]">
          <svg className="w-16 h-16 text-[var(--vibe-icon-color)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mb-4 text-center">Workdoc not found</p>
          <VibeButton onClick={() => navigate('/workdocs')}>Back to Workdocs</VibeButton>
        </div>
      )
    }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--vibe-bg-primary)]">
      {/* Minimal Top Bar - Notion/Monday Style */}
      <div className="sticky top-0 z-10 border-b border-[var(--vibe-border-light)] bg-[var(--vibe-bg-primary)]/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/workdocs')}
              className="p-1.5 hover:bg-[var(--vibe-bg-hover)] rounded-md transition-colors"
              title="Back to Workdocs"
            >
              <svg className="w-5 h-5 text-[var(--vibe-icon-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Status Indicator - Compact */}
            {hasUnsavedChanges ? (
              <span className="text-xs text-[var(--vibe-secondary-text)]">Unsaved</span>
            ) : updateMutation.isPending ? (
              <span className="text-xs text-[var(--vibe-secondary-text)]">Saving...</span>
            ) : (
              <span className="text-xs text-[var(--vibe-positive)]">Saved</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Share Button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-[var(--vibe-primary-text)] hover:bg-[var(--vibe-bg-hover)] rounded-lg transition-colors"
              title="Share"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 hover:bg-[var(--vibe-bg-hover)] rounded-md transition-colors"
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 text-[var(--vibe-icon-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-[var(--vibe-icon-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* More Options */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-1.5 hover:bg-[var(--vibe-bg-hover)] rounded-md transition-colors"
                title="More options"
                aria-label="More options"
              >
                <svg className="w-5 h-5 text-[var(--vibe-icon-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--vibe-bg-primary)] border border-[var(--vibe-border-light)] rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                      showToast('Link copied to clipboard', 'success')
                      setShowMoreMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--vibe-primary-text)] hover:bg-[var(--vibe-bg-hover)] transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy link
                  </button>
                  <button
                    onClick={() => {
                      // Export functionality - could be enhanced
                      const blob = new Blob([`# ${title}\n\n${content}`], { type: 'text/markdown' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${title || 'workdoc'}.md`
                      a.click()
                      URL.revokeObjectURL(url)
                      showToast('Workdoc exported', 'success')
                      setShowMoreMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--vibe-primary-text)] hover:bg-[var(--vibe-bg-hover)] transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export as Markdown
                  </button>
                  <div className="border-t border-[var(--vibe-border-light)] my-1"></div>
                  <button
                    onClick={() => {
                      setShowDeleteDialog(true)
                      setShowMoreMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete workdoc
                  </button>
                </div>
              )}
            </div>

            {/* Collaborative Presence */}
            <div className="flex items-center space-x-2 pl-2 border-l border-[var(--vibe-border-light)]">
              {collaborators.length > 0 && (
                <CollaborativePresence collaborators={collaborators} />
              )}
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--vibe-primary)] to-[var(--vibe-primary-selected)] flex items-center justify-center text-white text-xs font-semibold">
                {workdoc.creator.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Content - Notion Style */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-12">
          {/* Cover Image Placeholder (Notion-style) */}
          <div className="group relative mb-8">
            <div className="h-40 bg-gradient-to-br from-[var(--vibe-primary-light)] to-[var(--vibe-primary)] rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="px-4 py-2 bg-white/90 hover:bg-white text-[var(--vibe-primary-text)] rounded-lg text-sm font-medium shadow-lg transition-all">
                  Add cover
                </button>
              </div>
            </div>
          </div>

          {/* Icon + Title Section - Notion Style */}
          <div className="mb-4">
            {/* Icon Emoji (Notion-style) */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-6xl mb-4 hover:bg-[var(--vibe-bg-hover)] rounded-lg p-2 -ml-2 transition-colors"
                title="Change icon"
              >
                {emoji}
              </button>
              {showEmojiPicker && (
                <div className="absolute top-0 left-0 bg-[var(--vibe-bg-primary)] border border-[var(--vibe-border-light)] rounded-lg shadow-lg p-3 z-50 grid grid-cols-5 gap-2 max-w-xs">
                  {commonEmojis.map((e) => (
                    <button
                      key={e}
                      onClick={() => {
                        setEmoji(e)
                        setShowEmojiPicker(false)
                      }}
                      className="text-2xl hover:bg-[var(--vibe-bg-hover)] rounded p-1 transition-colors"
                    >
                      {e}
                    </button>
                  ))}
                  <input
                    type="text"
                    placeholder="Or type emoji"
                    maxLength={2}
                    className="col-span-5 px-2 py-1 border border-[var(--vibe-border-light)] rounded bg-[var(--vibe-bg-secondary)] text-[var(--vibe-primary-text)] text-sm"
                    onChange={(e) => {
                      if (e.target.value) {
                        setEmoji(e.target.value)
                        setShowEmojiPicker(false)
                      }
                    }}
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Title - Large and Bold */}
            {isEditingTitle ? (
              <textarea
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    setIsEditingTitle(false)
                  }
                  if (e.key === 'Escape') {
                    setTitle(workdoc.title)
                    setIsEditingTitle(false)
                  }
                }}
                className="w-full text-5xl font-bold text-[var(--vibe-primary-text)] bg-transparent focus:outline-none resize-none overflow-hidden"
                style={{ height: 'auto' }}
                autoFocus
                rows={1}
              />
            ) : (
              <h1
                className="text-5xl font-bold text-[var(--vibe-primary-text)] cursor-text hover:bg-[var(--vibe-bg-hover)]/50 rounded-lg px-2 py-1 -mx-2 transition-colors leading-tight"
                onClick={() => setIsEditingTitle(true)}
              >
                {title || 'Untitled'}
              </h1>
            )}
          </div>

          {/* Metadata - Small and subtle */}
          <div className="flex items-center space-x-3 text-xs text-[var(--vibe-secondary-text)] mb-8 pl-2">
            <div className="flex items-center space-x-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{workdoc.creator.name}</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Last edited {new Date(workdoc.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Editor - Clean and spacious */}
          <div className="min-h-[600px]">
            <LexicalEditor
              content={content}
              onChange={handleContentChange}
              placeholder="Press '/' for commands, or just start typing..."
            />
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {workdoc && (
        <ShareWorkdocModal
          workdocId={workdoc.id}
          workdocTitle={title || workdoc.title}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete workdoc"
        message={`Are you sure you want to delete "${title || 'this workdoc'}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}