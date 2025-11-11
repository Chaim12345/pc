import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'

interface Template {
  id: string
  name: string
  description: string
  category: string
  icon: string
  columns: Array<{
    name: string
    type: string
    settings?: any
  }>
  groups: Array<{
    name: string
    items: any[]
  }>
}

export default function Templates() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [boardName, setBoardName] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await api.get('/templates')
      return response.data.data
    },
  })

  const templates: Template[] = templatesData || []
  const categories = Array.from(new Set(templates.map((t) => t.category)))

  const filteredTemplates = templates.filter((t) => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const createBoardMutation = useMutation({
    mutationFn: async ({ templateId, name }: { templateId: string; name: string }) => {
      const response = await api.post(`/templates/${templateId}/create-board`, {
        name,
        organizationId: user?.organizationId,
      })
      return response.data.data
    },
    onSuccess: (board) => {
      showToast('Board created successfully!', 'success')
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      navigate(`/board/${board.id}`)
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to create board', 'error')
    },
  })

  const handleCreateBoard = () => {
    if (!selectedTemplate || !boardName.trim()) {
      showToast('Please enter a board name', 'warning')
      return
    }
    createBoardMutation.mutate({ templateId: selectedTemplate.id, name: boardName })
  }

  const handleUseTemplate = (template: Template) => {
    setSelectedTemplate(template)
    setBoardName(template.name)
  }

  const handlePreviewTemplate = (template: Template) => {
    setPreviewTemplate(template)
    setShowPreview(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-monday-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg text-monday-textLight dark:text-gray-400">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-monday-background dark:bg-monday-dark p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-monday-text dark:text-white mb-2">Board Templates</h1>
          <p className="text-lg text-monday-textLight dark:text-gray-400">
            Choose from {templates.length} pre-built templates to get up and running quickly
          </p>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full px-4 py-3 pl-12 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-darkLight text-monday-text dark:text-white focus:ring-2 focus:ring-monday-primary focus:border-transparent"
            />
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-monday-textLight dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button onClick={() => setSelectedCategory('all')} className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${selectedCategory === 'all' ? 'bg-monday-primary text-white shadow-md' : 'bg-white dark:bg-monday-darkLight text-monday-text dark:text-white border border-monday-border dark:border-gray-700 hover:border-monday-primary'}`}>
            All ({templates.length})
          </button>
          {categories.map((category) => {
            const count = templates.filter(t => t.category === category).length
            return (
              <button key={category} onClick={() => setSelectedCategory(category)} className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${selectedCategory === category ? 'bg-monday-primary text-white shadow-md' : 'bg-white dark:bg-monday-darkLight text-monday-text dark:text-white border border-monday-border dark:border-gray-700 hover:border-monday-primary'}`}>
                {category} ({count})
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white dark:bg-monday-darkLight border border-monday-border dark:border-gray-700 rounded-xl p-6 hover:shadow-2xl hover:border-monday-primary transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-monday-blue to-monday-purple rounded-2xl flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform">{template.icon}</div>
              <h3 className="text-xl font-bold text-monday-text dark:text-white mb-2 group-hover:text-monday-primary transition-colors">{template.name}</h3>
              <p className="text-sm text-monday-textLight dark:text-gray-400 mb-4 min-h-[40px]">{template.description}</p>
              <div className="flex items-center gap-4 mb-4 text-xs text-monday-textLight dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10m0-10a2 2 0 012 2h2a2 2 0 012-2m0 0v10a2 2 0 01-2 2h-2a2 2 0 01-2-2" /></svg>
                  {template.columns.length} columns
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                  {template.groups.length} groups
                </span>
              </div>
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-monday-background dark:bg-gray-800 text-monday-primary text-xs font-medium rounded-full">{template.category}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleUseTemplate(template)} className="flex-1 px-4 py-2 bg-monday-primary text-white rounded-lg font-medium hover:bg-monday-primaryHover transition-colors text-sm">Use Template</button>
                <button onClick={() => handlePreviewTemplate(template)} className="px-4 py-2 border border-monday-border dark:border-gray-700 text-monday-text dark:text-white rounded-lg font-medium hover:bg-monday-background dark:hover:bg-gray-800 transition-colors text-sm" title="Preview template">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="text-lg text-monday-textLight dark:text-gray-400 mb-2">{searchQuery ? 'No templates match your search' : 'No templates found in this category'}</p>
            {searchQuery && <button onClick={() => setSearchQuery('')} className="text-monday-primary hover:underline">Clear search</button>}
          </div>
        )}
      </div>

      {showPreview && previewTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-monday-border dark:border-gray-700">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{previewTemplate.icon}</span>
                <div><h2 className="text-2xl font-bold text-monday-text dark:text-white">{previewTemplate.name}</h2><p className="text-sm text-monday-textLight dark:text-gray-400">{previewTemplate.category} • {previewTemplate.columns.length} columns • {previewTemplate.groups.length} groups</p></div>
              </div>
              <button onClick={() => { setShowPreview(false); setPreviewTemplate(null); }} className="w-8 h-8 flex items-center justify-center text-monday-textLight hover:text-monday-text dark:hover:text-white hover:bg-monday-background dark:hover:bg-gray-800 rounded-lg transition-colors" aria-label="Close preview"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-monday-textLight dark:text-gray-400 mb-6">{previewTemplate.description}</p>
              <div className="mb-6"><h3 className="text-lg font-bold text-monday-text dark:text-white mb-3">Columns ({previewTemplate.columns.length})</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{previewTemplate.columns.map((column, index) => (<div key={index} className="p-3 bg-monday-background dark:bg-gray-800 rounded-lg border border-monday-border dark:border-gray-700"><div className="font-medium text-monday-text dark:text-white text-sm">{column.name}</div><div className="text-xs text-monday-textLight dark:text-gray-400 capitalize">{column.type}</div></div>))}</div></div>
              <div><h3 className="text-lg font-bold text-monday-text dark:text-white mb-3">Groups ({previewTemplate.groups.length})</h3><div className="space-y-2">{previewTemplate.groups.map((group, index) => (<div key={index} className="p-3 bg-monday-background dark:bg-gray-800 rounded-lg border border-monday-border dark:border-gray-700 flex items-center gap-2"><svg className="w-4 h-4 text-monday-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg><span className="font-medium text-monday-text dark:text-white text-sm">{group.name}</span></div>))}</div></div>
            </div>
            <div className="p-6 border-t border-monday-border dark:border-gray-700 flex gap-3"><button onClick={() => { setShowPreview(false); setPreviewTemplate(null); }} className="flex-1 px-4 py-3 border border-monday-border dark:border-gray-700 text-monday-text dark:text-white rounded-lg font-medium hover:bg-monday-background dark:hover:bg-gray-800 transition-colors">Close</button><button onClick={() => { setShowPreview(false); handleUseTemplate(previewTemplate); }} className="flex-1 px-4 py-3 bg-monday-primary text-white rounded-lg font-medium hover:bg-monday-primaryHover transition-all">Use This Template</button></div>
          </div>
        </div>
      )}

      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold text-monday-text dark:text-white">Create Board from Template</h2><button onClick={() => { setSelectedTemplate(null); setBoardName(''); }} className="w-8 h-8 flex items-center justify-center text-monday-textLight hover:text-monday-text dark:hover:text-white hover:bg-monday-background dark:hover:bg-gray-800 rounded-lg transition-colors" aria-label="Close"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <div className="mb-6 p-4 bg-monday-background dark:bg-gray-800 rounded-lg"><div className="flex items-center space-x-3 mb-2"><span className="text-3xl">{selectedTemplate.icon}</span><div><h3 className="font-semibold text-monday-text dark:text-white">{selectedTemplate.name}</h3><p className="text-sm text-monday-textLight dark:text-gray-400">{selectedTemplate.category}</p></div></div><p className="text-sm text-monday-textLight dark:text-gray-400">{selectedTemplate.description}</p></div>
            <div className="mb-6"><label className="block text-sm font-medium text-monday-text dark:text-white mb-2">Board Name</label><input type="text" value={boardName} onChange={(e) => setBoardName(e.target.value)} placeholder="Enter board name" className="w-full px-4 py-3 border border-monday-border dark:border-gray-700 rounded-lg bg-white dark:bg-monday-dark text-monday-text dark:text-white focus:ring-2 focus:ring-monday-primary focus:border-transparent" autoFocus onKeyDown={(e) => { if (e.key === 'Enter' && boardName.trim()) handleCreateBoard(); }} /></div>
            <div className="flex space-x-3"><button onClick={() => { setSelectedTemplate(null); setBoardName(''); }} className="flex-1 px-4 py-3 border border-monday-border dark:border-gray-700 text-monday-text dark:text-white rounded-lg font-medium hover:bg-monday-background dark:hover:bg-gray-800 transition-colors">Cancel</button><button onClick={handleCreateBoard} disabled={createBoardMutation.isPending || !boardName.trim()} className="flex-1 px-4 py-3 bg-monday-primary text-white rounded-lg font-medium hover:bg-monday-primaryHover disabled:opacity-50 disabled:cursor-not-allowed transition-all">{createBoardMutation.isPending ? 'Creating...' : 'Create Board'}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
