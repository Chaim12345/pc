import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'
import { logger } from '../utils/logger'

interface FormField {
  id: string
  type: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'file' | 'textarea' | 'email' | 'phone'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: any
}

interface FormData {
  name: string
  description: string
  boardId: string
  groupId: string
  fields: FormField[]
  settings: {
    thankYouMessage?: string
    redirectUrl?: string
    allowMultipleSubmissions?: boolean
  }
  isPublic: boolean
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', icon: '📝' },
  { value: 'textarea', label: 'Long Text', icon: '📄' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'phone', label: 'Phone', icon: '📞' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'dropdown', label: 'Dropdown', icon: '📋' },
  { value: 'checkbox', label: 'Checkbox', icon: '✅' },
  { value: 'file', label: 'File Upload', icon: '📎' }
]

const FORM_TEMPLATES = {
  contact: {
    name: 'Contact Form',
    description: 'Collect contact information from visitors',
    fields: [
      { id: 'name', type: 'text', label: 'Full Name', required: true, placeholder: 'John Doe' },
      { id: 'email', type: 'email', label: 'Email Address', required: true, placeholder: 'john@example.com' },
      { id: 'phone', type: 'phone', label: 'Phone Number', required: false, placeholder: '+1 (555) 123-4567' },
      { id: 'company', type: 'text', label: 'Company', required: false, placeholder: 'Acme Inc.' },
      { id: 'message', type: 'textarea', label: 'Message', required: true, placeholder: 'How can we help you?' }
    ] as FormField[]
  },
  survey: {
    name: 'Customer Survey',
    description: 'Gather feedback from your customers',
    fields: [
      { id: 'name', type: 'text', label: 'Your Name', required: true, placeholder: 'Enter your name' },
      { id: 'rating', type: 'dropdown', label: 'Overall Satisfaction', required: true, options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'] },
      { id: 'recommend', type: 'dropdown', label: 'Would you recommend us?', required: true, options: ['Definitely', 'Probably', 'Not Sure', 'Probably Not', 'Definitely Not'] },
      { id: 'feedback', type: 'textarea', label: 'Additional Feedback', required: false, placeholder: 'Share your thoughts...' },
      { id: 'contact', type: 'checkbox', label: 'May we contact you about your feedback?', required: false }
    ] as FormField[]
  },
  registration: {
    name: 'Event Registration',
    description: 'Register attendees for events',
    fields: [
      { id: 'fullname', type: 'text', label: 'Full Name', required: true, placeholder: 'John Doe' },
      { id: 'email', type: 'email', label: 'Email Address', required: true, placeholder: 'john@example.com' },
      { id: 'phone', type: 'phone', label: 'Phone Number', required: true, placeholder: '+1 (555) 123-4567' },
      { id: 'company', type: 'text', label: 'Company/Organization', required: false, placeholder: 'Acme Inc.' },
      { id: 'dietary', type: 'dropdown', label: 'Dietary Restrictions', required: false, options: ['None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Other'] },
      { id: 'notes', type: 'textarea', label: 'Special Requirements', required: false, placeholder: 'Any special needs or requests?' }
    ] as FormField[]
  }
}

export default function FormEditorPage() {
  const { formId } = useParams<{ formId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const isNewForm = formId === 'new'
  const boardId = searchParams.get('boardId')

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    boardId: boardId || '',
    groupId: '',
    fields: [],
    settings: {
      thankYouMessage: 'Thank you for your submission!',
      allowMultipleSubmissions: true
    },
    isPublic: true
  })

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [groups, setGroups] = useState<any[]>([])
  const [showTemplates, setShowTemplates] = useState(isNewForm && formData.fields.length === 0)

  // Fetch existing form
  const { data: existingForm } = useQuery({
    queryKey: ['form', formId],
    queryFn: async () => {
      const response = await api.get(`/forms/${formId}`)
      return response.data.data
    },
    enabled: !isNewForm && !!formId
  })

  // Fetch groups for board
  useEffect(() => {
    if (formData.boardId) {
      api.get(`/groups/board/${formData.boardId}`)
        .then(response => setGroups(response.data.data))
        .catch(error => logger.error('Failed to fetch groups:', error))
    }
  }, [formData.boardId])

  // Load existing form data
  useEffect(() => {
    if (existingForm) {
      setFormData({
        name: existingForm.name,
        description: existingForm.description || '',
        boardId: existingForm.boardId,
        groupId: existingForm.groupId,
        fields: existingForm.fields || [],
        settings: existingForm.settings || {},
        isPublic: existingForm.isPublic
      })
    }
  }, [existingForm])

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isNewForm) {
        return await api.post('/forms', data)
      } else {
        return await api.put(`/forms/${formId}`, data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      showToast(`Form ${isNewForm ? 'created' : 'updated'} successfully`, 'success')
      navigate(`/forms/board/${formData.boardId}`)
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to save form', 'error')
    }
  })

  const addField = (type: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: type as any,
      label: `New ${type} field`,
      required: false,
      placeholder: '',
      options: type === 'dropdown' ? ['Option 1', 'Option 2'] : undefined
    }
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }))
    setEditingFieldId(newField.id)
  }

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    }))
  }

  const deleteField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId)
    }))
  }

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    setFormData(prev => {
      const index = prev.fields.findIndex(f => f.id === fieldId)
      if (index === -1) return prev
      
      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= prev.fields.length) return prev

      const newFields = [...prev.fields]
      const [removed] = newFields.splice(index, 1)
      newFields.splice(newIndex, 0, removed)

      return { ...prev, fields: newFields }
    })
  }

  const applyTemplate = (templateKey: keyof typeof FORM_TEMPLATES) => {
    const template = FORM_TEMPLATES[templateKey]
    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      fields: template.fields.map(f => ({ ...f, id: `field_${Date.now()}_${Math.random()}` }))
    }))
    setShowTemplates(false)
    showToast(`${template.name} template applied!`, 'success')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      showToast('Please enter a form name', 'error')
      return
    }
    
    if (!formData.groupId) {
      showToast('Please select a group', 'error')
      return
    }
    
    if (formData.fields.length === 0) {
      showToast('Please add at least one field', 'error')
      return
    }

    saveMutation.mutate(formData)
  }

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
            {isNewForm ? 'Create New Form' : 'Edit Form'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form Builder */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-monday-text dark:text-white mb-4">Form Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                    Form Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                    placeholder="Enter form name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary resize-none"
                    rows={3}
                    placeholder="Enter form description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                    Target Group *
                  </label>
                  <select
                    value={formData.groupId}
                    onChange={(e) => setFormData(prev => ({ ...prev, groupId: e.target.value }))}
                    className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                    required
                  >
                    <option value="">Select a group</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>{group.title}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-monday-textLight dark:text-gray-400">
                    Form submissions will create items in this group
                  </p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-monday-text dark:text-white">Form Fields</h2>
                {isNewForm && formData.fields.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="text-sm text-monday-primary hover:text-monday-primaryHover font-medium"
                  >
                    {showTemplates ? 'Hide Templates' : 'Use Template'}
                  </button>
                )}
              </div>
              
              {/* Templates */}
              {showTemplates && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => applyTemplate('contact')}
                    className="p-4 border-2 border-monday-border dark:border-gray-700 rounded-lg hover:border-monday-primary hover:bg-monday-primaryLight dark:hover:bg-monday-primary/10 transition-all text-left group"
                  >
                    <div className="text-3xl mb-2">📧</div>
                    <h3 className="font-semibold text-monday-text dark:text-white mb-1 group-hover:text-monday-primary">
                      Contact Form
                    </h3>
                    <p className="text-xs text-monday-textLight dark:text-gray-400">
                      Name, email, phone, company, message
                    </p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => applyTemplate('survey')}
                    className="p-4 border-2 border-monday-border dark:border-gray-700 rounded-lg hover:border-monday-primary hover:bg-monday-primaryLight dark:hover:bg-monday-primary/10 transition-all text-left group"
                  >
                    <div className="text-3xl mb-2">📊</div>
                    <h3 className="font-semibold text-monday-text dark:text-white mb-1 group-hover:text-monday-primary">
                      Customer Survey
                    </h3>
                    <p className="text-xs text-monday-textLight dark:text-gray-400">
                      Satisfaction ratings and feedback
                    </p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => applyTemplate('registration')}
                    className="p-4 border-2 border-monday-border dark:border-gray-700 rounded-lg hover:border-monday-primary hover:bg-monday-primaryLight dark:hover:bg-monday-primary/10 transition-all text-left group"
                  >
                    <div className="text-3xl mb-2">🎫</div>
                    <h3 className="font-semibold text-monday-text dark:text-white mb-1 group-hover:text-monday-primary">
                      Event Registration
                    </h3>
                    <p className="text-xs text-monday-textLight dark:text-gray-400">
                      Attendee info with special requirements
                    </p>
                  </button>
                </div>
              )}
              
              {/* Field List */}
              <div className="space-y-3 mb-4">
                {formData.fields.length === 0 ? (
                  <div className="text-center py-8 text-monday-textLight dark:text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No fields added yet. {showTemplates ? 'Choose a template above or add' : 'Add'} fields from the panel on the right.</p>
                  </div>
                ) : (
                  formData.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border border-monday-border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      {editingFieldId === field.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                            placeholder="Field label"
                          />
                          
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                            className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary"
                            placeholder="Placeholder text (optional)"
                          />

                          {field.type === 'dropdown' && (
                            <div>
                              <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                                Options (one per line)
                              </label>
                              <textarea
                                value={field.options?.join('\n') || ''}
                                onChange={(e) => updateField(field.id, { 
                                  options: e.target.value.split('\n').filter(o => o.trim()) 
                                })}
                                className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary resize-none"
                                rows={4}
                              />
                            </div>
                          )}

                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(field.id, { required: e.target.checked })}
                              className="w-4 h-4 text-monday-primary focus:ring-monday-primary border-monday-border dark:border-gray-700 rounded"
                            />
                            <span className="text-sm text-monday-text dark:text-white">Required field</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => setEditingFieldId(null)}
                            className="px-3 py-1 text-sm text-monday-primary hover:bg-monday-primaryLight dark:hover:bg-monday-primary/20 rounded transition-colors"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{FIELD_TYPES.find(t => t.value === field.type)?.icon}</span>
                              <div>
                                <p className="font-medium text-monday-text dark:text-white">
                                  {field.label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </p>
                                <p className="text-xs text-monday-textLight dark:text-gray-400">
                                  {FIELD_TYPES.find(t => t.value === field.type)?.label}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => moveField(field.id, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30 transition-colors"
                              title="Move up"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => moveField(field.id, 'down')}
                              disabled={index === formData.fields.length - 1}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30 transition-colors"
                              title="Move down"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingFieldId(field.id)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteField(field.id)}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-monday-text dark:text-white mb-4">Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-monday-text dark:text-white mb-2">
                    Thank You Message
                  </label>
                  <textarea
                    value={formData.settings.thankYouMessage || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, thankYouMessage: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:outline-none focus:ring-2 focus:ring-monday-primary resize-none"
                    rows={3}
                    placeholder="Message shown after successful submission"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="w-4 h-4 text-monday-primary focus:ring-monday-primary border-monday-border dark:border-gray-700 rounded"
                    />
                    <span className="text-sm text-monday-text dark:text-white">Form is active and accepting responses</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.settings.allowMultipleSubmissions || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, allowMultipleSubmissions: e.target.checked }
                      }))}
                      className="w-4 h-4 text-monday-primary focus:ring-monday-primary border-monday-border dark:border-gray-700 rounded"
                    />
                    <span className="text-sm text-monday-text dark:text-white">Allow multiple submissions</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="px-6 py-2 bg-monday-primary hover:bg-monday-primary/90 text-white rounded-lg font-medium transition-all disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving...' : isNewForm ? 'Create Form' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 border border-monday-border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-monday-text dark:text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Right: Field Types */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-lg p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-monday-text dark:text-white mb-4">Add Fields</h2>
              
              <div className="space-y-2">
                {FIELD_TYPES.map(fieldType => (
                  <button
                    key={fieldType.value}
                    type="button"
                    onClick={() => addField(fieldType.value)}
                    className="w-full flex items-center space-x-3 px-4 py-3 border border-monday-border dark:border-gray-700 rounded-lg hover:border-monday-primary hover:bg-monday-primaryLight dark:hover:bg-monday-primary/10 transition-all group"
                  >
                    <span className="text-2xl">{fieldType.icon}</span>
                    <span className="text-sm font-medium text-monday-text dark:text-white group-hover:text-monday-primary">
                      {fieldType.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

