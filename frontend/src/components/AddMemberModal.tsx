import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useToast } from '../contexts/ToastContext'

type User = {
  id: string
  name: string
  email: string
}

type Props = {
  teamId: string
  onClose: () => void
}

const AddMemberModal = ({ teamId, onClose }: Props) => {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // In a real app, you'd likely have a paginated/searchable user list
  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      // Assuming a /users endpoint exists to list all users in the org
      const response = await api.get('/users')
      return response.data.data
    },
  })

  const addMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/teams/${teamId}/members`, { userId })
    },
    onSuccess: () => {
      showToast('Member added successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['team', teamId] })
      onClose()
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to add member', 'error')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    addMemberMutation.mutate(selectedUser.id)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">Add Member</h2>
        <form onSubmit={handleSubmit}>
          {/* This should be a searchable dropdown component in a real app */}
          <select 
            onChange={(e) => setSelectedUser(users?.find(u => u.id === e.target.value) || null)} 
            className="w-full p-2 border rounded-md mb-4"
          >
            <option>Select a user</option>
            {users?.map(user => (
              <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
            ))}
          </select>

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
            <button type="submit" disabled={!selectedUser || addMemberMutation.isPending} className="px-4 py-2 rounded-md bg-monday-primary text-white disabled:opacity-50">
              {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddMemberModal
