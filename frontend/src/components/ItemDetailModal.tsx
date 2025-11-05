import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Item } from '@monday-clone/shared'
import { api } from '../services/api'
import CommentPanel from './CommentPanel'
import AttachmentPanel from './AttachmentPanel'
import TimeTracking from './TimeTracking'

interface ItemDetailModalProps {
  itemId: string
  boardId: string
  isOpen: boolean
  onClose: () => void
}

export default function ItemDetailModal({ itemId, boardId, isOpen, onClose }: ItemDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'attachments' | 'time'>('details')

  const { data: item, isLoading } = useQuery<Item>({
    queryKey: ['item', itemId],
    queryFn: async () => {
      const response = await api.get(`/items/${itemId}`)
      return response.data.data
    },
    enabled: isOpen && !!itemId,
  })

  if (!isOpen) return null
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-monday-hover w-full max-w-4xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-10 h-10 border-4 border-monday-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="text-lg text-monday-text dark:text-white font-medium">Loading item details...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (!item) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-monday-hover w-full max-w-4xl p-8 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-monday-text dark:text-white mb-2">Item Not Found</h2>
          <p className="text-monday-textLight dark:text-gray-400 mb-6">
            The item you're looking for doesn't exist or has been deleted.
          </p>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-monday-primary hover:bg-monday-primaryHover text-white font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'details', label: 'Details', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { id: 'comments', label: 'Comments', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    )},
    { id: 'attachments', label: 'Attachments', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
    )},
    { id: 'time', label: 'Time', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-monday-hover w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-monday-border dark:border-gray-700">
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-10 h-10 bg-gradient-to-br from-monday-primary to-monday-purple rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-monday-text dark:text-white truncate">{item.name}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center text-monday-textLight dark:text-gray-400 hover:text-monday-text dark:hover:text-white hover:bg-monday-background dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-monday-border dark:border-gray-700 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold transition-all relative ${
                activeTab === tab.id
                  ? 'text-monday-primary'
                  : 'text-monday-textLight dark:text-gray-400 hover:text-monday-text dark:hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-monday-primary"></div>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="bg-monday-background dark:bg-monday-dark rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-monday-textLight dark:text-gray-400 mb-2 uppercase tracking-wide">
                    Item Name
                  </label>
                  <div className="text-lg font-medium text-monday-text dark:text-white">{item.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-monday-textLight dark:text-gray-400 mb-2 uppercase tracking-wide">
                      Created
                    </label>
                    <div className="flex items-center space-x-2 text-monday-text dark:text-gray-300">
                      <svg className="w-4 h-4 text-monday-textLight" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-monday-textLight dark:text-gray-400 mb-2 uppercase tracking-wide">
                      Last Updated
                    </label>
                    <div className="flex items-center space-x-2 text-monday-text dark:text-gray-300">
                      <svg className="w-4 h-4 text-monday-textLight" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>{new Date(item.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-3">
                <button className="flex flex-col items-center justify-center p-4 bg-monday-background dark:bg-monday-dark rounded-xl hover:bg-monday-primaryLight/20 dark:hover:bg-gray-800 transition-colors">
                  <svg className="w-6 h-6 text-monday-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs font-medium text-monday-text dark:text-gray-300">Add Column</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-monday-background dark:bg-monday-dark rounded-xl hover:bg-monday-primaryLight/20 dark:hover:bg-gray-800 transition-colors">
                  <svg className="w-6 h-6 text-monday-purple mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  <span className="text-xs font-medium text-monday-text dark:text-gray-300">Duplicate</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-monday-background dark:bg-monday-dark rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <svg className="w-6 h-6 text-red-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="text-xs font-medium text-monday-text dark:text-gray-300">Delete</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <CommentPanel itemId={item.id} boardId={boardId} isOpen={true} embedded={true} />
          )}

          {activeTab === 'attachments' && (
            <AttachmentPanel itemId={item.id} boardId={boardId} isOpen={true} embedded={true} />
          )}

          {activeTab === 'time' && (
            <TimeTracking itemId={item.id} boardId={boardId} />
          )}
        </div>
      </div>
    </div>
  )
}
