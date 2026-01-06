import React, { useState, useEffect, useRef, memo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Comment, User, SocketEvent } from '@monday-clone/shared'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { format } from 'date-fns'
import ConfirmationDialog from './ConfirmationDialog'
import MentionTextarea from './MentionTextarea'
import ReactionBar from './ReactionBar'

interface CommentPanelProps {
  itemId: string
  boardId: string
  isOpen: boolean
  onClose?: () => void
  embedded?: boolean
}

export default function CommentPanel({ itemId, boardId, isOpen, onClose, embedded = false }: CommentPanelProps) {
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const queryClient = useQueryClient()
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null)

  // Fetch users for mention extraction
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users', 'organization'],
    queryFn: async () => {
      const response = await api.get('/users')
      return response.data.data || []
    },
    enabled: isOpen,
  })

  // Create a map of user names to IDs for mention extraction
  const userNameToIdMap = new Map<string, string>()
  users.forEach((u) => {
    userNameToIdMap.set(u.name.toLowerCase(), u.id)
  })

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ['comments', itemId],
    queryFn: async () => {
      const response = await api.get(`/comments/item/${itemId}`)
      return response.data.data
    },
    enabled: isOpen && !!itemId,
  })

  const createCommentMutation = useMutation({
    mutationFn: async ({ text, parentId, mentions }: { text: string; parentId?: string; mentions?: string[] }) => {
      const response = await api.post('/comments', {
        itemId,
        text,
        parentId,
        mentions,
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', itemId] })
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      setNewComment('')
      if (socket && isConnected) {
        socket.emit(SocketEvent.COMMENT_ADDED, { boardId, itemId })
      }
    },
  })

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, text }: { commentId: string; text: string }) => {
      const response = await api.put(`/comments/${commentId}`, { text })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', itemId] })
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await api.delete(`/comments/${commentId}`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', itemId] })
    },
  })

  useEffect(() => {
    if (!socket) return

    const handleCommentCreated = (data: any) => {
      if (data.itemId === itemId) {
        queryClient.invalidateQueries({ queryKey: ['comments', itemId] })
      }
    }

    socket.on(SocketEvent.COMMENT_CREATED, handleCommentCreated)

    return () => {
      socket.off(SocketEvent.COMMENT_CREATED, handleCommentCreated)
    }
  }, [socket, itemId, queryClient])

  // Extract user IDs from mentions in text
  const extractMentions = (text: string): string[] => {
    const mentions: string[] = []
    // Match @Name patterns - improved regex to match full names with spaces
    // Matches @ followed by one or more words (letters, numbers, spaces) until punctuation or end
    const mentionRegex = /@([A-Za-z][A-Za-z0-9\s]+?)(?=\s|$|,|\.|!|\?|:|@)/g
    let match
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionedName = match[1].trim()
      // Try to find user by name (case-insensitive)
      const userId = userNameToIdMap.get(mentionedName.toLowerCase())
      if (userId) {
        mentions.push(userId)
      } else {
        // Also try partial matches for names with spaces
        // If "@John Doe" doesn't match, try "John" and "Doe" separately
        const nameParts = mentionedName.split(/\s+/)
        for (const part of nameParts) {
          const partUserId = userNameToIdMap.get(part.toLowerCase())
          if (partUserId && !mentions.includes(partUserId)) {
            mentions.push(partUserId)
          }
        }
      }
    }
    
    return [...new Set(mentions)] // Remove duplicates
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const mentions = extractMentions(newComment)

    createCommentMutation.mutate({
      text: newComment,
      mentions,
    })
  }

  const handleReplySubmit = (parentId: string) => {
    if (!replyText.trim()) return

    const mentions = extractMentions(replyText)

    createCommentMutation.mutate({
      text: replyText,
      parentId,
      mentions,
    })
    setReplyingTo(null)
    setReplyText('')
  }

  const CommentItem = memo(({ comment, level = 0, currentUserId }: { comment: Comment; level?: number; currentUserId?: string }) => {
    const isAuthor = comment.userId === currentUserId
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(comment.text)

    return (
      <div className={`mb-4 ${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
              {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-gray-900">{comment.user?.name || 'Unknown'}</span>
              <span className="text-xs text-gray-500">{format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}</span>
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      updateCommentMutation.mutate({ commentId: comment.id, text: editText })
                      setIsEditing(false)
                    }}
                    className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditText(comment.text)
                    }}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-monday-text dark:text-white whitespace-pre-wrap comment-text">
                {comment.text.split(/(@[A-Za-z][A-Za-z0-9\s]*?)(?=\s|$|,|\.|!|\?|:)/g).map((part, idx) => {
                  if (part.startsWith('@')) {
                    return (
                      <span key={idx} className="text-monday-primary dark:text-monday-primary font-semibold bg-monday-primaryLight/20 dark:bg-monday-primary/20 px-1 rounded">
                        {part}
                      </span>
                    )
                  }
                  return <span key={idx}>{part}</span>
                })}
              </div>
            )}
            <div className="flex items-center space-x-4 mt-2">
              {!isEditing && (
                <>
                  <button
                    onClick={() => {
                      setReplyingTo(replyingTo === comment.id ? null : comment.id)
                      setReplyText('')
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Reply
                  </button>
                  {isAuthor && (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteCommentId(comment.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
            {!isEditing && (
              <div className="mt-2">
                <ReactionBar commentId={comment.id} />
              </div>
            )}
            {replyingTo === comment.id && (
              <div className="mt-3 ml-4">
                <MentionTextarea
                  value={replyText}
                  onChange={setReplyText}
                  placeholder="Write a reply... Use @username to mention someone"
                  className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary focus:border-transparent resize-none"
                  boardId={boardId}
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => handleReplySubmit(comment.id)}
                    className="px-3 py-1 bg-monday-primary text-white rounded-lg text-sm hover:bg-monday-primaryHover transition-all"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyText('')
                    }}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4">
                {comment.replies.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} level={level + 1} currentUserId={currentUserId} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  })

  CommentItem.displayName = 'CommentItem'

  if (!isOpen) return null

  const content = (
    <>
      <div className={`${embedded ? 'flex-1 overflow-y-auto p-4' : 'flex-1 overflow-y-auto p-4'}`}>
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {comments.length === 0 
            ? 'No comments' 
            : `${comments.length} comment${comments.length !== 1 ? 's' : ''}`}
        </div>
        {comments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No comments yet. Be the first to comment!</div>
        ) : (
          <div>{comments.map((comment) => <CommentItem key={comment.id} comment={comment} currentUserId={user?.id} />)}</div>
        )}
      </div>
      <div className="p-4 border-t border-monday-border dark:border-gray-700">
        <form onSubmit={handleSubmit}>
          <MentionTextarea
            value={newComment}
            onChange={setNewComment}
            placeholder="Add a comment... Use @username to mention someone"
            className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary focus:border-transparent resize-none"
            boardId={boardId}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!newComment.trim() || createCommentMutation.isPending}
              className="px-4 py-2 bg-monday-primary text-white rounded-lg font-medium hover:bg-monday-primaryHover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      </div>
    </>
  )

  if (embedded) {
    return <div className="flex flex-col h-full">{content}</div>
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Comments</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          )}
        </div>
        {content}
      </div>
      
      <ConfirmationDialog
        isOpen={!!deleteCommentId}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (deleteCommentId) {
            deleteCommentMutation.mutate(deleteCommentId)
            setDeleteCommentId(null)
          }
        }}
        onCancel={() => setDeleteCommentId(null)}
      />
    </div>
  )
}

