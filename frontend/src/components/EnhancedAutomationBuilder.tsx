import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useToast } from '../contexts/ToastContext'

interface AutomationBuilderProps {
  boardId: string
  automationId?: string
  onClose: () => void
}

interface AutomationAction {
  id: string
  type: string
  parameters: Record<string, any>
  delay?: number
}

interface AutomationCondition {
  id: string
  field: string
  operator: string
  value: any
  logic?: 'AND' | 'OR'
}

const AUTOMATION_TEMPLATES = [
  {
    id: 'assign-on-create',
    name: 'Auto-assign new items',
    icon: '👤',
    trigger: 'ITEM_CREATED',
    actions: [{ type: 'ASSIGN_PERSON', parameters: {} }],
  },
  {
    id: 'notify-status-change',
    name: 'Notify on status change',
    icon: '🔔',
    trigger: 'STATUS_CHANGED',
    actions: [{ type: 'SEND_NOTIFICATION', parameters: {} }, { type: 'SEND_EMAIL', parameters: {} }],
  },
  {
    id: 'move-when-done',
    name: 'Move when status is Done',
    icon: '✅',
    trigger: 'STATUS_CHANGED',
    conditions: [{ field: 'status', operator: '=', value: 'Done' }],
    actions: [{ type: 'MOVE_TO_GROUP', parameters: { groupName: 'Completed' } }],
  },
  {
    id: 'deadline-reminder',
    name: 'Send reminder before deadline',
    icon: '⏰',
    trigger: 'DATE_APPROACHING',
    actions: [{ type: 'SEND_NOTIFICATION', parameters: { message: 'Deadline approaching!' } }],
  },
  {
    id: 'duplicate-to-board',
    name: 'Duplicate item to another board',
    icon: '📋',
    trigger: 'STATUS_CHANGED',
    actions: [{ type: 'DUPLICATE_ITEM', parameters: {} }],
  },
  {
    id: 'archive-old',
    name: 'Archive items after 30 days',
    icon: '📦',
    trigger: 'SCHEDULED',
    actions: [{ type: 'ARCHIVE_ITEM', parameters: {} }],
  },
]

const TRIGGER_TYPES = [
  { value: 'ITEM_CREATED', label: 'Item is created', icon: '➕' },
  { value: 'ITEM_UPDATED', label: 'Item is updated', icon: '✏️' },
  { value: 'ITEM_DELETED', label: 'Item is deleted', icon: '🗑️' },
  { value: 'STATUS_CHANGED', label: 'Status changes', icon: '🔄' },
  { value: 'COLUMN_VALUE_CHANGED', label: 'Column value changes', icon: '📝' },
  { value: 'DATE_REACHED', label: 'Date is reached', icon: '📅' },
  { value: 'DATE_APPROACHING', label: 'Date is approaching', icon: '⏰' },
  { value: 'PERSON_ASSIGNED', label: 'Person is assigned', icon: '👤' },
  { value: 'COMMENT_ADDED', label: 'Comment is added', icon: '💬' },
  { value: 'FILE_UPLOADED', label: 'File is uploaded', icon: '📎' },
  { value: 'SCHEDULED', label: 'Time interval (recurring)', icon: '🔁' },
  { value: 'WEBHOOK', label: 'External webhook', icon: '🌐' },
  { value: 'BUTTON_CLICKED', label: 'Button is clicked', icon: '🔘' },
]

const ACTION_TYPES = [
  { value: 'UPDATE_COLUMN_VALUE', label: 'Update column value', icon: '📝' },
  { value: 'CHANGE_STATUS', label: 'Change status', icon: '🔄' },
  { value: 'ASSIGN_PERSON', label: 'Assign person', icon: '👤' },
  { value: 'SEND_NOTIFICATION', label: 'Send notification', icon: '🔔' },
  { value: 'SEND_EMAIL', label: 'Send email', icon: '📧' },
  { value: 'SEND_SLACK_MESSAGE', label: 'Send Slack message', icon: '💬' },
  { value: 'SEND_TEAMS_MESSAGE', label: 'Send Teams message', icon: '💼' },
  { value: 'CREATE_ITEM', label: 'Create new item', icon: '➕' },
  { value: 'DUPLICATE_ITEM', label: 'Duplicate item', icon: '📋' },
  { value: 'MOVE_TO_GROUP', label: 'Move to group', icon: '📁' },
  { value: 'ARCHIVE_ITEM', label: 'Archive item', icon: '📦' },
  { value: 'DELETE_ITEM', label: 'Delete item', icon: '🗑️' },
  { value: 'CREATE_UPDATE', label: 'Post an update', icon: '📢' },
  { value: 'ADD_TO_BOARD', label: 'Add to another board', icon: '➡️' },
  { value: 'WEBHOOK_CALL', label: 'Call webhook', icon: '🌐' },
  { value: 'INCREMENT_NUMBER', label: 'Increment number', icon: '➕' },
  { value: 'SET_DUE_DATE', label: 'Set due date', icon: '📅' },
  { value: 'CREATE_SUBITEM', label: 'Create subitem', icon: '🔹' },
  { value: 'CHANGE_PRIORITY', label: 'Change priority', icon: '🎯' },
]

export default function EnhancedAutomationBuilder({ boardId, automationId, onClose }: AutomationBuilderProps) {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  
  const [step, setStep] = useState<'template' | 'build'>('template')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [triggerType, setTriggerType] = useState('ITEM_CREATED')
  const [enabled, setEnabled] = useState(true)
  const [runOnce, setRunOnce] = useState(false)
  
  // Scope configuration
  const [scope, setScope] = useState<'all' | 'specific'>('all')
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  
  const [conditions, setConditions] = useState<AutomationCondition[]>([])
  const [actions, setActions] = useState<AutomationAction[]>([
    { id: '1', type: 'SEND_NOTIFICATION', parameters: {} }
  ])

  // Fetch columns for the board
  const { data: board } = useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const response = await api.get(`/boards/${boardId}`)
      return response.data.data
    },
  })

  const columns = board?.columns || []
  const groups = board?.groups || []
  
  // Extract status and priority options from columns
  const statusColumn = columns.find((col: any) => col.type === 'status')
  const statusOptions = statusColumn?.settings?.labels || ['Working on it', 'Done', 'Stuck']
  
  const priorityColumn = columns.find((col: any) => col.type === 'priority')
  const priorityOptions = priorityColumn?.settings?.labels || ['Critical', 'High', 'Medium', 'Low']
  
  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    )
  }
  
  const toggleColumnSelection = (columnId: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnId) ? prev.filter(id => id !== columnId) : [...prev, columnId]
    )
  }
  
  const toggleStatusSelection = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }
  
  const togglePrioritySelection = (priority: string) => {
    setSelectedPriorities(prev => 
      prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
    )
  }

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        id: Date.now().toString(),
        field: 'status',
        operator: '=',
        value: '',
        logic: 'AND',
      },
    ])
  }

  const updateCondition = (id: string, updates: Partial<AutomationCondition>) => {
    setConditions(conditions.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id))
  }

  const addAction = () => {
    setActions([
      ...actions,
      {
        id: Date.now().toString(),
        type: 'SEND_NOTIFICATION',
        parameters: {},
      },
    ])
  }

  const updateAction = (id: string, updates: Partial<AutomationAction>) => {
    setActions(actions.map(a => a.id === id ? { ...a, ...updates } : a))
  }

  const removeAction = (id: string) => {
    setActions(actions.filter(a => a.id !== id))
  }

  const moveAction = (id: string, direction: 'up' | 'down') => {
    const index = actions.findIndex(a => a.id === id)
    if (index === -1) return
    
    const newActions = [...actions]
    if (direction === 'up' && index > 0) {
      [newActions[index], newActions[index - 1]] = [newActions[index - 1], newActions[index]]
    } else if (direction === 'down' && index < actions.length - 1) {
      [newActions[index], newActions[index + 1]] = [newActions[index + 1], newActions[index]]
    }
    setActions(newActions)
  }

  const loadTemplate = (template: any) => {
    setName(template.name)
    setTriggerType(template.trigger)
    if (template.conditions) {
      setConditions(template.conditions.map((c: any, i: number) => ({ ...c, id: `${Date.now()}-${i}` })))
    }
    if (template.actions) {
      setActions(template.actions.map((a: any, i: number) => ({ ...a, id: `${Date.now()}-${i}` })))
    }
    setStep('build')
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/automations', {
        boardId,
        name,
        description,
        trigger: {
          type: triggerType,
          conditions: conditions.reduce((acc, c) => ({
            ...acc,
            [c.field]: { operator: c.operator, value: c.value, logic: c.logic }
          }), {}),
        },
        actions: actions.map(a => ({
          type: a.type,
          parameters: a.parameters,
          delay: a.delay,
        })),
        enabled,
        runOnce,
        scope: scope === 'specific' ? {
          groups: selectedGroups,
          columns: selectedColumns,
          statuses: selectedStatuses,
          priorities: selectedPriorities,
        } : null,
      })
      return response.data.data
    },
    onSuccess: () => {
      showToast('Automation created successfully!', 'success')
      queryClient.invalidateQueries({ queryKey: ['automations', boardId] })
      onClose()
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to create automation', 'error')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate()
  }

  if (step === 'template') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-monday-border dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-monday-text dark:text-white">Create Automation</h2>
              <p className="text-sm text-monday-textLight dark:text-gray-400 mt-1">
                Start with a template or build from scratch
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-monday-textLight hover:text-monday-text dark:hover:text-white hover:bg-monday-background dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {AUTOMATION_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => loadTemplate(template)}
                  className="p-6 border-2 border-monday-border dark:border-gray-700 rounded-xl hover:border-monday-primary hover:shadow-lg transition-all text-left group bg-white dark:bg-monday-dark"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                    {template.icon}
                  </div>
                  <h3 className="font-semibold text-monday-text dark:text-white mb-1 group-hover:text-monday-primary transition-colors">
                    {template.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-monday-textLight dark:text-gray-400">
                    <span className="px-2 py-1 bg-monday-background dark:bg-gray-800 rounded">
                      {template.actions.length} action{template.actions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center pt-4 border-t border-monday-border dark:border-gray-700">
              <button
                onClick={() => setStep('build')}
                className="px-6 py-3 bg-monday-primary text-white rounded-lg font-medium hover:bg-monday-primaryHover transition-all shadow-md hover:shadow-lg"
              >
                Start from scratch
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-monday-border dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setStep('template')}
              className="p-2 hover:bg-monday-background dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Back to templates"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-monday-text dark:text-white">
                {automationId ? 'Edit Automation' : 'Build Automation'}
              </h2>
              <p className="text-sm text-monday-textLight dark:text-gray-400 mt-1">
                Configure triggers, conditions, and actions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-monday-textLight hover:text-monday-text dark:hover:text-white hover:bg-monday-background dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-monday-background dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-monday-text dark:text-white mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                    Automation Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:ring-2 focus:ring-monday-primary focus:border-transparent"
                    placeholder="E.g., Notify team when status changes"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:ring-2 focus:ring-monday-primary focus:border-transparent resize-none"
                    rows={2}
                    placeholder="Brief description of what this automation does"
                  />
                </div>
              </div>
            </div>

            {/* Trigger */}
            <div className="bg-monday-background dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold text-monday-text dark:text-white">When this happens...</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {TRIGGER_TYPES.map((trigger) => (
                  <button
                    key={trigger.value}
                    type="button"
                    onClick={() => setTriggerType(trigger.value)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      triggerType === trigger.value
                        ? 'border-monday-primary bg-monday-primary/10'
                        : 'border-monday-border dark:border-gray-700 hover:border-monday-primary/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{trigger.icon}</span>
                      <span className="text-sm font-medium text-monday-text dark:text-white">
                        {trigger.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Scope Configuration */}
            <div className="bg-monday-background dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-white font-bold">
                  1.5
                </div>
                <h3 className="text-lg font-semibold text-monday-text dark:text-white">Apply to... (Scope)</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="all"
                      checked={scope === 'all'}
                      onChange={() => setScope('all')}
                      className="w-4 h-4 text-monday-primary"
                    />
                    <span className="font-medium text-monday-text dark:text-white">All items in this board</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="specific"
                      checked={scope === 'specific'}
                      onChange={() => setScope('specific')}
                      className="w-4 h-4 text-monday-primary"
                    />
                    <span className="font-medium text-monday-text dark:text-white">Specific groups, columns, or statuses</span>
                  </label>
                </div>

                {scope === 'specific' && (
                  <div className="space-y-4 pl-4 border-l-4 border-yellow-500">
                    {/* Groups */}
                    <div>
                      <h4 className="text-sm font-semibold text-monday-text dark:text-white mb-2 flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span>Specific Groups (optional)</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {groups.length === 0 ? (
                          <p className="text-sm text-monday-textLight dark:text-gray-400">No groups available</p>
                        ) : (
                          groups.map((group: any) => (
                            <button
                              key={group.id}
                              type="button"
                              onClick={() => toggleGroupSelection(group.id)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                selectedGroups.includes(group.id)
                                  ? 'bg-yellow-500 text-white shadow-md'
                                  : 'bg-white dark:bg-monday-dark border border-monday-border dark:border-gray-700 text-monday-text dark:text-white hover:border-yellow-500'
                              }`}
                            >
                              {group.title}
                            </button>
                          ))
                        )}
                      </div>
                      {selectedGroups.length > 0 && (
                        <p className="text-xs text-monday-textLight dark:text-gray-400 mt-2">
                          Selected: {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    {/* Columns */}
                    <div>
                      <h4 className="text-sm font-semibold text-monday-text dark:text-white mb-2 flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                        <span>Specific Columns (optional)</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {columns.length === 0 ? (
                          <p className="text-sm text-monday-textLight dark:text-gray-400">No columns available</p>
                        ) : (
                          columns.map((column: any) => (
                            <button
                              key={column.id}
                              type="button"
                              onClick={() => toggleColumnSelection(column.id)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                selectedColumns.includes(column.id)
                                  ? 'bg-yellow-500 text-white shadow-md'
                                  : 'bg-white dark:bg-monday-dark border border-monday-border dark:border-gray-700 text-monday-text dark:text-white hover:border-yellow-500'
                              }`}
                            >
                              {column.title}
                            </button>
                          ))
                        )}
                      </div>
                      {selectedColumns.length > 0 && (
                        <p className="text-xs text-monday-textLight dark:text-gray-400 mt-2">
                          Selected: {selectedColumns.length} column{selectedColumns.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    {/* Statuses */}
                    <div>
                      <h4 className="text-sm font-semibold text-monday-text dark:text-white mb-2 flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Specific Statuses (optional)</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {statusOptions.map((status: string) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => toggleStatusSelection(status)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedStatuses.includes(status)
                                ? 'bg-yellow-500 text-white shadow-md'
                                : 'bg-white dark:bg-monday-dark border border-monday-border dark:border-gray-700 text-monday-text dark:text-white hover:border-yellow-500'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                      {selectedStatuses.length > 0 && (
                        <p className="text-xs text-monday-textLight dark:text-gray-400 mt-2">
                          Selected: {selectedStatuses.length} status{selectedStatuses.length !== 1 ? 'es' : ''}
                        </p>
                      )}
                    </div>

                    {/* Priorities */}
                    <div>
                      <h4 className="text-sm font-semibold text-monday-text dark:text-white mb-2 flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        <span>Specific Priorities (optional)</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {priorityOptions.map((priority: string) => (
                          <button
                            key={priority}
                            type="button"
                            onClick={() => togglePrioritySelection(priority)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedPriorities.includes(priority)
                                ? 'bg-yellow-500 text-white shadow-md'
                                : 'bg-white dark:bg-monday-dark border border-monday-border dark:border-gray-700 text-monday-text dark:text-white hover:border-yellow-500'
                            }`}
                          >
                            {priority}
                          </button>
                        ))}
                      </div>
                      {selectedPriorities.length > 0 && (
                        <p className="text-xs text-monday-textLight dark:text-gray-400 mt-2">
                          Selected: {selectedPriorities.length} priorit{selectedPriorities.length !== 1 ? 'ies' : 'y'}
                        </p>
                      )}
                    </div>

                    {/* Summary */}
                    {(selectedGroups.length > 0 || selectedColumns.length > 0 || selectedStatuses.length > 0 || selectedPriorities.length > 0) && (
                      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>This automation will only apply to:</strong>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            {selectedGroups.length > 0 && <li>Items in {selectedGroups.length} selected group{selectedGroups.length !== 1 ? 's' : ''}</li>}
                            {selectedColumns.length > 0 && <li>Items with changes in {selectedColumns.length} selected column{selectedColumns.length !== 1 ? 's' : ''}</li>}
                            {selectedStatuses.length > 0 && <li>Items with {selectedStatuses.length} selected status{selectedStatuses.length !== 1 ? 'es' : ''}</li>}
                            {selectedPriorities.length > 0 && <li>Items with {selectedPriorities.length} selected priorit{selectedPriorities.length !== 1 ? 'ies' : 'y'}</li>}
                          </ul>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Conditions */}
            <div className="bg-monday-background dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <h3 className="text-lg font-semibold text-monday-text dark:text-white">
                    Only if... (optional)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={addCondition}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all text-sm"
                >
                  + Add Condition
                </button>
              </div>

              {conditions.length === 0 ? (
                <p className="text-monday-textLight dark:text-gray-400 text-sm text-center py-4">
                  No conditions set - automation will run every time the trigger occurs
                </p>
              ) : (
                <div className="space-y-3">
                  {conditions.map((condition, index) => (
                    <div key={condition.id} className="bg-white dark:bg-monday-dark rounded-lg p-4 border border-monday-border dark:border-gray-700">
                      {index > 0 && (
                        <div className="mb-3">
                          <select
                            value={condition.logic}
                            onChange={(e) => updateCondition(condition.id, { logic: e.target.value as 'AND' | 'OR' })}
                            className="px-3 py-1 border border-monday-border dark:border-gray-700 rounded bg-monday-background dark:bg-gray-800 text-sm font-medium"
                          >
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                          </select>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                          value={condition.field}
                          onChange={(e) => updateCondition(condition.id, { field: e.target.value })}
                          className="px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark"
                        >
                          <option value="status">Status</option>
                          <option value="priority">Priority</option>
                          <option value="assignee">Assignee</option>
                          {columns.map((col: any) => (
                            <option key={col.id} value={col.id}>{col.title}</option>
                          ))}
                        </select>
                        <select
                          value={condition.operator}
                          onChange={(e) => updateCondition(condition.id, { operator: e.target.value })}
                          className="px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark"
                        >
                          <option value="=">equals</option>
                          <option value="!=">not equals</option>
                          <option value=">">greater than</option>
                          <option value="<">less than</option>
                          <option value="contains">contains</option>
                          <option value="isEmpty">is empty</option>
                          <option value="isNotEmpty">is not empty</option>
                        </select>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={condition.value}
                            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                            className="flex-1 px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark"
                            placeholder="Value"
                          />
                          <button
                            type="button"
                            onClick={() => removeCondition(condition.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-monday-background dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <h3 className="text-lg font-semibold text-monday-text dark:text-white">Do this...</h3>
                </div>
                <button
                  type="button"
                  onClick={addAction}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-all text-sm"
                >
                  + Add Action
                </button>
              </div>

              <div className="space-y-4">
                {actions.map((action, index) => (
                  <div key={action.id} className="bg-white dark:bg-monday-dark rounded-lg p-4 border-2 border-monday-border dark:border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-monday-textLight dark:text-gray-400">
                          Step {index + 1}
                        </span>
                        {action.delay && (
                          <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded">
                            Delay: {action.delay}s
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => moveAction(action.id, 'up')}
                            className="p-1 text-monday-textLight hover:text-monday-text hover:bg-monday-background dark:hover:bg-gray-800 rounded transition-colors"
                            title="Move up"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                        )}
                        {index < actions.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveAction(action.id, 'down')}
                            className="p-1 text-monday-textLight hover:text-monday-text hover:bg-monday-background dark:hover:bg-gray-800 rounded transition-colors"
                            title="Move down"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeAction(action.id)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <select
                        value={action.type}
                        onChange={(e) => updateAction(action.id, { type: e.target.value, parameters: {} })}
                        className="w-full px-4 py-3 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark font-medium"
                      >
                        {ACTION_TYPES.map((actionType) => (
                          <option key={actionType.value} value={actionType.value}>
                            {actionType.icon} {actionType.label}
                          </option>
                        ))}
                      </select>

                      {/* Action-specific parameters */}
                      {(action.type === 'SEND_NOTIFICATION' || action.type === 'SEND_EMAIL' || action.type === 'CREATE_UPDATE') && (
                        <textarea
                          value={action.parameters.message || ''}
                          onChange={(e) => updateAction(action.id, { parameters: { ...action.parameters, message: e.target.value } })}
                          className="w-full px-4 py-3 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark resize-none"
                          rows={3}
                          placeholder="Message content... Use {column_name} for dynamic values"
                        />
                      )}

                      {action.type === 'MOVE_TO_GROUP' && (
                        <select
                          value={action.parameters.groupId || ''}
                          onChange={(e) => updateAction(action.id, { parameters: { ...action.parameters, groupId: e.target.value } })}
                          className="w-full px-4 py-3 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark"
                        >
                          <option value="">Select group...</option>
                          {groups.map((group: any) => (
                            <option key={group.id} value={group.id}>{group.title}</option>
                          ))}
                        </select>
                      )}

                      {action.type === 'UPDATE_COLUMN_VALUE' && (
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={action.parameters.columnId || ''}
                            onChange={(e) => updateAction(action.id, { parameters: { ...action.parameters, columnId: e.target.value } })}
                            className="px-4 py-3 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark"
                          >
                            <option value="">Select column...</option>
                            {columns.map((col: any) => (
                              <option key={col.id} value={col.id}>{col.title}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={action.parameters.value || ''}
                            onChange={(e) => updateAction(action.id, { parameters: { ...action.parameters, value: e.target.value } })}
                            className="px-4 py-3 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark"
                            placeholder="New value"
                          />
                        </div>
                      )}

                      {action.type === 'WEBHOOK_CALL' && (
                        <div className="space-y-2">
                          <input
                            type="url"
                            value={action.parameters.url || ''}
                            onChange={(e) => updateAction(action.id, { parameters: { ...action.parameters, url: e.target.value } })}
                            className="w-full px-4 py-3 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark"
                            placeholder="https://api.example.com/webhook"
                          />
                          <select
                            value={action.parameters.method || 'POST'}
                            onChange={(e) => updateAction(action.id, { parameters: { ...action.parameters, method: e.target.value } })}
                            className="px-4 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark"
                          >
                            <option value="POST">POST</option>
                            <option value="GET">GET</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                          </select>
                        </div>
                      )}

                      {/* Delay option */}
                      <div className="flex items-center space-x-3 pt-2 border-t border-monday-border dark:border-gray-700">
                        <input
                          type="checkbox"
                          id={`delay-${action.id}`}
                          checked={!!action.delay}
                          onChange={(e) => updateAction(action.id, { delay: e.target.checked ? 60 : undefined })}
                          className="w-4 h-4 text-monday-primary rounded"
                        />
                        <label htmlFor={`delay-${action.id}`} className="text-sm text-monday-textLight dark:text-gray-400">
                          Add delay before this action
                        </label>
                        {action.delay && (
                          <input
                            type="number"
                            value={action.delay}
                            onChange={(e) => updateAction(action.id, { delay: parseInt(e.target.value) || 0 })}
                            className="w-24 px-3 py-1 border border-monday-border dark:border-gray-700 rounded bg-white dark:bg-monday-dark text-sm"
                            min="1"
                          />
                        )}
                        {action.delay && <span className="text-sm text-monday-textLight dark:text-gray-400">seconds</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="bg-monday-background dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-monday-text dark:text-white mb-4">Options</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="w-5 h-5 text-monday-primary rounded"
                  />
                  <div>
                    <span className="font-medium text-monday-text dark:text-white">Enable automation</span>
                    <p className="text-sm text-monday-textLight dark:text-gray-400">
                      Automation will run automatically when triggered
                    </p>
                  </div>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={runOnce}
                    onChange={(e) => setRunOnce(e.target.checked)}
                    className="w-5 h-5 text-monday-primary rounded"
                  />
                  <div>
                    <span className="font-medium text-monday-text dark:text-white">Run only once per item</span>
                    <p className="text-sm text-monday-textLight dark:text-gray-400">
                      Prevent this automation from running multiple times on the same item
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-monday-border dark:border-gray-700">
            <button
              type="button"
              onClick={() => setStep('template')}
              className="px-4 py-2 text-monday-textLight hover:text-monday-text dark:hover:text-white transition-colors"
            >
              ← Back to templates
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-monday-border dark:border-gray-700 text-monday-text dark:text-white rounded-lg font-medium hover:bg-monday-background dark:hover:bg-gray-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || !name.trim()}
                className="px-6 py-3 bg-monday-primary text-white rounded-lg font-medium hover:bg-monday-primaryHover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Automation'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

