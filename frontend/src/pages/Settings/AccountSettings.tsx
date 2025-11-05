import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import TwoFactorAuthSetup from '../../components/TwoFactorAuthSetup'

export default function AccountSettings() {
  const { showToast } = useToast()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [show2FASetup, setShow2FASetup] = useState(false)

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await api.put('/users/me/password', data)
      return response.data.data
    },
    onSuccess: () => {
      showToast('Password changed successfully', 'success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to change password', 'error')
    },
  })

  const disable2FAMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/2fa/disable')
      return response.data
    },
    onSuccess: () => {
      showToast('2FA has been disabled', 'success')
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to disable 2FA', 'error')
    },
  })

  const handleDisable2FA = () => {
    if (window.confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) {
      disable2FAMutation.mutate()
    }
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error')
      return
    }

    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters', 'error')
      return
    }

    changePasswordMutation.mutate({ currentPassword, newPassword })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-monday-text dark:text-white mb-2">Account Settings</h2>
        <p className="text-monday-textLight dark:text-gray-400">
          Manage your account security and authentication
        </p>
      </div>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="bg-white dark:bg-monday-darkLight rounded-lg shadow-md border border-monday-border dark:border-gray-700 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-monday-text dark:text-white">Change Password</h3>

        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:border-monday-primary"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-monday-textLight hover:text-monday-text dark:text-gray-400 dark:hover:text-white"
            >
              {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:border-monday-primary"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-monday-textLight hover:text-monday-text dark:text-gray-400 dark:hover:text-white"
            >
              {showNewPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <p className="text-xs text-monday-textLight dark:text-gray-500 mt-1">
            Must be at least 8 characters long
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:border-monday-primary"
            required
            minLength={8}
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="px-6 py-2 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>

      {/* Two-Factor Authentication */}
      <div className="bg-white dark:bg-monday-darkLight rounded-lg shadow-md border border-monday-border dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-monday-text dark:text-white">Two-Factor Authentication</h3>
            <p className="text-sm text-monday-textLight dark:text-gray-400 mt-1">
              Add an extra layer of security to your account by enabling two-factor authentication
            </p>
          </div>
        </div>
        
        {user?.isTwoFactorEnabled ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">2FA is currently enabled</span>
            </div>
            <button
              onClick={handleDisable2FA}
              disabled={disable2FAMutation.isPending}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
            >
              {disable2FAMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setShow2FASetup(true)}
              className="px-4 py-2 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-lg transition-colors font-medium"
            >
              Enable 2FA
            </button>
          </div>
        )}
      </div>

      {show2FASetup && <TwoFactorAuthSetup onClose={() => setShow2FASetup(false)} />}

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md border-2 border-red-200 dark:border-red-800 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
        <p className="text-sm text-red-600 dark:text-red-400">
          Deleting your account is irreversible. All your data will be permanently deleted.
        </p>
        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium">
          Delete Account
        </button>
      </div>
    </div>
  )
}

