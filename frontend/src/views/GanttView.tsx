import React, { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Board, Item, Column, SocketEvent } from '@monday-clone/shared'
import { api } from '../services/api'
import { useSocket } from '../contexts/SocketContext'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays, addDays, isSameDay } from 'date-fns'
import ItemDetailModal from '../components/ItemDetailModal'

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
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

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
      <div className="flex items-center justify-center h-full bg-white dark:bg-monday-darkLight rounded-xl shadow-monday border border-monday-border/30 dark:border-gray-700">
        <div className="text-center max-w-md p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-monday-text dark:text-white mb-2">No Timeline Column Found</h3>
          <p className="text-monday-textLight dark:text-gray-400">
            Add a timeline or date column to your board to use the Gantt view.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-monday-darkLight rounded-xl shadow-monday border border-monday-border/30 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-monday-border dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-monday-darkLight dark:to-gray-900 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              zoom === 'week'
                ? 'bg-monday-primary text-white shadow-md'
                : 'bg-white dark:bg-monday-dark text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 border border-monday-border dark:border-gray-700'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setZoom('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              zoom === 'month'
                ? 'bg-monday-primary text-white shadow-md'
                : 'bg-white dark:bg-monday-dark text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 border border-monday-border dark:border-gray-700'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setZoom('quarter')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              zoom === 'quarter'
                ? 'bg-monday-primary text-white shadow-md'
                : 'bg-white dark:bg-monday-dark text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 border border-monday-border dark:border-gray-700'
            }`}
          >
            Quarter
          </button>
        </div>
        <div className="text-sm font-medium text-monday-text dark:text-white">
          {format(days[0], 'MMM d')} - {format(days[days.length - 1], 'MMM d, yyyy')}
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="min-w-full">
          {/* Timeline header */}
          <div className="flex border-b border-monday-border dark:border-gray-700 sticky top-0 bg-white dark:bg-monday-darkLight z-10 shadow-sm">
            <div className="w-64 border-r border-monday-border dark:border-gray-700 p-3 font-semibold text-sm text-monday-text dark:text-white bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-monday-darkLight">
              Item
            </div>
            <div className="flex-1 relative" style={{ minWidth: `${days.length * 30}px` }}>
              {days.map((day, index) => {
                const isWeekend = day.getDay() === 0 || day.getDay() === 6
                const isToday = isSameDay(day, new Date())
                return (
                  <div
                    key={day.toISOString()}
                    className={`inline-block border-r border-monday-border dark:border-gray-700 text-xs p-2 text-center ${
                      isToday
                        ? 'bg-monday-primaryLight dark:bg-monday-primary/20 border-monday-primary dark:border-monday-primary'
                        : isWeekend
                        ? 'bg-gray-50 dark:bg-gray-900/50'
                        : 'bg-white dark:bg-monday-darkLight'
                    }`}
                    style={{ width: `${dayWidth}%` }}
                  >
                    <div className={`font-medium ${isToday ? 'text-monday-primary dark:text-monday-primary' : 'text-monday-text dark:text-white'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="text-monday-textLight dark:text-gray-400">{format(day, 'EEE')}</div>
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
                <div
                  key={ganttItem.item.id}
                  className="flex border-b border-monday-border dark:border-gray-700 hover:bg-monday-background dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="w-64 border-r border-monday-border dark:border-gray-700 p-3 flex items-center bg-white dark:bg-monday-darkLight">
                    <button
                      onClick={() => setSelectedItemId(ganttItem.item.id)}
                      className="flex-1 truncate text-sm font-medium text-monday-text dark:text-white hover:text-monday-primary dark:hover:text-monday-primary text-left transition-colors"
                    >
                      {ganttItem.item.name}
                    </button>
                  </div>
                  <div className="flex-1 relative" style={{ minWidth: `${days.length * 30}px` }}>
                    <div className="relative h-12 flex items-center">
                      <button
                        onClick={() => setSelectedItemId(ganttItem.item.id)}
                        className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-lg px-3 text-xs flex items-center font-medium shadow-md hover:shadow-lg transition-all cursor-pointer ${
                          isToday
                            ? 'bg-monday-primary text-white hover:bg-monday-primaryHover'
                            : 'bg-monday-primaryLight dark:bg-monday-primary/30 text-monday-primary dark:text-monday-primary hover:bg-monday-primary/20 dark:hover:bg-monday-primary/40'
                        }`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          minWidth: '60px',
                        }}
                      >
                        <span className="truncate">{ganttItem.item.name}</span>
                        {ganttItem.duration && ganttItem.duration > 1 && (
                          <span className="ml-2 opacity-75">({ganttItem.duration}d)</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {ganttItems.length === 0 && (
              <div className="text-center py-12 text-monday-textLight dark:text-gray-400 px-4">
                No items with dates found. Add dates to items to see them in the Gantt chart.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItemId && (
        <ItemDetailModal
          itemId={selectedItemId}
          boardId={board.id}
          isOpen={!!selectedItemId}
          onClose={() => setSelectedItemId(null)}
        />
      )}
    </div>
  )
}
