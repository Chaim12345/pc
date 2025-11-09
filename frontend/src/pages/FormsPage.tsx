import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext'
import { api } from '../services/api'
import ConfirmationDialog from '../components/ConfirmationDialog'

interface Form {
  id: string
  boardId: string
  groupId: string
  name: string
  description?: string
  fields: any[]
  settings: any
  isPublic: boolean
  publicToken: string
  createdAt: string
  updatedAt: string
  _count: {
    submissions: number
  }
}

export default function FormsPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { theme } = useTheme()
  const queryClient = useQueryClient()
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null)

  const { data: forms, isLoading } = useQuery<Form[]>({
    queryKey: ['forms', boardId],
    queryFn: async () => {
      const response = await api.get(`/forms/board/${boardId}`)
      return response.data.data
    },
    enabled: !!boardId
  })

  const deleteMutation = useMutation({
    mutationFn: async (formId: string) => {
      await api.delete(`/forms/${formId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', boardId] })
      showToast('Form deleted successfully', 'success')
      setDeleteFormId(null)
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to delete form', 'error')
    }
  })

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/forms/view/${token}`
    navigator.clipboard.writeText(link)
    showToast('Form link copied to clipboard!', 'success')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-monday-textLight dark:text-gray-400">Loading forms...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-monday-background dark:bg-monday-dark p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="mb-4 text-monday-textLight dark:text-gray-400 hover:text-monday-text dark:hover:text-white transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Board</span>
            </button>
            <h1 className="text-3xl font-bold text-monday-text dark:text-white mb-2">Forms</h1>
            <p className="text-monday-textLight dark:text-gray-400">
              Collect data from external users and create board items automatically
            </p>
          </div>
          <button
            onClick={() => navigate(`/forms/new?boardId=${boardId}`)}
            className="px-4 py-2 bg-monday-primary hover:bg-monday-primary/90 text-white rounded-lg font-medium transition-all hover:scale-105 shadow-md flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Form</span>
          </button>
        </div>

        {/* Forms Grid */}
        {forms && forms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form) => (
              <div
                key={form.id}
                className="bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-lg p-6 hover:shadow-monday-hover transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-monday-text dark:text-white mb-1 truncate">
                      {form.name}
                    </h3>
                    {form.description && (
                      <p className="text-sm text-monday-textLight dark:text-gray-400 line-clamp-2">
                        {form.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate(`/forms/edit/${form.id}`)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                      title="Edit form"
                    >
                      <svg className="w-4 h-4 text-monday-textLight dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteFormId(form.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete form"
                    >
                      <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-4 mb-4 text-sm">
                  <div className="flex items-center space-x-1 text-monday-textLight dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>{form.fields?.length || 0} fields</span>
                  </div>
                  <div className="flex items-center space-x-1 text-monday-textLight dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{form._count.submissions} responses</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  {form.isPublic ? (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                      Inactive
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate(`/forms/${form.id}/submissions`)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-monday-text dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 border border-monday-border dark:border-gray-700 rounded-lg transition-colors"
                  >
                    View Responses
                  </button>
                  <button
                    onClick={() => copyLink(form.publicToken)}
                    className="px-3 py-2 text-sm font-medium text-monday-primary hover:bg-monday-primaryLight dark:hover:bg-monday-primary/20 border border-monday-primary rounded-lg transition-colors"
                    title="Copy form link"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-lg">
            <svg className="w-16 h-16 text-monday-textLight dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-monday-text dark:text-white mb-2">No forms yet</h3>
            <p className="text-monday-textLight dark:text-gray-400 mb-4">Create your first form to start collecting data</p>
            <button
              onClick={() => navigate(`/forms/new?boardId=${boardId}`)}
              className="px-4 py-2 bg-monday-primary hover:bg-monday-primary/90 text-white rounded-lg font-medium transition-all"
            >
              Create Form
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {deleteFormId && (
        <ConfirmationDialog
          isOpen={!!deleteFormId}
          title="Delete Form"
          message="Are you sure you want to delete this form? All submissions will be lost. This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => deleteMutation.mutate(deleteFormId)}
          onCancel={() => setDeleteFormId(null)}
          variant="danger"
        />
      )}
    </div>
  )
}






