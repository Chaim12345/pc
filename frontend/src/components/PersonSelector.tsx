import React, { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { User } from '@monday-clone/shared'

interface PersonSelectorProps {
  value?: string | User
  onChange: (person: User | null) => void
  boardId: string
}

export default function PersonSelector({ value, onChange, boardId }: PersonSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: members } = useQuery<User[]>({
    queryKey: ['board-members', boardId],
    queryFn: async () => {
      const response = await api.get(`/boards/${boardId}/members`)
      return response.data.data
    },
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedPerson = typeof value === 'string' 
    ? members?.find(m => m.id === value)
    : value

  const filteredMembers = members?.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-monday-blue',
      'bg-monday-purple',
      'bg-monday-green',
      'bg-monday-orange',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium bg-white dark:bg-monday-dark border-2 border-gray-200 dark:border-gray-700 hover:border-monday-primary dark:hover:border-monday-primary transition-all hover:scale-105 min-w-[140px]"
      >
        {selectedPerson ? (
          <>
            <div className={`w-6 h-6 rounded-full ${getAvatarColor(selectedPerson.name)} flex items-center justify-center text-white text-xs font-bold`}>
              {getInitials(selectedPerson.name)}
            </div>
            <span className="text-monday-text dark:text-white truncate max-w-[100px]">
              {selectedPerson.name}
            </span>
          </>
        ) : (
          <>
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-gray-500">Assign</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-monday-darkLight rounded-lg shadow-monday-hover border border-monday-border dark:border-gray-700 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-monday-textLight dark:text-gray-500 uppercase mb-2">
              Assign Person
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team members..."
              className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-monday-primary text-sm text-monday-text dark:text-white bg-white dark:bg-monday-dark placeholder-gray-400"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    onChange(member)
                    setIsOpen(false)
                    setSearchQuery('')
                  }}
                  className="w-full px-3 py-2 flex items-center space-x-3 hover:bg-monday-background dark:hover:bg-gray-800 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full ${getAvatarColor(member.name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {getInitials(member.name)}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-monday-text dark:text-white">
                      {member.name}
                    </div>
                    <div className="text-xs text-monday-textLight dark:text-gray-400">
                      {member.email}
                    </div>
                  </div>
                  {selectedPerson?.id === member.id && (
                    <svg className="w-5 h-5 text-monday-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-sm text-monday-textLight dark:text-gray-500">
                No team members found
              </div>
            )}
          </div>

          {selectedPerson && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2">
              <button
                onClick={() => {
                  onChange(null)
                  setIsOpen(false)
                  setSearchQuery('')
                }}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-medium"
              >
                Unassign
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


