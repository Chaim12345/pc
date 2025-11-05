import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'
import ActivityFeed from '../components/ActivityFeed'

interface ActivityFilters {
  action?: string
  entityType?: string
  userId?: string
  boardId?: string
  startDate?: string
  endDate?: string
}

export default function ActivityLogsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme } = useTheme()
  const { showToast } = useToast()
  const [filters, setFilters] = useState<ActivityFilters>({})
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: activityData, isLoading } = useQuery({
    queryKey: ['activity-logs', user?.organizationId, filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        organizationId: user?.organizationId || '',
        page: page.toString(),
        limit: '20',
        ...filters
      })
      const response = await api.get(`/activity-logs?${params}`)
      return response.data
    },
    enabled: !!user?.organizationId
  })

  const { data: usersData } = useQuery({
    queryKey: ['users', user?.organizationId],
    queryFn: async () => {
      const response = await api.get(`/users/organization/${user?.organizationId}`)
      return response.data.data
    },
    enabled: !!user?.organizationId
  })

  const { data: boardsData } = useQuery({
    queryKey: ['boards', user?.organizationId],
    queryFn: async () => {
      const response = await api.get(`/boards/organization/${user?.organizationId}`)
      return response.data.data
    },
    enabled: !!user?.organizationId
  })

  const handleExportCSV = () => {
    if (!activityData?.data || activityData.data.length === 0) {
      showToast('No data to export', 'error')
      return
    }

    const headers = ['Date', 'User', 'Action', 'Entity Type', 'Details']
    const rows = activityData.data.map((log: any) => [
      new Date(log.createdAt).toLocaleString(),
      log.user?.name || 'System',
      log.action,
      log.entityType,
      JSON.stringify(log.changes || {})
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    showToast('Activity logs exported successfully', 'success')
  }

  const handleFilterChange = (key: keyof ActivityFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
    setPage(1)
  }

  const actionTypes = [
    'created', 'updated', 'deleted', 'viewed', 'shared', 
    'commented', 'attached', 'assigned', 'moved', 'archived'
  ]

  const entityTypes = [
    'board', 'item', 'group', 'column', 'comment', 
    'attachment', 'user', 'workdoc', 'form', 'dashboard'
  ]

  return (
    <div className="min-h-screen bg-monday-background dark:bg-monday-dark">
      {/* Header */}
      <nav className="h-16 bg-white dark:bg-monday-darkLight border-b border-monday-border dark:border-gray-700 flex-shrink-0 shadow-sm">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-monday-textLight dark:text-gray-400 hover:text-monday-primary dark:hover:text-monday-primary transition-all hover:scale-105 group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <div className="h-8 w-px bg-monday-border dark:bg-gray-700"></div>
            <div>
              <h1 className="text-xl font-bold text-monday-text dark:text-white">Activity Logs</h1>
              <p className="text-xs text-monday-textLight dark:text-gray-400">
                Track all activities in your workspace
              </p>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-lg font-medium transition-all hover:scale-105 shadow-md flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export CSV</span>
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Filters */}
          <div className="bg-white dark:bg-monday-darkLight rounded-lg border border-monday-border dark:border-gray-700 p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-monday-text dark:text-white">Filters</h2>
              {(filters.action || filters.entityType || filters.userId || filters.boardId || filters.startDate || filters.endDate) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-monday-primary hover:text-monday-primaryHover font-medium"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search activities..."
                  className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                />
              </div>

              {/* Action Type */}
              <div>
                <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                  Action Type
                </label>
                <select
                  value={filters.action || ''}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                >
                  <option value="">All Actions</option>
                  {actionTypes.map(action => (
                    <option key={action} value={action}>{action.charAt(0).toUpperCase() + action.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Entity Type */}
              <div>
                <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                  Entity Type
                </label>
                <select
                  value={filters.entityType || ''}
                  onChange={(e) => handleFilterChange('entityType', e.target.value)}
                  className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                >
                  <option value="">All Types</option>
                  {entityTypes.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* User Filter */}
              <div>
                <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                  User
                </label>
                <select
                  value={filters.userId || ''}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                  className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                >
                  <option value="">All Users</option>
                  {usersData?.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              {/* Board Filter */}
              <div>
                <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                  Board
                </label>
                <select
                  value={filters.boardId || ''}
                  onChange={(e) => handleFilterChange('boardId', e.target.value)}
                  className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                >
                  <option value="">All Boards</option>
                  {boardsData?.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Date Range Start */}
              <div>
                <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                />
              </div>

              {/* Date Range End */}
              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                />
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <ActivityFeed
            activities={activityData?.data || []}
            isLoading={isLoading}
            searchTerm={searchTerm}
          />

          {/* Pagination */}
          {activityData?.pagination && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-monday-textLight dark:text-gray-400">
                Showing {activityData.pagination.page} of {activityData.pagination.totalPages} pages
                ({activityData.pagination.total} total activities)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-monday-border dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!activityData?.pagination || page >= activityData.pagination.totalPages}
                  className="px-4 py-2 border border-monday-border dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



