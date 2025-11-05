import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import DashboardViewer from '../components/DashboardViewer'

export default function DashboardViewPage() {
  const { dashboardId } = useParams<{ dashboardId: string }>()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = React.useState(false)

  if (!dashboardId) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-monday-background dark:bg-monday-dark">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-xl text-monday-text dark:text-white font-semibold">Dashboard ID is required</div>
          <button
            onClick={() => navigate('/dashboards')}
            className="mt-6 px-6 py-3 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-lg font-medium transition-all hover:scale-105"
          >
            Back to Dashboards
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-full bg-monday-background dark:bg-monday-dark overflow-hidden">
      {/* Top Navigation Bar */}
      <nav className="h-16 bg-white dark:bg-monday-darkLight border-b border-monday-border dark:border-gray-700 flex-shrink-0 shadow-sm z-10">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboards')}
              className="flex items-center space-x-2 text-monday-textLight dark:text-gray-400 hover:text-monday-primary dark:hover:text-monday-primary transition-all hover:scale-105 group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back</span>
            </button>
            <div className="h-8 w-px bg-monday-border dark:bg-gray-700"></div>
            <h1 className="text-xl font-bold text-monday-text dark:text-white">Dashboard View</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-monday-textLight dark:text-gray-400 hover:bg-monday-background dark:hover:bg-gray-800 transition-all hover:scale-110"
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-monday-primary to-monday-purple flex items-center justify-center text-white font-bold text-sm hover:scale-110 transition-transform shadow-md"
              >
                {user?.name?.charAt(0).toUpperCase()}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-monday-darkLight rounded-lg shadow-monday-hover border border-monday-border dark:border-gray-700 z-50 py-2">
                  <div className="px-4 py-3 border-b border-monday-border dark:border-gray-700">
                    <div className="font-semibold text-monday-text dark:text-white truncate">{user?.name}</div>
                    <div className="text-sm text-monday-textLight dark:text-gray-400 truncate">{user?.email}</div>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          <DashboardViewer dashboardId={dashboardId} />
        </div>
      </main>
    </div>
  )
}
