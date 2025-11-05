import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'
import { Dashboard, Organization } from '@monday-clone/shared'
import DashboardBuilder from '../components/DashboardBuilder'
import ConfirmationDialog from '../components/ConfirmationDialog'

export default function DashboardsPage() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [deletingDashboard, setDeletingDashboard] = useState<string | null>(null)

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await api.get('/organizations')
      return response.data.data
    },
  })

  const { data: dashboards } = useQuery<Dashboard[]>({
    queryKey: ['dashboards', organizations?.[0]?.id],
    queryFn: async () => {
      const response = await api.get(`/organizations/${organizations?.[0]?.id}/dashboards`)
      return response.data.data
    },
    enabled: !!organizations?.[0]?.id,
  })

  const deleteMutation = useMutation({
    mutationFn: async (dashboardId: string) => {
      await api.delete(`/dashboards/${dashboardId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] })
      showToast('Dashboard deleted successfully', 'success')
      setDeletingDashboard(null)
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to delete dashboard', 'error')
    },
  })

  const orgId = organizations?.[0]?.id

  return (
    <div className="flex flex-col h-screen w-full bg-monday-background dark:bg-monday-dark overflow-hidden">
      {/* Top Navigation Bar */}
      <nav className="h-16 bg-white dark:bg-monday-darkLight border-b border-monday-border dark:border-gray-700 flex-shrink-0 shadow-sm z-10">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-monday-textLight dark:text-gray-400 hover:text-monday-primary dark:hover:text-monday-primary transition-all hover:scale-105 group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back</span>
            </button>
            <div className="h-8 w-px bg-monday-border dark:bg-gray-700"></div>
            <h1 className="text-2xl font-bold text-monday-text dark:text-white">Dashboards</h1>
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
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-monday-textLight dark:text-gray-400">
                Create and manage your custom dashboards
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-lg font-medium flex items-center space-x-2 transition-all hover:scale-105 hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Dashboard</span>
            </button>
          </div>

          {dashboards && dashboards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboards.map((dashboard) => (
                <div
                  key={dashboard.id}
                  className="bg-white dark:bg-monday-darkLight rounded-xl shadow-monday hover:shadow-monday-hover transition-all duration-300 transform hover:scale-[1.02] overflow-hidden cursor-pointer group"
                  onClick={() => navigate(`/dashboards/${dashboard.id}`)}
                >
                  <div className="h-32 bg-gradient-to-br from-monday-blue via-monday-purple to-monday-orange p-5 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <svg className="w-16 h-16 text-white/80 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-monday-text dark:text-white mb-2 group-hover:text-monday-primary transition-colors">
                      {dashboard.name}
                    </h3>
                    <p className="text-sm text-monday-textLight dark:text-gray-400 mb-4">
                      {dashboard.widgets?.length || 0} widgets
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeletingDashboard(dashboard.id)
                      }}
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-monday-darkLight rounded-xl shadow-monday">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-monday-primaryLight dark:bg-monday-primary/20 rounded-full mb-6">
                <svg className="w-12 h-12 text-monday-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-monday-text dark:text-white mb-3">
                No dashboards yet
              </h3>
              <p className="text-monday-textLight dark:text-gray-400 mb-8 max-w-md mx-auto">
                Create your first dashboard to visualize your data with custom widgets
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-3 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-lg font-medium transition-all hover:scale-105 hover:shadow-lg inline-flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Dashboard</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Create Dashboard Modal */}
      {showCreateModal && orgId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <DashboardBuilder
              organizationId={orgId}
              onClose={() => {
                setShowCreateModal(false)
                queryClient.invalidateQueries({ queryKey: ['dashboards'] })
                showToast('Dashboard created successfully', 'success')
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingDashboard}
        title="Delete Dashboard"
        message="Are you sure you want to delete this dashboard? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (deletingDashboard) {
            deleteMutation.mutate(deletingDashboard)
          }
        }}
        onCancel={() => setDeletingDashboard(null)}
      />
    </div>
  )
}
