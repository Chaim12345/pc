import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useToast } from '../../contexts/ToastContext'
import { api } from '../../services/api'

export default function IntegrationsSettings() {
  const { showToast } = useToast()
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('')
  const [slackEnabled, setSlackEnabled] = useState(false)
  const [teamsWebhookUrl, setTeamsWebhookUrl] = useState('')
  const [teamsEnabled, setTeamsEnabled] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'item_created',
    'item_updated',
    'status_changed',
  ])
  const [teamsSelectedEvents, setTeamsSelectedEvents] = useState<string[]>([
    'item_created',
    'item_updated',
    'status_changed',
  ])

  const testSlackMutation = useMutation({
    mutationFn: async (webhookUrl: string) => {
      const response = await api.post('/integrations/slack/test', { webhookUrl })
      return response.data
    },
    onSuccess: () => {
      showToast('Slack webhook test successful!', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to test Slack webhook', 'error')
    },
  })

  const testTeamsMutation = useMutation({
    mutationFn: async (webhookUrl: string) => {
      const response = await api.post('/integrations/teams/test', { webhookUrl })
      return response.data
    },
    onSuccess: () => {
      showToast('Teams webhook test successful!', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to test Teams webhook', 'error')
    },
  })

  const handleTestConnection = () => {
    if (!slackWebhookUrl.trim()) {
      showToast('Please enter a webhook URL', 'warning')
      return
    }
    testSlackMutation.mutate(slackWebhookUrl)
  }

  const handleSaveIntegration = () => {
    // In a real implementation, this would save to the database
    // For now, we'll just show a success message
    showToast('Integration settings saved! Note: Full integration storage requires database migration.', 'info')
  }

  const handleTestTeamsConnection = () => {
    if (!teamsWebhookUrl.trim()) {
      showToast('Please enter a webhook URL', 'warning')
      return
    }
    testTeamsMutation.mutate(teamsWebhookUrl)
  }

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  const toggleTeamsEvent = (event: string) => {
    setTeamsSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  const availableEvents = [
    { id: 'item_created', label: 'Item Created', description: 'When a new item is added to a board' },
    { id: 'item_updated', label: 'Item Updated', description: 'When an item is modified' },
    { id: 'item_deleted', label: 'Item Deleted', description: 'When an item is removed' },
    { id: 'status_changed', label: 'Status Changed', description: 'When an item status changes' },
    { id: 'comment_added', label: 'Comment Added', description: 'When a comment is posted' },
    { id: 'mention', label: 'User Mentioned', description: 'When a user is @mentioned' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-monday-text dark:text-white mb-2">Integrations</h2>
        <p className="text-monday-textLight dark:text-gray-400">
          Connect external services to enhance your workflow
        </p>
      </div>

      {/* Slack Integration */}
      <div className="bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-monday-text dark:text-white">Slack</h3>
              <p className="text-sm text-monday-textLight dark:text-gray-400">
                Send notifications to your Slack workspace
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={slackEnabled}
              onChange={(e) => setSlackEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {slackEnabled && (
          <div className="space-y-4">
            {/* Webhook URL */}
            <div>
              <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                Webhook URL
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="flex-1 px-4 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={handleTestConnection}
                  disabled={testSlackMutation.isPending || !slackWebhookUrl.trim()}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {testSlackMutation.isPending ? 'Testing...' : 'Test'}
                </button>
              </div>
              <p className="mt-2 text-xs text-monday-textLight dark:text-gray-400">
                <a
                  href="https://api.slack.com/messaging/webhooks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Learn how to create a Slack webhook URL →
                </a>
              </p>
            </div>

            {/* Event Selection */}
            <div>
              <h4 className="text-sm font-medium text-monday-text dark:text-white mb-3">
                Notify on these events:
              </h4>
              <div className="space-y-2">
                {availableEvents.map((event) => (
                  <label
                    key={event.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event.id)}
                      onChange={() => toggleEvent(event.id)}
                      className="mt-1 w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-monday-text dark:text-white">{event.label}</div>
                      <div className="text-sm text-monday-textLight dark:text-gray-400">
                        {event.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-monday-border dark:border-gray-700">
              <button
                onClick={handleSaveIntegration}
                className="px-6 py-2 bg-monday-primary hover:bg-monday-primary/90 text-white rounded-lg font-medium transition-all"
              >
                Save Integration
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Microsoft Teams Integration */}
      <div className="bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.625 8.125h-7.5a.625.625 0 00-.625.625v7.5c0 .345.28.625.625.625h7.5c.345 0 .625-.28.625-.625v-7.5a.625.625 0 00-.625-.625z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-monday-text dark:text-white">Microsoft Teams</h3>
              <p className="text-sm text-monday-textLight dark:text-gray-400">
                Send notifications to your Teams workspace
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={teamsEnabled}
              onChange={(e) => setTeamsEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {teamsEnabled && (
          <div className="space-y-4">
            {/* Webhook URL */}
            <div>
              <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                Webhook URL
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={teamsWebhookUrl}
                  onChange={(e) => setTeamsWebhookUrl(e.target.value)}
                  placeholder="https://outlook.office.com/webhook/..."
                  className="flex-1 px-4 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleTestTeamsConnection}
                  disabled={testTeamsMutation.isPending || !teamsWebhookUrl.trim()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {testTeamsMutation.isPending ? 'Testing...' : 'Test'}
                </button>
              </div>
              <p className="mt-2 text-xs text-monday-textLight dark:text-gray-400">
                <a
                  href="https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Learn how to create a Teams webhook URL →
                </a>
              </p>
            </div>

            {/* Event Selection */}
            <div>
              <h4 className="text-sm font-medium text-monday-text dark:text-white mb-3">
                Notify on these events:
              </h4>
              <div className="space-y-2">
                {availableEvents.map((event) => (
                  <label
                    key={event.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={teamsSelectedEvents.includes(event.id)}
                      onChange={() => toggleTeamsEvent(event.id)}
                      className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-monday-text dark:text-white">{event.label}</div>
                      <div className="text-sm text-monday-textLight dark:text-gray-400">
                        {event.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-monday-border dark:border-gray-700">
              <button
                onClick={handleSaveIntegration}
                className="px-6 py-2 bg-monday-primary hover:bg-monday-primary/90 text-white rounded-lg font-medium transition-all"
              >
                Save Integration
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Coming Soon Integrations */}
      <div className="bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-monday-text dark:text-white mb-4">Coming Soon</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Zapier */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg opacity-60">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 12l10 10 10-10z"/>
              </svg>
            </div>
            <div>
              <div className="font-medium text-monday-text dark:text-white">Zapier</div>
              <div className="text-sm text-monday-textLight dark:text-gray-400">Connect with 3000+ apps</div>
            </div>
          </div>

          {/* Google Calendar */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg opacity-60">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/>
              </svg>
            </div>
            <div>
              <div className="font-medium text-monday-text dark:text-white">Google Calendar</div>
              <div className="text-sm text-monday-textLight dark:text-gray-400">Sync deadlines and events</div>
            </div>
          </div>

          {/* GitHub */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg opacity-60">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
            </div>
            <div>
              <div className="font-medium text-monday-text dark:text-white">GitHub</div>
              <div className="text-sm text-monday-textLight dark:text-gray-400">Link issues and pull requests</div>
            </div>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-900 dark:text-blue-200">
            <strong>Note:</strong> Full integration configuration storage requires a database migration to create the IntegrationConfig table. 
            For now, webhook URLs need to be configured in the backend code or environment variables.
          </div>
        </div>
      </div>
    </div>
  )
}



