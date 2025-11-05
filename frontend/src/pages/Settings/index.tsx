import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import ProfileSettings from './ProfileSettings'
import AccountSettings from './AccountSettings'
import NotificationSettings from './NotificationSettings'
import PreferencesSettings from './PreferencesSettings'
import IntegrationsSettings from './IntegrationsSettings'

type Tab = 'profile' | 'account' | 'notifications' | 'preferences' | 'integrations'

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const tabs = [
    { key: 'profile' as Tab, label: 'Profile', icon: '👤' },
    { key: 'account' as Tab, label: 'Account', icon: '🔐' },
    { key: 'notifications' as Tab, label: 'Notifications', icon: '🔔' },
    { key: 'preferences' as Tab, label: 'Preferences', icon: '⚙️' },
    { key: 'integrations' as Tab, label: 'Integrations', icon: '🔗' },
  ]

  return (
    <div className="flex h-screen w-full bg-monday-background dark:bg-monday-dark overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-monday-darkLight border-r border-monday-border dark:border-gray-700 flex flex-col shadow-lg">
        <div className="p-6 border-b border-monday-border dark:border-gray-700">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-monday-textLight dark:text-gray-400 hover:text-monday-primary dark:hover:text-monday-primary transition-all group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Dashboard</span>
          </button>
        </div>

        <div className="p-6 border-b border-monday-border dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-monday-primary to-monday-purple flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-monday-text dark:text-white">{user?.name}</h2>
              <p className="text-sm text-monday-textLight dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.key
                    ? 'bg-monday-primary text-white shadow-md'
                    : 'text-monday-text dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-monday-darkLight border-b border-monday-border dark:border-gray-700 flex items-center justify-between px-6 shadow-sm">
          <h1 className="text-2xl font-bold text-monday-text dark:text-white">Settings</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-monday-textLight dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto custom-scrollbar p-8">
          <div className="max-w-4xl mx-auto">
            {activeTab === 'profile' && <ProfileSettings />}
            {activeTab === 'account' && <AccountSettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'preferences' && <PreferencesSettings />}
            {activeTab === 'integrations' && <IntegrationsSettings />}
          </div>
        </div>
      </div>
    </div>
  )
}

