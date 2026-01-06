import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'
import RecurringTaskForm from './RecurringTaskForm'
import ConfirmationDialog from './ConfirmationDialog'

interface RecurringTask {
  id: string
  boardId: string
  groupId: string
  itemTemplate: any
  frequency: 'daily' | 'weekly' | 'monthly'
  interval: number
  daysOfWeek?: number[]
  dayOfMonth?: number
  startDate: string
  endDate?: string
  nextRunDate: string
  lastRunDate?: string
  isActive: boolean
  createdAt: string
}

interface Props {
  boardId: string
  groupId?: string
  isOpen: boolean
  onClose: () => void
}

export default function RecurringTasksModal({ boardId, groupId, isOpen, onClose }: Props) {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null)
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)

  const { data: recurringTasks, isLoading } = useQuery<RecurringTask[]>({
    queryKey: ['recurring-tasks', boardId],
    queryFn: async () => {
      const response = await api.get(`/recurring-tasks/board/${boardId}`)
      return response.data.data
    },
    enabled: isOpen && !!boardId
  })

  const { data: groups } = useQuery({
    queryKey: ['groups', boardId],
    queryFn: async () => {
      const response = await api.get(`/groups/board/${boardId}`)
      return response.data.data
    },
    enabled: isOpen && !!boardId
  })

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/recurring-tasks/${taskId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks', boardId] })
      showToast('Recurring task deleted', 'success')
      setDeleteTaskId(null)
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to delete task', 'error')
    }
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ taskId, isActive }: { taskId: string; isActive: boolean }) => {
      await api.patch(`/recurring-tasks/${taskId}`, { isActive })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks', boardId] })
      showToast('Task status updated', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to update task', 'error')
    }
  })

  const runNowMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await api.post(`/recurring-tasks/${taskId}/run`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks', boardId] })
      showToast('Task executed successfully', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to run task', 'error')
    }
  })

  const getFrequencyLabel = (task: RecurringTask) => {
    let label = `Every `
    if (task.interval > 1) {
      label += `${task.interval} `
    }
    
    switch (task.frequency) {
      case 'daily':
        label += task.interval === 1 ? 'day' : 'days'
        break
      case 'weekly':
        label += task.interval === 1 ? 'week' : 'weeks'
        if (task.daysOfWeek && task.daysOfWeek.length > 0) {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          label += ` on ${task.daysOfWeek.map(d => days[d]).join(', ')}`
        }
        break
      case 'monthly':
        label += task.interval === 1 ? 'month' : 'months'
        if (task.dayOfMonth) {
          label += ` on day ${task.dayOfMonth}`
        }
        break
    }
    
    return label
  }

  const getNextRuns = (task: RecurringTask, count: number = 5) => {
    const dates = []
    const startDate = new Date(task.nextRunDate)
    const currentDate = new Date(startDate)
    
    for (let i = 0; i < count; i++) {
      dates.push(new Date(currentDate))
      
      // Calculate next date based on frequency
      switch (task.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + task.interval)
          break
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (task.interval * 7))
          break
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + task.interval)
          break
      }
    }
    
    return dates
  }

  const handleFormSuccess = () => {
    setShowCreateForm(false)
    setEditingTask(null)
    queryClient.invalidateQueries({ queryKey: ['recurring-tasks', boardId] })
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-monday-border dark:border-gray-700">
            <div>
              <h3 className="text-2xl font-bold text-monday-text dark:text-white flex items-center space-x-2">
                <svg className="w-6 h-6 text-monday-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Recurring Tasks</span>
              </h3>
              <p className="text-sm text-monday-textLight dark:text-gray-400 mt-1">
                Automatically create tasks on a schedule
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {showCreateForm || editingTask ? (
              <RecurringTaskForm
                boardId={boardId}
                groupId={groupId}
                groups={groups || []}
                editingTask={editingTask}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setShowCreateForm(false)
                  setEditingTask(null)
                }}
              />
            ) : (
              <>
                {/* Create Button */}
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full px-4 py-3 mb-6 border-2 border-dashed border-monday-border dark:border-gray-700 hover:border-monday-primary hover:bg-monday-primaryLight dark:hover:bg-monday-primary/10 rounded-lg text-monday-text dark:text-white font-medium transition-all flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create New Recurring Task</span>
                </button>

                {/* Task List */}
                {isLoading ? (
                  <div className="text-center py-8 text-monday-textLight dark:text-gray-400">
                    Loading...
                  </div>
                ) : recurringTasks && recurringTasks.length > 0 ? (
                  <div className="space-y-4">
                    {recurringTasks.map((task) => (
                      <div
                        key={task.id}
                        className="border border-monday-border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-monday-text dark:text-white">
                                {task.itemTemplate?.name || 'Untitled Task'}
                              </h4>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                task.isActive
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                              }`}>
                                {task.isActive ? 'Active' : 'Paused'}
                              </span>
                            </div>
                            <p className="text-sm text-monday-textLight dark:text-gray-400 mb-2">
                              {getFrequencyLabel(task)}
                            </p>
                            <div className="text-xs text-monday-textLight dark:text-gray-400">
                              <p>Next run: {new Date(task.nextRunDate).toLocaleString()}</p>
                              {task.lastRunDate && (
                                <p>Last run: {new Date(task.lastRunDate).toLocaleString()}</p>
                              )}
                              {task.endDate && (
                                <p>Ends: {new Date(task.endDate).toLocaleDateString()}</p>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => toggleActiveMutation.mutate({ taskId: task.id, isActive: !task.isActive })}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                              title={task.isActive ? 'Pause' : 'Resume'}
                            >
                              {task.isActive ? (
                                <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => runNowMutation.mutate(task.id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                              title="Run now"
                            >
                              <svg className="w-4 h-4 text-monday-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setEditingTask(task)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4 text-monday-textLight dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteTaskId(task.id)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Next Runs Preview */}
                        <details className="mt-3">
                          <summary className="text-xs text-monday-primary cursor-pointer hover:underline">
                            View next 5 scheduled runs
                          </summary>
                          <div className="mt-2 text-xs text-monday-textLight dark:text-gray-400 space-y-1 ml-4">
                            {getNextRuns(task).map((date, index) => (
                              <div key={index}>
                                {index + 1}. {date.toLocaleString()}
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-monday-textLight dark:text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No recurring tasks yet</p>
                    <p className="text-sm mt-2">Create one to automate task creation</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {deleteTaskId && (
        <ConfirmationDialog
          isOpen={!!deleteTaskId}
          title="Delete Recurring Task"
          message="Are you sure you want to delete this recurring task? Future scheduled tasks will not be created."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => deleteMutation.mutate(deleteTaskId)}
          onCancel={() => setDeleteTaskId(null)}
          variant="danger"
        />
      )}
    </>
  )
}

