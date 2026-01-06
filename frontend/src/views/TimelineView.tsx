import React, { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Board, Item, Column, SocketEvent } from '@monday-clone/shared'
import { api } from '../services/api'
import { useSocket } from '../contexts/SocketContext'
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  differenceInDays,
  addDays,
  startOfDay,
  endOfDay,
  isSameDay,
} from 'date-fns'
import ItemDetailModal from '../components/ItemDetailModal'

interface TimelineViewProps {
  board: Board
}

interface TimelineItem {
  item: Item
  startDate?: Date
  endDate?: Date
  row: number
}

export default function TimelineView({ board }: TimelineViewProps) {
  const { socket, isConnected } = useSocket()
  const queryClient = useQueryClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [zoom, setZoom] = useState<'day' | 'week' | 'month'>('month')
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
      socket && isConnected && socket.emit(SocketEvent.COLUMN_UPDATED, { boardId: board.id })
    },
  })

  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = []
    let rowIndex = 0

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
            row: rowIndex++,
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
    let start: Date
    let end: Date

    if (zoom === 'day') {
      start = startOfDay(currentDate)
      end = endOfDay(currentDate)
    } else if (zoom === 'week') {
      start = startOfWeek(currentDate)
      end = endOfWeek(currentDate)
    } else {
      // month
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      start = startOfDay(monthStart)
      end = endOfDay(monthEnd)
    }

    if (timelineItems.length > 0) {
      const dates = timelineItems
        .map((ti) => [ti.startDate, ti.endDate])
        .flat()
        .filter((d): d is Date => d !== undefined)

      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
        const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))
        start = new Date(Math.min(start.getTime(), minDate.getTime()))
        end = new Date(Math.max(end.getTime(), maxDate.getTime()))
      }
    }

    return { start, end }
  }, [currentDate, zoom, timelineItems])

  const days = useMemo(() => {
    return eachDayOfInterval({ start: timelineRange.start, end: timelineRange.end })
  }, [timelineRange])

  const getItemPosition = (item: TimelineItem) => {
    if (!item.startDate || days.length === 0) return { left: 0, width: 0 }

    const timelineStart = timelineRange.start.getTime()
    const timelineEnd = timelineRange.end.getTime()
    const timelineDuration = timelineEnd - timelineStart

    const itemStart = Math.max(item.startDate.getTime(), timelineStart)
    const itemEnd = Math.min(item.endDate?.getTime() || item.startDate.getTime(), timelineEnd)

    const left = ((itemStart - timelineStart) / timelineDuration) * 100
    const width = ((itemEnd - itemStart) / timelineDuration) * 100

    return { left: Math.max(0, left), width: Math.max(1, width) }
  }

  const dayWidth = 100 / days.length
  const rowHeight = 60

  const previousPeriod = () => {
    if (zoom === 'day') {
      setCurrentDate(addDays(currentDate, -1))
    } else if (zoom === 'week') {
      setCurrentDate(addDays(currentDate, -7))
    } else {
      setCurrentDate(addDays(currentDate, -30))
    }
  }

  const nextPeriod = () => {
    if (zoom === 'day') {
      setCurrentDate(addDays(currentDate, 1))
    } else if (zoom === 'week') {
      setCurrentDate(addDays(currentDate, 7))
    } else {
      setCurrentDate(addDays(currentDate, 30))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  if (!timelineColumn && !dateColumn) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-monday-darkLight rounded-xl shadow-monday border border-monday-border/30 dark:border-gray-700">
        <div className="text-center max-w-md p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-200 to-indigo-300 dark:from-indigo-900 dark:to-indigo-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-monday-text dark:text-white mb-2">No Timeline Column Found</h3>
          <p className="text-monday-textLight dark:text-gray-400">
            Add a timeline or date column to your board to use the Timeline view.
          </p>
        </div>
      </div>
    )
  }

  const maxRows = Math.max(...timelineItems.map((ti) => ti.row), 0) + 1

  return (
    <div className="flex flex-col h-full bg-white dark:bg-monday-darkLight rounded-xl shadow-monday border border-monday-border/30 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-monday-border dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-monday-darkLight dark:to-gray-900 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={previousPeriod}
            className="p-2 hover:bg-monday-background dark:hover:bg-gray-800 rounded-lg transition-all hover:scale-105 text-monday-text dark:text-white"
            title="Previous period"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-monday-text dark:text-white min-w-[250px] text-center">
            {zoom === 'day'
              ? format(currentDate, 'EEEE, MMMM d, yyyy')
              : zoom === 'week'
              ? `Week of ${format(startOfWeek(currentDate), 'MMM d')}`
              : format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={nextPeriod}
            className="p-2 hover:bg-monday-background dark:hover:bg-gray-800 rounded-lg transition-all hover:scale-105 text-monday-text dark:text-white"
            title="Next period"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom('day')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              zoom === 'day'
                ? 'bg-monday-primary text-white shadow-md'
                : 'bg-white dark:bg-monday-dark text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 border border-monday-border dark:border-gray-700'
            }`}
          >
            Day
          </button>
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
            onClick={goToToday}
            className="px-4 py-2 bg-monday-primary hover:bg-monday-primaryHover text-white text-sm font-medium rounded-lg transition-all hover:scale-105 shadow-sm ml-2"
          >
            Today
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="min-w-full">
          {/* Timeline header */}
          <div className="flex border-b border-monday-border dark:border-gray-700 sticky top-0 bg-white dark:bg-monday-darkLight z-10 shadow-sm">
            <div className="w-64 border-r border-monday-border dark:border-gray-700 p-3 font-semibold text-sm text-monday-text dark:text-white bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-monday-darkLight">
              Item
            </div>
            <div className="flex-1 relative" style={{ minWidth: `${days.length * 40}px` }}>
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

          {/* Timeline items */}
          <div className="relative" style={{ minHeight: `${maxRows * rowHeight}px` }}>
            {timelineItems.map((timelineItem) => {
              const { left, width } = getItemPosition(timelineItem)
              const top = timelineItem.row * rowHeight
              const isToday = timelineItem.startDate && isSameDay(timelineItem.startDate, new Date())

              return (
                <div key={timelineItem.item.id} className="absolute" style={{ top: `${top}px`, left: '256px', right: 0 }}>
                  <button
                    onClick={() => setSelectedItemId(timelineItem.item.id)}
                    className={`absolute top-2 h-10 rounded-lg px-3 text-xs flex items-center font-medium shadow-md hover:shadow-lg cursor-pointer transition-all ${
                      isToday
                        ? 'bg-monday-primary text-white hover:bg-monday-primaryHover'
                        : 'bg-monday-primaryLight dark:bg-monday-primary/30 text-monday-primary dark:text-monday-primary hover:bg-monday-primary/20 dark:hover:bg-monday-primary/40'
                    }`}
                    style={{
                      left: `calc(${left}% + 0px)`,
                      width: `${width}%`,
                      minWidth: '80px',
                    }}
                    title={`${timelineItem.item.name} - ${format(timelineItem.startDate!, 'MMM d')} to ${format(timelineItem.endDate || timelineItem.startDate!, 'MMM d')}`}
                  >
                    <span className="truncate">{timelineItem.item.name}</span>
                  </button>
                </div>
              )
            })}

            {/* Grid lines */}
            {days.map((day, index) => (
              <div
                key={`grid-${day.toISOString()}`}
                className="absolute border-l border-monday-border dark:border-gray-700"
                style={{
                  left: `calc(256px + ${index * dayWidth}%)`,
                  top: 0,
                  bottom: 0,
                }}
              />
            ))}

            {timelineItems.length === 0 && (
              <div className="text-center py-12 text-monday-textLight dark:text-gray-400" style={{ paddingLeft: '256px' }}>
                No items with dates found. Add dates to items to see them in the timeline.
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
