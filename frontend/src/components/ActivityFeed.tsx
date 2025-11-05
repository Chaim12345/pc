import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { format, formatDistanceToNow } from 'date-fns'

interface ActivityFeedProps {
  boardId?: string
  itemId?: string
  organizationId?: string
  showFilters?: boolean
  limit?: number
}

interface ActivityLog {
  id: string
  action: string
  entityType: string
  entityId?: string
  changes?: any
  createdAt: string
  user?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export default function ActivityFeed({
  boardId,
  itemId,
  organizationId,
  showFilters = false,
  limit = 50,
}: ActivityFeedProps) {
  const [filterAction, setFilterAction] = useState<string>('')
  const [filterEntityType, setFilterEntityType] = useState<string>('')
  const [page, setPage] = useState(1)

  // Build query params
  const queryParams = new URLSearchParams()
  if (boardId) queryParams.append('boardId', boardId)
  if (itemId) queryParams.append('itemId', itemId)
  if (organizationId) queryParams.append('organizationId', organizationId)
  if (filterAction) queryParams.append('action', filterAction)
  if (filterEntityType) queryParams.append('entityType', filterEntityType)
  queryParams.append('page', page.toString())
  queryParams.append('limit', limit.toString())

  const endpoint = itemId
    ? `/activity-logs/item/${itemId}?${queryParams.toString()}`
    : boardId
    ? `/activity-logs/board/${boardId}?${queryParams.toString()}`
    : `/activity-logs?${queryParams.toString()}`

  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', boardId, itemId, organizationId, filterAction, filterEntityType, page, limit],
    queryFn: async () => {
      const response = await api.get(endpoint)
      return response.data
    },
  })

  const logs: ActivityLog[] = data?.data || []
  const pagination = data?.pagination

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
      case 'CREATED':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )
      case 'UPDATE':
      case 'UPDATED':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )
      case 'DELETE':
      case 'DELETED':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )
      case 'COMMENT':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )
      case 'ASSIGN':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const formatActivityMessage = (log: ActivityLog) => {
    const userName = log.user?.name || 'Someone'
    const entity = log.entityType.toLowerCase()

    switch (log.action) {
      case 'CREATE':
      case 'CREATED':
        return `${userName} created a ${entity}`
      case 'UPDATE':
      case 'UPDATED':
        if (log.changes) {
          const changedFields = Object.keys(log.changes).join(', ')
          return `${userName} updated ${changedFields} on ${entity}`
        }
        return `${userName} updated a ${entity}`
      case 'DELETE':
      case 'DELETED':
        return `${userName} deleted a ${entity}`
      case 'COMMENT':
        return `${userName} commented on ${entity}`
      case 'ASSIGN':
        return `${userName} assigned ${entity}`
      default:
        return `${userName} performed ${log.action} on ${entity}`
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-monday-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex gap-3">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:ring-2 focus:ring-monday-primary"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Created</option>
            <option value="UPDATE">Updated</option>
            <option value="DELETE">Deleted</option>
            <option value="COMMENT">Commented</option>
            <option value="ASSIGN">Assigned</option>
          </select>

          <select
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value)}
            className="px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:ring-2 focus:ring-monday-primary"
          >
            <option value="">All Types</option>
            <option value="item">Items</option>
            <option value="board">Boards</option>
            <option value="comment">Comments</option>
            <option value="column">Columns</option>
          </select>
        </div>
      )}

      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-monday-textLight dark:text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">No activity yet</p>
            <p className="text-sm">Activity will appear here when changes are made</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start space-x-3 p-4 bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">{getActionIcon(log.action)}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-monday-text dark:text-white">
                    {formatActivityMessage(log)}
                  </p>
                  <span
                    className="text-xs text-monday-textLight dark:text-gray-400 flex-shrink-0 ml-2"
                    title={format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}
                  >
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {/* User */}
                {log.user && (
                  <div className="flex items-center mt-1 space-x-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-monday-blue to-monday-purple flex items-center justify-center text-white text-xs font-semibold">
                      {log.user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-monday-textLight dark:text-gray-400">
                      {log.user.name}
                    </span>
                  </div>
                )}

                {/* Changes detail */}
                {log.changes && Object.keys(log.changes).length > 0 && (
                  <div className="mt-2 text-xs bg-monday-background dark:bg-gray-800 rounded p-2">
                    {Object.entries(log.changes).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-start space-x-2">
                        <span className="font-medium text-monday-primary">{key}:</span>
                        <span className="text-monday-textLight dark:text-gray-400">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-monday-border dark:border-gray-700">
          <p className="text-sm text-monday-textLight dark:text-gray-400">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} activities
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 border border-monday-border dark:border-gray-700 rounded-lg text-sm font-medium text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1 border border-monday-border dark:border-gray-700 rounded-lg text-sm font-medium text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
