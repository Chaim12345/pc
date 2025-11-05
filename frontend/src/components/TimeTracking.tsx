import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TimeEntry } from '@monday-clone/shared'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { format } from 'date-fns'
import ConfirmationDialog from './ConfirmationDialog'

interface TimeTrackingProps {
  itemId: string
  boardId: string
}

export default function TimeTracking({ itemId, boardId }: TimeTrackingProps) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [manualHours, setManualHours] = useState('')
  const [manualDescription, setManualDescription] = useState('')
  const [showManualForm, setShowManualForm] = useState(false)
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null)

  const { data: entries = [] } = useQuery<TimeEntry[]>({
    queryKey: ['timeEntries', itemId],
    queryFn: async () => {
      const response = await api.get(`/time-tracking/item/${itemId}`)
      return response.data.data
    },
  })

  const activeEntry = entries.find((e) => e.userId === user?.id && !e.endTime)

  const startTimerMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/time-tracking/start', { itemId })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries', itemId] })
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })

  const stopTimerMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const response = await api.post(`/time-tracking/stop/${entryId}`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries', itemId] })
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })

  const createManualMutation = useMutation({
    mutationFn: async ({ duration, description }: { duration: number; description?: string }) => {
      const response = await api.post('/time-tracking/manual', {
        itemId,
        duration,
        description,
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries', itemId] })
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      setManualHours('')
      setManualDescription('')
      setShowManualForm(false)
    },
  })

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const response = await api.delete(`/time-tracking/${entryId}`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries', itemId] })
    },
  })

  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (!activeEntry) {
      setElapsedTime(0)
      return
    }

    const interval = setInterval(() => {
      const start = new Date(activeEntry.startTime).getTime()
      const now = Date.now()
      setElapsedTime(Math.floor((now - start) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [activeEntry])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m ${secs}s`
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const hours = parseFloat(manualHours)
    if (isNaN(hours) || hours <= 0) {
      showToast('Please enter a valid number of hours', 'error')
      return
    }
    createManualMutation.mutate({
      duration: hours * 3600,
      description: manualDescription || undefined,
    })
    showToast('Time entry added successfully', 'success')
  }

  let totalTime = entries.reduce((sum, entry) => {
    if (entry.duration) return sum + entry.duration
    if (entry.endTime) {
      const start = new Date(entry.startTime).getTime()
      const end = new Date(entry.endTime).getTime()
      return sum + Math.floor((end - start) / 1000)
    }
    return sum
  }, 0)

  if (activeEntry) {
    totalTime += elapsedTime
  }

  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Time Tracking</h3>
        <div className="text-sm text-gray-600">Total: {formatDuration(totalTime)}</div>
      </div>

      {activeEntry ? (
        <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg mb-4">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">Timer Running</div>
            <div className="text-lg font-bold text-blue-600">{formatDuration(elapsedTime)}</div>
          </div>
          <button
            onClick={() => stopTimerMutation.mutate(activeEntry.id)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Stop
          </button>
        </div>
      ) : (
        <button
          onClick={() => startTimerMutation.mutate()}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 mb-4"
        >
          Start Timer
        </button>
      )}

      {!showManualForm ? (
        <button
          onClick={() => setShowManualForm(true)}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 mb-4"
        >
          Add Manual Entry
        </button>
      ) : (
        <form onSubmit={handleManualSubmit} className="mb-4 p-3 border border-gray-300 rounded-lg">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
            <input
              type="number"
              step="0.25"
              min="0"
              value={manualHours}
              onChange={(e) => setManualHours(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
              required
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              value={manualDescription}
              onChange={(e) => setManualDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={2}
              placeholder="What did you work on?"
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={createManualMutation.isPending}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
            >
              {createManualMutation.isPending ? 'Adding...' : 'Add Entry'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowManualForm(false)
                setManualHours('')
                setManualDescription('')
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {entries.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase">Recent Entries</div>
          {entries.slice(0, 5).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex-1">
                <div className="text-sm text-gray-900">{entry.user?.name || 'Unknown'}</div>
                {entry.description && (
                  <div className="text-xs text-gray-500">{entry.description}</div>
                )}
                <div className="text-xs text-gray-400">
                  {format(new Date(entry.startTime), 'MMM d, yyyy h:mm a')}
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {formatDuration(entry.duration || 0)}
              </div>
              {entry.userId === user?.id && (
                <button
                  onClick={() => setDeleteEntryId(entry.id)}
                  className="ml-2 text-red-600 hover:text-red-700 text-xs"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      <ConfirmationDialog
        isOpen={!!deleteEntryId}
        title="Delete Time Entry"
        message="Are you sure you want to delete this time entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (deleteEntryId) {
            deleteEntryMutation.mutate(deleteEntryId)
            setDeleteEntryId(null)
          }
        }}
        onCancel={() => setDeleteEntryId(null)}
      />
    </div>
  )
}

