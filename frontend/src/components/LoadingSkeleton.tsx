import React from 'react'

interface LoadingSkeletonProps {
  type?: 'board' | 'table' | 'kanban' | 'card' | 'list'
  count?: number
}

export default function LoadingSkeleton({ type = 'board', count = 3 }: LoadingSkeletonProps) {
  if (type === 'table') {
    return (
      <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-monday overflow-hidden border border-monday-border/30 dark:border-gray-700 p-6 animate-pulse">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-10 w-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
          </div>
        </div>

        {/* Table Header */}
        <div className="flex space-x-4 mb-4 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
        </div>

        {/* Table Rows */}
        {[...Array(count)].map((_, i) => (
          <div key={i} className="flex space-x-4 mb-4 py-3">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'kanban') {
    return (
      <div className="flex space-x-4 overflow-x-auto pb-4 animate-pulse">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-80 bg-white dark:bg-monday-darkLight rounded-lg shadow-monday p-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
            {[...Array(3)].map((_, j) => (
              <div key={j} className="mb-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-monday-darkLight rounded-lg shadow-monday overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700"></div>
            <div className="p-5">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-4 bg-white dark:bg-monday-darkLight rounded-lg shadow-sm">
            <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Default board skeleton
  return (
    <div className="min-h-screen bg-monday-background dark:bg-monday-dark p-6 animate-pulse">
      <div className="mb-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-monday-darkLight rounded-lg shadow-monday p-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


