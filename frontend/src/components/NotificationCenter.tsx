import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../contexts/SocketContext'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'
import { logger } from '../utils/logger'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
  metadata?: any
}

interface NotificationsResponse {
  notifications: Notification[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'mentions' | 'comments' | 'updates' | 'system'>('all')
  const [page, setPage] = useState(1)
  const [allNotifications, setAllNotifications] = useState<Notification[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)
  const { socket } = useSocket()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const limit = 50

  // Fetch notifications with pagination
  const { data: notificationsData, isLoading: isLoadingNotifications } = useQuery<NotificationsResponse>({
    queryKey: ['notifications', page, limit],
    queryFn: async () => {
      const response = await api.get(`/notifications?page=${page}&limit=${limit}`)
      return response.data.data
    },
    placeholderData: (previousData) => previousData,
  })

  // Accumulate notifications across pages
  useEffect(() => {
    if (notificationsData?.notifications) {
      if (page === 1) {
        setAllNotifications(notificationsData.notifications)
      } else {
        setAllNotifications(prev => [...prev, ...notificationsData.notifications])
      }
    }
  }, [notificationsData, page])

  // Fetch unread count
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await api.get('/notifications/unread-count')
      return response.data.data.count
    },
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.put(`/notifications/${notificationId}/read`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put('/notifications/read-all')
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
      showToast('All notifications marked as read', 'success')
    },
  })

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.delete(`/notifications/${notificationId}`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
      showToast('Notification deleted', 'success')
    },
  })

  // Listen for real-time notifications
  useEffect(() => {
    if (socket) {
      const handleNotificationNew = (data: { notification?: Notification }) => {
        logger.log('Received NOTIFICATION_NEW event:', data)
        
        // If notification data is provided, add it to the list immediately
        if (data.notification) {
          setAllNotifications(prev => [data.notification!, ...prev])
          // Show toast for mentions
          if (data.notification.type === 'mention') {
            showToast(data.notification.message, 'info')
          }
        }
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
        
        // Reset to first page when new notification arrives
        setPage(1)
        if (!data.notification) {
          setAllNotifications([])
        }
      }

      socket.on('NOTIFICATION_NEW', handleNotificationNew)
      logger.log('Listening for NOTIFICATION_NEW events')

      return () => {
        socket.off('NOTIFICATION_NEW', handleNotificationNew)
        logger.log('Stopped listening for NOTIFICATION_NEW events')
      }
    }
  }, [socket, queryClient, showToast])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const pagination = notificationsData?.pagination

  // Filter tabs - memoized
  const filterTabs = useMemo(() => [
    { key: 'all', label: 'All' },
    { key: 'mentions', label: 'Mentions' },
    { key: 'comments', label: 'Comments' },
    { key: 'updates', label: 'Updates' },
    { key: 'system', label: 'System' },
  ], [])

  // Filter notifications - memoized for performance
  const filteredNotifications = useMemo(() => {
    return allNotifications.filter((notif) => {
      if (filter === 'all') return true
      return notif.type === filter
    })
  }, [allNotifications, filter])

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: filteredNotifications.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated height per notification item
    overscan: 5, // Render 5 extra items outside viewport
  })

  // Reset page and notifications when filter changes
  useEffect(() => {
    setPage(1)
    setAllNotifications([])
  }, [filter])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
        )
      case 'comment':
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
        )
      case 'assignment':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        )
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const now = new Date()
    const notifDate = new Date(timestamp)
    const diffMs = now.getTime() - notifDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return notifDate.toLocaleDateString()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Notifications"
      >
        <svg className="w-6 h-6 text-monday-text dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-monday-darkLight rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-monday-text dark:text-white">Notifications</h3>
              {allNotifications.length > 0 && (
                <button
                  onClick={() => markAllAsReadMutation.mutate()}
                  className="text-xs text-monday-primary hover:text-monday-primaryHover font-medium focus:outline-none focus:ring-2 focus:ring-monday-primary focus:ring-offset-2 rounded px-2 py-1"
                  aria-label="Mark all notifications as read"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2 overflow-x-auto" role="tablist" aria-label="Notification filters">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  role="tab"
                  aria-selected={filter === tab.key}
                  aria-controls={`notification-list-${tab.key}`}
                  className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-monday-primary focus:ring-offset-2 ${
                    filter === tab.key
                      ? 'bg-monday-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-monday-text dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div 
            ref={parentRef}
            id={`notification-list-${filter}`}
            className="flex-1 overflow-y-auto custom-scrollbar"
            style={{ height: '400px' }}
          >
            <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
              {filteredNotifications.length === 0 
                ? 'No notifications' 
                : `${filteredNotifications.length} notification${filteredNotifications.length !== 1 ? 's' : ''}`}
            </div>
            {isLoadingNotifications && filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-monday-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-monday-textLight dark:text-gray-400">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-sm text-monday-textLight dark:text-gray-400">No notifications</p>
              </div>
            ) : (
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const notification = filteredNotifications[virtualItem.index]
                  return (
                    <div
                      key={notification.id}
                      data-index={virtualItem.index}
                      ref={virtualizer.measureElement}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <div
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer border-b border-gray-200 dark:border-gray-700 ${
                          !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                        }`}
                        onClick={() => {
                          if (!notification.read) {
                            markAsReadMutation.mutate(notification.id)
                          }
                          // Use link from metadata if available
                          const link = notification.metadata?.link || notification.link
                          if (link) {
                            setIsOpen(false)
                            navigate(link)
                          }
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <p className="text-sm font-medium text-monday-text dark:text-white">
                                {notification.title}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotificationMutation.mutate(notification.id)
                                }}
                                className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                aria-label={`Delete notification: ${notification.title}`}
                              >
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <p className="text-xs text-monday-textLight dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-monday-textLight dark:text-gray-500 mt-1">
                              {formatTimestamp(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-monday-primary rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {/* Load more button if there are more pages */}
            {pagination && pagination.page < pagination.totalPages && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  className="w-full px-4 py-2 text-sm text-monday-primary hover:bg-monday-primaryLight/20 dark:hover:bg-monday-primary/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-monday-primary focus:ring-offset-2"
                  aria-label={`Load more notifications (page ${pagination.page + 1} of ${pagination.totalPages})`}
                >
                  Load more ({pagination.total - (pagination.page * pagination.limit)} remaining)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

