import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'
import ConfirmationDialog from './ConfirmationDialog'

interface Dependency {
  id: string
  itemId: string
  dependsOnId: string
  type: string
  dependsOn?: any
  item?: any
}

interface Props {
  itemId: string
  boardId: string
  isOpen: boolean
  onClose: () => void
}

export default function DependencyManager({ itemId, boardId, isOpen, onClose }: Props) {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState('')
  const [dependencyType, setDependencyType] = useState('blocked_by')
  const [deleteDepId, setDeleteDepId] = useState<string | null>(null)

  const { data: dependencies } = useQuery({
    queryKey: ['dependencies', itemId],
    queryFn: async () => {
      const response = await api.get(`/dependencies/item/${itemId}`)
      return response.data.data
    },
    enabled: isOpen && !!itemId
  })

  const { data: boardItems } = useQuery({
    queryKey: ['board-items', boardId],
    queryFn: async () => {
      const response = await api.get(`/boards/${boardId}`)
      const board = response.data.data
      const items = board.groups.flatMap((g: any) => g.items || [])
      return items.filter((item: any) => item.id !== itemId)
    },
    enabled: isOpen && showAddForm
  })

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/dependencies', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependencies', itemId] })
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      showToast('Dependency added successfully', 'success')
      setShowAddForm(false)
      setSelectedItemId('')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to add dependency', 'error')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (depId: string) => {
      await api.delete(`/dependencies/${depId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependencies', itemId] })
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      showToast('Dependency removed', 'success')
      setDeleteDepId(null)
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to remove dependency', 'error')
    }
  })

  const handleAdd = () => {
    if (!selectedItemId) {
      showToast('Please select an item', 'error')
      return
    }

    addMutation.mutate({
      itemId,
      dependsOnId: selectedItemId,
      type: dependencyType
    })
  }

  if (!isOpen) return null

  const typeLabels: Record<string, { label: string; color: string; icon: string }> = {
    blocked_by: { label: 'Blocked By', color: 'red', icon: '🚫' },
    blocks: { label: 'Blocks', color: 'orange', icon: '⛔' },
    related_to: { label: 'Related To', color: 'blue', icon: '🔗' }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-monday-border dark:border-gray-700">
            <div>
              <h3 className="text-2xl font-bold text-monday-text dark:text-white">Manage Dependencies</h3>
              <p className="text-sm text-monday-textLight dark:text-gray-400 mt-1">
                Configure how this item relates to other items
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Add Form */}
            {showAddForm ? (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 space-y-4">
                <h4 className="font-semibold text-monday-text dark:text-white mb-4">Add Dependency</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                      Dependency Type
                    </label>
                    <select
                      value={dependencyType}
                      onChange={(e) => setDependencyType(e.target.value)}
                      className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                    >
                      <option value="blocked_by">🚫 Blocked By</option>
                      <option value="blocks">⛔ Blocks</option>
                      <option value="related_to">🔗 Related To</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                      Select Item
                    </label>
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                    >
                      <option value="">Select an item...</option>
                      {boardItems?.map((item: any) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleAdd}
                    disabled={addMutation.isPending}
                    className="px-4 py-2 bg-monday-primary hover:bg-monday-primary/90 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                  >
                    {addMutation.isPending ? 'Adding...' : 'Add Dependency'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false)
                      setSelectedItemId('')
                    }}
                    className="px-4 py-2 border border-monday-border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-monday-text dark:text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full px-4 py-3 border-2 border-dashed border-monday-border dark:border-gray-700 hover:border-monday-primary hover:bg-monday-primaryLight dark:hover:bg-monday-primary/10 rounded-lg text-monday-text dark:text-white font-medium transition-all flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Dependency</span>
              </button>
            )}

            {/* Dependencies This Item Depends On */}
            {dependencies?.dependencies && dependencies.dependencies.length > 0 && (
              <div>
                <h4 className="font-semibold text-monday-text dark:text-white mb-3">This Item Depends On:</h4>
                <div className="space-y-2">
                  {dependencies.dependencies.map((dep: Dependency) => {
                    const typeInfo = typeLabels[dep.type] || typeLabels.blocked_by
                    return (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between p-4 border border-monday-border dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{typeInfo.icon}</span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-monday-text dark:text-white">
                                {dep.dependsOn?.name || 'Unknown Item'}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${typeInfo.color}-100 text-${typeInfo.color}-800 dark:bg-${typeInfo.color}-900/20 dark:text-${typeInfo.color}-400`}>
                                {typeInfo.label}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setDeleteDepId(dep.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Remove dependency"
                        >
                          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Items That Depend On This Item */}
            {dependencies?.dependedOnBy && dependencies.dependedOnBy.length > 0 && (
              <div>
                <h4 className="font-semibold text-monday-text dark:text-white mb-3">Items That Depend On This:</h4>
                <div className="space-y-2">
                  {dependencies.dependedOnBy.map((dep: Dependency) => {
                    const typeInfo = typeLabels[dep.type] || typeLabels.blocked_by
                    return (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between p-4 border border-monday-border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/30"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{typeInfo.icon}</span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-monday-text dark:text-white">
                                {dep.item?.name || 'Unknown Item'}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${typeInfo.color}-100 text-${typeInfo.color}-800 dark:bg-${typeInfo.color}-900/20 dark:text-${typeInfo.color}-400`}>
                                {typeInfo.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!dependencies?.dependencies || dependencies.dependencies.length === 0) && 
             (!dependencies?.dependedOnBy || dependencies.dependedOnBy.length === 0) && 
             !showAddForm && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-monday-textLight dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <p className="text-monday-textLight dark:text-gray-400 mb-2">No dependencies yet</p>
                <p className="text-sm text-monday-textLight dark:text-gray-400">
                  Add dependencies to track how items relate to each other
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {deleteDepId && (
        <ConfirmationDialog
          isOpen={!!deleteDepId}
          title="Remove Dependency"
          message="Are you sure you want to remove this dependency?"
          confirmText="Remove"
          cancelText="Cancel"
          onConfirm={() => deleteMutation.mutate(deleteDepId)}
          onCancel={() => setDeleteDepId(null)}
          variant="danger"
        />
      )}
    </>
  )
}





