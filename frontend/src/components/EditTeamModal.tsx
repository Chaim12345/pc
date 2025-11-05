import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useToast } from '../contexts/ToastContext'

type Team = {
  id: string
  name: string
  description?: string
}

type Props = {
  team: Team
  onClose: () => void
}

const EditTeamModal = ({ team, onClose }: Props) => {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [name, setName] = useState(team.name)
  const [description, setDescription] = useState(team.description || '')

  const updateTeamMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      await api.put(`/teams/${team.id}`, data)
    },
    onSuccess: () => {
      showToast('Team updated successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['team', team.id] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      onClose()
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to update team', 'error')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateTeamMutation.mutate({ name, description })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-monday-text dark:text-white">Edit Team</h2>
          <button onClick={onClose} className="text-monday-textLight dark:text-gray-400 hover:text-monday-text dark:hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-monday-text dark:text-white mb-1">Team Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-monday-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-monday-text dark:text-white mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-monday-primary"
              rows={3}
            />
          </div>
          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md">Cancel</button>
            <button type="submit" disabled={updateTeamMutation.isPending} className="flex-1 px-4 py-2 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-md disabled:opacity-50">
              {updateTeamMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditTeamModal
