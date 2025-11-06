import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { User } from '@monday-clone/shared'

interface AddTeamMemberModalProps {
  teamId: string
  existingMemberIds: string[]
  onClose: () => void
  onAddMember: (userId: string, role: string) => void
}

export default function AddTeamMemberModal({ teamId, existingMemberIds, onClose, onAddMember }: AddTeamMemberModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState('MEMBER')

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users', 'search', searchQuery],
    queryFn: async () => {
      const response = await api.get(`/users/search?query=${encodeURIComponent(searchQuery)}`)
      return response.data.data
    },
  })

  // Filter out users who are already members
  const availableUsers = users.filter(user => !existingMemberIds.includes(user.id))

  const handleAddMember = () => {
    if (selectedUserId) {
      onAddMember(selectedUserId, selectedRole)
      onClose()
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-monday-blue',
      'bg-monday-purple',
      'bg-monday-green',
      'bg-monday-orange',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-monday-text dark:text-white">Add Team Member</h2>
          <button
            onClick={onClose}
            className="text-monday-textLight dark:text-gray-400 hover:text-monday-text dark:hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
              Search Users
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-monday-textLight dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-monday-background dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                autoFocus
              />
            </div>
          </div>

          {/* User List */}
          <div className="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-monday-primary"></div>
              </div>
            ) : availableUsers.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {availableUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-monday-background dark:hover:bg-gray-800 transition-colors ${
                      selectedUserId === user.id ? 'bg-monday-primaryLight dark:bg-monday-primary/20' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                      {getInitials(user.name)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-monday-text dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-xs text-monday-textLight dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                    {selectedUserId === user.id && (
                      <svg className="w-5 h-5 text-monday-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-monday-textLight dark:text-gray-500">
                {searchQuery ? 'No users found' : 'Start typing to search for users'}
              </div>
            )}
          </div>

          {/* Role Selection */}
          {selectedUserId && (
            <div>
              <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-monday-background dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
                <option value="OWNER">Owner</option>
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-monday-text dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddMember}
              disabled={!selectedUserId}
              className="flex-1 px-4 py-2 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Member
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

