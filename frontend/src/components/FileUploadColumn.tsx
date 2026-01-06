import React, { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Attachment } from '@monday-clone/shared';

interface FileUploadColumnProps {
  itemId: string;
  boardId: string;
  value?: Attachment[];
  onChange?: (files: Attachment[]) => void;
}

export default function FileUploadColumn({ itemId, boardId, value = [], onChange }: FileUploadColumnProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch attachments for this item
  const { data: attachments = [] } = useQuery<Attachment[]>({
    queryKey: ['attachments', itemId],
    queryFn: async () => {
      const response = await api.get(`/items/${itemId}/attachments`);
      return response.data.data || [];
    },
    enabled: !!itemId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/items/${itemId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', itemId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      await api.delete(`/attachments/${attachmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', itemId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        uploadMutation.mutate(file);
      });
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (mimeType.includes('pdf')) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  return (
    <div className="px-3 py-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {attachments.length > 0 ? (
        <div className="flex flex-col gap-1">
          {attachments.slice(0, 2).map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="text-gray-600 dark:text-gray-400">
                {getFileIcon(attachment.mimeType)}
              </div>
              <span className="text-xs truncate flex-1 text-gray-700 dark:text-gray-300">
                {attachment.filename}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {formatFileSize(attachment.size)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMutation.mutate(attachment.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:text-red-700 transition-all"
                title="Remove file"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {attachments.length > 2 && (
            <span className="text-xs text-gray-500 dark:text-gray-400 px-2">
              +{attachments.length - 2} more
            </span>
          )}
        </div>
      ) : null}
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadMutation.isPending}
        className="mt-1 flex items-center gap-1.5 px-2 py-1 text-xs text-monday-primary hover:text-monday-primaryHover dark:text-monday-primary dark:hover:text-white hover:bg-monday-primaryLight/20 dark:hover:bg-gray-800 rounded transition-all disabled:opacity-50"
      >
        {uploadMutation.isPending ? (
          <>
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{attachments.length > 0 ? 'Add more' : 'Add files'}</span>
          </>
        )}
      </button>
    </div>
  );
}








