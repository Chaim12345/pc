import React, { useEffect, useCallback, useState } from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Dropcursor from '@tiptap/extension-dropcursor'
import Gapcursor from '@tiptap/extension-gapcursor'
import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { renderSlashCommands } from './SlashCommands'
import { api } from '../services/api'
import { useToast } from '../contexts/ToastContext'

interface Props {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

// Create slash command extension
const SlashCommand = Extension.create({
  name: 'slashCommand',
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        allowSpaces: true,
        startOfLine: false,
        ...renderSlashCommands()
      })
    ]
  }
})

export default function TipTapEditor({ content, onChange, placeholder }: Props) {
  const { showToast } = useToast()
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        strike: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
        emptyEditorClass: 'cursor-text before:content-[attr(data-placeholder)] before:absolute before:top-0 before:left-0 before:text-[var(--vibe-secondary-text)] before:pointer-events-none before:opacity-60'
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[var(--vibe-primary)] hover:underline cursor-pointer transition-colors decoration-2 underline-offset-2'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-xl my-6 shadow-lg border border-[var(--vibe-border-light)] transition-all hover:shadow-xl'
        },
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-[var(--vibe-border-light)] my-6 rounded-lg overflow-hidden shadow-sm'
        }
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border border-[var(--vibe-border-light)] hover:bg-[var(--vibe-bg-hover)] transition-colors'
        }
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-[var(--vibe-border-light)] bg-[var(--vibe-bg-hover)] px-4 py-3 font-semibold text-sm'
        }
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-[var(--vibe-border-light)] px-4 py-3 focus-within:ring-2 focus-within:ring-[var(--vibe-primary)] focus-within:ring-offset-1 transition-all'
        }
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'list-none pl-0 my-4 space-y-2'
        }
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start my-2 group'
        }
      }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'px-1 rounded bg-yellow-200 dark:bg-yellow-900/40'
        }
      }),
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Dropcursor.configure({
        color: 'var(--vibe-primary)',
        width: 3,
      }),
      Gapcursor,
      SlashCommand,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] text-[var(--vibe-primary-text)] prose-headings:font-bold prose-h1:text-4xl prose-h1:mt-8 prose-h1:mb-4 prose-h2:text-3xl prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-2xl prose-h3:mt-4 prose-h3:mb-2 prose-p:text-base prose-p:leading-relaxed prose-p:my-3 prose-li:my-2 prose-table:w-full prose-th:border prose-td:border prose-th:p-2 prose-td:p-2 prose-blockquote:border-l-4 prose-blockquote:border-[var(--vibe-primary)] prose-blockquote:pl-4 prose-blockquote:italic prose-code:bg-[var(--vibe-bg-hover)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-[var(--vibe-bg-secondary)] prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto'
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0]
          if (file.type.startsWith('image/')) {
            handleImageUpload(file)
            return true
          }
        }
        return false
      },
      handlePaste: (view, event, _slice) => {
        const items = Array.from(event.clipboardData?.items || [])
        const imageItem = items.find(item => item.type.startsWith('image/'))
        if (imageItem) {
          const file = imageItem.getAsFile()
          if (file) {
            handleImageUpload(file)
            return true
          }
        }
        return false
      },
    }
  })

  // Sync editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [content, editor])

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image size must be less than 10MB', 'error')
      return
    }

    setIsUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/attachments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const imageUrl = response.data.data?.url || response.data.data?.fileUrl
      if (imageUrl) {
        editor.chain().focus().setImage({ src: imageUrl }).run()
        showToast('Image uploaded successfully', 'success')
      }
    } catch (error: any) {
      console.error('Failed to upload image:', error)
      showToast(error.response?.data?.error || 'Failed to upload image', 'error')
      // Fallback: create object URL for preview
      const objectUrl = URL.createObjectURL(file)
      editor.chain().focus().setImage({ src: objectUrl }).run()
    } finally {
      setIsUploadingImage(false)
    }
  }, [editor, showToast])

  const handleAddLink = () => {
    if (!editor) return
    
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to)
    
    if (editor.isActive('link')) {
      const attrs = editor.getAttributes('link')
      setLinkUrl(attrs.href || '')
      setLinkText(selectedText || '')
    } else {
      setLinkUrl('')
      setLinkText(selectedText || '')
    }
    
    setShowLinkModal(true)
  }

  const handleSaveLink = () => {
    if (!editor || !linkUrl.trim()) return

    if (linkText.trim()) {
      editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run()
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).run()
    }
    
    setShowLinkModal(false)
    setLinkUrl('')
    setLinkText('')
  }

  const handleRemoveLink = () => {
    if (!editor) return
    editor.chain().focus().unsetLink().run()
    setShowLinkModal(false)
  }

  const addImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleImageUpload(file)
      }
    }
    input.click()
  }

  const addTable = () => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const insertTableRow = () => {
    if (!editor) return
    editor.chain().focus().addRowAfter().run()
  }

  const deleteTableRow = () => {
    if (!editor) return
    editor.chain().focus().deleteRow().run()
  }

  const insertTableColumn = () => {
    if (!editor) return
    editor.chain().focus().addColumnAfter().run()
  }

  const deleteTableColumn = () => {
    if (!editor) return
    editor.chain().focus().deleteColumn().run()
  }

  const deleteTable = () => {
    if (!editor) return
    editor.chain().focus().deleteTable().run()
  }

  if (!editor) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-pulse text-[var(--vibe-secondary-text)]">Loading editor...</div>
      </div>
    )
  }

  const isTableActive = editor.isActive('table')
  const hasSelection = editor.state.selection.empty === false

  return (
    <div className="overflow-hidden bg-transparent relative">
      {/* Floating Bubble Menu - Appears on text selection */}
      {hasSelection && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{
            duration: 200,
            placement: 'top',
            animation: 'scale',
          }}
          className="bubble-menu"
        >
          <div className="flex items-center gap-1 bg-[var(--vibe-bg-primary)] border border-[var(--vibe-border-light)] rounded-lg shadow-xl p-1.5 backdrop-blur-sm">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Bold"
              size="small"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Italic"
              size="small"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <line x1="19" y1="4" x2="10" y2="4" strokeWidth={2} />
                <line x1="14" y1="20" x2="5" y2="20" strokeWidth={2} />
                <line x1="15" y1="4" x2="9" y2="20" strokeWidth={2} />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title="Underline"
              size="small"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19h14M5 5h14" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive('highlight')}
              title="Highlight"
              size="small"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </ToolbarButton>
            <div className="w-px h-6 bg-[var(--vibe-border-light)] mx-1" />
            <ToolbarButton
              onClick={handleAddLink}
              isActive={editor.isActive('link')}
              title="Add Link"
              size="small"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </ToolbarButton>
          </div>
        </BubbleMenu>
      )}

      {/* Main Toolbar - Improved organization */}
      <div className="sticky top-16 z-10 mb-6 bg-[var(--vibe-bg-primary)]/95 backdrop-blur-md border border-[var(--vibe-border-light)] rounded-xl p-2.5 flex flex-wrap gap-1.5 shadow-lg transition-all duration-200"
        style={{ marginLeft: '-0.5rem', marginRight: '-0.5rem' }}
      >
        {/* Text Formatting Group */}
        <ToolbarGroup label="Formatting">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
            shortcut="Ctrl+B"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
            shortcut="Ctrl+I"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="19" y1="4" x2="10" y2="4" strokeWidth={2} />
              <line x1="14" y1="20" x2="5" y2="20" strokeWidth={2} />
              <line x1="15" y1="4" x2="9" y2="20" strokeWidth={2} />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline (Ctrl+U)"
            shortcut="Ctrl+U"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19h14M5 5h14" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M9 5v14M15 5v14" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Inline Code"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive('highlight')}
            title="Highlight"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </ToolbarButton>
        </ToolbarGroup>

        {/* Headings Group */}
        <ToolbarGroup label="Headings">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <span className="font-bold text-sm">H1</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <span className="font-bold text-sm">H2</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <span className="font-bold text-sm">H3</span>
          </ToolbarButton>
        </ToolbarGroup>

        {/* Lists Group */}
        <ToolbarGroup label="Lists">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h1v5H3V4zM3 10h1l1 5H3v-5zM8 6h13M8 12h13M8 18h13M3 16h1l1 5H3v-5z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive('taskList')}
            title="Task List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </ToolbarButton>
        </ToolbarGroup>

        {/* Alignment Group */}
        <ToolbarGroup label="Alignment">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H3M21 14H3M21 6H3" />
            </svg>
          </ToolbarButton>
        </ToolbarGroup>

        {/* Insert Group */}
        <ToolbarGroup label="Insert">
          <ToolbarButton
            onClick={handleAddLink}
            isActive={editor.isActive('link')}
            title="Add Link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={addImage}
            title="Add Image"
            disabled={isUploadingImage}
          >
            {isUploadingImage ? (
              <div className="w-4 h-4 border-2 border-[var(--vibe-primary)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </ToolbarButton>
          {!isTableActive && (
            <ToolbarButton
              onClick={addTable}
              title="Insert Table"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </ToolbarButton>
          )}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Blockquote"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21c0-4.418 3.582-8 8-8s8 3.582 8 8M13 3c0 4.418-3.582 8-8 8S5 7.418 5 3" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
          </ToolbarButton>
        </ToolbarGroup>

        {/* Table Controls - Only show when table is active */}
        {isTableActive && (
          <ToolbarGroup label="Table">
            <ToolbarButton onClick={insertTableRow} title="Add Row">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </ToolbarButton>
            <ToolbarButton onClick={deleteTableRow} title="Delete Row">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </ToolbarButton>
            <ToolbarButton onClick={insertTableColumn} title="Add Column">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" transform="rotate(90 12 12)" />
              </svg>
            </ToolbarButton>
            <ToolbarButton onClick={deleteTableColumn} title="Delete Column">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" transform="rotate(90 12 12)" />
              </svg>
            </ToolbarButton>
            <ToolbarButton onClick={deleteTable} title="Delete Table">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </ToolbarButton>
          </ToolbarGroup>
        )}

        {/* Actions Group */}
        <ToolbarGroup label="Actions" className="ml-auto">
          <ToolbarButton
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            title="Clear Formatting"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
            shortcut="Ctrl+Z"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Shift+Z)"
            shortcut="Ctrl+Shift+Z"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </ToolbarButton>
        </ToolbarGroup>
      </div>

      {/* Link Modal - Better UX than prompt */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowLinkModal(false)}>
          <div className="bg-[var(--vibe-bg-primary)] border border-[var(--vibe-border-light)] rounded-xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[var(--vibe-primary-text)] mb-4">Add Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--vibe-secondary-text)] mb-2">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-[var(--vibe-border-light)] rounded-lg bg-[var(--vibe-bg-secondary)] text-[var(--vibe-primary-text)] focus:outline-none focus:ring-2 focus:ring-[var(--vibe-primary)] transition-all"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveLink()
                    } else if (e.key === 'Escape') {
                      setShowLinkModal(false)
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--vibe-secondary-text)] mb-2">Text (optional)</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Link text"
                  className="w-full px-3 py-2 border border-[var(--vibe-border-light)] rounded-lg bg-[var(--vibe-bg-secondary)] text-[var(--vibe-primary-text)] focus:outline-none focus:ring-2 focus:ring-[var(--vibe-primary)] transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveLink()
                    } else if (e.key === 'Escape') {
                      setShowLinkModal(false)
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                {editor.isActive('link') && (
                  <button
                    onClick={handleRemoveLink}
                    className="px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    Remove Link
                  </button>
                )}
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 text-sm font-medium text-[var(--vibe-secondary-text)] hover:bg-[var(--vibe-bg-hover)] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLink}
                  disabled={!linkUrl.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-[var(--vibe-primary)] hover:bg-[var(--vibe-primary-selected)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="min-h-[600px] text-lg relative">
        <EditorContent editor={editor} />
      </div>

      {/* Upload Progress Indicator */}
      {isUploadingImage && (
        <div className="fixed bottom-4 right-4 bg-[var(--vibe-bg-primary)] border border-[var(--vibe-border-light)] rounded-lg shadow-lg p-3 flex items-center gap-3 z-50">
          <div className="w-5 h-5 border-2 border-[var(--vibe-primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[var(--vibe-primary-text)]">Uploading image...</span>
        </div>
      )}
    </div>
  )
}

interface ToolbarGroupProps {
  label?: string
  children: React.ReactNode
  className?: string
}

function ToolbarGroup({ label, children, className = '' }: ToolbarGroupProps) {
  return (
    <div className={`flex items-center gap-1 border-r border-[var(--vibe-border-light)] pr-2 last:border-r-0 ${className}`}>
      {children}
    </div>
  )
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title?: string
  shortcut?: string
  size?: 'small' | 'normal'
  children: React.ReactNode
}

function ToolbarButton({ onClick, isActive, disabled, title, shortcut, size = 'normal', children }: ToolbarButtonProps) {
  const padding = size === 'small' ? 'p-1.5' : 'p-2'
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${title} (${shortcut})` : title}
      className={`${padding} rounded-lg transition-all duration-150 ${
        isActive
          ? 'bg-[var(--vibe-primary)] text-white shadow-md scale-105'
          : 'text-[var(--vibe-icon-color)] hover:bg-[var(--vibe-bg-hover)] hover:scale-105'
      } ${
        disabled ? 'opacity-40 cursor-not-allowed hover:scale-100' : 'cursor-pointer'
      } active:scale-95`}
    >
      {children}
    </button>
  )
}
