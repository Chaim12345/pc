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
  const { socket } = useSocket()
  const queryClient = useQueryClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [zoom, setZoom] = useState<'day' | 'week' | 'month'>('month')

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
  const rowHeight = 50

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

  if (!timelineColumn && !dateColumn) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500">No timeline or date column found. Please add a date or timeline column to use Timeline view.</p>
      </div>
    )
  }

  const maxRows = Math.max(...timelineItems.map((ti) => ti.row), 0) + 1

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={previousPeriod} className="px-3 py-1 text-gray-600 hover:text-gray-900">
            ←
          </button>
          <h2 className="text-lg font-semibold">
            {zoom === 'day'
              ? format(currentDate, 'EEEE, MMMM d, yyyy')
              : zoom === 'week'
              ? `Week of ${format(startOfWeek(currentDate), 'MMM d')}`
              : format(currentDate, 'MMMM yyyy')}
          </h2>
          <button onClick={nextPeriod} className="px-3 py-1 text-gray-600 hover:text-gray-900">
            →
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom('day')}
            className={`px-3 py-1 rounded text-sm ${
              zoom === 'day' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Day
          </button>
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
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Timeline header */}
          <div className="flex border-b sticky top-0 bg-white z-10">
            <div className="w-64 border-r p-2 font-semibold text-sm">Item</div>
            <div className="flex-1 relative" style={{ minWidth: `${days.length * 40}px` }}>
              {days.map((day, index) => {
                const isWeekend = day.getDay() === 0 || day.getDay() === 6
                const isToday = isSameDay(day, new Date())
                return (
                  <div
                    key={day.toISOString()}
                    className={`inline-block border-r text-xs p-1 text-center ${
                      isToday ? 'bg-primary-50 border-primary-300' : isWeekend ? 'bg-gray-50' : 'bg-white'
                    }`}
                    style={{ width: `${dayWidth}%` }}
                  >
                    <div className="font-medium">{format(day, 'd')}</div>
                    <div className="text-gray-500">{format(day, 'EEE')}</div>
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

              return (
                <div key={timelineItem.item.id} className="absolute" style={{ top: `${top}px`, left: '256px', right: 0 }}>
                  <div
                    className="absolute top-2 h-8 rounded px-2 text-xs flex items-center bg-primary-200 text-primary-800 hover:bg-primary-300 cursor-pointer shadow-sm"
                    style={{
                      left: `calc(${left}% + 0px)`,
                      width: `${width}%`,
                      minWidth: '80px',
                    }}
                    title={`${timelineItem.item.name} - ${format(timelineItem.startDate!, 'MMM d')} to ${format(timelineItem.endDate || timelineItem.startDate!, 'MMM d')}`}
                  >
                    <span className="truncate">{timelineItem.item.name}</span>
                  </div>
                </div>
              )
            })}

            {/* Grid lines */}
            {days.map((day, index) => (
              <div
                key={`grid-${day.toISOString()}`}
                className="absolute border-l border-gray-200"
                style={{
                  left: `calc(256px + ${(index * dayWidth)}%)`,
                  top: 0,
                  bottom: 0,
                }}
              />
            ))}

            {timelineItems.length === 0 && (
              <div className="text-center py-12 text-gray-500" style={{ paddingLeft: '256px' }}>
                No items with dates found. Add dates to items to see them in the timeline.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



