import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Automation, AutomationTriggerType, AutomationActionType } from '@monday-clone/shared'
import { api } from '../services/api'

interface AutomationBuilderProps {
  boardId: string
  automationId?: string
  onClose: () => void
}

export default function AutomationBuilder({ boardId, automationId, onClose }: AutomationBuilderProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>(AutomationTriggerType.ITEM_CREATED)
  const [actionType, setActionType] = useState<AutomationActionType>(AutomationActionType.UPDATE_COLUMN_VALUE)
  const [enabled, setEnabled] = useState(true)
  const [triggerConditions, setTriggerConditions] = useState<Record<string, any>>({})
  const [actionParameters, setActionParameters] = useState<Record<string, any>>({})

  const { data: automation } = useQuery<Automation>({
    queryKey: ['automation', automationId],
    queryFn: async () => {
      const response = await api.get(`/automations/${automationId}`)
      return response.data.data
    },
    enabled: !!automationId,
  })

  // Handle automation data changes
  useEffect(() => {
    if (automation) {
      setName(automation.name)
      setEnabled(automation.enabled)
      if (automation.trigger) {
        setTriggerType(automation.trigger.type)
        setTriggerConditions(automation.trigger.conditions || {})
      }
      if (automation.actions && automation.actions.length > 0) {
        setActionType(automation.actions[0].type)
        setActionParameters(automation.actions[0].parameters || {})
      }
    }
  }, [automation])

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/automations', {
        boardId,
        name,
        trigger: {
          type: triggerType,
          conditions: triggerConditions,
        },
        actions: [
          {
            type: actionType,
            parameters: actionParameters,
          },
        ],
        enabled,
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations', boardId] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put(`/automations/${automationId}`, {
        name,
        trigger: {
          type: triggerType,
          conditions: triggerConditions,
        },
        actions: [
          {
            type: actionType,
            parameters: actionParameters,
          },
        ],
        enabled,
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations', boardId] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (automationId) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            {automationId ? 'Edit Automation' : 'Create Automation'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Automation name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">When</label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as AutomationTriggerType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={AutomationTriggerType.ITEM_CREATED}>Item is created</option>
                <option value={AutomationTriggerType.ITEM_UPDATED}>Item is updated</option>
                <option value={AutomationTriggerType.ITEM_DELETED}>Item is deleted</option>
                <option value={AutomationTriggerType.COLUMN_VALUE_CHANGED}>Column value changes</option>
                <option value={AutomationTriggerType.DATE_REACHED}>Date is reached</option>
                <option value={AutomationTriggerType.STATUS_CHANGED}>Status changes</option>
              </select>
            </div>

            {triggerType === AutomationTriggerType.COLUMN_VALUE_CHANGED && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Column</label>
                <input
                  type="text"
                  value={triggerConditions.columnId || ''}
                  onChange={(e) =>
                    setTriggerConditions({ ...triggerConditions, columnId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Column ID"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Then</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as AutomationActionType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={AutomationActionType.UPDATE_COLUMN_VALUE}>Update column value</option>
                <option value={AutomationActionType.CREATE_ITEM}>Create item</option>
                <option value={AutomationActionType.SEND_NOTIFICATION}>Send notification</option>
                <option value={AutomationActionType.MOVE_TO_GROUP}>Move to group</option>
                <option value={AutomationActionType.CHANGE_STATUS}>Change status</option>
              </select>
            </div>

            {actionType === AutomationActionType.UPDATE_COLUMN_VALUE && (
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Column ID</label>
                  <input
                    type="text"
                    value={actionParameters.columnId || ''}
                    onChange={(e) =>
                      setActionParameters({ ...actionParameters, columnId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Column ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <input
                    type="text"
                    value={actionParameters.value || ''}
                    onChange={(e) =>
                      setActionParameters({ ...actionParameters, value: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="New value"
                  />
                </div>
              </div>
            )}

            {actionType === AutomationActionType.SEND_NOTIFICATION && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={actionParameters.message || ''}
                  onChange={(e) =>
                    setActionParameters({ ...actionParameters, message: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Notification message"
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="enabled" className="ml-2 text-sm text-gray-700">
                Enable automation
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : automationId
                ? 'Update'
                : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


