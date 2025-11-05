import React, { useState, useRef, useEffect } from 'react'

export interface StatusOption {
  id: string
  label: string
  color?: string
}

const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
  { id: '1', label: 'Working on it', color: '#FDAB3D' },
  { id: '2', label: 'Done', color: '#00C875' },
  { id: '3', label: 'Stuck', color: '#E2445C' },
  { id: '4', label: 'Waiting', color: '#A25DDC' },
  { id: '5', label: 'Not Started', color: '#C5C7D0' },
]

interface StatusDropdownProps {
  value?: any
  options?: StatusOption[]
  onChange: (status: StatusOption | null) => void
  itemName?: string
}

function hexToRgb(hex?: string) {
  if (!hex) return null
  const sanitized = hex.replace('#', '')
  if (sanitized.length !== 6) return null
  const bigint = parseInt(sanitized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return { r, g, b }
}

function getContrastingTextColor(hex?: string) {
  const rgb = hexToRgb(hex)
  if (!rgb) {
    return '#111827'
  }
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.6 ? '#111827' : '#FFFFFF'
}

export default function StatusDropdown({ value, onChange, itemName, options }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const availableOptions = options && options.length ? options : DEFAULT_STATUS_OPTIONS

  const valueId = typeof value === 'object' && value !== null ? value.id : value
  const valueLabel = typeof value === 'object' && value !== null ? value.label : value

  const selectedStatus = availableOptions.find((s) => {
    if (!value) return false
    return s.id === valueId || s.label === valueLabel
  }) || null

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
        className={`flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 hover:shadow-md min-w-[140px] ${
          selectedStatus
            ? 'text-white'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
        style={selectedStatus ? { backgroundColor: selectedStatus.color, color: getContrastingTextColor(selectedStatus.color) } : undefined}
      >
        {selectedStatus ? selectedStatus.label : 'Set Status'}
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-monday-darkLight rounded-lg shadow-monday-hover border border-monday-border dark:border-gray-700 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 text-xs font-semibold text-monday-textLight dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-700">
            Select Status{itemName && ` for ${itemName}`}
          </div>
          
          <div className="py-1">
            {availableOptions.map((status) => (
              <button
                key={status.id}
                onClick={() => {
                  onChange(status)
                  setIsOpen(false)
                }}
                className="w-full px-3 py-2 flex items-center space-x-3 hover:bg-monday-background dark:hover:bg-gray-800 transition-colors group"
              >
                <span
                  className="flex-1 flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium group-hover:scale-105 transition-transform"
                  style={{
                    backgroundColor: status.color || '#9CA3AF',
                    color: getContrastingTextColor(status.color),
                  }}
                >
                  {status.label}
                </span>
                {selectedStatus?.id === status.id && (
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
                onChange(null)
                setIsOpen(false)
              }}
              className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-medium"
            >
              Clear Status
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


