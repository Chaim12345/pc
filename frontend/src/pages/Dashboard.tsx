import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { Board } from '@monday-clone/shared'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { usePage } from '../contexts/PageContext'


// Board colors for Monday.com style
const BOARD_COLORS = [
  { bg: 'bg-gradient-to-br from-purple-500 to-purple-700', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-blue-500 to-blue-700', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-green-500 to-green-700', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-orange-500 to-orange-700', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-pink-500 to-pink-700', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-red-500 to-red-700', text: 'text-white' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { setPageTitle, setPageActions } = usePage()

  useEffect(() => {
    setPageTitle('My Work')
    // Actions are now in MainLayout, we can clear them or set them if needed for this page
    setPageActions(null)
  }, [setPageTitle, setPageActions])

  // Enable keyboard shortcuts
  useKeyboardShortcuts()

  const { data: boards } = useQuery<Board[]>({
    queryKey: ['boards'],
    queryFn: async () => {
      const response = await api.get('/boards')
      return response.data.data
    },
  })

  return (
    <div className="max-w-7xl mx-auto">
      {/* Skip to main content for accessibility */}
      <a
        href="#boards-grid"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-monday-primary text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to boards
      </a>

      {/* Boards Grid */}
      {boards && boards.length > 0 ? (
        <div id="boards-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="grid" aria-label="Your boards">
          {boards.map((board, index) => {
            const colorScheme = BOARD_COLORS[index % BOARD_COLORS.length]
            return (
              <div
                key={board.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/board/${board.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/board/${board.id}`)
                  }
                }}
                aria-label={`Open board: ${board.name}. ${board.groups?.length || 0} groups. Team board.`}
                className="group relative bg-white dark:bg-monday-darkLight rounded-xl shadow-monday hover:shadow-monday-hover cursor-pointer transition-all duration-300 transform hover:scale-[1.03] overflow-hidden focus:outline-none focus:ring-2 focus:ring-monday-primary focus:ring-offset-2"
              >
                {/* Colorful Header */}
                <div className={`h-28 ${colorScheme.bg} p-5 flex items-center justify-between relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                      </svg>
                    </div>
                  </div>
                  <button
                    className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/30 rounded-lg"
                    aria-label={`Board options for ${board.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: Implement board options menu
                    }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </button>
                </div>

                {/* Board Info */}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-monday-text dark:text-white mb-2 truncate group-hover:text-monday-primary transition-colors">
                    {board.name}
                  </h3>
                  <dl className="flex items-center text-xs text-monday-textLight dark:text-gray-400 space-x-4">
                    <div className="flex items-center">
                      <dt className="sr-only">Number of groups</dt>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <dd>{board.groups?.length || 0} groups</dd>
                    </div>
                    <div className="flex items-center">
                      <dt className="sr-only">Board type</dt>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <dd>Team</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 bg-white dark:bg-monday-darkLight rounded-xl shadow-monday" role="region" aria-labelledby="empty-state-heading">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-monday-primaryLight dark:bg-monday-primary/20 rounded-full mb-6">
            <svg className="w-12 h-12 text-monday-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <h3 id="empty-state-heading" className="text-2xl font-bold text-monday-text dark:text-white mb-3">
            No boards yet
          </h3>
          <p className="text-monday-textLight dark:text-gray-400 mb-8 max-w-md mx-auto">
            Get started by creating your first board to organize your work and collaborate with your team
          </p>
          {/* The "Create your first board" button is handled by the MainLayout now */}
        </div>
      )}
    </div>
  )
}





