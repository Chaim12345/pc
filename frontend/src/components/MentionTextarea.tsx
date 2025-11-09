import React, { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface MentionTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  boardId?: string
  onMention?: (userId: string) => void
}

export default function MentionTextarea({
  value,
  onChange,
  placeholder,
  className = '',
  boardId,
  onMention,
}: MentionTextareaProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [suggestionIndex, setSuggestionIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Fetch users in organization for mentions
  const { data: orgUsers } = useQuery<User[]>({
    queryKey: ['users', 'organization'],
    queryFn: async () => {
      const response = await api.get('/users')
      return response.data.data || []
    },
    enabled: true, // Always enabled since we want org users
  })

  const users: User[] = orgUsers || []

  // Filter users based on mention query
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  // Handle textarea input
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart

    onChange(newValue)
    setCursorPosition(cursorPos)

    // Check if user is typing @ mention
    const textBeforeCursor = newValue.slice(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1])
      setShowSuggestions(true)
      setSuggestionIndex(0)
    } else {
      setShowSuggestions(false)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || filteredUsers.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSuggestionIndex((prev) => Math.min(prev + 1, filteredUsers.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSuggestionIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (showSuggestions) {
        e.preventDefault()
        insertMention(filteredUsers[suggestionIndex])
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Insert mention into textarea
  const insertMention = (user: User) => {
    const textBeforeCursor = value.slice(0, cursorPosition)
    const textAfterCursor = value.slice(cursorPosition)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      const mentionStart = textBeforeCursor.lastIndexOf('@')
      const newText =
        textBeforeCursor.slice(0, mentionStart) +
        `@${user.name} ` +
        textAfterCursor

      onChange(newText)
      setShowSuggestions(false)
      onMention?.(user.id)

      // Set cursor position after mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = mentionStart + user.name.length + 2
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
          textareaRef.current.focus()
        }
      }, 0)
    }
  }

  // Calculate suggestion box position
  const getSuggestionPosition = () => {
    if (!textareaRef.current) return { top: 0, left: 0 }

    const textarea = textareaRef.current
    const textBeforeCursor = value.slice(0, cursorPosition)
    const lines = textBeforeCursor.split('\n')
    const currentLine = lines.length - 1
    const lineHeight = 24 // Approximate line height
    const top = (currentLine + 1) * lineHeight

    return { top, left: 0 }
  }

  const suggestionPosition = getSuggestionPosition()

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />

      {showSuggestions && filteredUsers.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto"
          style={{
            top: `${suggestionPosition.top}px`,
            left: `${suggestionPosition.left}px`,
            minWidth: '250px',
          }}
        >
          {filteredUsers.map((user, index) => (
            <button
              key={user.id}
              onClick={() => insertMention(user)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                index === suggestionIndex
                  ? 'bg-monday-primary text-white'
                  : 'hover:bg-monday-background dark:hover:bg-gray-800'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-monday-blue to-monday-purple flex items-center justify-center text-white font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`font-medium truncate ${
                    index === suggestionIndex
                      ? 'text-white'
                      : 'text-monday-text dark:text-white'
                  }`}
                >
                  {user.name}
                </div>
                <div
                  className={`text-sm truncate ${
                    index === suggestionIndex
                      ? 'text-white/80'
                      : 'text-monday-textLight dark:text-gray-400'
                  }`}
                >
                  {user.email}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

