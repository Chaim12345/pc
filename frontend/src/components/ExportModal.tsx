import React, { useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'

interface Props {
  boardId: string
  boardName: string
  isOpen: boolean
  onClose: () => void
}

export default function ExportModal({ boardId, boardName, isOpen, onClose }: Props) {
  const { showToast } = useToast()
  const [exporting, setExporting] = useState(false)
  const [format, setFormat] = useState<'excel' | 'csv' | 'pdf'>('excel')

  const handleExport = async () => {
    try {
      setExporting(true)
      
      const response = await api.get(`/export/${boardId}/${format}`, {
        responseType: 'blob'
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      
      const extensions = { excel: 'xlsx', csv: 'csv', pdf: 'pdf' }
      link.setAttribute('download', `${boardName}_${Date.now()}.${extensions[format]}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      showToast(`Board exported as ${format.toUpperCase()} successfully`, 'success')
      onClose()
    } catch (error: any) {
      console.error('Export error:', error)
      showToast('Failed to export board', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get(`/template/${boardId}`, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${boardName}_template.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      showToast('Template downloaded successfully', 'success')
    } catch (error: any) {
      showToast('Failed to download template', 'error')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-monday-border dark:border-gray-700">
          <h3 className="text-xl font-bold text-monday-text dark:text-white flex items-center space-x-2">
            <svg className="w-6 h-6 text-monday-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export Board</span>
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
            Export <strong>{boardName}</strong> to your preferred format
          </p>

          {/* Format Selection */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-monday-primary"
              style={{ borderColor: format === 'excel' ? '#4A90E2' : undefined }}>
              <input
                type="radio"
                name="format"
                value="excel"
                checked={format === 'excel'}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-4 h-4 text-monday-primary"
              />
              <div className="flex-1">
                <div className="font-semibold text-monday-text dark:text-white">Excel (.xlsx)</div>
                <div className="text-sm text-monday-textLight dark:text-gray-400">
                  Full-featured spreadsheet with formatting
                </div>
              </div>
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.17 3.25Q21.5 3.25 21.76 3.5 22 3.74 22 4.08V19.92Q22 20.26 21.76 20.5 21.5 20.75 21.17 20.75H7.83Q7.5 20.75 7.24 20.5 7 20.26 7 19.92V17H2.83Q2.5 17 2.24 16.74 2 16.5 2 16.17V7.83Q2 7.5 2.24 7.24 2.5 7 2.83 7H7V4.08Q7 3.74 7.24 3.5 7.5 3.25 7.83 3.25M7 13.06L8.18 15.28H9.97L8 12.06L9.93 8.89H8.22L7.13 10.9L7.09 10.96L7.06 11.03Q6.8 10.5 6.5 9.96 6.25 9.43 5.97 8.89H4.16L6.05 12.08L4 15.28H5.78M13.88 19.5V17H8.25V19.5M13.88 15.75V12.63H12V15.75M13.88 11.38V8.25H12V11.38M13.88 7V4.5H8.25V7M20.75 19.5V17H15.13V19.5M20.75 15.75V12.63H15.13V15.75M20.75 11.38V8.25H15.13V11.38M20.75 7V4.5H15.13V7Z" />
              </svg>
            </label>

            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-monday-primary"
              style={{ borderColor: format === 'csv' ? '#4A90E2' : undefined }}>
              <input
                type="radio"
                name="format"
                value="csv"
                checked={format === 'csv'}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-4 h-4 text-monday-primary"
              />
              <div className="flex-1">
                <div className="font-semibold text-monday-text dark:text-white">CSV (.csv)</div>
                <div className="text-sm text-monday-textLight dark:text-gray-400">
                  Simple text format, compatible with any app
                </div>
              </div>
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,20H5.5V19H18.5V20M18.5,17H5.5V16H18.5V17M18.5,14H5.5V13H18.5V14Z" />
              </svg>
            </label>

            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-monday-primary"
              style={{ borderColor: format === 'pdf' ? '#4A90E2' : undefined }}>
              <input
                type="radio"
                name="format"
                value="pdf"
                checked={format === 'pdf'}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-4 h-4 text-monday-primary"
              />
              <div className="flex-1">
                <div className="font-semibold text-monday-text dark:text-white">PDF (.pdf)</div>
                <div className="text-sm text-monday-textLight dark:text-gray-400">
                  Print-ready document format
                </div>
              </div>
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M15.2,20H13L12.4,18.1H9.6L9,20H6.8L10.2,11.5H11.8L15.2,20M10.1,16.5H11.9L11,13.8L10.1,16.5M13,9V3.5L18.5,9H13Z" />
              </svg>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-monday-border dark:border-gray-700">
            <button
              onClick={handleDownloadTemplate}
              className="text-sm text-monday-primary hover:text-monday-primaryHover font-medium"
            >
              Download Template
            </button>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-monday-border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-monday-text dark:text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-2 bg-monday-primary hover:bg-monday-primary/90 text-white rounded-lg font-medium transition-all disabled:opacity-50"
              >
                {exporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}






