import React, { useState, useMemo } from 'react'
import { Board, Item, Column } from '@monday-clone/shared'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'

interface CalendarViewProps {
  board: Board
}

export default function CalendarView({ board }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

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
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getItemsForDate = (date: Date) => {
    return itemsWithDates.filter(({ date: itemDate }) => isSameDay(itemDate, date))
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={previousMonth}
          className="px-3 py-1 text-gray-600 hover:text-gray-900"
        >
          ← Prev
        </button>
        <h2 className="text-lg font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
        <button
          onClick={nextMonth}
          className="px-3 py-1 text-gray-600 hover:text-gray-900"
        >
          Next →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {weekDays.map((day) => (
          <div key={day} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-600">
            {day}
          </div>
        ))}

        {daysInMonth.map((day, index) => {
          const itemsForDay = getItemsForDate(day)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toISOString()}
              className={`bg-white min-h-[100px] p-2 ${
                index === 0 ? 'col-start-' + (day.getDay() + 1) : ''
              }`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  isToday ? 'text-primary-600 font-bold' : 'text-gray-700'
                }`}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {itemsForDay.map(({ item }) => (
                  <div
                    key={item.id}
                    className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded truncate"
                  >
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

