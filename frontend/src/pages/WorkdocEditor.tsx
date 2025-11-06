import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'
import TipTapEditor from '../components/TipTapEditor'
import VibeButton from '../components/VibeButton'
import { useSocket } from '../contexts/SocketContext'
import CollaborativePresence from '../components/CollaborativePresence'

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
  const socket = useSocket()
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
  const titleInputRef = useRef<HTMLInputElement>(null)

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
    if (!socket || !workdocId) return

    // Join workdoc room
    socket.emit('join-workdoc', { workdocId })

    // Listen for collaborator updates
    socket.on('collaborator-joined', (user: any) => {
      setCollaborators(prev => [...prev.filter(c => c.id !== user.id), user])
    })

    socket.on('collaborator-left', (userId: string) => {
      setCollaborators(prev => prev.filter(c => c.id !== userId))
    })

    socket.on('workdoc-updated', (data: any) => {
      if (data.userId !== socket.id) {
        // Update from another user
        queryClient.invalidateQueries({ queryKey: ['workdoc', workdocId] })
      }
    })

    return () => {
      socket.emit('leave-workdoc', { workdocId })
      socket.off('collaborator-joined')
      socket.off('collaborator-left')
      socket.off('workdoc-updated')
    }
  }, [socket, workdocId])

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
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
    }
  }, [title, content, hasUnsavedChanges])

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
              className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-[var(--vibe-primary-text)] hover:bg-[var(--vibe-bg-hover)] rounded-lg transition-colors"
              title="Share"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* More Options */}
            <button
              className="p-1.5 hover:bg-[var(--vibe-bg-hover)] rounded-md transition-colors"
              title="More options"
            >
              <svg className="w-5 h-5 text-[var(--vibe-icon-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

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
            <button className="text-6xl mb-4 hover:bg-[var(--vibe-bg-hover)] rounded-lg p-2 -ml-2 transition-colors">
              📄
            </button>

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
            <TipTapEditor
              content={content}
              onChange={handleContentChange}
              placeholder="Press '/' for commands, or just start typing..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}