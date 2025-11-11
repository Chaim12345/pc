import React, { useState, useMemo } from 'react'
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
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [inviteData, setInviteData] = useState({ email: '', name: '', role: 'MEMBER' })
  const [addUserData, setAddUserData] = useState({ email: '', role: 'MEMBER' })
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'status' | 'role' | 'createdAt'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
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

  // Fetch user details
  const { data: userDetails } = useQuery({
    queryKey: ['user', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return null
      const response = await api.get(`/users/${selectedUser.id}`)
      return response.data.data
    },
    enabled: !!selectedUser,
  })

  // Calculate statistics
  const statistics = useMemo(() => {
    const users = usersData?.data || []
    return {
      total: usersData?.total || 0,
      active: users.filter((u: User) => u.status === 'ACTIVE').length,
      inactive: users.filter((u: User) => u.status === 'INACTIVE').length,
      pending: users.filter((u: User) => u.status === 'PENDING').length,
      suspended: users.filter((u: User) => u.status === 'SUSPENDED').length,
      owners: users.filter((u: User) => u.role === 'OWNER').length,
      admins: users.filter((u: User) => u.role === 'ADMIN').length,
      members: users.filter((u: User) => u.role === 'MEMBER').length,
      viewers: users.filter((u: User) => u.role === 'VIEWER').length,
    }
  }, [usersData])

  // Sort users
  const sortedUsers = useMemo(() => {
    const users = usersData?.data || []
    return [...users].sort((a: User, b: User) => {
      let aVal: any = a[sortBy]
      let bVal: any = b[sortBy]
      
      if (sortBy === 'createdAt' || sortBy === 'lastSeenAt') {
        aVal = aVal ? new Date(aVal).getTime() : 0
        bVal = bVal ? new Date(bVal).getTime() : 0
      } else {
        aVal = String(aVal || '').toLowerCase()
        bVal = String(bVal || '').toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
  }, [usersData?.data, sortBy, sortOrder])

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
      setShowUserDetailsModal(false)
      setSelectedUser(null)
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
    if (selectedUsers.length === sortedUsers.length && sortedUsers.length > 0) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(sortedUsers.map((u: User) => u.id))
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

  const handleViewUserDetails = (user: User) => {
    setSelectedUser(user)
    setShowUserDetailsModal(true)
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const exportUsers = (format: 'csv' | 'json') => {
    const users = sortedUsers
    if (format === 'csv') {
      const headers = ['Name', 'Email', 'Status', 'Role', 'Last Seen', 'Created At']
      const rows = users.map((u: User) => [
        u.name,
        u.email,
        u.status,
        u.role,
        u.lastSeenAt ? new Date(u.lastSeenAt).toLocaleString() : 'Never',
        new Date(u.createdAt).toLocaleString(),
      ])
      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const json = JSON.stringify(users, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
    showToast(`Users exported as ${format.toUpperCase()}`, 'success')
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

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-monday-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-monday-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  const total = usersData?.total || 0
  const totalPages = usersData?.totalPages || 1

  return (
    <div className="flex h-screen w-full bg-monday-background dark:bg-monday-dark overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 bg-white dark:bg-monday-darkLight border-r border-monday-border dark:border-gray-700 flex flex-col shadow-lg">
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

        {/* Statistics */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-monday-text dark:text-white mb-4">Statistics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Users</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{statistics.total}</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-xs text-green-600 dark:text-green-400 mb-1">Active</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{statistics.active}</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <div className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">Pending</div>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{statistics.pending}</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <div className="text-xs text-red-600 dark:text-red-400 mb-1">Suspended</div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">{statistics.suspended}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <h3 className="text-sm font-semibold text-monday-text dark:text-white mb-2">Status Filter</h3>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-monday-dark text-monday-text dark:text-white text-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active ({statistics.active})</option>
              <option value="INACTIVE">Inactive ({statistics.inactive})</option>
              <option value="SUSPENDED">Suspended ({statistics.suspended})</option>
              <option value="PENDING">Pending ({statistics.pending})</option>
            </select>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-monday-text dark:text-white mb-2">Role Filter</h3>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-monday-dark text-monday-text dark:text-white text-sm"
            >
              <option value="ALL">All Roles</option>
              <option value="OWNER">Owner ({statistics.owners})</option>
              <option value="ADMIN">Admin ({statistics.admins})</option>
              <option value="MEMBER">Member ({statistics.members})</option>
              <option value="VIEWER">Viewer ({statistics.viewers})</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-monday-textLight dark:text-gray-400 space-y-2">
              <div className="flex justify-between">
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
                    } else if (e.target.value === 'updateRole') {
                      const role = window.prompt('Enter role (OWNER, ADMIN, MEMBER, VIEWER):')
                      if (role && ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'].includes(role.toUpperCase())) {
                        bulkUpdateMutation.mutate({ action: 'updateRole', value: role.toUpperCase() })
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
                  <option value="updateRole">Change Role</option>
                  <option value="delete">Delete</option>
                </select>
                <span className="text-sm text-monday-textLight dark:text-gray-400">
                  {selectedUsers.length} selected
                </span>
              </>
            )}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-5 py-2.5 bg-white dark:bg-monday-dark hover:bg-monday-background dark:hover:bg-gray-800 text-monday-text dark:text-white rounded-lg font-medium flex items-center space-x-2 transition-all hover:scale-105 border border-monday-border dark:border-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export</span>
              </button>
              {showExportMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-monday-darkLight rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                    <button
                      onClick={() => {
                        exportUsers('csv')
                        setShowExportMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-monday-text dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-t-lg"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={() => {
                        exportUsers('json')
                        setShowExportMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-monday-text dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-b-lg"
                    >
                      Export JSON
                    </button>
                  </div>
                </>
              )}
            </div>
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
          ) : sortedUsers.length > 0 ? (
            <>
              <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-monday overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === sortedUsers.length && sortedUsers.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-monday-primary rounded focus:ring-2 focus:ring-monday-primary"
                        />
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-monday-textLight dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          User
                          <SortIcon field="name" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-monday-textLight dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                          Status
                          <SortIcon field="status" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-monday-textLight dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleSort('role')}
                      >
                        <div className="flex items-center">
                          Role
                          <SortIcon field="role" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-monday-textLight dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center">
                          Joined
                          <SortIcon field="createdAt" />
                        </div>
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
                    {sortedUsers.map((u: User) => (
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
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-monday-primary to-monday-purple flex items-center justify-center text-white font-semibold">
                                {getInitials(u.name)}
                              </div>
                            )}
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
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-monday-textLight dark:text-gray-400">
                          {u.lastSeenAt ? getRelativeTime(u.lastSeenAt) : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewUserDetails(u)}
                              className="text-monday-primary hover:text-monday-primaryHover"
                              title="View details"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete user"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
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

      {/* User Details Modal */}
      {showUserDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUserDetailsModal(false)}>
          <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-monday-text dark:text-white">User Details</h2>
              <button
                onClick={() => {
                  setShowUserDetailsModal(false)
                  setSelectedUser(null)
                }}
                className="text-monday-textLight dark:text-gray-400 hover:text-monday-text dark:hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt={selectedUser.name} className="w-20 h-20 rounded-full" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-monday-primary to-monday-purple flex items-center justify-center text-white text-2xl font-semibold">
                    {getInitials(selectedUser.name)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-monday-text dark:text-white">{selectedUser.name}</h3>
                  <p className="text-monday-textLight dark:text-gray-400">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-sm text-monday-textLight dark:text-gray-400 mb-1">Status</div>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedUser.status)}`}>
                    {selectedUser.status}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-sm text-monday-textLight dark:text-gray-400 mb-1">Role</div>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(selectedUser.role)}`}>
                    {selectedUser.role}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-sm text-monday-textLight dark:text-gray-400 mb-1">Joined</div>
                  <div className="text-monday-text dark:text-white font-medium">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-sm text-monday-textLight dark:text-gray-400 mb-1">Last Seen</div>
                  <div className="text-monday-text dark:text-white font-medium">
                    {selectedUser.lastSeenAt ? getRelativeTime(selectedUser.lastSeenAt) : 'Never'}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    const newStatus = selectedUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
                    updateStatusMutation.mutate({ userId: selectedUser.id, status: newStatus })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-monday-text dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {selectedUser.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
