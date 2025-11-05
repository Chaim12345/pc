import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'
import { Board, Item, Column, Group, SocketEvent } from '@monday-clone/shared'
import ViewSelector from '../components/ViewSelector'
import GlobalSearch from '../components/GlobalSearch'
import NotificationCenter from '../components/NotificationCenter'

export default function BoardView() {
  const { boardId } = useParams<{ boardId: string }>()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { socket, joinBoard, leaveBoard } = useSocket()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showBoardMenu, setShowBoardMenu] = useState(false)
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [newColumnType, setNewColumnType] = useState('TEXT')

  // Enable keyboard shortcuts
  useKeyboardShortcuts({ boardId })

  const { data: board, isLoading } = useQuery<Board>({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const response = await api.get(`/boards/${boardId}`)
      return response.data.data
    },
    enabled: !!boardId,
  })

  const addColumnMutation = useMutation({
    mutationFn: async ({ title, type }: { title: string; type: string }) => {
      const response = await api.post('/columns', {
        boardId,
        title,
        type,
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      showToast('Column added successfully', 'success')
      setShowAddColumn(false)
      setNewColumnTitle('')
      setNewColumnType('TEXT')
    },
    onError: () => {
      showToast('Failed to add column', 'error')
    },
  })

  useEffect(() => {
    if (boardId) {
      joinBoard(boardId)
    }

    return () => {
      if (boardId) {
        leaveBoard(boardId)
      }
    }
  }, [boardId])

  useEffect(() => {
    if (!socket) return

    const handleItemChanged = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    }

    const handleColumnChanged = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    }

    const handleGroupChanged = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    }

    socket.on(SocketEvent.ITEM_CHANGED, handleItemChanged)
    socket.on(SocketEvent.COLUMN_CHANGED, handleColumnChanged)
    socket.on(SocketEvent.GROUP_CHANGED, handleGroupChanged)

    return () => {
      socket.off(SocketEvent.ITEM_CHANGED, handleItemChanged)
      socket.off(SocketEvent.COLUMN_CHANGED, handleColumnChanged)
      socket.off(SocketEvent.GROUP_CHANGED, handleGroupChanged)
    }
  }, [socket, boardId, queryClient])

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault()
    if (newColumnTitle.trim()) {
      addColumnMutation.mutate({ title: newColumnTitle, type: newColumnType })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-monday-background dark:bg-monday-dark">
        <div className="flex flex-col items-center space-y-4 animate-pulse">
          <div className="w-16 h-16 border-4 border-monday-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="space-y-2 text-center">
            <div className="text-lg text-monday-text dark:text-white font-medium">Loading board...</div>
            <div className="text-sm text-monday-textLight dark:text-gray-400">Getting everything ready</div>
          </div>
        </div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-monday-background dark:bg-monday-dark">
        <div className="text-center max-w-md">
          <div className="mb-6 relative">
            <div className="text-8xl mb-4 animate-bounce">📋</div>
            <div className="absolute inset-0 blur-3xl bg-monday-primary/20 rounded-full transform scale-150"></div>
          </div>
          <h2 className="text-2xl text-monday-text dark:text-white font-bold mb-2">Board not found</h2>
          <p className="text-monday-textLight dark:text-gray-400 mb-6">
            This board might have been deleted or you don't have access to it.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-monday-primary hover:bg-monday-primaryHover text-white font-medium rounded-lg transition-all hover:shadow-lg hover:scale-105 flex items-center space-x-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-full bg-monday-background dark:bg-monday-dark overflow-hidden">
      {/* Top Navigation Bar */}
      <nav className="h-16 bg-white dark:bg-monday-darkLight border-b border-monday-border dark:border-gray-700 flex-shrink-0 shadow-sm z-30">
        <div className="h-full px-6 flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-monday-textLight dark:text-gray-400 hover:text-monday-primary dark:hover:text-monday-primary transition-all hover:scale-105 group flex-shrink-0"
              title="Back to Dashboard"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium hidden sm:inline">Back</span>
            </button>
            <div className="h-8 w-px bg-monday-border dark:bg-gray-700 hidden sm:block"></div>
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-monday-blue via-monday-purple to-monday-orange flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                {board.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-monday-text dark:text-white truncate">{board.name}</h1>
                {board.description && (
                  <p className="text-xs text-monday-textLight dark:text-gray-400 truncate hidden lg:block">
                    {board.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="w-64 hidden lg:block">
              <GlobalSearch />
            </div>
            
            <NotificationCenter />
            
            <button
              onClick={() => setShowShareModal(true)}
              className="px-3 py-2 text-sm font-medium text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 rounded-lg transition-all hover:scale-105 hidden md:flex items-center space-x-2"
              title="Share board"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden xl:inline">Share</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-monday-textLight dark:text-gray-400 hover:bg-monday-background dark:hover:bg-gray-800 transition-all hover:scale-110"
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <div className="h-8 w-px bg-monday-border dark:bg-gray-700 hidden sm:block"></div>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-monday-primary to-monday-purple flex items-center justify-center text-white font-semibold text-sm hover:scale-110 transition-transform shadow-md"
                title={user?.name || 'User'}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-monday-darkLight rounded-lg shadow-monday-hover border border-monday-border dark:border-gray-700 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-monday-border dark:border-gray-700">
                    <div className="font-semibold text-monday-text dark:text-white">{user?.name}</div>
                    <div className="text-sm text-monday-textLight dark:text-gray-400">{user?.email}</div>
                  </div>
                  <button
                    onClick={() => navigate('/settings/profile')}
                    className="w-full px-4 py-2 text-left text-sm text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Profile Settings</span>
                  </button>
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Quick Actions Bar */}
      <div className="bg-white dark:bg-monday-darkLight border-b border-monday-border dark:border-gray-700 px-6 py-3 flex-shrink-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar">
            <QuickActionButton
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
              label="New Item"
              onClick={() => showToast('Click on a group to add an item', 'info')}
            />
            <QuickActionButton
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>}
              label="Add Column"
              onClick={() => setShowAddColumn(true)}
            />
            <QuickActionButton
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>}
              label="Filter"
              onClick={() => showToast('Filter feature coming soon', 'info')}
            />
            <QuickActionButton
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>}
              label="Sort"
              onClick={() => showToast('Sort feature coming soon', 'info')}
            />
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className="text-xs text-monday-textLight dark:text-gray-400 hidden md:inline">
              {board.groups?.reduce((total, group) => total + (group.items?.length || 0), 0)} items
            </span>
            <div className="w-px h-4 bg-monday-border dark:bg-gray-700 hidden md:block"></div>
            <button
              onClick={() => setShowBoardMenu(!showBoardMenu)}
              className="p-1.5 rounded hover:bg-monday-background dark:hover:bg-gray-800 transition-colors"
              title="Board options"
            >
              <svg className="w-5 h-5 text-monday-textLight dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden p-6 min-h-0">
        <div className="flex-1 min-h-0 overflow-hidden">
          <ViewSelector board={board} />
        </div>
      </main>

      {/* Add Column Modal */}
      {showAddColumn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-monday-text dark:text-white flex items-center space-x-2">
                <svg className="w-6 h-6 text-monday-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>Add New Column</span>
              </h3>
              <button
                onClick={() => setShowAddColumn(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold transition-colors hover:rotate-90 duration-300"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddColumn} className="space-y-4">
              <div>
                <label htmlFor="column-title" className="block text-sm font-semibold text-monday-text dark:text-white mb-2">
                  Column Title
                </label>
                <input
                  id="column-title"
                  type="text"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  placeholder="e.g. Status, Priority, Due Date"
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white placeholder-gray-400 focus:outline-none focus:border-monday-primary focus:ring-4 focus:ring-monday-primary/20 transition-all"
                  autoFocus
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div>
                <label htmlFor="column-type" className="block text-sm font-semibold text-monday-text dark:text-white mb-2">
                  Column Type
                </label>
                <select
                  id="column-type"
                  value={newColumnType}
                  onChange={(e) => setNewColumnType(e.target.value)}
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:border-monday-primary focus:ring-4 focus:ring-monday-primary/20 transition-all"
                  style={{ fontSize: '16px' }}
                >
                  <option value="TEXT">Text</option>
                  <option value="NUMBER">Number</option>
                  <option value="STATUS">Status</option>
                  <option value="PRIORITY">Priority</option>
                  <option value="DATE">Date</option>
                  <option value="PERSON">Person</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddColumn(false)
                    setNewColumnTitle('')
                    setNewColumnType('TEXT')
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-monday-text dark:text-white bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newColumnTitle.trim()}
                  className="px-5 py-2.5 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-lg font-medium transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Column</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

interface QuickActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
}

function QuickActionButton({ icon, label, onClick }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-monday-text dark:text-white bg-white dark:bg-monday-dark hover:bg-monday-background dark:hover:bg-gray-800 border border-monday-border dark:border-gray-700 rounded-lg transition-all hover:scale-105 hover:shadow-md whitespace-nowrap"
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
