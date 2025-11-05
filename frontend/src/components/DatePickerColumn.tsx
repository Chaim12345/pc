import React, { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'

interface DatePickerColumnProps {
  value?: string | Date
  onChange: (date: Date | null) => void
}

export default function DatePickerColumn({ value, onChange }: DatePickerColumnProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : null
    setSelectedDate(newDate)
    onChange(newDate)
    setIsOpen(false)
  }

  const handleQuickDate = (days: number) => {
    const newDate = new Date()
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
    onChange(newDate)
    setIsOpen(false)
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium bg-white dark:bg-monday-dark border-2 border-gray-200 dark:border-gray-700 hover:border-monday-primary dark:hover:border-monday-primary transition-all hover:scale-105 min-w-[130px]"
      >
        <svg className="w-4 h-4 text-monday-textLight" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className={selectedDate ? 'text-monday-text dark:text-white' : 'text-gray-500'}>
          {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Set Date'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-monday-darkLight rounded-lg shadow-monday-hover border border-monday-border dark:border-gray-700 z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="mb-3">
            <label className="block text-xs font-semibold text-monday-textLight dark:text-gray-500 uppercase mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-monday-primary text-monday-text dark:text-white bg-white dark:bg-monday-dark"
            />
          </div>

          <div className="mb-3">
            <div className="text-xs font-semibold text-monday-textLight dark:text-gray-500 uppercase mb-2">
              Quick Select
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickDate(0)}
                className="px-3 py-2 text-sm bg-monday-background dark:bg-monday-dark hover:bg-monday-primaryLight dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => handleQuickDate(1)}
                className="px-3 py-2 text-sm bg-monday-background dark:bg-monday-dark hover:bg-monday-primaryLight dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Tomorrow
              </button>
              <button
                onClick={() => handleQuickDate(7)}
                className="px-3 py-2 text-sm bg-monday-background dark:bg-monday-dark hover:bg-monday-primaryLight dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                In 1 Week
              </button>
              <button
                onClick={() => handleQuickDate(30)}
                className="px-3 py-2 text-sm bg-monday-background dark:bg-monday-dark hover:bg-monday-primaryLight dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                In 1 Month
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <button
              onClick={() => {
                setSelectedDate(null)
                onChange(null)
                setIsOpen(false)
              }}
              className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-medium"
            >
              Clear Date
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


