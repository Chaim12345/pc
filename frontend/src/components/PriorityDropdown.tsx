import React, { useState, useRef, useEffect } from 'react'

interface PriorityOption {
  id: string
  label: string
  icon: string
  color: string
  bgColor: string
}

const PRIORITY_OPTIONS: PriorityOption[] = [
  { id: 'critical', label: 'Critical', icon: '🔥', color: 'text-white', bgColor: 'bg-red-600' },
  { id: 'high', label: 'High', icon: '⬆️', color: 'text-white', bgColor: 'bg-orange-500' },
  { id: 'medium', label: 'Medium', icon: '➡️', color: 'text-white', bgColor: 'bg-blue-500' },
  { id: 'low', label: 'Low', icon: '⬇️', color: 'text-white', bgColor: 'bg-gray-400' },
]

interface PriorityDropdownProps {
  value?: string
  onChange: (priority: PriorityOption) => void
}

export default function PriorityDropdown({ value, onChange }: PriorityDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedPriority = PRIORITY_OPTIONS.find(p => p.label === value || p.id === value) || null

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

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium transition-all hover:scale-105 hover:shadow-md min-w-[110px] ${
          selectedPriority
            ? `${selectedPriority.bgColor} ${selectedPriority.color}`
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        {selectedPriority && <span className="mr-1.5">{selectedPriority.icon}</span>}
        {selectedPriority ? selectedPriority.label : 'Priority'}
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-monday-darkLight rounded-lg shadow-monday-hover border border-monday-border dark:border-gray-700 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 text-xs font-semibold text-monday-textLight dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-700">
            Set Priority
          </div>
          
          <div className="py-1">
            {PRIORITY_OPTIONS.map((priority) => (
              <button
                key={priority.id}
                onClick={() => {
                  onChange(priority)
                  setIsOpen(false)
                }}
                className="w-full px-3 py-2 flex items-center space-x-3 hover:bg-monday-background dark:hover:bg-gray-800 transition-colors"
              >
                <span className={`flex-1 flex items-center px-3 py-1 rounded-md text-sm font-medium ${priority.bgColor} ${priority.color}`}>
                  <span className="mr-2">{priority.icon}</span>
                  {priority.label}
                </span>
                {selectedPriority?.id === priority.id && (
                  <svg className="w-5 h-5 text-monday-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2">
            <button
              onClick={() => {
                onChange({ id: '', label: '', icon: '', color: '', bgColor: '' })
                setIsOpen(false)
              }}
              className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-medium"
            >
              Clear Priority
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


