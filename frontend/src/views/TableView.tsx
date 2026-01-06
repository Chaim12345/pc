import React, { useState, useMemo, useCallback } from 'react'
import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query'
import { Board, Item, Column, Group, User, ColumnType } from '@monday-clone/shared'
import { api } from '../services/api'
import { useSocket } from '../contexts/SocketContext'
import { SocketEvent } from '@monday-clone/shared'
import ItemDetailModal from '../components/ItemDetailModal'
import StatusDropdown, { StatusOption } from '../components/StatusDropdown'
import PriorityDropdown from '../components/PriorityDropdown'
import DatePickerColumn from '../components/DatePickerColumn'
import PersonSelector from '../components/PersonSelector'
import FileUploadColumn from '../components/FileUploadColumn'
import ItemRow from '../components/ItemRow';
import { SortRule } from '../components/SortModal'
import { logger } from '../utils/logger'
import Modal from '../components/Modal'
import ConfirmationDialog from '../components/ConfirmationDialog'
import { useToast } from '../contexts/ToastContext'

interface TableViewProps {
  board: Board
  sortRules?: SortRule[]
  onSortChange?: (rules: SortRule[]) => void
}

export default function TableView({ board, sortRules = [], onSortChange }: TableViewProps) {
  const { socket, isConnected } = useSocket()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [editingCell, setEditingCell] = useState<{ itemId: string; columnId: string } | null>(null)
  const [editValue, setEditValue] = useState<any>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [showAddItemModal, setShowAddItemModal] = useState<{ groupId: string; name: string } | null>(null)
  const [showGroupOptions, setShowGroupOptions] = useState<string | null>(null)
  const [showColumnOptions, setShowColumnOptions] = useState<string | null>(null)
  const [renameGroupId, setRenameGroupId] = useState<string | null>(null)
  const [renameGroupName, setRenameGroupName] = useState<string>('')
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null)
  const [editColumnId, setEditColumnId] = useState<string | null>(null)
  const [editColumnTitle, setEditColumnTitle] = useState<string>('')
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null)
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())

  // Handle column header click for sorting - memoized
  const handleColumnSort = useCallback((columnId: string) => {
    const existingRule = sortRules.find(rule => rule.columnId === columnId)
    let newRules: SortRule[] = []

    if (existingRule) {
      // Toggle direction: asc -> desc -> remove
      if (existingRule.direction === 'asc') {
        // Change to desc
        newRules = sortRules.map(rule =>
          rule.columnId === columnId ? { ...rule, direction: 'desc' } : rule
        )
      } else {
        // Remove sort
        newRules = sortRules.filter(rule => rule.columnId !== columnId)
      }
    } else {
      // Add new sort (asc by default)
      newRules = [{ id: Date.now().toString(), columnId, direction: 'asc' }, ...sortRules]
    }

    onSortChange?.(newRules)
  }, [sortRules, onSortChange])

  // Get sort direction for a column
  const getSortDirection = (columnId: string): 'asc' | 'desc' | null => {
    const rule = sortRules.find(rule => rule.columnId === columnId)
    return rule ? rule.direction : null
  }

  // Sort items based on sortRules - memoized for performance
  const sortItems = useCallback((items: Item[]): Item[] => {
    if (sortRules.length === 0) return items

    return [...items].sort((a, b) => {
      for (const rule of sortRules) {
        const aValue = getColumnValue(a, rule.columnId)
        const bValue = getColumnValue(b, rule.columnId)

        // Handle different value types
        let comparison = 0

        if (aValue === null || aValue === undefined) {
          comparison = bValue === null || bValue === undefined ? 0 : 1
        } else if (bValue === null || bValue === undefined) {
          comparison = -1
        } else if (typeof aValue === 'object' && aValue !== null) {
          // Handle status, priority, person objects
          const aLabel = aValue.label || aValue.name || String(aValue)
          const bLabel = bValue.label || bValue.name || String(bValue)
          comparison = aLabel.localeCompare(bLabel)
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          // Try to parse as date
          const aDate = new Date(aValue)
          const bDate = new Date(bValue)
          if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
            comparison = aDate.getTime() - bDate.getTime()
          } else {
            comparison = aValue.localeCompare(bValue)
          }
        } else {
          comparison = String(aValue).localeCompare(String(bValue))
        }

        if (comparison !== 0) {
          return rule.direction === 'asc' ? comparison : -comparison
        }
      }
      return 0
    })
  }, [sortRules])

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: any }) => {
      const response = await api.put(`/items/${itemId}`, updates)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', board.id] })
      if (socket && isConnected) {
        socket.emit(SocketEvent.ITEM_UPDATED, { boardId: board.id })
      }
    },
  })

  const updateColumnValueMutation = useMutation({
    mutationFn: async ({ itemId, columnId, value }: { itemId: string; columnId: string; value: any }) => {
      const response = await api.post(`/columns/${columnId}/values`, { itemId, value })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', board.id] })
      if (socket && isConnected) {
        socket.emit(SocketEvent.COLUMN_UPDATED, { boardId: board.id })
      }
    },
  })

  const createItemMutation = useMutation({
    mutationFn: async ({ groupId, name }: { groupId: string; name: string }) => {
      const response = await api.post('/items', {
        boardId: board.id,
        groupId,
        name,
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', board.id] })
    },
  })

  const createSubItemMutation = useMutation({
    mutationFn: async ({ parentId, groupId, name }: { parentId: string; groupId: string; name: string }) => {
      const response = await api.post('/items', {
        boardId: board.id,
        groupId,
        name,
        parentId,
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', board.id] })
    },
  })

  // Group mutations
  const renameGroupMutation = useMutation({
    mutationFn: async ({ groupId, title }: { groupId: string; title: string }) => {
      const response = await api.put(`/groups/${groupId}`, { title })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', board.id] })
      socket && isConnected && socket.emit(SocketEvent.BOARD_UPDATED, { boardId: board.id })
      showToast('Group renamed successfully', 'success')
      setRenameGroupId(null)
      setRenameGroupName('')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to rename group', 'error')
    },
  })

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await api.delete(`/groups/${groupId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', board.id] })
      socket && isConnected && socket.emit(SocketEvent.BOARD_UPDATED, { boardId: board.id })
      showToast('Group deleted successfully', 'success')
      setDeleteGroupId(null)
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to delete group', 'error')
    },
  })

  // Column mutations
  const updateColumnMutation = useMutation({
    mutationFn: async ({ columnId, title }: { columnId: string; title: string }) => {
      const response = await api.put(`/columns/${columnId}`, { title })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', board.id] })
      socket && isConnected && socket.emit(SocketEvent.COLUMN_UPDATED, { boardId: board.id })
      showToast('Column updated successfully', 'success')
      setEditColumnId(null)
      setEditColumnTitle('')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to update column', 'error')
    },
  })

  const deleteColumnMutation = useMutation({
    mutationFn: async (columnId: string) => {
      const response = await api.delete(`/columns/${columnId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', board.id] })
      socket && isConnected && socket.emit(SocketEvent.COLUMN_UPDATED, { boardId: board.id })
      showToast('Column deleted successfully', 'success')
      setDeleteColumnId(null)
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to delete column', 'error')
    },
  })

  const getColumnValue = (item: Item, columnId: string): any => {
    const columnValue = item.columnValues?.find((cv) => cv.columnId === columnId)
    return columnValue?.value
  }

  const safelyParseSettings = (value: string) => {
    try {
      return JSON.parse(value)
    } catch (error) {
      logger.warn('Failed to parse column settings JSON', error)
      return {}
    }
  }

  const getStatusOptions = (column: Column): StatusOption[] => {
    if (!column.settings) {
      return []
    }

    const settings = typeof column.settings === 'string' ? safelyParseSettings(column.settings) : column.settings
    const labels = (settings as any)?.labels

    if (Array.isArray(labels)) {
      return labels
        .filter((label) => label && typeof label === 'object')
        .map((label) => ({
          id: label.id?.toString() ?? '',
          label: label.label ?? '',
          color: label.color,
        }))
        .filter((option) => option.id && option.label)
    }

    return []
  }

  const renderCell = (item: Item, column: Column) => {
    const value = getColumnValue(item, column.id)
    const isEditing = editingCell?.itemId === item.id && editingCell?.columnId === column.id

    // Handle different column types with specific dropdowns
    if (column.type === 'STATUS') {
      return (
        <div className="px-3 py-2">
          <StatusDropdown
            value={value}
            options={getStatusOptions(column)}
            onChange={(status) => {
              updateColumnValueMutation.mutate({
                itemId: item.id,
                columnId: column.id,
                value: status ? { id: status.id, label: status.label, color: status.color } : null,
              })
            }}
            itemName={item.name}
          />
        </div>
      )
    }

    if (column.type === 'PRIORITY' || column.title.toLowerCase().includes('priority')) {
      return (
        <div className="px-3 py-2">
          <PriorityDropdown
            value={value?.label || value}
            onChange={(priority) => {
              updateColumnValueMutation.mutate({
                itemId: item.id,
                columnId: column.id,
                value: priority.label ? { label: priority.label, id: priority.id } : null,
              })
            }}
          />
        </div>
      )
    }

    if (column.type === 'DATE') {
      return (
        <div className="px-3 py-2">
          <DatePickerColumn
            value={value}
            onChange={(date) => {
              updateColumnValueMutation.mutate({
                itemId: item.id,
                columnId: column.id,
                value: date ? date.toISOString() : null,
              })
            }}
          />
        </div>
      )
    }

    if (column.type === ColumnType.PEOPLE || column.title.toLowerCase().includes('person') || column.title.toLowerCase().includes('assign')) {
      return (
        <div className="px-3 py-2">
          <PersonSelector
            value={value}
            onChange={(person) => {
              updateColumnValueMutation.mutate({
                itemId: item.id,
                columnId: column.id,
                value: person ? { id: person.id, name: person.name, email: person.email } : null,
              })
            }}
            boardId={board.id}
          />
        </div>
      )
    }

    if (column.type === 'FILES') {
      return (
        <FileUploadColumn
          itemId={item.id}
          boardId={board.id}
          value={value}
        />
      )
    }

    // Default text/number editing
    if (isEditing) {
      return (
        <input
          type={column.type === 'NUMBER' ? 'number' : 'text'}
          value={editValue ?? ''}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => {
            updateColumnValueMutation.mutate({
              itemId: item.id,
              columnId: column.id,
              value: editValue,
            })
            setEditingCell(null)
            setEditValue(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateColumnValueMutation.mutate({
                itemId: item.id,
                columnId: column.id,
                value: editValue,
              })
              setEditingCell(null)
              setEditValue(null)
            }
            if (e.key === 'Escape') {
              setEditingCell(null)
              setEditValue(null)
            }
          }}
          className="w-full px-3 py-2 text-base border-2 border-monday-primary rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-monday-primary/20 text-monday-text dark:bg-monday-dark dark:text-white"
          autoFocus
          style={{ fontSize: '14px' }}
        />
      )
    }

    const displayValue = value?.toString() || ''

    return (
      <div
        onClick={() => {
          setEditingCell({ itemId: item.id, columnId: column.id })
          setEditValue(value)
        }}
        className="px-3 py-2 hover:bg-monday-primaryLight/20 dark:hover:bg-gray-700 cursor-pointer min-h-[40px] flex items-center rounded-lg transition-all group relative"
        title={displayValue ? `Click to edit: ${displayValue}` : 'Click to add value'}
      >
        {displayValue ? (
          <span className="text-monday-text dark:text-gray-300 group-hover:font-medium transition-all">{displayValue}</span>
        ) : (
          <span className="text-monday-textLight dark:text-gray-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Click to add
          </span>
        )}
      </div>
    )
  }

  const handleAddItem = (groupId: string) => {
    setShowAddItemModal({ groupId, name: '' })
  }

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (showAddItemModal && showAddItemModal.name.trim()) {
      createItemMutation.mutate({ groupId: showAddItemModal.groupId, name: showAddItemModal.name })
      setShowAddItemModal(null)
    }
  }

  const getColumnIcon = (type: string, title: string) => {
    if (type === 'STATUS') {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
    if (type === 'PRIORITY' || title.toLowerCase().includes('priority')) {
      return (
        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    }
    if (type === 'DATE') {
      return (
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
    if (type === 'PERSON' || title.toLowerCase().includes('person') || title.toLowerCase().includes('assign')) {
      return (
        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
    if (type === 'NUMBER') {
      return (
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-monday-darkLight rounded-xl shadow-monday overflow-hidden border border-monday-border/30 dark:border-gray-700">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="min-w-full">
          <thead>
            <tr className="border-b-2 border-monday-border dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-monday-dark">
              <th className="px-6 py-4 text-left text-xs font-bold text-monday-text dark:text-white uppercase tracking-wider sticky left-0 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-monday-dark z-20 border-r border-monday-border/30 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-monday-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Item</span>
                </div>
              </th>
                     {board.columns?.filter(col => !hiddenColumns.has(col.id)).map((column) => {
                const sortDirection = getSortDirection(column.id)
                const isSorted = sortDirection !== null
                
                return (
                  <th
                    key={column.id}
                    className={`px-6 py-4 text-left text-xs font-bold text-monday-text dark:text-white uppercase tracking-wider min-w-[200px] hover:bg-monday-background/30 dark:hover:bg-gray-800/30 transition-colors group cursor-pointer select-none ${
                      isSorted ? 'bg-monday-primaryLight/20 dark:bg-monday-primary/10' : ''
                    }`}
                    onClick={() => handleColumnSort(column.id)}
                    title={`Click to sort${isSorted ? ` (${sortDirection === 'asc' ? 'ascending' : 'descending'})` : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1">
                        {getColumnIcon(column.type, column.title)}
                        <span>{column.title}</span>
                        {isSorted && (
                          <span className="ml-1 text-monday-primary dark:text-monday-primary">
                            {sortDirection === 'asc' ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                          </span>
                        )}
                        {!isSorted && (
                          <svg className="w-3 h-3 opacity-0 group-hover:opacity-50 text-monday-textLight dark:text-gray-400 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        )}
                      </div>
                      <div className="relative">
                        <button 
                          className={`opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all ml-2 ${showColumnOptions === column.id ? 'opacity-100 bg-gray-200 dark:bg-gray-700' : ''}`}
                          title="Column options"
                          onClick={(e) => {
                            e.stopPropagation() // Prevent triggering sort
                            setShowColumnOptions(showColumnOptions === column.id ? null : column.id)
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        {showColumnOptions === column.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setShowColumnOptions(null)}
                            ></div>
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-monday-darkLight rounded-lg shadow-lg border border-monday-border dark:border-gray-700 z-50 py-1">
                                     <button
                                       onClick={(e) => {
                                         e.stopPropagation()
                                         setShowColumnOptions(null)
                                         const col = board.columns?.find(c => c.id === column.id)
                                         if (col) {
                                           setEditColumnTitle(col.title)
                                           setEditColumnId(col.id)
                                         }
                                       }}
                                       className="w-full px-4 py-2 text-left text-sm text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 flex items-center gap-2"
                                     >
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                       </svg>
                                       Edit Column
                                     </button>
                                     <button
                                       onClick={(e) => {
                                         e.stopPropagation()
                                         setShowColumnOptions(null)
                                         setHiddenColumns(prev => {
                                           const newSet = new Set(prev)
                                           if (newSet.has(column.id)) {
                                             newSet.delete(column.id)
                                           } else {
                                             newSet.add(column.id)
                                           }
                                           return newSet
                                         })
                                         showToast(
                                           hiddenColumns.has(column.id) 
                                             ? 'Column shown' 
                                             : 'Column hidden', 
                                           'success'
                                         )
                                       }}
                                       className="w-full px-4 py-2 text-left text-sm text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 flex items-center gap-2"
                                     >
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L3 9.88m3.29-3.29L9.88 9.88" />
                                       </svg>
                                       {hiddenColumns.has(column.id) ? 'Show Column' : 'Hide Column'}
                                     </button>
                                     <button
                                       onClick={(e) => {
                                         e.stopPropagation()
                                         setShowColumnOptions(null)
                                         setDeleteColumnId(column.id)
                                       }}
                                       className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                     >
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                       </svg>
                                       Delete Column
                                     </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {board.groups?.map((group, groupIndex) => (
              <React.Fragment key={group.id}>
                {/* Group Header */}
                <tr className="group-header bg-gradient-to-r from-monday-background via-monday-primaryLight/10 to-white dark:from-gray-900 dark:via-gray-800 dark:to-monday-dark">
                  <td colSpan={(board.columns?.length || 0) + 1} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-1 h-8 bg-gradient-to-b from-monday-blue to-monday-purple rounded-full shadow-sm"></div>
                        <span className="font-bold text-monday-text dark:text-white text-base">
                          {group.title}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium text-monday-textLight dark:text-gray-400 bg-white dark:bg-monday-dark rounded-full">
                          {group.items?.length || 0} items
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowGroupOptions(showGroupOptions === group.id ? null : group.id)
                            }}
                            className={`p-1.5 hover:bg-white dark:hover:bg-monday-dark rounded transition-all ${showGroupOptions === group.id ? 'bg-white dark:bg-monday-dark' : ''}`}
                            title="Group options"
                          >
                            <svg className="w-4 h-4 text-monday-textLight" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          {showGroupOptions === group.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setShowGroupOptions(null)}
                              ></div>
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-monday-darkLight rounded-lg shadow-lg border border-monday-border dark:border-gray-700 z-50 py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setShowGroupOptions(null)
                                    const currentGroup = board.groups?.find(g => g.id === group.id)
                                    if (currentGroup) {
                                      setRenameGroupName(currentGroup.title)
                                      setRenameGroupId(currentGroup.id)
                                    }
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Rename Group
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setShowGroupOptions(null)
                                    setDeleteGroupId(group.id)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete Group
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                
                {/* Group Items - Sorted */}
                {sortItems(group.items?.filter(item => !item.parentId) || []).map((item, itemIndex) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    columns={board.columns || []}
                    level={0}
                    renderCell={renderCell}
                    itemIndex={itemIndex}
                    editingCell={editingCell}
                    setEditingCell={setEditingCell}
                    editValue={editValue}
                    setEditValue={setEditValue}
                    updateItemMutation={updateItemMutation}
                    setSelectedItemId={setSelectedItemId}
                    createSubItemMutation={createSubItemMutation}
                  />
                ))}
                
                {/* Add Item Row */}
                <tr className="border-b-2 border-monday-border dark:border-gray-700 bg-monday-background/30 dark:bg-gray-900/30">
                  <td colSpan={(board.columns?.length || 0) + 1} className="px-6 py-3">
                    {showAddItemModal?.groupId === group.id ? (
                      <form onSubmit={handleAddItemSubmit} className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-monday-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <input
                          type="text"
                          value={showAddItemModal.name}
                          onChange={(e) => setShowAddItemModal({ ...showAddItemModal, name: e.target.value })}
                          placeholder="Enter item name..."
                          className="flex-1 px-4 py-2.5 text-base border-2 border-monday-primary rounded-lg bg-white focus:outline-none focus:ring-4 focus:ring-monday-primary/20 text-monday-text dark:bg-monday-dark dark:text-white placeholder-gray-400 shadow-sm"
                          autoFocus
                          onBlur={() => {
                            setTimeout(() => {
                              if (showAddItemModal && !showAddItemModal.name.trim()) {
                                setShowAddItemModal(null)
                              }
                            }, 200)
                          }}
                          style={{ fontSize: '14px' }}
                        />
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-lg font-medium transition-all hover:shadow-md hover:scale-105 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-monday-primary focus:ring-offset-2"
                          aria-label="Add item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Add</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddItemModal(null)}
                          className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-monday-text dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                          aria-label="Cancel adding item"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => handleAddItem(group.id)}
                        className="flex items-center space-x-2 text-monday-textLight dark:text-gray-400 hover:text-monday-primary dark:hover:text-monday-primary transition-all group/add hover:scale-105 py-1 focus:outline-none focus:ring-2 focus:ring-monday-primary focus:ring-offset-2 rounded"
                        title="Add a new item to this group"
                        aria-label={`Add a new item to ${group.title || 'this group'}`}
                      >
                        <svg className="w-5 h-5 group-hover/add:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-sm font-medium">Add item</span>
                      </button>
                    )}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {selectedItemId && (
        <ItemDetailModal
          itemId={selectedItemId}
          boardId={board.id}
          isOpen={!!selectedItemId}
          onClose={() => setSelectedItemId(null)}
        />
      )}

      {/* Rename Group Modal */}
      <Modal
        isOpen={!!renameGroupId}
        onClose={() => {
          setRenameGroupId(null)
          setRenameGroupName('')
        }}
        title="Rename Group"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={renameGroupName}
              onChange={(e) => setRenameGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameGroupName.trim() && renameGroupId) {
                  renameGroupMutation.mutate({ groupId: renameGroupId, title: renameGroupName.trim() })
                }
              }}
              className="w-full px-4 py-2 border-2 border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
              autoFocus
              placeholder="Enter group name"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setRenameGroupId(null)
                setRenameGroupName('')
              }}
              className="px-4 py-2 text-sm font-medium text-monday-text dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (renameGroupName.trim() && renameGroupId) {
                  renameGroupMutation.mutate({ groupId: renameGroupId, title: renameGroupName.trim() })
                }
              }}
              disabled={!renameGroupName.trim() || renameGroupMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-monday-primary hover:bg-monday-primaryHover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {renameGroupMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Group Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteGroupId}
        title="Delete Group"
        message={`Are you sure you want to delete this group? All items in this group will also be deleted. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (deleteGroupId) {
            deleteGroupMutation.mutate(deleteGroupId)
          }
        }}
        onCancel={() => setDeleteGroupId(null)}
      />

      {/* Edit Column Modal */}
      <Modal
        isOpen={!!editColumnId}
        onClose={() => {
          setEditColumnId(null)
          setEditColumnTitle('')
        }}
        title="Edit Column"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
              Column Title
            </label>
            <input
              type="text"
              value={editColumnTitle}
              onChange={(e) => setEditColumnTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && editColumnTitle.trim() && editColumnId) {
                  updateColumnMutation.mutate({ columnId: editColumnId, title: editColumnTitle.trim() })
                }
              }}
              className="w-full px-4 py-2 border-2 border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
              autoFocus
              placeholder="Enter column title"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setEditColumnId(null)
                setEditColumnTitle('')
              }}
              className="px-4 py-2 text-sm font-medium text-monday-text dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (editColumnTitle.trim() && editColumnId) {
                  updateColumnMutation.mutate({ columnId: editColumnId, title: editColumnTitle.trim() })
                }
              }}
              disabled={!editColumnTitle.trim() || updateColumnMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-monday-primary hover:bg-monday-primaryHover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateColumnMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Column Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteColumnId}
        title="Delete Column"
        message={`Are you sure you want to delete this column? All values in this column will be permanently deleted. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (deleteColumnId) {
            deleteColumnMutation.mutate(deleteColumnId)
          }
        }}
        onCancel={() => setDeleteColumnId(null)}
      />
    </div>
  )
}
