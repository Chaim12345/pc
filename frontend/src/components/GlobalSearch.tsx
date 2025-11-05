import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Board, Item } from '@monday-clone/shared'
import { api } from '../services/api'
import { useNavigate } from 'react-router-dom'

interface SearchResult {
  type: 'board' | 'item'
  id: string
  name: string
  boardId?: string
  boardName?: string
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const navigate = useNavigate()

  const { data: results = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query.trim()) return []
      
      // Search boards
      const boardsResponse = await api.get(`/boards/search?q=${encodeURIComponent(query)}`)
      const boards: SearchResult[] = (boardsResponse.data.data || []).map((board: Board) => ({
        type: 'board' as const,
        id: board.id,
        name: board.name,
      }))

      // Search items (would need an endpoint)
      // For now, just return boards
      return boards
    },
    enabled: query.trim().length > 0 && isOpen,
  })

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'board') {
      navigate(`/board/${result.id}`)
    } else if (result.type === 'item' && result.boardId) {
      navigate(`/board/${result.boardId}`)
    }
    setQuery('')
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setQuery('')
    }
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <svg
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors ${
            isFocused ? 'text-monday-primary' : 'text-monday-textLight dark:text-gray-500'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            setIsOpen(true)
            setIsFocused(true)
          }}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200)
            setIsFocused(false)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search boards, items..."
          className="w-full pl-10 pr-4 py-2.5 text-base bg-white dark:bg-monday-dark border-2 border-transparent text-monday-text dark:text-white placeholder-monday-textLight dark:placeholder-gray-500 rounded-lg focus:outline-none focus:border-monday-primary focus:ring-2 focus:ring-monday-primaryLight dark:focus:ring-monday-primary/20 transition-all"
          style={{ fontSize: '14px' }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setIsOpen(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-monday-textLight hover:text-monday-text dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-monday-darkLight rounded-xl shadow-monday-hover border border-monday-border dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center space-x-2 text-monday-textLight dark:text-gray-400">
                <div className="w-4 h-4 border-2 border-monday-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Searching...</span>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 mx-auto text-monday-textLight dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-monday-text dark:text-white font-medium mb-1">No results found</p>
              <p className="text-sm text-monday-textLight dark:text-gray-400">
                Try searching with different keywords
              </p>
            </div>
          ) : (
            <div className="py-2 max-h-96 overflow-y-auto">
              <div className="px-3 py-2 text-xs font-semibold text-monday-textLight dark:text-gray-500 uppercase tracking-wider">
                Results ({results.length})
              </div>
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-3 py-2.5 text-left hover:bg-monday-primaryLight/20 dark:hover:bg-gray-800 flex items-center space-x-3 group transition-colors"
                >
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    result.type === 'board' 
                      ? 'bg-gradient-to-br from-monday-purple to-monday-blue' 
                      : 'bg-gradient-to-br from-monday-orange to-monday-primary'
                  }`}>
                    {result.type === 'board' ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-monday-text dark:text-white group-hover:text-monday-primary transition-colors truncate">
                      {result.name}
                    </div>
                    {result.boardName && (
                      <div className="text-sm text-monday-textLight dark:text-gray-400 truncate">
                        in {result.boardName}
                      </div>
                    )}
                  </div>

                  {/* Badge */}
                  <div className="flex-shrink-0">
                    <span className="px-2 py-1 text-xs font-medium text-monday-textLight dark:text-gray-400 bg-monday-background dark:bg-monday-dark rounded uppercase">
                      {result.type}
                    </span>
                  </div>

                  {/* Arrow */}
                  <svg className="w-4 h-4 text-monday-textLight group-hover:text-monday-primary transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {/* Footer hint */}
          <div className="border-t border-monday-border dark:border-gray-700 px-4 py-2 bg-monday-background/50 dark:bg-monday-dark/50">
            <div className="flex items-center justify-between text-xs text-monday-textLight dark:text-gray-500">
              <span>Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-600 rounded font-mono">ESC</kbd> to close</span>
              <span>↑↓ to navigate</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
