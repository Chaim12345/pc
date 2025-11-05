import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTheme } from '../../contexts/ThemeContext'
import { useToast } from '../../contexts/ToastContext'
import { api } from '../../services/api'

export default function PreferencesSettings() {
  const { theme, toggleTheme } = useTheme()
  const { showToast } = useToast()

  const [language, setLanguage] = useState('en')
  const [timezone, setTimezone] = useState('UTC')
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY')
  const [timeFormat, setTimeFormat] = useState('12h')
  const [weekStart, setWeekStart] = useState('sunday')

  const savePreferencesMutation = useMutation({
    mutationFn: async (preferences: any) => {
      const response = await api.put('/users/me/preferences', preferences)
      return response.data.data
    },
    onSuccess: () => {
      showToast('Preferences saved successfully', 'success')
    },
    onError: () => {
      showToast('Failed to save preferences', 'error')
    },
  })

  const handleSavePreferences = () => {
    savePreferencesMutation.mutate({
      language,
      timezone,
      dateFormat,
      timeFormat,
      weekStart,
      theme,
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-monday-text dark:text-white mb-2">Preferences</h2>
        <p className="text-monday-textLight dark:text-gray-400">
          Customize your experience with language, timezone, and display settings
        </p>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-monday-darkLight rounded-lg shadow-md border border-monday-border dark:border-gray-700 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-monday-text dark:text-white">Appearance</h3>

        <div>
          <label className="block text-sm font-medium text-monday-text dark:text-white mb-3">
            Theme
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => theme === 'dark' && toggleTheme()}
              className={`p-4 rounded-lg border-2 transition-all ${
                theme === 'light'
                  ? 'border-monday-primary bg-monday-primaryLight/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-monday-primary/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center">
                  ☀️
                </div>
                <span className="font-medium text-monday-text dark:text-white">Light Mode</span>
              </div>
            </button>
            <button
              onClick={() => theme === 'light' && toggleTheme()}
              className={`p-4 rounded-lg border-2 transition-all ${
                theme === 'dark'
                  ? 'border-monday-primary bg-monday-primaryLight/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-monday-primary/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  🌙
                </div>
                <span className="font-medium text-monday-text dark:text-white">Dark Mode</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Language & Region */}
      <div className="bg-white dark:bg-monday-darkLight rounded-lg shadow-md border border-monday-border dark:border-gray-700 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-monday-text dark:text-white">Language & Region</h3>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:border-monday-primary"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="pt">Português</option>
            <option value="ja">日本語</option>
            <option value="zh">中文</option>
          </select>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:border-monday-primary"
          >
            <option value="UTC">UTC (Coordinated Universal Time)</option>
            <option value="America/New_York">Eastern Time (US & Canada)</option>
            <option value="America/Chicago">Central Time (US & Canada)</option>
            <option value="America/Denver">Mountain Time (US & Canada)</option>
            <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Europe/Berlin">Berlin</option>
            <option value="Asia/Tokyo">Tokyo</option>
            <option value="Asia/Shanghai">Shanghai</option>
            <option value="Australia/Sydney">Sydney</option>
          </select>
        </div>
      </div>

      {/* Date & Time Format */}
      <div className="bg-white dark:bg-monday-darkLight rounded-lg shadow-md border border-monday-border dark:border-gray-700 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-monday-text dark:text-white">Date & Time Format</h3>

        {/* Date Format */}
        <div>
          <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
            Date Format
          </label>
          <select
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:border-monday-primary"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2023)</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2023)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (2023-12-31)</option>
            <option value="MMM DD, YYYY">MMM DD, YYYY (Dec 31, 2023)</option>
          </select>
        </div>

        {/* Time Format */}
        <div>
          <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
            Time Format
          </label>
          <select
            value={timeFormat}
            onChange={(e) => setTimeFormat(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:border-monday-primary"
          >
            <option value="12h">12-hour (3:00 PM)</option>
            <option value="24h">24-hour (15:00)</option>
          </select>
        </div>

        {/* Week Start */}
        <div>
          <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
            Week Starts On
          </label>
          <select
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:border-monday-primary"
          >
            <option value="sunday">Sunday</option>
            <option value="monday">Monday</option>
            <option value="saturday">Saturday</option>
          </select>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-white dark:bg-monday-darkLight rounded-lg shadow-md border border-monday-border dark:border-gray-700 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-monday-text dark:text-white">Keyboard Shortcuts</h3>
        <p className="text-sm text-monday-textLight dark:text-gray-400">
          Use keyboard shortcuts to navigate and work faster
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Cmd/Ctrl + K</kbd>
            <span className="ml-2 text-monday-textLight dark:text-gray-400">Search</span>
          </div>
          <div>
            <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Cmd/Ctrl + N</kbd>
            <span className="ml-2 text-monday-textLight dark:text-gray-400">New Item</span>
          </div>
          <div>
            <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">?</kbd>
            <span className="ml-2 text-monday-textLight dark:text-gray-400">Show Shortcuts</span>
          </div>
          <div>
            <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Esc</kbd>
            <span className="ml-2 text-monday-textLight dark:text-gray-400">Close Dialog</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSavePreferences}
          disabled={savePreferencesMutation.isPending}
          className="px-6 py-2 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
        >
          {savePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}

