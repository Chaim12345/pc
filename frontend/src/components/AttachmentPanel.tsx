import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Attachment } from '@monday-clone/shared'
import { api } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { format } from 'date-fns'
import ConfirmationDialog from './ConfirmationDialog'

interface AttachmentPanelProps {
  itemId: string
  boardId: string
  isOpen: boolean
  onClose?: () => void
  embedded?: boolean
}

export default function AttachmentPanel({ itemId, boardId, isOpen, onClose, embedded = false }: AttachmentPanelProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [deleteAttachmentId, setDeleteAttachmentId] = useState<string | null>(null)

  const { data: attachments = [] } = useQuery<Attachment[]>({
    queryKey: ['attachments', itemId],
    queryFn: async () => {
      const response = await api.get(`/attachments/item/${itemId}`)
      return response.data.data
    },
    enabled: isOpen && !!itemId,
  })

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const response = await api.delete(`/attachments/${attachmentId}`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', itemId] })
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('itemId', itemId)

    try {
      const response = await api.post('/attachments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      queryClient.invalidateQueries({ queryKey: ['attachments', itemId] })
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      showToast('File uploaded successfully!', 'success')
    } catch (error) {
      console.error('Upload error:', error)
      showToast('Failed to upload file', 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await api.get(`/attachments/${attachment.id}/download`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', attachment.filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      showToast('File downloaded successfully', 'success')
    } catch (error) {
      console.error('Download error:', error)
      showToast('Failed to download file', 'error')
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.startsWith('video/')) return '🎥'
    if (mimeType.startsWith('audio/')) return '🎵'
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊'
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦'
    return '📎'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (!isOpen) return null

  const content = (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        {attachments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No attachments yet. Upload a file to get started!</div>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="text-2xl">{getFileIcon(attachment.mimeType)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{attachment.filename}</div>
                    <div className="text-sm text-gray-500">
                      {formatFileSize(attachment.size)} • {format(new Date(attachment.createdAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownload(attachment)}
                    className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => setDeleteAttachmentId(attachment.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 border-t">
        <label className="block">
          <div className="flex items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
            <div className="flex flex-col items-center justify-center">
              <svg
                className="w-8 h-8 mb-2 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-sm text-gray-500">
                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </span>
            </div>
          </div>
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>
    </>
  )

  if (embedded) {
    return <div className="flex flex-col h-full">{content}</div>
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Attachments</h2>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
              ×
            </button>
          )}
        </div>
        {content}
      </div>
      
      <ConfirmationDialog
        isOpen={!!deleteAttachmentId}
        title="Delete Attachment"
        message="Are you sure you want to delete this attachment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (deleteAttachmentId) {
            deleteAttachmentMutation.mutate(deleteAttachmentId)
            setDeleteAttachmentId(null)
          }
        }}
        onCancel={() => setDeleteAttachmentId(null)}
      />
    </div>
  )
}

