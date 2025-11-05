import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { api } from '../../services/api'

export default function ProfileSettings() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; bio?: string }) => {
      const response = await api.put('/users/me/profile', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      showToast('Profile updated successfully', 'success')
    },
    onError: () => {
      showToast('Failed to update profile', 'error')
    },
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      const response = await api.put('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      showToast('Avatar uploaded successfully', 'success')
      setAvatarFile(null)
      setAvatarPreview(null)
    },
    onError: () => {
      showToast('Failed to upload avatar', 'error')
    },
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate({ name, email, bio })
  }

  const handleUploadAvatar = () => {
    if (avatarFile) {
      uploadAvatarMutation.mutate(avatarFile)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-monday-text dark:text-white mb-2">Profile Settings</h2>
        <p className="text-monday-textLight dark:text-gray-400">
          Manage your personal information and profile picture
        </p>
      </div>

      {/* Avatar Section */}
      <div className="bg-white dark:bg-monday-darkLight rounded-lg shadow-md border border-monday-border dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-monday-text dark:text-white mb-4">Profile Picture</h3>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-monday-primary to-monday-purple flex items-center justify-center text-white font-bold text-3xl shadow-lg overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
              ) : user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
          </div>
          <div className="flex-1">
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <span className="px-4 py-2 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Choose Photo</span>
              </span>
            </label>
            {avatarFile && (
              <button
                onClick={handleUploadAvatar}
                disabled={uploadAvatarMutation.isPending}
                className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {uploadAvatarMutation.isPending ? 'Uploading...' : 'Upload Avatar'}
              </button>
            )}
            <p className="text-xs text-monday-textLight dark:text-gray-500 mt-2">
              Recommended: Square image, at least 400x400px
            </p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-white dark:bg-monday-darkLight rounded-lg shadow-md border border-monday-border dark:border-gray-700 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-monday-text dark:text-white">Personal Information</h3>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:border-monday-primary"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:border-monday-primary"
            required
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:border-monday-primary resize-none"
            placeholder="Tell us about yourself..."
          />
          <p className="text-xs text-monday-textLight dark:text-gray-500 mt-1">
            Max 200 characters
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="px-6 py-2 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

