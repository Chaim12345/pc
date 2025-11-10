import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'
import { logger } from '../utils/logger'
import Modal from './Modal'

interface ShareWorkdocModalProps {
  workdocId: string
  workdocTitle: string
  isOpen: boolean
  onClose: () => void
}

export default function ShareWorkdocModal({ workdocId, workdocTitle, isOpen, onClose }: ShareWorkdocModalProps) {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [accessLevel, setAccessLevel] = useState<'view' | 'edit'>('view')
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)

  const { data: sharedAccesses } = useQuery({
    queryKey: ['workdoc-shares', workdocId],
    queryFn: async () => {
      const response = await api.get(`/workdocs/${workdocId}/shares`)
      return response.data.data || []
    },
    enabled: isOpen && !!workdocId,
  })

  const shareMutation = useMutation({
    mutationFn: async (data: { email: string; accessLevel: string }) => {
      const response = await api.post(`/workdocs/${workdocId}/share`, data)
      return response.data.data
    },
    onSuccess: () => {
      showToast('Workdoc shared successfully', 'success')
      setEmail('')
      queryClient.invalidateQueries({ queryKey: ['workdoc-shares', workdocId] })
    },
    onError: (error: any) => {
      logger.error('Share workdoc error:', error)
      showToast(error.response?.data?.error || 'Failed to share workdoc', 'error')
    },
  })

  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/workdocs/${workdocId}/share-link`)
      return response.data.data
    },
    onSuccess: (data) => {
      setShareLink(data.shareLink)
      showToast('Share link generated', 'success')
    },
    onError: (error: any) => {
      logger.error('Generate share link error:', error)
      showToast(error.response?.data?.error || 'Failed to generate share link', 'error')
    },
  })

  const revokeMutation = useMutation({
    mutationFn: async (shareId: string) => {
      await api.delete(`/workdocs/${workdocId}/shares/${shareId}`)
    },
    onSuccess: () => {
      showToast('Access revoked', 'success')
      queryClient.invalidateQueries({ queryKey: ['workdoc-shares', workdocId] })
    },
    onError: (error: any) => {
      logger.error('Revoke share error:', error)
      showToast('Failed to revoke access', 'error')
    },
  })

  const handleShare = () => {
    if (!email.trim()) {
      showToast('Please enter an email address', 'error')
      return
    }
    shareMutation.mutate({ email: email.trim(), accessLevel })
  }

  const handleCopyLink = () => {
    if (!shareLink) {
      generateLinkMutation.mutate()
      return
    }
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    showToast('Link copied to clipboard', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRevoke = (shareId: string) => {
    if (window.confirm('Are you sure you want to revoke this access?')) {
      revokeMutation.mutate(shareId)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Share "${workdocTitle}"`} size="md">
      <div className="space-y-6">
        {/* Share via email */}
        <div>
          <label className="block text-sm font-medium text-[var(--vibe-primary-text)] mb-2">
            Share with people
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="flex-1 px-3 py-2 border border-[var(--vibe-border-light)] rounded-lg bg-[var(--vibe-bg-primary)] text-[var(--vibe-primary-text)] focus:outline-none focus:ring-2 focus:ring-[var(--vibe-primary)]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleShare()
                }
              }}
            />
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value as 'view' | 'edit')}
              className="px-3 py-2 border border-[var(--vibe-border-light)] rounded-lg bg-[var(--vibe-bg-primary)] text-[var(--vibe-primary-text)] focus:outline-none focus:ring-2 focus:ring-[var(--vibe-primary)]"
            >
              <option value="view">View</option>
              <option value="edit">Edit</option>
            </select>
            <button
              onClick={handleShare}
              disabled={shareMutation.isPending}
              className="px-4 py-2 bg-[var(--vibe-primary)] text-white rounded-lg hover:bg-[var(--vibe-primary-selected)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {shareMutation.isPending ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </div>

        {/* Share via link */}
        <div>
          <label className="block text-sm font-medium text-[var(--vibe-primary-text)] mb-2">
            Share via link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareLink || 'Click "Generate Link" to create a shareable link'}
              readOnly
              className="flex-1 px-3 py-2 border border-[var(--vibe-border-light)] rounded-lg bg-[var(--vibe-bg-secondary)] text-[var(--vibe-secondary-text)] focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              disabled={generateLinkMutation.isPending}
              className="px-4 py-2 bg-[var(--vibe-primary)] text-white rounded-lg hover:bg-[var(--vibe-primary-selected)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? 'Copied!' : shareLink ? 'Copy' : 'Generate Link'}
            </button>
          </div>
        </div>

        {/* Shared with list */}
        {sharedAccesses && sharedAccesses.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[var(--vibe-primary-text)] mb-2">
              Shared with
            </label>
            <div className="space-y-2">
              {sharedAccesses.map((access: any) => (
                <div
                  key={access.id}
                  className="flex items-center justify-between p-3 bg-[var(--vibe-bg-secondary)] rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--vibe-primary)] to-[var(--vibe-primary-selected)] flex items-center justify-center text-white text-xs font-semibold">
                      {access.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--vibe-primary-text)]">{access.email}</p>
                      <p className="text-xs text-[var(--vibe-secondary-text)] capitalize">{access.accessLevel}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevoke(access.id)}
                    className="text-xs text-red-500 hover:text-red-600 transition-colors"
                    disabled={revokeMutation.isPending}
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

