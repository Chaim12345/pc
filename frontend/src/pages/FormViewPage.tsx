import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { logger } from '../utils/logger'

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
  const { showToast } = useToast()
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [submitterEmail, setSubmitterEmail] = useState('')
  const [submitterName, setSubmitterName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

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
      showToast('Form submitted successfully!', 'success')
    },
    onError: (error: any) => {
      logger.error('Form submission error:', error)
      showToast(error.response?.data?.error || 'Failed to submit form. Please try again.', 'error')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationErrors({})

    // Validate required fields
    const errors: Record<string, string> = {}
    if (form) {
      for (const field of form.fields) {
        if (field.required && !formData[field.id]) {
          errors[field.id] = `${field.label} is required`
        }
        // Email validation
        if (field.type === 'email' && formData[field.id] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[field.id])) {
          errors[field.id] = 'Please enter a valid email address'
        }
        // Phone validation (basic)
        if (field.type === 'phone' && formData[field.id] && !/^[\d\s\-+()]+$/.test(formData[field.id])) {
          errors[field.id] = 'Please enter a valid phone number'
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      showToast('Please fill in all required fields correctly', 'error')
      return
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
    const commonClasses = `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
      validationErrors[field.id] 
        ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20' 
        : 'border-[var(--vibe-border-light)] focus:ring-[var(--vibe-primary)] bg-[var(--vibe-bg-primary)]'
    } text-[var(--vibe-primary-text)]`
    const labelClasses = "block text-sm font-medium text-[var(--vibe-primary-text)] mb-2"

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
              onChange={(e) => {
                handleFieldChange(field.id, e.target.value)
                // Clear validation error when user starts typing
                if (validationErrors[field.id]) {
                  setValidationErrors(prev => {
                    const newErrors = { ...prev }
                    delete newErrors[field.id]
                    return newErrors
                  })
                }
              }}
              placeholder={field.placeholder}
              required={field.required}
              className={commonClasses}
              aria-required={field.required}
              aria-describedby={field.placeholder ? `${fieldId}-hint` : undefined}
              aria-invalid={!!validationErrors[field.id]}
            />
            {field.placeholder && (
              <span id={`${fieldId}-hint`} className="sr-only">{field.placeholder}</span>
            )}
            {validationErrors[field.id] && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {validationErrors[field.id]}
              </p>
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
              onChange={(e) => {
                handleFieldChange(field.id, e.target.value)
                if (validationErrors[field.id]) {
                  setValidationErrors(prev => {
                    const newErrors = { ...prev }
                    delete newErrors[field.id]
                    return newErrors
                  })
                }
              }}
              placeholder={field.placeholder}
              required={field.required}
              className={`${commonClasses} resize-none`}
              rows={4}
              aria-required={field.required}
              aria-describedby={field.placeholder ? `${fieldId}-hint` : undefined}
              aria-invalid={!!validationErrors[field.id]}
            />
            {field.placeholder && (
              <span id={`${fieldId}-hint`} className="sr-only">{field.placeholder}</span>
            )}
            {validationErrors[field.id] && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {validationErrors[field.id]}
              </p>
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
              onChange={(e) => {
                handleFieldChange(field.id, e.target.value)
                if (validationErrors[field.id]) {
                  setValidationErrors(prev => {
                    const newErrors = { ...prev }
                    delete newErrors[field.id]
                    return newErrors
                  })
                }
              }}
              required={field.required}
              className={commonClasses}
              aria-required={field.required}
              aria-invalid={!!validationErrors[field.id]}
            >
              <option value="">Select an option</option>
              {field.options?.map((option, idx) => (
                <option key={idx} value={option}>{option}</option>
              ))}
            </select>
            {validationErrors[field.id] && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {validationErrors[field.id]}
              </p>
            )}
          </div>
        )
      
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              id={fieldId}
              type="checkbox"
              checked={formData[field.id] || false}
              onChange={(e) => {
                handleFieldChange(field.id, e.target.checked)
                if (validationErrors[field.id]) {
                  setValidationErrors(prev => {
                    const newErrors = { ...prev }
                    delete newErrors[field.id]
                    return newErrors
                  })
                }
              }}
              required={field.required}
              aria-required={field.required}
              aria-invalid={!!validationErrors[field.id]}
              className="w-5 h-5 text-[var(--vibe-primary)] focus:ring-[var(--vibe-primary)] border-[var(--vibe-border-light)] rounded bg-[var(--vibe-bg-primary)]"
            />
            <label htmlFor={fieldId} className="text-[var(--vibe-primary-text)] cursor-pointer">
              {field.label}
              {field.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
            </label>
            {validationErrors[field.id] && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {validationErrors[field.id]}
              </p>
            )}
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
              onChange={(e) => {
                handleFieldChange(field.id, e.target.files?.[0])
                if (validationErrors[field.id]) {
                  setValidationErrors(prev => {
                    const newErrors = { ...prev }
                    delete newErrors[field.id]
                    return newErrors
                  })
                }
              }}
              required={field.required}
              className={commonClasses}
              aria-required={field.required}
              aria-invalid={!!validationErrors[field.id]}
            />
            {validationErrors[field.id] && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {validationErrors[field.id]}
              </p>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--vibe-bg-primary)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--vibe-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--vibe-secondary-text)]">Loading form...</p>
        </div>
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--vibe-bg-primary)]">
        <div className="text-center max-w-md p-8">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-[var(--vibe-primary-text)] mb-2">Form Not Found</h2>
          <p className="text-[var(--vibe-secondary-text)]">This form is not available or has been removed.</p>
        </div>
      </div>
    )
  }

  if (!form.isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--vibe-bg-primary)]">
        <div className="text-center max-w-md p-8">
          <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-2xl font-bold text-[var(--vibe-primary-text)] mb-2">Form Closed</h2>
          <p className="text-[var(--vibe-secondary-text)]">This form is not currently accepting responses.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--vibe-bg-primary)]">
        <div className="max-w-md w-full bg-[var(--vibe-bg-primary)] rounded-lg shadow-lg p-8 text-center border border-[var(--vibe-border-light)]">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[var(--vibe-primary-text)] mb-2">Thank You!</h2>
          <p className="text-[var(--vibe-secondary-text)]">
            {form.settings?.thankYouMessage || 'Your response has been submitted successfully.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--vibe-bg-primary)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[var(--vibe-bg-primary)] rounded-lg shadow-lg overflow-hidden border border-[var(--vibe-border-light)]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--vibe-primary)] to-[var(--vibe-primary-selected)] px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">{form.name}</h1>
            {form.description && (
              <p className="text-white/90">{form.description}</p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
            {/* Submitter Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-[var(--vibe-border-light)]">
              <div>
                <label className="block text-sm font-medium text-[var(--vibe-primary-text)] mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--vibe-border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--vibe-primary)] bg-[var(--vibe-bg-primary)] text-[var(--vibe-primary-text)]"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--vibe-primary-text)] mb-2">
                  Your Email
                </label>
                <input
                  type="email"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--vibe-border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--vibe-primary)] bg-[var(--vibe-bg-primary)] text-[var(--vibe-primary-text)]"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Form Fields */}
            {form.fields.map((field) => (
              <div key={field.id}>
                {renderField(field)}
              </div>
            ))}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full px-6 py-3 bg-[var(--vibe-primary)] hover:bg-[var(--vibe-primary-selected)] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {submitMutation.isPending ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

