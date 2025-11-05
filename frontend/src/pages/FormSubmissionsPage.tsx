import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

interface FormSubmission {
  id: string
  formId: string
  itemId?: string
  data: any
  submitterEmail?: string
  submitterName?: string
  ipAddress?: string
  createdAt: string
}

export default function FormSubmissionsPage() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()

  const { data: form } = useQuery({
    queryKey: ['form', formId],
    queryFn: async () => {
      const response = await api.get(`/forms/${formId}`)
      return response.data.data
    }
  })

  const { data: submissionsData, isLoading } = useQuery({
    queryKey: ['form-submissions', formId],
    queryFn: async () => {
      const response = await api.get(`/forms/${formId}/submissions`)
      return response.data
    }
  })

  const { data: analytics } = useQuery({
    queryKey: ['form-analytics', formId],
    queryFn: async () => {
      const response = await api.get(`/forms/${formId}/analytics`)
      return response.data.data
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-monday-textLight dark:text-gray-400">Loading submissions...</div>
      </div>
    )
  }

  const submissions = submissionsData?.data || []

  return (
    <div className="min-h-screen bg-monday-background dark:bg-monday-dark p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-monday-textLight dark:text-gray-400 hover:text-monday-text dark:hover:text-white transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Forms</span>
          </button>
          <h1 className="text-3xl font-bold text-monday-text dark:text-white mb-2">
            {form?.name || 'Form'} - Responses
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-monday-textLight dark:text-gray-400 mb-1">Total Responses</p>
                <p className="text-3xl font-bold text-monday-text dark:text-white">
                  {analytics?.totalSubmissions || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-monday-textLight dark:text-gray-400 mb-1">Form Fields</p>
                <p className="text-3xl font-bold text-monday-text dark:text-white">
                  {form?.fields?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-monday-textLight dark:text-gray-400 mb-1">Status</p>
                <p className="text-lg font-bold text-monday-text dark:text-white">
                  {form?.isPublic ? (
                    <span className="text-green-600 dark:text-green-400">Active</span>
                  ) : (
                    <span className="text-gray-600 dark:text-gray-400">Inactive</span>
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-monday-border dark:border-gray-700">
            <h2 className="text-lg font-semibold text-monday-text dark:text-white">Recent Responses</h2>
          </div>
          
          {submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-monday-dark">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-monday-textLight dark:text-gray-400 uppercase tracking-wider">
                      Submitted By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-monday-textLight dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-monday-textLight dark:text-gray-400 uppercase tracking-wider">
                      Responses
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-monday-border dark:divide-gray-700">
                  {submissions.map((submission: FormSubmission) => (
                    <tr key={submission.id} className="hover:bg-gray-50 dark:hover:bg-monday-dark transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-monday-text dark:text-white">
                            {submission.submitterName || 'Anonymous'}
                          </div>
                          {submission.submitterEmail && (
                            <div className="text-sm text-monday-textLight dark:text-gray-400">
                              {submission.submitterEmail}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-monday-textLight dark:text-gray-400">
                        {new Date(submission.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-monday-text dark:text-white">
                          {Object.entries(submission.data).map(([key, value]) => (
                            <div key={key} className="mb-1">
                              <span className="font-medium">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-monday-textLight dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-monday-textLight dark:text-gray-400">No responses yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



