import React, { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'

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
}

interface Props {
  boardId: string
  groupId?: string
  groups: any[]
  editingTask?: RecurringTask | null
  onSuccess: () => void
  onCancel: () => void
}

export default function RecurringTaskForm({ boardId, groupId, groups, editingTask, onSuccess, onCancel }: Props) {
  const { showToast } = useToast()
  const isEditing = !!editingTask

  const [formData, setFormData] = useState({
    groupId: groupId || editingTask?.groupId || '',
    taskName: editingTask?.itemTemplate?.name || '',
    taskDescription: editingTask?.itemTemplate?.description || '',
    frequency: editingTask?.frequency || 'weekly' as 'daily' | 'weekly' | 'monthly',
    interval: editingTask?.interval || 1,
    daysOfWeek: editingTask?.daysOfWeek || [1], // Monday by default
    dayOfMonth: editingTask?.dayOfMonth || 1,
    startDate: editingTask?.startDate ? new Date(editingTask.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: editingTask?.endDate ? new Date(editingTask.endDate).toISOString().split('T')[0] : '',
    isActive: editingTask?.isActive ?? true
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        boardId,
        groupId: data.groupId,
        itemTemplate: {
          name: data.taskName,
          description: data.taskDescription
        },
        frequency: data.frequency,
        interval: data.interval,
        daysOfWeek: data.frequency === 'weekly' ? data.daysOfWeek : undefined,
        dayOfMonth: data.frequency === 'monthly' ? data.dayOfMonth : undefined,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        isActive: data.isActive
      }

      if (isEditing && editingTask) {
        return await api.put(`/recurring-tasks/${editingTask.id}`, payload)
      } else {
        return await api.post('/recurring-tasks', payload)
      }
    },
    onSuccess: () => {
      showToast(`Recurring task ${isEditing ? 'updated' : 'created'} successfully`, 'success')
      onSuccess()
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to save recurring task', 'error')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.groupId) {
      showToast('Please select a group', 'error')
      return
    }

    if (!formData.taskName.trim()) {
      showToast('Please enter a task name', 'error')
      return
    }

    if (formData.frequency === 'weekly' && formData.daysOfWeek.length === 0) {
      showToast('Please select at least one day of the week', 'error')
      return
    }

    saveMutation.mutate(formData)
  }

  const handleDayOfWeekToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort()
    }))
  }

  const daysOfWeekLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 space-y-4">
        <h4 className="font-semibold text-monday-text dark:text-white mb-4">
          {isEditing ? 'Edit Recurring Task' : 'Create New Recurring Task'}
        </h4>

        {/* Task Name */}
        <div>
          <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
            Task Name *
          </label>
          <input
            type="text"
            value={formData.taskName}
            onChange={(e) => setFormData(prev => ({ ...prev, taskName: e.target.value }))}
            className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
            placeholder="Enter task name"
            required
          />
        </div>

        {/* Task Description */}
        <div>
          <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
            Description
          </label>
          <textarea
            value={formData.taskDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, taskDescription: e.target.value }))}
            className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary resize-none"
            rows={3}
            placeholder="Enter task description (optional)"
          />
        </div>

        {/* Group Selection */}
        <div>
          <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
            Target Group *
          </label>
          <select
            value={formData.groupId}
            onChange={(e) => setFormData(prev => ({ ...prev, groupId: e.target.value }))}
            className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
            required
          >
            <option value="">Select a group</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>{group.title}</option>
            ))}
          </select>
        </div>

        {/* Frequency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
              Frequency *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))}
              className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
              required
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
              Repeat Every
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="365"
                value={formData.interval}
                onChange={(e) => setFormData(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }))}
                className="w-20 px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
              />
              <span className="text-sm text-monday-textLight dark:text-gray-400">
                {formData.frequency === 'daily' ? 'days' : formData.frequency === 'weekly' ? 'weeks' : 'months'}
              </span>
            </div>
          </div>
        </div>

        {/* Days of Week (for weekly) */}
        {formData.frequency === 'weekly' && (
          <div>
            <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
              Days of Week *
            </label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeekLabels.map((label, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDayOfWeekToggle(index)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.daysOfWeek.includes(index)
                      ? 'bg-monday-primary text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-monday-text dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {label.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Day of Month (for monthly) */}
        {formData.frequency === 'monthly' && (
          <div>
            <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
              Day of Month *
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={formData.dayOfMonth}
              onChange={(e) => setFormData(prev => ({ ...prev, dayOfMonth: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
              required
            />
            <p className="mt-1 text-xs text-monday-textLight dark:text-gray-400">
              Enter a number between 1 and 31
            </p>
          </div>
        )}

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
              Start Date *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
              End Date (optional)
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              min={formData.startDate}
              className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
            />
          </div>
        </div>

        {/* Active Status */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-monday-primary focus:ring-monday-primary border-monday-border dark:border-gray-700 rounded"
            />
            <span className="text-sm text-monday-text dark:text-white">Task is active and will run on schedule</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="px-6 py-2 bg-monday-primary hover:bg-monday-primary/90 text-white rounded-lg font-medium transition-all disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-monday-border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-monday-text dark:text-white rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}






