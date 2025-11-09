import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { useTheme } from '../contexts/ThemeContext'

interface Board {
  id: string
  name: string
  description?: string
  groups: any[]
  columns: any[]
}

export default function GuestBoardView() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [guestToken, setGuestToken] = useState<string | null>(null)
  const [accessLevel, setAccessLevel] = useState<string>('view')

  const { data, isLoading, error } = useQuery({
    queryKey: ['guest-board', token],
    queryFn: async () => {
      const response = await api.get(`/guest-access/public/${token}`)
      const { board, accessLevel: level, guestToken: gToken } = response.data.data
      setGuestToken(gToken)
      setAccessLevel(level)
      return board as Board
    },
    enabled: !!token
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-monday-background dark:bg-monday-dark">
        <div className="flex flex-col items-center space-y-4 animate-pulse">
          <div className="w-16 h-16 border-4 border-monday-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="space-y-2 text-center">
            <div className="text-lg text-monday-text dark:text-white font-medium">Loading board...</div>
            <div className="text-sm text-monday-textLight dark:text-gray-400">Verifying guest access</div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-monday-background dark:bg-monday-dark">
        <div className="text-center max-w-md p-8">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-monday-text dark:text-white mb-2">Access Denied</h2>
          <p className="text-monday-textLight dark:text-gray-400 mb-4">
            This guest access link is invalid, expired, or has been revoked.
          </p>
        </div>
      </div>
    )
  }

  const board = data

  return (
    <div className="flex flex-col h-screen w-full bg-monday-background dark:bg-monday-dark overflow-hidden">
      {/* Top Navigation Bar */}
      <nav className="h-16 bg-white dark:bg-monday-darkLight border-b border-monday-border dark:border-gray-700 flex-shrink-0 shadow-sm z-30">
        <div className="h-full px-6 flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-monday-blue via-monday-purple to-monday-orange flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                {board.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-monday-text dark:text-white truncate">{board.name}</h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                    Guest {accessLevel === 'view' ? '👁️ View Only' : accessLevel === 'comment' ? '💬 Can Comment' : '✏️ Can Edit'}
                  </span>
                </div>
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
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-monday-textLight dark:text-gray-400 hover:bg-monday-background dark:hover:bg-gray-800 transition-all hover:scale-110"
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden p-6 min-h-0">
        <div className="flex-1 min-h-0 overflow-auto bg-white dark:bg-monday-darkLight rounded-lg border border-monday-border dark:border-gray-700 p-6">
          {/* Board Content */}
          <div className="space-y-6">
            {board.groups && board.groups.length > 0 ? (
              board.groups.map((group) => (
                <div key={group.id} className="space-y-3">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <h3 className="text-lg font-semibold text-monday-text dark:text-white">
                      {group.title}
                    </h3>
                    <span className="text-sm text-monday-textLight dark:text-gray-400">
                      {group.items?.length || 0} items
                    </span>
                  </div>

                  {/* Items Table */}
                  {group.items && group.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-monday-border dark:border-gray-700">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-monday-text dark:text-white">
                              Item
                            </th>
                            {board.columns.map((column) => (
                              <th key={column.id} className="text-left py-3 px-4 text-sm font-semibold text-monday-text dark:text-white">
                                {column.title}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map((item: any) => (
                            <tr key={item.id} className="border-b border-monday-border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-medium text-monday-text dark:text-white">
                                  {item.name}
                                </div>
                              </td>
                              {board.columns.map((column) => {
                                const columnValue = item.columnValues?.find((cv: any) => cv.columnId === column.id)
                                return (
                                  <td key={column.id} className="py-3 px-4 text-monday-textLight dark:text-gray-400">
                                    {columnValue?.value || '-'}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-monday-textLight dark:text-gray-400">
                      No items in this group
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-monday-textLight dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-monday-textLight dark:text-gray-400">This board is empty</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}





