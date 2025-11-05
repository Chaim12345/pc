import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useToast } from '../../contexts/ToastContext'
import { api } from '../../services/api'

export default function NotificationSettings() {
  const { showToast } = useToast()

  const [emailNotifications, setEmailNotifications] = useState({
    mentions: true,
    comments: true,
    assignments: true,
    statusChanges: false,
    dueDates: true,
    boardInvites: true,
  })

  const [pushNotifications, setPushNotifications] = useState({
    mentions: true,
    comments: false,
    assignments: true,
    statusChanges: false,
    dueDates: true,
    boardInvites: true,
  })

  const [inAppNotifications, setInAppNotifications] = useState({
    mentions: true,
    comments: true,
    assignments: true,
    statusChanges: true,
    dueDates: true,
    boardInvites: true,
  })

  const [digestEmail, setDigestEmail] = useState<'none' | 'daily' | 'weekly'>('daily')

  const saveNotificationsMutation = useMutation({
    mutationFn: async (preferences: any) => {
      const response = await api.put('/notifications/preferences', preferences)
      return response.data.data
    },
    onSuccess: () => {
      showToast('Notification preferences saved', 'success')
    },
    onError: () => {
      showToast('Failed to save preferences', 'error')
    },
  })

  const handleSavePreferences = () => {
    saveNotificationsMutation.mutate({
      emailNotifications,
      pushNotifications,
      inAppNotifications,
      digestEmail,
    })
  }

  const NotificationToggle = ({
    label,
    description,
    checked,
    onChange,
  }: {
    label: string
    description: string
    checked: boolean
    onChange: (checked: boolean) => void
  }) => (
    <div className="flex items-start justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div className="flex-1">
        <p className="font-medium text-monday-text dark:text-white">{label}</p>
        <p className="text-sm text-monday-textLight dark:text-gray-400 mt-1">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-monday-primary' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-monday-text dark:text-white mb-2">Notification Settings</h2>
        <p className="text-monday-textLight dark:text-gray-400">
          Manage how you receive notifications from your boards and teams
        </p>
      </div>

      {/* Email Notifications */}
      <div className="bg-white dark:bg-monday-darkLight rounded-lg shadow-md border border-monday-border dark:border-gray-700 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-monday-text dark:text-white mb-4">Email Notifications</h3>
        <NotificationToggle
          label="Mentions"
          description="Get notified when someone mentions you in a comment"
          checked={emailNotifications.mentions}
          onChange={(checked) => setEmailNotifications({ ...emailNotifications, mentions: checked })}
        />
        <NotificationToggle
          label="Comments"
          description="Get notified about new comments on items you're following"
          checked={emailNotifications.comments}
          onChange={(checked) => setEmailNotifications({ ...emailNotifications, comments: checked })}
        />
        <NotificationToggle
          label="Assignments"
          description="Get notified when you're assigned to an item"
          checked={emailNotifications.assignments}
          onChange={(checked) => setEmailNotifications({ ...emailNotifications, assignments: checked })}
        />
        <NotificationToggle
          label="Status Changes"
          description="Get notified when item statuses change"
          checked={emailNotifications.statusChanges}
          onChange={(checked) => setEmailNotifications({ ...emailNotifications, statusChanges: checked })}
        />
        <NotificationToggle
          label="Due Dates"
          description="Get notified about upcoming due dates"
          checked={emailNotifications.dueDates}
          onChange={(checked) => setEmailNotifications({ ...emailNotifications, dueDates: checked })}
        />
        <NotificationToggle
          label="Board Invites"
          description="Get notified when you're invited to a board"
          checked={emailNotifications.boardInvites}
          onChange={(checked) => setEmailNotifications({ ...emailNotifications, boardInvites: checked })}
        />
      </div>

      {/* Push Notifications */}
      <div className="bg-white dark:bg-monday-darkLight rounded-lg shadow-md border border-monday-border dark:border-gray-700 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-monday-text dark:text-white mb-4">Push Notifications</h3>
        <NotificationToggle
          label="Mentions"
          description="Get push notifications for mentions"
          checked={pushNotifications.mentions}
          onChange={(checked) => setPushNotifications({ ...pushNotifications, mentions: checked })}
        />
        <NotificationToggle
          label="Comments"
          description="Get push notifications for comments"
          checked={pushNotifications.comments}
          onChange={(checked) => setPushNotifications({ ...pushNotifications, comments: checked })}
        />
        <NotificationToggle
          label="Assignments"
          description="Get push notifications for assignments"
          checked={pushNotifications.assignments}
          onChange={(checked) => setPushNotifications({ ...pushNotifications, assignments: checked })}
        />
      </div>

      {/* In-App Notifications */}
      <div className="bg-white dark:bg-monday-darkLight rounded-lg shadow-md border border-monday-border dark:border-gray-700 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-monday-text dark:text-white mb-4">In-App Notifications</h3>
        <NotificationToggle
          label="Mentions"
          description="Show in-app notifications for mentions"
          checked={inAppNotifications.mentions}
          onChange={(checked) => setInAppNotifications({ ...inAppNotifications, mentions: checked })}
        />
        <NotificationToggle
          label="Comments"
          description="Show in-app notifications for comments"
          checked={inAppNotifications.comments}
          onChange={(checked) => setInAppNotifications({ ...inAppNotifications, comments: checked })}
        />
        <NotificationToggle
          label="All Activity"
          description="Show all board activity in notifications"
          checked={inAppNotifications.statusChanges}
          onChange={(checked) => setInAppNotifications({ ...inAppNotifications, statusChanges: checked })}
        />
      </div>

      {/* Digest Email */}
      <div className="bg-white dark:bg-monday-darkLight rounded-lg shadow-md border border-monday-border dark:border-gray-700 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-monday-text dark:text-white mb-4">Email Digest</h3>
        <p className="text-sm text-monday-textLight dark:text-gray-400 mb-4">
          Receive a summary of your notifications via email
        </p>
        <div className="space-y-2">
          {[
            { value: 'none', label: 'Never' },
            { value: 'daily', label: 'Daily Summary' },
            { value: 'weekly', label: 'Weekly Summary' },
          ].map((option) => (
            <label
              key={option.value}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            >
              <input
                type="radio"
                name="digest"
                value={option.value}
                checked={digestEmail === option.value}
                onChange={(e) => setDigestEmail(e.target.value as any)}
                className="w-4 h-4 text-monday-primary"
              />
              <span className="text-monday-text dark:text-white">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSavePreferences}
          disabled={saveNotificationsMutation.isPending}
          className="px-6 py-2 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
        >
          {saveNotificationsMutation.isPending ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}

