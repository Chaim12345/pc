import React, { useMemo } from 'react'
import { Widget, Board } from '@monday-clone/shared'

interface ChartWidgetProps {
  widget: Widget
  boards?: Board[]
}

export default function ChartWidget({ widget, boards }: ChartWidgetProps) {
  const config = widget.config || {}
  const { boardId, columnId, chartType = 'bar' } = config

  const chartData = useMemo(() => {
    if (!boards || !boardId) return []

    const board = boards.find(b => b.id === boardId)
    if (!board || !board.groups) return []

    const dataMap: Record<string, number> = {}
    board.groups.forEach(group => {
      group.items?.forEach(item => {
        if (columnId) {
          const columnValue = item.columnValues?.find(cv => cv.columnId === columnId)
          if (columnValue?.value) {
            const key = String(columnValue.value)
            dataMap[key] = (dataMap[key] || 0) + 1
          }
        } else {
          // Count by group
          const key = group.title
          dataMap[key] = (dataMap[key] || 0) + 1
        }
      })
    })

    return Object.entries(dataMap).map(([label, value]) => ({ label, value }))
  }, [boards, boardId, columnId])

  const maxValue = chartData.length > 0 ? Math.max(...chartData.map(d => d.value)) : 1

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <div className="text-sm font-semibold text-gray-900 mb-4">{widget.title}</div>
      <div className="space-y-2">
        {chartData.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-8">No data available</div>
        ) : (
          chartData.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="text-xs text-gray-600 w-24 truncate">{item.label}</div>
              <div className="flex-1">
                <div className="relative h-6 bg-gray-200 rounded overflow-hidden">
                  <div
                    className={`h-full ${chartType === 'bar' ? 'bg-primary-500' : 'bg-primary-300'}`}
                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-xs text-gray-700 w-8 text-right">{item.value}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}



