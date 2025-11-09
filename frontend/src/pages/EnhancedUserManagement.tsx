import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  status: string
  role: string
  lastSeenAt?: string
  createdAt: string
}

export default function EnhancedUserManagement() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [inviteData, setInviteData] = useState({ email: '', name: '', role: 'MEMBER' })
  const [addUserData, setAddUserData] = useState({ email: '', role: 'MEMBER' })
  const [page, setPage] = useState(1)
  const limit = 20

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', 'all', searchQuery, statusFilter, roleFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      if (roleFilter !== 'ALL') params.append('role', roleFilter)
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      
      const response = await api.get(`/users/all?${params.toString()}`)
      return response.data
    },
    enabled: !!user,
  })

  const inviteUserMutation = useMutation({
    mutationFn: async (data: { email: string; name: string; role: string }) => {
      const response = await api.post('/users/invite', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'all'] })
      setShowInviteModal(false)
      setInviteData({ email: '', name: '', role: 'MEMBER' })
      showToast('User invited successfully!', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to invite user', 'error')
    },
  })

  const addUserMutation = useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      // For adding existing users, we still use invite endpoint but without name
      // The backend will handle adding existing users to the organization
      const response = await api.post('/users/invite', { ...data, name: data.email.split('@')[0] })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'all'] })
      setShowAddUserModal(false)
      setAddUserData({ email: '', role: 'MEMBER' })
      showToast('User added successfully!', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to add user', 'error')
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      await api.put(`/users/${userId}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'all'] })
      showToast('User status updated!', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to update status', 'error')
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await api.put(`/users/${userId}/role`, { role })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'all'] })
      showToast('User role updated!', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to update role', 'error')
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/users/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'all'] })
      showToast('User deleted successfully!', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to delete user', 'error')
    },
  })

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ action, value }: { action: string; value?: string }) => {
      await api.post('/users/bulk', { userIds: selectedUsers, action, value })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'all'] })
      setSelectedUsers([])
      showToast('Bulk operation completed!', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Bulk operation failed', 'error')
    },
  })

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === usersData?.data?.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(usersData?.data?.map((u: User) => u.id) || [])
    }
  }

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault()
    inviteUserMutation.mutate(inviteData)
  }

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()
    addUserMutation.mutate(addUserData)
  }

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    }
    return styles[status as keyof typeof styles] || styles.ACTIVE
  }

  const getRoleBadge = (role: string) => {
    const styles = {
      OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      MEMBER: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      VIEWER: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    }
    return styles[role as keyof typeof styles] || styles.MEMBER
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const users = usersData?.data || []
  const total = usersData?.total || 0
  const totalPages = usersData?.totalPages || 1

  return (
    <div className="flex h-screen w-full bg-monday-background dark:bg-monday-dark overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-monday-darkLight border-r border-monday-border dark:border-gray-700 flex flex-col shadow-lg">
        <div className="p-6 border-b border-monday-border dark:border-gray-700">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-monday-textLight dark:text-gray-400 hover:text-monday-primary dark:hover:text-monday-primary transition-all group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Dashboard</span>
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <h3 className="text-sm font-semibold text-monday-text dark:text-white mb-2">Status</h3>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-monday-dark text-monday-text dark:text-white text-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-monday-text dark:text-white mb-2">Role</h3>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-monday-dark text-monday-text dark:text-white text-sm"
            >
              <option value="ALL">All Roles</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-monday-textLight dark:text-gray-400">
              <div className="flex justify-between mb-2">
                <span>Total Users:</span>
                <span className="font-semibold">{total}</span>
              </div>
              <div className="flex justify-between">
                <span>Selected:</span>
                <span className="font-semibold">{selectedUsers.length}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-monday-darkLight border-b border-monday-border dark:border-gray-700 flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
          <h1 className="text-2xl font-bold text-monday-text dark:text-white">User Management</h1>
          <div className="flex items-center space-x-3">
            {selectedUsers.length > 0 && (
              <>
                <select
                  onChange={(e) => {
                    if (e.target.value === 'delete') {
                      if (window.confirm(`Delete ${selectedUsers.length} selected user(s)?`)) {
                        bulkUpdateMutation.mutate({ action: 'delete' })
                      }
                    } else {
                      bulkUpdateMutation.mutate({ action: 'updateStatus', value: e.target.value })
                    }
                    e.target.value = ''
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-monday-dark text-monday-text dark:text-white"
                >
                  <option value="">Bulk Actions</option>
                  <option value="ACTIVE">Activate</option>
                  <option value="INACTIVE">Deactivate</option>
                  <option value="SUSPENDED">Suspend</option>
                  <option value="delete">Delete</option>
                </select>
                <span className="text-sm text-monday-textLight dark:text-gray-400">
                  {selectedUsers.length} selected
                </span>
              </>
            )}
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-5 py-2.5 bg-white dark:bg-monday-dark hover:bg-monday-background dark:hover:bg-gray-800 text-monday-text dark:text-white rounded-lg font-medium flex items-center space-x-2 transition-all hover:scale-105 border border-monday-border dark:border-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>Add User</span>
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-5 py-2.5 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-lg font-medium flex items-center space-x-2 transition-all hover:scale-105 hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Invite User</span>
            </button>
          </div>
        </header>

        {/* Search Bar */}
        <div className="p-6 bg-white dark:bg-monday-darkLight border-b border-monday-border dark:border-gray-700">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-monday-textLight dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-monday-background dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
            />
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-monday-primary"></div>
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-monday overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-monday-primary rounded focus:ring-2 focus:ring-monday-primary"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-monday-textLight dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-monday-textLight dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-monday-textLight dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-monday-textLight dark:text-gray-400 uppercase tracking-wider">
                        Last Seen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-monday-textLight dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((u: User) => (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(u.id)}
                            onChange={() => handleSelectUser(u.id)}
                            className="w-4 h-4 text-monday-primary rounded focus:ring-2 focus:ring-monday-primary"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-monday-primary to-monday-purple flex items-center justify-center text-white font-semibold">
                              {getInitials(u.name)}
                            </div>
                            <div>
                              <div className="font-medium text-monday-text dark:text-white">{u.name}</div>
                              <div className="text-sm text-monday-textLight dark:text-gray-400">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={u.status}
                            onChange={(e) => updateStatusMutation.mutate({ userId: u.id, status: e.target.value })}
                            className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusBadge(u.status)}`}
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="SUSPENDED">Suspended</option>
                            <option value="PENDING">Pending</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={u.role}
                            onChange={(e) => updateRoleMutation.mutate({ userId: u.id, role: e.target.value })}
                            className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getRoleBadge(u.role)}`}
                          >
                            <option value="OWNER">Owner</option>
                            <option value="ADMIN">Admin</option>
                            <option value="MEMBER">Member</option>
                            <option value="VIEWER">Viewer</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-monday-textLight dark:text-gray-400">
                          {u.lastSeenAt ? getRelativeTime(u.lastSeenAt) : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete user"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-monday-textLight dark:text-gray-400">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} users
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 text-monday-text dark:text-white"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-monday-text dark:text-white">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 text-monday-text dark:text-white"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <svg className="w-24 h-24 text-monday-textLight dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="text-xl font-bold text-monday-text dark:text-white mb-2">No users found</h3>
              <p className="text-monday-textLight dark:text-gray-400">Try adjusting your filters or search query</p>
            </div>
          )}
        </main>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddUserModal(false)}>
          <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-monday-text dark:text-white">Add Existing User</h2>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-monday-textLight dark:text-gray-400 hover:text-monday-text dark:hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-monday-text dark:text-white mb-1">Email</label>
                <input
                  type="email"
                  value={addUserData.email}
                  onChange={(e) => setAddUserData({ ...addUserData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-monday-background dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                  placeholder="user@example.com"
                  required
                />
                <p className="mt-1 text-xs text-monday-textLight dark:text-gray-400">
                  Add an existing user to your organization by their email address
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-monday-text dark:text-white mb-1">Role</label>
                <select
                  value={addUserData.role}
                  onChange={(e) => setAddUserData({ ...addUserData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-monday-background dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                  <option value="OWNER">Owner</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-monday-text dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addUserMutation.isPending}
                  className="flex-1 px-4 py-2 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-md transition-colors disabled:opacity-50"
                >
                  {addUserMutation.isPending ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-monday-text dark:text-white">Invite User</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-monday-textLight dark:text-gray-400 hover:text-monday-text dark:hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-monday-text dark:text-white mb-1">Email</label>
                <input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-monday-background dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-monday-text dark:text-white mb-1">Name</label>
                <input
                  type="text"
                  value={inviteData.name}
                  onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-monday-background dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-monday-text dark:text-white mb-1">Role</label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-monday-background dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                  <option value="OWNER">Owner</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-monday-text dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteUserMutation.isPending}
                  className="flex-1 px-4 py-2 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-md transition-colors disabled:opacity-50"
                >
                  {inviteUserMutation.isPending ? 'Inviting...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

