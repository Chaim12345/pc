import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'
import { Board, SocketEvent } from '@monday-clone/shared'
import ViewSelector from '../components/ViewSelector'
import AIAssistant from '../components/AIAssistant'
import GuestAccessModal from '../components/GuestAccessModal'
import RecurringTasksModal from '../components/RecurringTasksModal'
import ExportModal from '../components/ExportModal'
import ImportModal from '../components/ImportModal'
import FilterModal, { FilterRule } from '../components/FilterModal'
import SortModal, { SortRule } from '../components/SortModal'
import EnhancedAutomationBuilder from '../components/EnhancedAutomationBuilder'
import { usePage } from '../contexts/PageContext'


export default function BoardView() {
  const { boardId } = useParams<{ boardId: string }>()
  const navigate = useNavigate()
  const { setPageTitle, setPageActions } = usePage()
  const { user } = useAuth()
  const { socket, joinBoard, leaveBoard } = useSocket()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [showBoardMenu, setShowBoardMenu] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [newColumnType, setNewColumnType] = useState('TEXT')
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [showGuestAccess, setShowGuestAccess] = useState(false)
  const [showRecurringTasks, setShowRecurringTasks] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showSortModal, setShowSortModal] = useState(false)
  const [showAutomations, setShowAutomations] = useState(false)
  const [filterRules, setFilterRules] = useState<FilterRule[]>([])
  const [sortRules, setSortRules] = useState<SortRule[]>([])

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

  useEffect(() => {
    if (board) {
      setPageTitle(board.name)
      setPageActions(
        <div className="flex items-center space-x-2">
           <button
              onClick={() => setShowGuestAccess(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-monday-primary hover:bg-monday-primaryHover rounded-lg transition-all hover:scale-105 hover:shadow-lg hidden md:flex items-center space-x-2"
              title="Share board with guests"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden xl:inline">Share</span>
            </button>
        </div>
      )
    }

    return () => {
      setPageActions(null)
    }
  }, [board, setPageTitle, setPageActions, setShowGuestAccess])

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

    const handleItemChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    }

    const handleColumnChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    }

    const handleGroupChanged = () => {
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
      {/* Top Navigation Bar is now in MainLayout */}

      {/* Improved Toolbar */}
      <div className="bg-white dark:bg-monday-darkLight border-b border-monday-border dark:border-gray-700 px-4 py-2.5 flex-shrink-0 z-20">
        <div className="flex items-center justify-between gap-3">
          {/* Primary Actions - Most Used */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast('Click on a group to add an item', 'info')}
              className="flex items-center gap-2 px-3 py-1.5 bg-monday-primary hover:bg-monday-primaryHover text-white text-sm font-medium rounded-lg transition-all hover:scale-105 shadow-sm"
              title="Add new item"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Item</span>
            </button>
            
            <button
              onClick={() => setShowAddColumn(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-monday-dark hover:bg-monday-background dark:hover:bg-gray-800 text-monday-text dark:text-white text-sm font-medium rounded-lg border border-monday-border dark:border-gray-700 transition-all hover:scale-105"
              title="Add column"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="hidden sm:inline">Column</span>
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-monday-border dark:bg-gray-700"></div>

            {/* View & Organize */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowFilterModal(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-lg transition-all hover:scale-105 ${
                  filterRules.length > 0
                    ? 'bg-monday-primaryLight dark:bg-monday-primary/20 text-monday-primary dark:text-monday-primary border border-monday-primary/30'
                    : 'bg-white dark:bg-monday-dark hover:bg-monday-background dark:hover:bg-gray-800 text-monday-text dark:text-white border border-monday-border dark:border-gray-700'
                }`}
                title={`Filter${filterRules.length > 0 ? ` (${filterRules.length} active)` : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {filterRules.length > 0 && (
                  <span className="hidden sm:inline text-xs font-semibold">{filterRules.length}</span>
                )}
              </button>

              <button
                onClick={() => setShowSortModal(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-lg transition-all hover:scale-105 ${
                  sortRules.length > 0
                    ? 'bg-monday-primaryLight dark:bg-monday-primary/20 text-monday-primary dark:text-monday-primary border border-monday-primary/30'
                    : 'bg-white dark:bg-monday-dark hover:bg-monday-background dark:hover:bg-gray-800 text-monday-text dark:text-white border border-monday-border dark:border-gray-700'
                }`}
                title={`Sort${sortRules.length > 0 ? ` (${sortRules.length} active)` : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                {sortRules.length > 0 && (
                  <span className="hidden sm:inline text-xs font-semibold">{sortRules.length}</span>
                )}
              </button>
            </div>

            {/* More Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-monday-dark hover:bg-monday-background dark:hover:bg-gray-800 text-monday-text dark:text-white text-sm font-medium rounded-lg border border-monday-border dark:border-gray-700 transition-all hover:scale-105"
                title="More actions"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
                <span className="hidden sm:inline">More</span>
                <svg className={`w-3 h-3 transition-transform ${showMoreMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showMoreMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowMoreMenu(false)}
                  ></div>
                  <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-monday-darkLight rounded-lg shadow-lg border border-monday-border dark:border-gray-700 z-50 py-1">
                    <button
                      onClick={() => {
                        navigate(`/forms/board/${boardId}`)
                        setShowMoreMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Forms
                    </button>
                    <button
                      onClick={() => {
                        setShowAIAssistant(true)
                        setShowMoreMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Assistant
                    </button>
                    <button
                      onClick={() => {
                        setShowAutomations(true)
                        setShowMoreMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Automations
                    </button>
                    <div className="border-t border-monday-border dark:border-gray-700 my-1"></div>
                    <button
                      onClick={() => {
                        setShowGuestAccess(true)
                        setShowMoreMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Guest Access
                    </button>
                    <button
                      onClick={() => {
                        setShowRecurringTasks(true)
                        setShowMoreMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Recurring Tasks
                    </button>
                    <div className="border-t border-monday-border dark:border-gray-700 my-1"></div>
                    <button
                      onClick={() => {
                        setShowImport(true)
                        setShowMoreMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Import
                    </button>
                    <button
                      onClick={() => {
                        setShowExport(true)
                        setShowMoreMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Side - Stats & Menu */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-monday-textLight dark:text-gray-400 hidden lg:inline whitespace-nowrap">
              {board.groups?.reduce((total, group) => total + (group.items?.length || 0), 0)} items
            </span>
            <button
              onClick={() => setShowBoardMenu(!showBoardMenu)}
              className="p-1.5 rounded-lg hover:bg-monday-background dark:hover:bg-gray-800 transition-colors"
              title="Board options"
              aria-label="Board options"
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
          <ViewSelector board={board} filterRules={filterRules} sortRules={sortRules} />
        </div>
      </main>

      {/* AI Assistant Modal */}
      <AIAssistant
        boardId={boardId || ''}
        groupId={board?.groups?.[0]?.id}
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        context="board"
      />

      {/* Guest Access Modal */}
      <GuestAccessModal
        boardId={boardId || ''}
        isOpen={showGuestAccess}
        onClose={() => setShowGuestAccess(false)}
      />

      {/* Recurring Tasks Modal */}
      <RecurringTasksModal
        boardId={boardId || ''}
        groupId={board?.groups?.[0]?.id}
        isOpen={showRecurringTasks}
        onClose={() => setShowRecurringTasks(false)}
      />

      {/* Export Modal */}
      <ExportModal
        boardId={boardId || ''}
        boardName={board?.name || 'Board'}
        isOpen={showExport}
        onClose={() => setShowExport(false)}
      />

      {/* Import Modal */}
      <ImportModal
        boardId={boardId || ''}
        boardName={board?.name || 'Board'}
        isOpen={showImport}
        onClose={() => setShowImport(false)}
      />

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

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        columns={board?.columns || []}
        onApplyFilter={(rules) => {
          setFilterRules(rules)
          showToast(`${rules.length} filter${rules.length !== 1 ? 's' : ''} applied`, 'success')
        }}
      />

      {/* Sort Modal */}
      <SortModal
        isOpen={showSortModal}
        onClose={() => setShowSortModal(false)}
        columns={board?.columns || []}
        onApplySort={(rules) => {
          setSortRules(rules)
          showToast(`Sorted by ${rules.length} column${rules.length !== 1 ? 's' : ''}`, 'success')
        }}
      />

      {/* Automations Modal */}
      {showAutomations && boardId && (
        <EnhancedAutomationBuilder
          boardId={boardId}
          onClose={() => setShowAutomations(false)}
        />
      )}
    </div>
  )
}

