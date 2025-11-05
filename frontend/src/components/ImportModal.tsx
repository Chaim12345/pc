import React, { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'

interface Props {
  boardId: string
  boardName: string
  isOpen: boolean
  onClose: () => void
}

export default function ImportModal({ boardId, boardName, isOpen, onClose }: Props) {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await api.post(`/import/${boardId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      showToast(
        `Import successful! ${data.data.imported} items created${data.data.errors ? ` (${data.data.errors.length} errors)` : ''}`,
        data.data.errors && data.data.errors.length > 0 ? 'warning' : 'success'
      )
      setSelectedFile(null)
      onClose()
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to import data', 'error')
    }
  })

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!validExtensions.includes(fileExt)) {
      showToast('Please upload a valid Excel (.xlsx, .xls) or CSV file', 'error')
      return
    }

    setSelectedFile(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleImport = () => {
    if (selectedFile) {
      importMutation.mutate(selectedFile)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-monday-border dark:border-gray-700">
          <h3 className="text-xl font-bold text-monday-text dark:text-white flex items-center space-x-2">
            <svg className="w-6 h-6 text-monday-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Import Data</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-monday-textLight dark:text-gray-400">
            Import data into <strong>{boardName}</strong> from an Excel or CSV file
          </p>

          {/* File Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 transition-all ${
              dragActive
                ? 'border-monday-primary bg-monday-primaryLight dark:bg-monday-primary/10'
                : 'border-monday-border dark:border-gray-700 hover:border-monday-primary'
            }`}
          >
            <div className="text-center">
              {selectedFile ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-monday-text dark:text-white">{selectedFile.name}</p>
                    <p className="text-sm text-monday-textLight dark:text-gray-400">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto bg-monday-primaryLight dark:bg-monday-primary/10 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-monday-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-monday-text dark:text-white font-medium mb-2">
                    Drag and drop your file here
                  </p>
                  <p className="text-sm text-monday-textLight dark:text-gray-400 mb-4">
                    or
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-monday-primary hover:bg-monday-primary/90 text-white rounded-lg font-medium transition-all"
                  >
                    Choose File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <p className="text-xs text-monday-textLight dark:text-gray-400 mt-3">
                    Supported formats: Excel (.xlsx, .xls), CSV (.csv)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Import Guidelines:</h4>
            <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>First row should contain column headers</li>
              <li>Include "Group" and "Item Name" columns</li>
              <li>Additional columns should match your board's column names</li>
              <li>Download the template to see the correct format</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-monday-border dark:border-gray-700">
            <button
              onClick={onClose}
              className="text-sm text-monday-textLight dark:text-gray-400 hover:text-monday-text dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedFile || importMutation.isPending}
              className="px-6 py-2 bg-monday-primary hover:bg-monday-primary/90 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importMutation.isPending ? 'Importing...' : 'Import Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



