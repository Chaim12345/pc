import React, { useState, useRef, useEffect } from 'react'

interface ReactionPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

const EMOJI_OPTIONS = ['👍', '❤️', '😊', '🎉', '👀', '🚀', '✅', '💯', '🔥', '👏']

export default function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full mb-2 left-0 bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-lg shadow-2xl p-2 grid grid-cols-5 gap-1 z-50"
    >
      {EMOJI_OPTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onSelect(emoji)
            onClose()
          }}
          className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-monday-background dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

