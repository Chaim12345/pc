import React, { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Board, Item, Column, SocketEvent } from '@monday-clone/shared'
import { api } from '../services/api'
import { useSocket } from '../contexts/SocketContext'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays, addDays, isSameDay } from 'date-fns'

interface GanttViewProps {
  board: Board
}

interface GanttItem {
  item: Item
  startDate?: Date
  endDate?: Date
  duration?: number // days
}

export default function GanttView({ board }: GanttViewProps) {
  const { socket } = useSocket()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [zoom, setZoom] = useState<'week' | 'month' | 'quarter'>('month')

  // Find timeline or date columns
  const timelineColumn = board.columns?.find((col) => col.type === 'TIMELINE')
  const dateColumn = board.columns?.find((col) => col.type === 'DATE')

  const updateColumnValueMutation = useMutation({
    mutationFn: async ({ itemId, columnId, value }: { itemId: string; columnId: string; value: any }) => {
      const response = await api.post(`/columns/${columnId}/values`, { itemId, value })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', board.id] })
      if (socket) {
        socket.emit(SocketEvent.COLUMN_UPDATED, { boardId: board.id })
      }
    },
  })

  const ganttItems = useMemo(() => {
    const items: GanttItem[] = []

    if (!board.groups) return items

    board.groups.forEach((group) => {
      group.items?.forEach((item) => {
        let startDate: Date | undefined
        let endDate: Date | undefined

        if (timelineColumn) {
          const settings = timelineColumn.settings as any
          const startColumnId = settings?.startDateColumnId
          const endColumnId = settings?.endDateColumnId

          if (startColumnId) {
            const startValue = item.columnValues?.find((cv) => cv.columnId === startColumnId)
            if (startValue?.value) {
              startDate = new Date(startValue.value)
            }
          }

          if (endColumnId) {
            const endValue = item.columnValues?.find((cv) => cv.columnId === endColumnId)
            if (endValue?.value) {
              endDate = new Date(endValue.value)
            }
          }
        } else if (dateColumn) {
          const dateValue = item.columnValues?.find((cv) => cv.columnId === dateColumn.id)
          if (dateValue?.value) {
            startDate = new Date(dateValue.value)
            endDate = startDate
          }
        }

        if (startDate) {
          items.push({
            item,
            startDate,
            endDate: endDate || startDate,
            duration: endDate ? differenceInDays(endDate, startDate) + 1 : 1,
          })
        }
      })
    })

    return items.sort((a, b) => {
      if (!a.startDate || !b.startDate) return 0
      return a.startDate.getTime() - b.startDate.getTime()
    })
  }, [board.groups, timelineColumn, dateColumn])

  // Calculate timeline range
  const timelineRange = useMemo(() => {
    if (ganttItems.length === 0) {
      const start = startOfWeek(selectedDate)
      const end = endOfWeek(selectedDate)
      return { start, end }
    }

    const dates = ganttItems
      .map((gi) => [gi.startDate, gi.endDate])
      .flat()
      .filter((d): d is Date => d !== undefined)

    if (dates.length === 0) {
      const start = startOfWeek(selectedDate)
      const end = endOfWeek(selectedDate)
      return { start, end }
    }

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))
    const start = startOfWeek(minDate)
    const end = endOfWeek(maxDate)

    return { start, end }
  }, [ganttItems, selectedDate])

  const days = useMemo(() => {
    if (zoom === 'week') {
      return eachDayOfInterval({ start: timelineRange.start, end: endOfWeek(timelineRange.start) })
    } else if (zoom === 'month') {
      const start = startOfWeek(timelineRange.start)
      const end = endOfWeek(addDays(timelineRange.start, 30))
      return eachDayOfInterval({ start, end })
    } else {
      // quarter
      const start = startOfWeek(timelineRange.start)
      const end = endOfWeek(addDays(timelineRange.start, 90))
      return eachDayOfInterval({ start, end })
    }
  }, [timelineRange, zoom])

  const getItemPosition = (item: GanttItem) => {
    if (!item.startDate || days.length === 0) return { left: 0, width: 0 }

    const timelineStart = days[0].getTime()
    const timelineEnd = days[days.length - 1].getTime()
    const timelineDuration = timelineEnd - timelineStart

    const itemStart = item.startDate.getTime()
    const itemEnd = item.endDate?.getTime() || item.startDate.getTime()

    const left = ((itemStart - timelineStart) / timelineDuration) * 100
    const width = ((itemEnd - itemStart) / timelineDuration) * 100

    return { left: Math.max(0, left), width: Math.max(2, width) }
  }

  const dayWidth = 100 / days.length

  if (!timelineColumn && !dateColumn) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500">No timeline or date column found. Please add a date or timeline column to use Gantt view.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom('week')}
            className={`px-3 py-1 rounded text-sm ${
              zoom === 'week' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setZoom('month')}
            className={`px-3 py-1 rounded text-sm ${
              zoom === 'month' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setZoom('quarter')}
            className={`px-3 py-1 rounded text-sm ${
              zoom === 'quarter' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Quarter
          </button>
        </div>
        <div className="text-sm text-gray-600">
          {format(days[0], 'MMM d')} - {format(days[days.length - 1], 'MMM d, yyyy')}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Timeline header */}
          <div className="flex border-b sticky top-0 bg-white z-10">
            <div className="w-64 border-r p-2 font-semibold text-sm">Item</div>
            <div className="flex-1 relative" style={{ minWidth: `${days.length * 30}px` }}>
              {days.map((day, index) => {
                const isWeekend = day.getDay() === 0 || day.getDay() === 6
                return (
                  <div
                    key={day.toISOString()}
                    className={`inline-block border-r text-xs p-1 text-center ${
                      isWeekend ? 'bg-gray-50' : 'bg-white'
                    }`}
                    style={{ width: `${dayWidth}%` }}
                  >
                    {format(day, 'd')}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Gantt items */}
          <div className="relative">
            {ganttItems.map((ganttItem, index) => {
              const { left, width } = getItemPosition(ganttItem)
              const isToday = ganttItem.startDate && isSameDay(ganttItem.startDate, new Date())

              return (
                <div key={ganttItem.item.id} className="flex border-b hover:bg-gray-50">
                  <div className="w-64 border-r p-2 flex items-center">
                    <div className="flex-1 truncate text-sm font-medium">{ganttItem.item.name}</div>
                  </div>
                  <div className="flex-1 relative" style={{ minWidth: `${days.length * 30}px` }}>
                    <div className="relative h-10">
                      <div
                        className={`absolute top-2 h-6 rounded px-2 text-xs flex items-center ${
                          isToday ? 'bg-primary-500 text-white' : 'bg-primary-200 text-primary-800'
                        }`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          minWidth: '60px',
                        }}
                      >
                        <span className="truncate">{ganttItem.item.name}</span>
                        {ganttItem.duration && ganttItem.duration > 1 && (
                          <span className="ml-1">({ganttItem.duration}d)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {ganttItems.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No items with dates found. Add dates to items to see them in the Gantt chart.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



