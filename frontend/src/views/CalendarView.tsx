import React, { useState, useMemo } from 'react'
import { Board, Item, Column } from '@monday-clone/shared'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from 'date-fns'
import ItemDetailModal from '../components/ItemDetailModal'

interface CalendarViewProps {
  board: Board
}

export default function CalendarView({ board }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  // Find date column
  const dateColumn = board.columns?.find((col) => col.type === 'DATE')

  const itemsWithDates = useMemo(() => {
    if (!dateColumn || !board.groups) return []

    const items: Array<{ item: Item; date: Date }> = []

    board.groups.forEach((group) => {
      group.items?.forEach((item) => {
        const columnValue = item.columnValues?.find((cv) => cv.columnId === dateColumn.id)
        const dateValue = columnValue?.value

        if (dateValue) {
          items.push({
            item,
            date: new Date(dateValue),
          })
        }
      })
    })

    return items
  }, [board.groups, dateColumn])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const daysInMonth = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getItemsForDate = (date: Date) => {
    return itemsWithDates.filter(({ date: itemDate }) => isSameDay(itemDate, date))
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  if (!dateColumn) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-monday-darkLight rounded-xl shadow-monday border border-monday-border/30 dark:border-gray-700">
        <div className="text-center max-w-md p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-900 dark:to-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-monday-text dark:text-white mb-2">No Date Column Found</h3>
          <p className="text-monday-textLight dark:text-gray-400">
            Add a date column to your board to use the Calendar view.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-monday-darkLight rounded-xl shadow-monday border border-monday-border/30 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-monday-border dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-monday-darkLight dark:to-gray-900">
        <div className="flex items-center gap-3">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-monday-background dark:hover:bg-gray-800 rounded-lg transition-all hover:scale-105 text-monday-text dark:text-white"
            title="Previous month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-monday-text dark:text-white min-w-[200px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-monday-background dark:hover:bg-gray-800 rounded-lg transition-all hover:scale-105 text-monday-text dark:text-white"
            title="Next month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-4 py-2 bg-monday-primary hover:bg-monday-primaryHover text-white text-sm font-medium rounded-lg transition-all hover:scale-105 shadow-sm"
        >
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="grid grid-cols-7 h-full min-h-[600px]">
          {/* Weekday Headers */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-monday-darkLight border-r border-b border-monday-border dark:border-gray-700 p-3 text-center"
            >
              <div className="text-xs font-bold text-monday-textLight dark:text-gray-400 uppercase tracking-wider">
                {day}
              </div>
            </div>
          ))}

          {/* Calendar Days */}
          {daysInMonth.map((day) => {
            const itemsForDay = getItemsForDate(day)
            const isToday = isSameDay(day, new Date())
            const isCurrentMonthDay = isCurrentMonth(day)
            const isWeekend = day.getDay() === 0 || day.getDay() === 6

            return (
              <div
                key={day.toISOString()}
                className={`border-r border-b border-monday-border dark:border-gray-700 p-2 min-h-[100px] transition-all ${
                  isCurrentMonthDay
                    ? 'bg-white dark:bg-monday-darkLight hover:bg-monday-background dark:hover:bg-gray-800'
                    : 'bg-gray-50 dark:bg-gray-900/50 opacity-60'
                } ${isToday ? 'ring-2 ring-monday-primary dark:ring-monday-primary' : ''}`}
              >
                <div
                  className={`text-sm font-semibold mb-2 ${
                    isToday
                      ? 'text-monday-primary dark:text-monday-primary'
                      : isCurrentMonthDay
                      ? 'text-monday-text dark:text-white'
                      : 'text-monday-textLight dark:text-gray-500'
                  }`}
                >
                  {isToday ? (
                    <span className="inline-flex items-center justify-center w-7 h-7 bg-monday-primary text-white rounded-full">
                      {format(day, 'd')}
                    </span>
                  ) : (
                    format(day, 'd')
                  )}
                </div>
                <div className="space-y-1">
                  {itemsForDay.slice(0, 3).map(({ item }) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className="w-full text-left text-xs bg-monday-primaryLight dark:bg-monday-primary/20 text-monday-primary dark:text-monday-primary px-2 py-1 rounded truncate hover:bg-monday-primary/20 dark:hover:bg-monday-primary/30 transition-all cursor-pointer"
                      title={item.name}
                    >
                      {item.name}
                    </button>
                  ))}
                  {itemsForDay.length > 3 && (
                    <div className="text-xs text-monday-textLight dark:text-gray-400 px-2 py-1">
                      +{itemsForDay.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
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
