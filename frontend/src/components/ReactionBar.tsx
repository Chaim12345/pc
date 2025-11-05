import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import ReactionPicker from './ReactionPicker'

interface ReactionBarProps {
  commentId?: string
  itemId?: string
}

interface GroupedReaction {
  emoji: string
  count: number
  users: string[]
  reactionIds: string[]
}

export default function ReactionBar({ commentId, itemId }: ReactionBarProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showPicker, setShowPicker] = useState(false)

  const queryKey = commentId
    ? ['reactions', 'comment', commentId]
    : ['reactions', 'item', itemId]

  const endpoint = commentId
    ? `/reactions/comment/${commentId}`
    : `/reactions/item/${itemId}`

  // Fetch reactions
  const { data: reactionsData } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await api.get(endpoint)
      return response.data.data
    },
    enabled: !!(commentId || itemId),
  })

  // Toggle reaction mutation
  const toggleReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      const response = await api.post('/reactions/toggle', {
        emoji,
        commentId,
        itemId,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const reactions: GroupedReaction[] = reactionsData?.reactions || []
  const currentUserReactions = reactionsData?.currentUserReactions || []

  const handleToggleReaction = (emoji: string) => {
    toggleReactionMutation.mutate(emoji)
  }

  const userHasReacted = (emoji: string) => {
    return currentUserReactions.some((r: any) => r.emoji === emoji)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap relative">
      {reactions.map((reaction: GroupedReaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleToggleReaction(reaction.emoji)}
          className={`
            flex items-center gap-1 px-2 py-1 rounded-full text-sm border transition-all
            ${
              userHasReacted(reaction.emoji)
                ? 'bg-monday-primary/10 border-monday-primary text-monday-primary'
                : 'bg-monday-background dark:bg-gray-800 border-monday-border dark:border-gray-700 text-monday-text dark:text-white hover:border-monday-primary'
            }
          `}
          title={`${reaction.count} ${reaction.count === 1 ? 'reaction' : 'reactions'}`}
        >
          <span className="text-base leading-none">{reaction.emoji}</span>
          <span className="text-xs font-medium">{reaction.count}</span>
        </button>
      ))}

      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-monday-border dark:border-gray-700 bg-monday-background dark:bg-gray-800 text-monday-textLight hover:border-monday-primary hover:text-monday-primary transition-all"
          title="Add reaction"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {showPicker && (
          <ReactionPicker
            onSelect={handleToggleReaction}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    </div>
  )
}

