import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

interface Board {
  id: string
  name: string
  description?: string
}

interface AddBoardToTeamModalProps {
  teamId: string
  existingBoardIds: string[]
  onClose: () => void
  onAddBoard: (boardId: string, access: string) => void
}

export default function AddBoardToTeamModal({ teamId, existingBoardIds, onClose, onAddBoard }: AddBoardToTeamModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [selectedAccess, setSelectedAccess] = useState('EDIT')

  const { data: boards = [], isLoading } = useQuery<Board[]>({
    queryKey: ['boards'],
    queryFn: async () => {
      const response = await api.get('/boards')
      return response.data.data
    },
  })

  // Filter out boards already in the team
  const availableBoards = boards.filter(board => 
    !existingBoardIds.includes(board.id) &&
    (searchQuery === '' || 
     board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     board.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleAddBoard = () => {
    if (selectedBoardId) {
      onAddBoard(selectedBoardId, selectedAccess)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-monday-text dark:text-white">Add Board to Team</h2>
          <button
            onClick={onClose}
            className="text-monday-textLight dark:text-gray-400 hover:text-monday-text dark:hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
              Search Boards
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-monday-textLight dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by board name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-monday-background dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                autoFocus
              />
            </div>
          </div>

          {/* Board List */}
          <div className="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-monday-primary"></div>
              </div>
            ) : availableBoards.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {availableBoards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => setSelectedBoardId(board.id)}
                    className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-monday-background dark:hover:bg-gray-800 transition-colors ${
                      selectedBoardId === board.id ? 'bg-monday-primaryLight dark:bg-monday-primary/20' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-monday-primary to-monday-purple flex items-center justify-center text-white font-bold flex-shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-monday-text dark:text-white">
                        {board.name}
                      </div>
                      {board.description && (
                        <div className="text-xs text-monday-textLight dark:text-gray-400 line-clamp-1">
                          {board.description}
                        </div>
                      )}
                    </div>
                    {selectedBoardId === board.id && (
                      <svg className="w-5 h-5 text-monday-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-monday-textLight dark:text-gray-500">
                {searchQuery ? 'No boards found' : 'All boards are already added to this team'}
              </div>
            )}
          </div>

          {/* Access Level Selection */}
          {selectedBoardId && (
            <div>
              <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                Access Level
              </label>
              <select
                value={selectedAccess}
                onChange={(e) => setSelectedAccess(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-monday-background dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
              >
                <option value="VIEW">View Only</option>
                <option value="EDIT">Can Edit</option>
                <option value="ADMIN">Admin</option>
              </select>
              <p className="mt-1 text-xs text-monday-textLight dark:text-gray-400">
                {selectedAccess === 'VIEW' && 'Team members can only view this board'}
                {selectedAccess === 'EDIT' && 'Team members can view and edit items'}
                {selectedAccess === 'ADMIN' && 'Team members have full control'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-monday-text dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddBoard}
              disabled={!selectedBoardId}
              className="flex-1 px-4 py-2 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Board
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

