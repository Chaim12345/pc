import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../services/api'

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

interface Form {
  id: string
  name: string
  description?: string
  fields: FormField[]
  settings: any
  isPublic: boolean
}

export default function FormViewPage() {
  const { token } = useParams<{ token: string }>()
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [submitterEmail, setSubmitterEmail] = useState('')
  const [submitterName, setSubmitterName] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const { data: form, isLoading, error } = useQuery<Form>({
    queryKey: ['form-public', token],
    queryFn: async () => {
      const response = await api.get(`/forms/public/${token}`)
      return response.data.data
    }
  })

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post(`/forms/public/${token}/submit`, data)
    },
    onSuccess: () => {
      setSubmitted(true)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (form) {
      for (const field of form.fields) {
        if (field.required && !formData[field.id]) {
          alert(`Please fill in the required field: ${field.label}`)
          return
        }
      }
    }

    submitMutation.mutate({
      data: formData,
      submitterEmail,
      submitterName
    })
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const renderField = (field: FormField) => {
    const fieldId = `field-${field.id}`
    const commonClasses = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div>
            <label htmlFor={fieldId} className={labelClasses}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
            </label>
            <input
              id={fieldId}
              type={field.type}
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className={commonClasses}
              aria-required={field.required}
              aria-describedby={field.placeholder ? `${fieldId}-hint` : undefined}
            />
            {field.placeholder && (
              <span id={`${fieldId}-hint`} className="sr-only">{field.placeholder}</span>
            )}
          </div>
        )
      
      case 'number':
        return (
          <div>
            <label htmlFor={fieldId} className={labelClasses}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
            </label>
            <input
              id={fieldId}
              type="number"
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className={commonClasses}
              aria-required={field.required}
              aria-describedby={field.placeholder ? `${fieldId}-hint` : undefined}
            />
            {field.placeholder && (
              <span id={`${fieldId}-hint`} className="sr-only">{field.placeholder}</span>
            )}
          </div>
        )
      
      case 'date':
        return (
          <div>
            <label htmlFor={fieldId} className={labelClasses}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
            </label>
            <input
              id={fieldId}
              type="date"
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              className={commonClasses}
              aria-required={field.required}
            />
          </div>
        )
      
      case 'textarea':
        return (
          <div>
            <label htmlFor={fieldId} className={labelClasses}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
            </label>
            <textarea
              id={fieldId}
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className={`${commonClasses} resize-none`}
              rows={4}
              aria-required={field.required}
              aria-describedby={field.placeholder ? `${fieldId}-hint` : undefined}
            />
            {field.placeholder && (
              <span id={`${fieldId}-hint`} className="sr-only">{field.placeholder}</span>
            )}
          </div>
        )
      
      case 'dropdown':
        return (
          <div>
            <label htmlFor={fieldId} className={labelClasses}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
            </label>
            <select
              id={fieldId}
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              className={commonClasses}
              aria-required={field.required}
            >
              <option value="">Select an option</option>
              {field.options?.map((option, idx) => (
                <option key={idx} value={option}>{option}</option>
              ))}
            </select>
          </div>
        )
      
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              id={fieldId}
              type="checkbox"
              checked={formData[field.id] || false}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              required={field.required}
              aria-required={field.required}
              className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={fieldId} className="text-gray-700 dark:text-gray-300 cursor-pointer">
              {field.label}
              {field.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
            </label>
          </div>
        )
      
      case 'file':
        return (
          <div>
            <label htmlFor={fieldId} className={labelClasses}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
            </label>
            <input
              id={fieldId}
              type="file"
              onChange={(e) => handleFieldChange(field.id, e.target.files?.[0])}
              required={field.required}
              className={commonClasses}
              aria-required={field.required}
            />
          </div>
        )
      
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Form Not Found</h2>
          <p className="text-gray-600">This form is not available or has been removed.</p>
        </div>
      </div>
    )
  }

  if (!form.isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Form Closed</h2>
          <p className="text-gray-600">This form is not currently accepting responses.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-600">
            {form.settings?.thankYouMessage || 'Your response has been submitted successfully.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">{form.name}</h1>
            {form.description && (
              <p className="text-blue-100">{form.description}</p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
            {/* Submitter Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Email
                </label>
                <input
                  type="email"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Form Fields */}
            {form.fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit'}
              </button>
              
              {submitMutation.isError && (
                <p className="mt-2 text-sm text-red-600 text-center">
                  Failed to submit form. Please try again.
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

