import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'
import ConfirmationDialog from './ConfirmationDialog'
import Modal from './Modal'

interface GuestAccess {
  id: string
  boardId: string
  token: string
  email?: string
  name?: string
  accessLevel: string
  expiresAt?: string
  isActive: boolean
  createdAt: string
  lastAccessedAt?: string
  accessCount: number
}

interface Props {
  boardId: string
  isOpen: boolean
  onClose: () => void
}

export default function GuestAccessModal({ boardId, isOpen, onClose }: Props) {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [revokeGuestId, setRevokeGuestId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    accessLevel: 'view',
    expiresAt: ''
  })

  const { data: guestAccesses, isLoading } = useQuery<GuestAccess[]>({
    queryKey: ['guest-accesses', boardId],
    queryFn: async () => {
      const response = await api.get(`/guest-access/board/${boardId}`)
      return response.data.data
    },
    enabled: isOpen && !!boardId
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/guest-access', { ...data, boardId })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guest-accesses', boardId] })
      showToast('Guest access created successfully', 'success')
      
      // Copy link to clipboard
      const shareLink = `${window.location.origin}/guest/board/${data.token}`
      navigator.clipboard.writeText(shareLink)
      showToast('Share link copied to clipboard!', 'success')
      
      setShowCreateForm(false)
      setFormData({ email: '', name: '', accessLevel: 'view', expiresAt: '' })
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to create guest access', 'error')
    }
  })

  const revokeMutation = useMutation({
    mutationFn: async (guestId: string) => {
      await api.post(`/guest-access/${guestId}/revoke`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-accesses', boardId] })
      showToast('Guest access revoked', 'success')
      setRevokeGuestId(null)
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to revoke access', 'error')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (guestId: string) => {
      await api.delete(`/guest-access/${guestId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-accesses', boardId] })
      showToast('Guest access deleted', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to delete access', 'error')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/guest/board/${token}`
    navigator.clipboard.writeText(link)
    showToast('Link copied to clipboard!', 'success')
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Guest Access"
        size="4xl"
      >
        <div className="space-y-6">
          <p className="text-sm text-monday-textLight dark:text-gray-400">
            Share this board with external users via secure links
          </p>
            {/* Create Form */}
            {showCreateForm ? (
              <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 space-y-4">
                <h4 className="font-semibold text-monday-text dark:text-white mb-4">Create New Guest Access</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                      Guest Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                      placeholder="Enter guest name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                      Guest Email (optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                      placeholder="guest@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                      Access Level
                    </label>
                    <select
                      value={formData.accessLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, accessLevel: e.target.value }))}
                      className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                    >
                      <option value="view">View Only</option>
                      <option value="comment">Can Comment</option>
                      <option value="edit">Can Edit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                      Expires At (optional)
                    </label>
                    <input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                      className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-4 py-2 bg-monday-primary hover:bg-monday-primary/90 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create & Copy Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-monday-border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-monday-text dark:text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full px-4 py-3 border-2 border-dashed border-monday-border dark:border-gray-700 hover:border-monday-primary hover:bg-monday-primaryLight dark:hover:bg-monday-primary/10 rounded-lg text-monday-text dark:text-white font-medium transition-all flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create New Guest Access</span>
              </button>
            )}

            {/* Guest List */}
            <div>
              <h4 className="font-semibold text-monday-text dark:text-white mb-4">Active Guest Accesses</h4>
              
              {isLoading ? (
                <div className="text-center py-8 text-monday-textLight dark:text-gray-400">
                  Loading...
                </div>
              ) : guestAccesses && guestAccesses.length > 0 ? (
                <div className="space-y-3">
                  {guestAccesses.map((guest) => (
                    <div
                      key={guest.id}
                      className="border border-monday-border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h5 className="font-medium text-monday-text dark:text-white">
                              {guest.name || 'Anonymous Guest'}
                            </h5>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              guest.isActive 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                            }`}>
                              {guest.isActive ? 'Active' : 'Revoked'}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                              {guest.accessLevel}
                            </span>
                          </div>
                          
                          {guest.email && (
                            <p className="text-sm text-monday-textLight dark:text-gray-400 mb-1">
                              {guest.email}
                            </p>
                          )}
                          
                          <div className="text-xs text-monday-textLight dark:text-gray-400 space-y-1">
                            <p>Created: {new Date(guest.createdAt).toLocaleDateString()}</p>
                            {guest.expiresAt && (
                              <p>Expires: {new Date(guest.expiresAt).toLocaleDateString()}</p>
                            )}
                            <p>Access count: {guest.accessCount}</p>
                            {guest.lastAccessedAt && (
                              <p>Last accessed: {new Date(guest.lastAccessedAt).toLocaleString()}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => copyLink(guest.token)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                            title="Copy link"
                          >
                            <svg className="w-4 h-4 text-monday-textLight dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          {guest.isActive && (
                            <button
                              onClick={() => setRevokeGuestId(guest.id)}
                              className="p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 rounded transition-colors"
                              title="Revoke access"
                            >
                              <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => deleteMutation.mutate(guest.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-monday-textLight dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>No guest accesses yet</p>
                </div>
              )}
            </div>
        </div>
      </Modal>

      {/* Revoke Confirmation */}
      {revokeGuestId && (
        <ConfirmationDialog
          isOpen={!!revokeGuestId}
          title="Revoke Guest Access"
          message="Are you sure you want to revoke this guest access? The guest will no longer be able to view the board using this link."
          confirmText="Revoke"
          cancelText="Cancel"
          onConfirm={() => revokeMutation.mutate(revokeGuestId)}
          onCancel={() => setRevokeGuestId(null)}
          variant="warning"
        />
      )}
    </>
  )
}

