import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListItemNode, ListNode } from '@lexical/list'
import { CodeNode, CodeHighlightNode } from '@lexical/code'
import { LinkNode } from '@lexical/link'
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { $getRoot } from 'lexical'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'
import LexicalToolbar from './LexicalToolbar'
import './LexicalEditor.css'

interface Props {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

const theme = {
  paragraph: 'mb-2',
  heading: {
    h1: 'text-4xl font-bold mt-8 mb-4',
    h2: 'text-3xl font-bold mt-6 mb-3',
    h3: 'text-2xl font-bold mt-4 mb-2',
  },
  list: {
    nested: {
      listitem: 'ml-4',
    },
    ol: 'list-decimal ml-6',
    ul: 'list-disc ml-6',
    listitem: 'my-2',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'bg-[var(--vibe-bg-hover)] px-1.5 py-0.5 rounded text-sm font-mono',
  },
  link: 'text-[var(--vibe-primary)] hover:underline cursor-pointer',
  quote: 'border-l-4 border-[var(--vibe-primary)] pl-4 italic my-4',
  code: 'bg-[var(--vibe-bg-secondary)] rounded-lg p-4 overflow-x-auto my-4',
}

function Placeholder({ placeholder }: { placeholder: string }) {
  return (
    <div className="lexical-editor-placeholder">
      {placeholder}
    </div>
  )
}

function OnChange({ onChange }: { onChange: (content: string) => void }) {
  const [editor] = useLexicalComposerContext()
  const isInternalUpdateRef = useRef(false)

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      if (isInternalUpdateRef.current) {
        isInternalUpdateRef.current = false
        return
      }

      editorState.read(() => {
        const htmlString = $generateHtmlFromNodes(editor, null)
        onChange(htmlString)
      })
    })
  }, [editor, onChange])

  return null
}

function ContentSync({ content, isInternalUpdateRef }: { content: string; isInternalUpdateRef: React.MutableRefObject<boolean> }) {
  const [editor] = useLexicalComposerContext()
  const [lastContent, setLastContent] = useState(content)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Initialize editor with content on first load
    if (!isInitialized && content) {
      editor.update(() => {
        const parser = new DOMParser()
        const dom = parser.parseFromString(content || '<p></p>', 'text/html')
        const nodes = $generateNodesFromDOM(editor, dom)
        const root = $getRoot()
        root.clear()
        root.append(...nodes)
      }, { discrete: true })
      setIsInitialized(true)
      setLastContent(content)
      return
    }

    // Skip if content hasn't changed or if it's an internal update
    if (content === lastContent || isInternalUpdateRef.current) return

    isInternalUpdateRef.current = true
    editor.update(() => {
      const parser = new DOMParser()
      const dom = parser.parseFromString(content || '<p></p>', 'text/html')
      const nodes = $generateNodesFromDOM(editor, dom)
      const root = $getRoot()
      root.clear()
      root.append(...nodes)
    }, { discrete: true })
    isInternalUpdateRef.current = false

    setLastContent(content)
  }, [content, editor, lastContent, isInternalUpdateRef, isInitialized])

  return null
}

export default function LexicalEditor({ content, onChange, placeholder }: Props) {
  const { showToast } = useToast()
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const isInternalUpdateRef = useRef(false)

  const handleChange = useCallback((newContent: string) => {
    onChange(newContent)
  }, [onChange])

  const initialConfig = {
    namespace: 'LexicalEditor',
    theme,
    onError: (error: Error) => {
      console.error('Lexical error:', error)
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      LinkNode,
    ],
  }

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error')
      return
    }

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
        // Image insertion will be handled by the toolbar component
        showToast('Image uploaded successfully', 'success')
        return imageUrl
      } else {
        throw new Error('No image URL returned from server')
      }
    } catch (error: any) {
      console.error('Failed to upload image:', error)
      showToast(error.response?.data?.error || 'Failed to upload image', 'error')
      return null
    } finally {
      setIsUploadingImage(false)
    }
  }, [showToast])

  return (
    <div className="lexical-editor-wrapper">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="lexical-editor-container">
          <LexicalToolbar onImageUpload={handleImageUpload} isUploadingImage={isUploadingImage} />
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="ContentEditable__root" />
              }
              placeholder={<Placeholder placeholder={placeholder || 'Start writing...'} />}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <LinkPlugin />
            {/* MarkdownShortcutPlugin temporarily disabled - requires HorizontalRuleNode */}
            {/* <MarkdownShortcutPlugin /> */}
            <OnChange onChange={handleChange} />
            <ContentSync content={content} isInternalUpdateRef={isInternalUpdateRef} />
          </div>
        </div>
      </LexicalComposer>
    </div>
  )
}
