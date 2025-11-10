import React from 'react'
import { Widget, Board } from '@monday-clone/shared'

interface NumbersWidgetProps {
  widget: Widget
  boards?: Board[]
}

export default function NumbersWidget({ widget, boards }: NumbersWidgetProps) {
  const config = widget.config || {}
  const { boardId, columnId, operation = 'sum' } = config

  // Calculate numbers from board data
  const calculateValue = () => {
    if (!boards || !boardId) return 0

    const board = boards.find(b => b.id === boardId)
    if (!board || !board.groups) return 0

    const values: number[] = []
    board.groups.forEach(group => {
      group.items?.forEach(item => {
        if (columnId) {
          const columnValue = item.columnValues?.find(cv => cv.columnId === columnId)
          if (columnValue?.value) {
            const numValue = parseFloat(columnValue.value)
            if (!isNaN(numValue)) {
              values.push(numValue)
            }
          }
        } else {
          // Count items
          values.push(1)
        }
      })
    })

    switch (operation) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0)
      case 'average':
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
      case 'count':
        return values.length
      case 'min':
        return values.length > 0 ? Math.min(...values) : 0
      case 'max':
        return values.length > 0 ? Math.max(...values) : 0
      default:
        return values.length
    }
  }

  const value = calculateValue()
  const formattedValue = operation === 'average' ? value.toFixed(1) : value.toLocaleString()

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <div className="text-sm text-gray-600 mb-2">{widget.title}</div>
      <div className="text-4xl font-bold text-gray-900">{formattedValue}</div>
      {columnId && (
        <div className="text-xs text-gray-500 mt-2 capitalize">{operation}</div>
      )}
    </div>
  )
}



