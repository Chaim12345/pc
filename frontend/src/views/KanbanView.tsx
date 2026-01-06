import { useState, useMemo, memo, useCallback } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Board, Item, Column, Group } from '@monday-clone/shared'
import { api } from '../services/api'
import { useSocket } from '../contexts/SocketContext'
import { useToast } from '../contexts/ToastContext'
import { SocketEvent } from '@monday-clone/shared'
import ItemDetailModal from '../components/ItemDetailModal'
import { logger } from '../utils/logger'
import type { FilterRule } from '../components/FilterModal'
import type { SortRule } from '../components/SortModal'

interface KanbanViewProps {
  board: Board
  filterRules?: FilterRule[]
  sortRules?: SortRule[]
}

interface KanbanColumnProps {
  label: any
  column: Column
  items: Item[]
  boardId: string
  onItemMove: (itemId: string, columnId: string, position: number) => void
  onAddItem: (name: string, statusLabel: any) => void
  onEditName: (itemId: string, newName: string) => void
  onDelete: (itemId: string) => void
  onDuplicate: (itemId: string) => void
  onItemClick?: (itemId: string) => void
}

interface KanbanItemProps {
  item: Item
  column: Column
  boardId: string
  isDragging?: boolean
  onEditName: (itemId: string, newName: string) => void
  onDelete: (itemId: string) => void
  onDuplicate: (itemId: string) => void
  onItemClick?: (itemId: string) => void
  commentCount?: number
}

const KanbanItem = memo(function KanbanItem({ item, column, boardId, isDragging = false, onEditName, onDelete, onDuplicate, onItemClick, commentCount = 0 }: KanbanItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(item.name)
  const [showMenu, setShowMenu] = useState(false)
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isItemDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isItemDragging ? 'none' : (transition || 'transform 150ms cubic-bezier(0.2, 0, 0, 1), opacity 150ms ease'),
    opacity: isItemDragging ? 0.5 : 1,
  }

  const columnValue = item.columnValues?.find((cv) => cv.columnId === column.id)
  const statusValue = columnValue?.value as { id: string; label: string; color: string } | null

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleNameSave = () => {
    if (editedName.trim() && editedName !== item.name) {
      onEditName(item.id, editedName.trim())
    }
    setIsEditing(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave()
    } else if (e.key === 'Escape') {
      setEditedName(item.name)
      setIsEditing(false)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on drag handle, menu, or editing
    if (isEditing || showMenu) return
    const target = e.target as HTMLElement
    if (target.closest('[data-drag-handle]') || target.closest('[data-menu-button]')) return
    onItemClick?.(item.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      className={`bg-white dark:bg-monday-dark p-4 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 mb-3 border-2 border-transparent hover:border-monday-primary/30 group relative cursor-pointer transform hover:scale-[1.02] ${
        isDragging ? 'rotate-2 scale-110 shadow-2xl z-50' : ''
      } ${isItemDragging ? 'opacity-40 scale-95' : ''}`}
    >
      {/* Item Name */}
      {isEditing ? (
        <input
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onBlur={handleNameSave}
          onKeyDown={handleNameKeyDown}
          className="w-full font-semibold text-monday-text dark:text-white mb-3 px-2 py-1 border-2 border-monday-primary rounded focus:outline-none bg-white dark:bg-monday-dark"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          {...attributes}
          {...listeners}
          data-drag-handle
          onClick={(e) => {
            e.stopPropagation()
            handleNameClick(e)
          }}
          className="font-semibold text-monday-text dark:text-white mb-3 group-hover:text-monday-primary transition-colors cursor-grab active:cursor-grabbing select-none"
          aria-label={`Drag handle for ${item.name}. Click to edit name.`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleNameClick(e as any)
            }
          }}
        >
          {item.name}
        </div>
      )}

      {/* Status Badge */}
      {statusValue && (
        <div className="flex items-center space-x-2 mb-3">
          <div
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm"
            style={{
              backgroundColor: statusValue.color || '#808080',
              color: '#ffffff',
            }}
          >
            <span className="mr-1">●</span>
            {statusValue.label}
          </div>
        </div>
      )}

      {/* Item Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center space-x-2">
          {/* Assignee Avatar Placeholder */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-monday-blue to-monday-purple flex items-center justify-center text-white text-xs font-bold">
            {item.name.charAt(0).toUpperCase()}
          </div>
          {/* Comments indicator */}
          {commentCount > 0 && (
            <div className="flex items-center space-x-1 text-xs text-monday-textLight dark:text-gray-400 bg-monday-background dark:bg-gray-800 px-2 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span className="font-medium">{commentCount}</span>
            </div>
          )}
        </div>

        {/* Action button with menu */}
        <div className="relative">
          <button 
            data-menu-button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
            aria-label="Item options"
          >
            <svg className="w-4 h-4 text-monday-textLight" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-monday-darkLight rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                  setIsEditing(true)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-monday-text dark:text-white flex items-center space-x-2"
                aria-label={`Edit name of ${item.name}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Name</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                  onDuplicate(item.id)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-monday-text dark:text-white flex items-center space-x-2"
                aria-label={`Duplicate ${item.name}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Duplicate</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                  onDelete(item.id)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center space-x-2"
                aria-label={`Delete ${item.name}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

KanbanItem.displayName = 'KanbanItem'

const KanbanColumn = memo(function KanbanColumn({ label, column, items, boardId, onItemMove, onAddItem, onEditName, onDelete, onDuplicate, onItemClick }: KanbanColumnProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const itemIds = items.map((item) => item.id)
  const droppableId = `kanban-column-${label.id}`
  const { setNodeRef, isOver } = useDroppable({ id: droppableId })

  const getColumnColor = (label: string) => {
    const colorMap: Record<string, string> = {
      'Done': 'from-green-500 to-green-600',
      'Working on it': 'from-orange-500 to-orange-600',
      'Stuck': 'from-red-500 to-red-600',
      'Waiting': 'from-purple-500 to-purple-600',
      'Not Started': 'from-gray-400 to-gray-500',
    }
    return colorMap[label] || 'from-blue-500 to-blue-600'
  }

  const handleAddItem = () => {
    if (newItemName.trim()) {
      onAddItem(newItemName.trim(), label)
      setNewItemName('')
      setShowAddForm(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem()
    } else if (e.key === 'Escape') {
      setNewItemName('')
      setShowAddForm(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-[21rem] bg-monday-background dark:bg-monday-darkLight rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-monday-primary/30 transition-all duration-200 ${
        isOver ? 'border-monday-primary shadow-lg bg-monday-primaryLight/5 dark:bg-monday-primary/10 scale-[1.02]' : ''
      }`}
    >
      {/* Column Header */}
      <div className="mb-4">
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r ${getColumnColor(label.label)} text-white shadow-md`}>
          <div className="flex-1">
            <div className="font-bold text-sm">{label.label}</div>
            <div className="text-xs opacity-90">{items.length} items</div>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
            title="Add item"
            aria-label={`Add item to ${label.label} column`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <div className="mb-3 p-3 bg-white dark:bg-monday-dark rounded-lg shadow-md border-2 border-monday-primary">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter item name..."
            className="w-full px-3 py-2 mb-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:border-monday-primary"
            autoFocus
          />
          <div className="flex space-x-2">
            <button
              onClick={handleAddItem}
              className="flex-1 px-3 py-1.5 bg-monday-primary hover:bg-monday-primaryHover text-white text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-monday-primary focus:ring-offset-2"
              aria-label="Add item"
            >
              Add
            </button>
            <button
              onClick={() => {
                setNewItemName('')
                setShowAddForm(false)
              }}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-monday-text dark:text-white text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              aria-label="Cancel adding item"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Column Items */}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-0 min-h-[220px]">
          {items.length > 0 ? (
            items.map((item) => (
              <KanbanItem 
                key={item.id} 
                item={item} 
                column={column}
                boardId={boardId}
                onEditName={onEditName} 
                onDelete={onDelete} 
                onDuplicate={onDuplicate}
                onItemClick={onItemClick}
                commentCount={item.comments?.length || 0}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-sm text-monday-textLight dark:text-gray-500">No items yet</p>
              <p className="text-xs text-monday-textLight dark:text-gray-600 mt-1">Drag items here or click + to add</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
})

KanbanColumn.displayName = 'KanbanColumn'

export default function KanbanView({ board: boardProp, filterRules = [], sortRules = [] }: KanbanViewProps) {
  const { socket, isConnected } = useSocket()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [activeItem, setActiveItem] = useState<Item | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  // Subscribe to board data from query cache to ensure optimistic updates trigger re-renders
  const { data: board } = useQuery<Board>({
    queryKey: ['board', boardProp.id],
    queryFn: async () => {
      // This will use cached data if available, otherwise fetch
      const cached = queryClient.getQueryData<Board>(['board', boardProp.id])
      if (cached) return cached
      const response = await api.get(`/boards/${boardProp.id}`)
      return response.data.data
    },
    initialData: boardProp,
    // Ensure we always get the latest from cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  // Find status column
  const statusColumn = board.columns?.find((col) => col.type === 'STATUS')

  // Get the first group (or create logic to select group)
  const defaultGroup = board.groups?.[0]

  const addItemMutation = useMutation({
    mutationFn: async ({ name, statusLabel }: { name: string; statusLabel: any }) => {
      if (!defaultGroup) throw new Error('No group available')
      
      const response = await api.post(`/groups/${defaultGroup.id}/items`, {
        name,
        columnValues: statusColumn ? [
          {
            columnId: statusColumn.id,
            value: statusLabel,
          },
        ] : [],
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', board.id] })
      showToast('Item added successfully', 'success')
      socket && isConnected && socket.emit(SocketEvent.ITEM_CREATED, { boardId: board.id })
    },
    onError: (error) => {
      showToast('Failed to add item', 'error')
      logger.error('Add item error:', error)
    },
  })

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: any }) => {
      const response = await api.put(`/items/${itemId}`, updates)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', board.id] })
      showToast('Item updated successfully', 'success')
      socket && isConnected && socket.emit(SocketEvent.ITEM_UPDATED, { boardId: board.id })
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await api.delete(`/items/${itemId}`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', board.id] })
      showToast('Item deleted successfully', 'success')
      socket && isConnected && socket.emit(SocketEvent.ITEM_DELETED, { boardId: board.id })
    },
  })

  const duplicateItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const item = board.groups
        ?.flatMap((g) => g.items || [])
        .find((i) => i.id === itemId)
      
      if (!item || !defaultGroup) throw new Error('Item or group not found')
      
      const response = await api.post(`/groups/${defaultGroup.id}/items`, {
        name: `${item.name} (Copy)`,
        columnValues: item.columnValues?.map((cv) => ({
          columnId: cv.columnId,
          value: cv.value,
        })) || [],
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', board.id] })
      showToast('Item duplicated successfully', 'success')
      socket && isConnected && socket.emit(SocketEvent.ITEM_CREATED, { boardId: board.id })
    },
  })

  const updateColumnValueMutation = useMutation({
    mutationFn: async ({ itemId, columnId, value }: { itemId: string; columnId: string; value: any }) => {
      const response = await api.post(`/columns/${columnId}/values`, { itemId, value })
      return response.data.data
    },
    onMutate: async ({ itemId, columnId, value }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['board', board.id] })

      // Snapshot the previous value
      const previousBoard = queryClient.getQueryData<Board>(['board', board.id])

      // Optimistically update the board data with proper deep copy
      if (previousBoard) {
        // Create deep copy of board structure
        const updatedBoard: Board = {
          ...previousBoard,
          groups: previousBoard.groups?.map((group) => ({
            ...group,
            items: group.items?.map((item) => {
              if (item.id === itemId) {
                const columnValueIndex = item.columnValues?.findIndex((cv) => cv.columnId === columnId) ?? -1
                
                let updatedColumnValues: any[]
                if (columnValueIndex >= 0 && item.columnValues) {
                  // Update existing column value
                  updatedColumnValues = [...item.columnValues]
                  updatedColumnValues[columnValueIndex] = {
                    ...updatedColumnValues[columnValueIndex],
                    value,
                  }
                } else if (item.columnValues) {
                  // Add new column value
                  updatedColumnValues = [
                    ...item.columnValues,
                    { columnId, value } as any
                  ]
                } else {
                  // Initialize columnValues array
                  updatedColumnValues = [{ columnId, value } as any]
                }

                return {
                  ...item,
                  columnValues: updatedColumnValues,
                }
              }
              return item
            }),
          })),
        }

        // Update the cache optimistically
        queryClient.setQueryData<Board>(['board', board.id], updatedBoard)
      }

      return { previousBoard }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousBoard) {
        queryClient.setQueryData(['board', board.id], context.previousBoard)
      }
      showToast('Failed to move item', 'error')
    },
    onSuccess: () => {
      // Invalidate queries to update all views (Table, Gantt, etc.)
      // React Query will intelligently refetch only when components are mounted
      queryClient.invalidateQueries({ 
        queryKey: ['board', board.id]
      })
      socket && isConnected && socket.emit(SocketEvent.COLUMN_UPDATED, { boardId: board.id })
    },
  })

  const handleAddItem = useCallback((name: string, statusLabel: any) => {
    addItemMutation.mutate({ name, statusLabel })
  }, [addItemMutation])

  const handleEditName = useCallback((itemId: string, newName: string) => {
    updateItemMutation.mutate({ itemId, updates: { name: newName } })
  }, [updateItemMutation])

  const handleDelete = useCallback((itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteItemMutation.mutate(itemId)
    }
  }, [deleteItemMutation])

  const handleDuplicate = useCallback((itemId: string) => {
    duplicateItemMutation.mutate(itemId)
  }, [duplicateItemMutation])

  const handleDragStart = (event: DragStartEvent) => {
    const itemId = event.active.id as string
    const item = board.groups
      ?.flatMap((g) => g.items || [])
      .find((item) => item.id === itemId)
    setActiveItem(item || null)
    // Close item detail modal if open
    if (selectedItemId === itemId) {
      setSelectedItemId(null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !statusColumn) {
      setActiveItem(null)
      return
    }

    const itemId = active.id as string
    const overId = over.id as string
    const settings = statusColumn.settings as any
    const labels = settings?.labels || []

    // Find current item status
    const currentItem = board.groups
      ?.flatMap((g) => g.items || [])
      .find((item) => item.id === itemId)
    
    const currentColumnValue = currentItem?.columnValues?.find((cv) => cv.columnId === statusColumn.id)
    const currentStatus = currentColumnValue?.value as { id: string } | null

    let targetStatus: any = null

    if (overId.startsWith('kanban-column-')) {
      const labelId = overId.replace('kanban-column-', '')
      targetStatus = labels.find((label: any) => label.id?.toString() === labelId.toString())
    } else {
      const targetItem = board.groups
        ?.flatMap((g) => g.items || [])
        .find((item) => item.id === overId)

      if (targetItem) {
        const columnValue = targetItem.columnValues?.find((cv) => cv.columnId === statusColumn.id)
        targetStatus = columnValue?.value
      }
    }

    if (!targetStatus) {
      targetStatus = labels[0] || { id: '1', label: 'Working on it', color: '#FDAB3D' }
    }

    // Only update if status actually changed
    const targetStatusId = targetStatus.id?.toString() ?? targetStatus.id
    const currentStatusId = currentStatus?.id?.toString()
    
    if (targetStatusId !== currentStatusId) {
      // Update optimistically - the mutation will handle the UI update
      updateColumnValueMutation.mutate({
        itemId,
        columnId: statusColumn.id,
        value: {
          id: targetStatusId,
          label: targetStatus.label,
          color: targetStatus.color,
        },
      })
    }

    // Clear active item after a short delay to allow smooth transition
    setTimeout(() => {
      setActiveItem(null)
    }, 100)
  }

  // Group items by status
  const itemsByStatus = useMemo(() => {
    if (!statusColumn || !board.groups) return {}

    const settings = statusColumn.settings as any
    const labels = settings?.labels || []

    const grouped: Record<string, Item[]> = {}
    labels.forEach((label: any) => {
      grouped[label.id] = []
    })
    grouped['none'] = []

    board.groups.forEach((group) => {
      group.items?.forEach((item) => {
        const columnValue = item.columnValues?.find((cv) => cv.columnId === statusColumn.id)
        const statusValue = columnValue?.value as { id: string } | null

        if (statusValue?.id) {
          if (!grouped[statusValue.id]) {
            grouped[statusValue.id] = []
          }
          grouped[statusValue.id].push(item)
        } else {
          grouped['none'].push(item)
        }
      })
    })

    return grouped
  }, [board.groups, statusColumn])

  if (!statusColumn) {
    return (
      <div className="flex items-center justify-center py-20 bg-white dark:bg-monday-darkLight rounded-xl shadow-monday">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-200 to-orange-300 dark:from-orange-900 dark:to-orange-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-orange-600 dark:text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-monday-text dark:text-white mb-2">No Status Column Found</h3>
          <p className="text-monday-textLight dark:text-gray-400 mb-6">
            Add a status column to your board to use the Kanban view.
          </p>
          <button
            onClick={() => showToast('Click "Add Column" button and select "Status" type', 'info')}
            className="px-6 py-3 bg-monday-primary hover:bg-monday-primaryHover text-white font-medium rounded-lg transition-all hover:scale-105 hover:shadow-lg inline-flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Status Column</span>
          </button>
        </div>
      </div>
    )
  }

  const settings = statusColumn.settings as any
  const labels = settings?.labels || []

  return (
    <DndContext 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 px-2 custom-scrollbar">
        {labels.map((label: any) => (
          <KanbanColumn
            key={label.id}
            label={label}
            column={statusColumn}
            boardId={board.id}
            items={itemsByStatus[label.id] || []}
            onItemMove={(itemId, columnId, position) => {
              updateColumnValueMutation.mutate({
                itemId,
                columnId,
                value: label,
              })
            }}
            onAddItem={handleAddItem}
            onEditName={handleEditName}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onItemClick={setSelectedItemId}
          />
        ))}
        {itemsByStatus['none'] && itemsByStatus['none'].length > 0 && (
          <KanbanColumn
            label={{ id: 'none', label: 'No Status', color: '#808080' }}
            column={statusColumn}
            boardId={board.id}
            items={itemsByStatus['none']}
            onItemMove={() => {}}
            onAddItem={handleAddItem}
            onEditName={handleEditName}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onItemClick={setSelectedItemId}
          />
        )}
      </div>

      <DragOverlay>
        {activeItem && statusColumn ? (
          <div className="rotate-2 scale-110 opacity-95 shadow-2xl">
            <KanbanItem 
              item={activeItem} 
              column={statusColumn}
              boardId={board.id}
              isDragging={true}
              onEditName={handleEditName}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              commentCount={activeItem.comments?.length || 0}
            />
          </div>
        ) : null}
      </DragOverlay>

      {/* Item Detail Modal */}
      {selectedItemId && (
        <ItemDetailModal
          itemId={selectedItemId}
          boardId={board.id}
          isOpen={!!selectedItemId}
          onClose={() => setSelectedItemId(null)}
        />
      )}
    </DndContext>
  )
}
