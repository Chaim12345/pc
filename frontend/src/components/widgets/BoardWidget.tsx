import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Widget, Board } from '@monday-clone/shared'

interface BoardWidgetProps {
  widget: Widget
  boards?: Board[]
}

export default function BoardWidget({ widget, boards }: BoardWidgetProps) {
  const navigate = useNavigate()
  const config = widget.config || {}
  const { boardId } = config

  const board = boards?.find(b => b.id === boardId)

  if (!board) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-full">
        <div className="text-sm font-semibold text-gray-900 mb-2">{widget.title}</div>
        <div className="text-sm text-gray-500">No board selected</div>
      </div>
    )
  }

  const itemCount = board.groups?.reduce((sum, group) => sum + (group.items?.length || 0), 0) || 0

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/board/${boardId}`)
  }

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow p-6 h-full cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="text-sm font-semibold text-gray-900 mb-2">{widget.title}</div>
      <div className="text-lg font-bold text-primary-600 mb-1">{board.name}</div>
      <div className="text-xs text-gray-500">
        {itemCount} {itemCount === 1 ? 'item' : 'items'}
      </div>
      {board.description && (
        <div className="text-xs text-gray-600 mt-2 line-clamp-2">{board.description}</div>
      )}
    </div>
  )
}

