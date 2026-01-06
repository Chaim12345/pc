import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext'
import { usePage } from '../contexts/PageContext'
import { api } from '../services/api'
import { Board } from '@monday-clone/shared'
import GlobalSearch from './GlobalSearch'
import KeyboardShortcutsPanel from './KeyboardShortcutsPanel'
import NotificationCenter from './NotificationCenter'
import SidebarSkeleton from './SidebarSkeleton'
import LanguageSwitcher from './LanguageSwitcher'

export default function MainLayout() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { pageTitle, pageActions } = usePage()
  const { showToast } = useToast()
  const { theme, toggleTheme } = useTheme()
  const [newBoardName, setNewBoardName] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [boardsExpanded, setBoardsExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebarBoardsExpanded')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [favoriteBoards, setFavoriteBoards] = useState<string[]>(() => {
    const saved = localStorage.getItem('favoriteBoards')
    return saved ? JSON.parse(saved) : []
  })

  // Listen for ? key to open shortcuts
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !showCreateModal) {
        e.preventDefault()
        setShowShortcuts(true)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showCreateModal])

  const { data: boards, refetch, isLoading: boardsLoading } = useQuery<Board[]>({
    queryKey: ['boards'],
    queryFn: async () => {
      const response = await api.get('/boards')
      return response.data.data
    },
  })

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoardName.trim()) return

    try {
      const orgs = await api.get('/organizations')
      const orgId = orgs.data.data[0]?.id

      if (!orgId) {
        showToast('Please create an organization first', 'warning')
        return
      }

      await api.post('/boards', {
        name: newBoardName,
        organizationId: orgId,
      })
      setNewBoardName('')
      setShowCreateModal(false)
      refetch()
      showToast('Board created successfully!', 'success')
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to create board', 'error')
    }
  }

  const toggleBoardsExpanded = () => {
    setBoardsExpanded((prev: boolean) => {
      const newState = !prev
      localStorage.setItem('sidebarBoardsExpanded', JSON.stringify(newState))
      return newState
    })
  }

  const toggleFavoriteBoard = (boardId: string) => {
    setFavoriteBoards((prev: string[]) => {
      const newFavorites = prev.includes(boardId)
        ? prev.filter((id) => id !== boardId)
        : [...prev, boardId]
      localStorage.setItem('favoriteBoards', JSON.stringify(newFavorites))
      return newFavorites
    })
  }

  const isLinkActive = (path: string) => location.pathname.startsWith(path)

  const favoriteBoardsList = boards?.filter(board => favoriteBoards.includes(board.id)) || []
  const regularBoardsList = boards?.filter(board => !favoriteBoards.includes(board.id)) || []

  const isWorkdocEditorRoute = location.pathname.startsWith('/workdocs/')

  if (isWorkdocEditorRoute) {
    return (
      <div className="min-h-screen bg-[var(--vibe-bg-secondary)] text-[var(--vibe-primary-text)]">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full bg-monday-background dark:bg-monday-dark overflow-hidden">
      {/* Enhanced Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white dark:bg-monday-darkLight border-r border-monday-border dark:border-gray-700 flex flex-col transition-all duration-300 flex-shrink-0 shadow-lg`}>
        {/* Logo & Collapse */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-monday-border dark:border-gray-700">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-gradient-to-br from-monday-primary to-monday-purple rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-bold text-xl text-monday-text dark:text-white">monday</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-monday-primary focus:ring-offset-2"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!sidebarCollapsed}
          >
            <svg className={`w-5 h-5 text-monday-textLight transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          <Link
            to="/dashboard"
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg font-medium group relative hover:scale-[1.02] transition-all shadow-sm ${
              isLinkActive('/dashboard') || location.pathname === '/'
                ? 'text-monday-text dark:text-white bg-monday-primaryLight dark:bg-monday-primary/20'
                : 'text-monday-textLight dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-monday-text dark:hover:text-white'
            }`}
            title="Go to home page"
          >
            <svg className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {!sidebarCollapsed && <span>{t('navigation.home')}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-monday-text dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {t('navigation.home')}
              </div>
            )}
          </Link>

          <Link
            to="/dashboards"
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg transition-all group hover:scale-[1.02] ${
              isLinkActive('/dashboards')
                ? 'text-monday-text dark:text-white bg-monday-primaryLight dark:bg-monday-primary/20 font-medium'
                : 'text-monday-textLight dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-monday-text dark:hover:text-white'
            }`}
            title="View all dashboards"
          >
            <svg className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {!sidebarCollapsed && <span>{t('navigation.dashboards')}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-monday-text dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {t('navigation.dashboards')}
              </div>
            )}
          </Link>

          <Link
            to="/templates"
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg transition-all group hover:scale-[1.02] ${
              isLinkActive('/templates')
                ? 'text-monday-text dark:text-white bg-monday-primaryLight dark:bg-monday-primary/20 font-medium'
                : 'text-monday-textLight dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-monday-text dark:hover:text-white'
            }`}
            title={t('navigation.boardTemplates')}
          >
            <svg className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            {!sidebarCollapsed && <span>{t('navigation.templates')}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-monday-text dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {t('navigation.templates')}
              </div>
            )}
          </Link>

          <Link
            to="/settings"
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg transition-all group hover:scale-[1.02] ${
              isLinkActive('/settings')
                ? 'text-monday-text dark:text-white bg-monday-primaryLight dark:bg-monday-primary/20 font-medium'
                : 'text-monday-textLight dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-monday-text dark:hover:text-white'
            }`}
            title={t('navigation.settings')}
          >
            <svg className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {!sidebarCollapsed && <span>{t('navigation.settings')}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-monday-text dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {t('navigation.settings')}
              </div>
            )}
          </Link>

          <Link
            to="/teams"
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg transition-all group hover:scale-[1.02] ${
              isLinkActive('/teams')
                ? 'text-monday-text dark:text-white bg-monday-primaryLight dark:bg-monday-primary/20 font-medium'
                : 'text-monday-textLight dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-monday-text dark:hover:text-white'
            }`}
            title={t('navigation.teams')}
          >
            <svg className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {!sidebarCollapsed && <span>{t('navigation.teams')}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-monday-text dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {t('navigation.teams')}
              </div>
            )}
          </Link>

          <Link
            to="/users"
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg transition-all group hover:scale-[1.02] ${
              isLinkActive('/users')
                ? 'text-monday-text dark:text-white bg-monday-primaryLight dark:bg-monday-primary/20 font-medium'
                : 'text-monday-textLight dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-monday-text dark:hover:text-white'
            }`}
            title={t('navigation.userManagement')}
          >
            <svg className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {!sidebarCollapsed && <span>{t('navigation.users')}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-monday-text dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {t('navigation.userManagement')}
              </div>
            )}
          </Link>

          <Link
            to="/workdocs"
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg transition-all group hover:scale-[1.02] ${
              isLinkActive('/workdocs')
                ? 'text-monday-text dark:text-white bg-monday-primaryLight dark:bg-monday-primary/20 font-medium'
                : 'text-monday-textLight dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-monday-text dark:hover:text-white'
            }`}
            title={t('navigation.workdocs')}
          >
            <svg className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {!sidebarCollapsed && <span>{t('navigation.workdocs')}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-monday-text dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {t('navigation.workdocs')}
              </div>
            )}
          </Link>

          {!sidebarCollapsed && (
            <>
              {favoriteBoardsList.length > 0 && (
                <div className="pt-4 pb-2">
                  <div className="flex items-center justify-between px-3 mb-2">
                    <span className="text-xs font-bold text-monday-textLight dark:text-gray-500 uppercase tracking-wider">{t('navigation.favorites')}</span>
                  </div>
                  <div className="space-y-1">
                    {favoriteBoardsList.map((board) => (
                      <div key={board.id} className="group flex items-center">
                        <Link
                          to={`/board/${board.id}`}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all hover:scale-[1.02] ${
                            location.pathname === `/board/${board.id}`
                              ? 'text-monday-primary dark:text-monday-primary bg-monday-primaryLight/30 dark:bg-gray-800 font-medium'
                              : 'text-monday-text dark:text-gray-300 hover:bg-monday-primaryLight/30 dark:hover:bg-gray-800'
                          }`}
                          title={`Open ${board.name}`}
                        >
                          <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0 group-hover:scale-150 transition-transform shadow-sm"></div>
                          <span className="truncate text-sm font-medium group-hover:text-monday-primary dark:group-hover:text-monday-primary transition-colors">{board.name}</span>
                        </Link>
                        <button 
                          onClick={() => toggleFavoriteBoard(board.id)} 
                          className="p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:opacity-100 focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 rounded"
                          aria-label={`Remove ${board.name} from favorites`}
                        >
                          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 pb-2">
                <div className="flex items-center justify-between px-3 mb-2">
                  <button 
                    onClick={toggleBoardsExpanded} 
                    className="flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-monday-primary focus:ring-offset-2 rounded px-1"
                    aria-label={boardsExpanded ? "Collapse boards section" : "Expand boards section"}
                    aria-expanded={boardsExpanded}
                  >
                    <svg className={`w-4 h-4 transition-transform ${boardsExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    <span className="text-xs font-bold text-monday-textLight dark:text-gray-500 uppercase tracking-wider">{t('navigation.myBoards')}</span>
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-monday-textLight hover:bg-monday-primary hover:text-white transition-all hover:scale-110 shadow-sm focus:outline-none focus:ring-2 focus:ring-monday-primary focus:ring-offset-2"
                    title={t('navigation.createNewBoard')}
                    aria-label={t('navigation.createNewBoard')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {boardsLoading ? (
                  <SidebarSkeleton />
                ) : boardsExpanded && regularBoardsList && regularBoardsList.length > 0 ? (
                  <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                    {regularBoardsList.map((board) => (
                      <div key={board.id} className="group flex items-center">
                        <Link
                          to={`/board/${board.id}`}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all hover:scale-[1.02] ${
                            location.pathname === `/board/${board.id}`
                              ? 'text-monday-primary dark:text-monday-primary bg-monday-primaryLight/30 dark:bg-gray-800 font-medium'
                              : 'text-monday-text dark:text-gray-300 hover:bg-monday-primaryLight/30 dark:hover:bg-gray-800'
                          }`}
                          title={`Open ${board.name}`}
                        >
                          <div className="w-2 h-2 rounded-full bg-monday-purple flex-shrink-0 group-hover:scale-150 transition-transform shadow-sm"></div>
                          <span className="truncate text-sm font-medium group-hover:text-monday-primary dark:group-hover:text-monday-primary transition-colors">{board.name}</span>
                        </Link>
                        <button 
                          onClick={() => toggleFavoriteBoard(board.id)} 
                          className="p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:opacity-100 focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 rounded"
                          aria-label={`Add ${board.name} to favorites`}
                        >
                          <svg className="w-4 h-4 text-gray-400 hover:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : boardsExpanded ? (
                  <p className="px-3 text-xs text-monday-textLight dark:text-gray-500 italic">{t('navigation.noBoardsYet')}</p>
                ) : null}
              </div>
            </>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-monday-border dark:border-gray-700 p-3 space-y-1">
          <button
            onClick={() => setShowShortcuts(true)}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg text-monday-textLight dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-monday-text dark:hover:text-white text-sm transition-all group focus:outline-none focus:ring-2 focus:ring-monday-primary focus:ring-offset-2`}
            title={t('navigation.shortcuts')}
            aria-label={t('navigation.shortcuts')}
          >
            <svg className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            {!sidebarCollapsed && (
              <>
                <span className="flex-1">{t('navigation.shortcuts')}</span>
                <kbd className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded font-semibold">?</kbd>
              </>
            )}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-monday-text dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {t('navigation.shortcuts')}
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-16 bg-white dark:bg-monday-darkLight border-b border-monday-border dark:border-gray-700 flex items-center justify-between px-6 flex-shrink-0 shadow-sm z-10">
          <div className="flex items-center space-x-4 min-w-0">
            <h1 className="text-2xl font-bold text-monday-text dark:text-white truncate">{pageTitle}</h1>
          </div>

          <div className="flex items-center space-x-4 flex-shrink-0">
            {pageActions}
            <div className="w-64 hidden md:block">
              <GlobalSearch />
            </div>

            <NotificationCenter />

            <LanguageSwitcher />

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg text-monday-textLight dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all hover:scale-110"
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-monday-primary to-monday-purple flex items-center justify-center text-white font-bold text-sm hover:scale-110 transition-transform shadow-md"
                title={`Logged in as ${user?.name}`}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-monday-darkLight rounded-lg shadow-monday-hover border border-monday-border dark:border-gray-700 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-monday-border dark:border-gray-700">
                    <div className="font-semibold text-monday-text dark:text-white">{user?.name}</div>
                    <div className="text-sm text-monday-textLight dark:text-gray-400 truncate">{user?.email}</div>
                  </div>
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full px-4 py-2 text-left text-sm text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{t('navigation.settings')}</span>
                  </button>
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>{t('auth.logout')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="main-content" role="main" className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <Outlet />
        </main>
      </div>

      {/* Create Board Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-monday-text dark:text-white flex items-center space-x-2">
                <svg className="w-7 h-7 text-monday-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create New Board</span>
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewBoardName('')
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-3xl font-bold transition-all hover:rotate-90 duration-300 w-8 h-8 flex items-center justify-center"
              >
                ?
              </button>
            </div>

            <form onSubmit={handleCreateBoard} className="space-y-5">
              <div>
                <label htmlFor="board-name" className="block text-sm font-bold text-monday-text dark:text-white mb-2">
                  Board Name
                </label>
                <input
                  id="board-name"
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="e.g. Marketing Campaign, Product Roadmap"
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white placeholder-gray-400 focus:outline-none focus:border-monday-primary focus:ring-4 focus:ring-monday-primary/20 transition-all"
                  autoFocus
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewBoardName('')
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-monday-text dark:text-white bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newBoardName.trim()}
                  className="px-6 py-2.5 bg-monday-primary hover:bg-monday-primaryHover text-white font-semibold rounded-lg shadow-monday hover:shadow-monday-hover transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Create Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Panel */}
      <KeyboardShortcutsPanel
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  )
}
