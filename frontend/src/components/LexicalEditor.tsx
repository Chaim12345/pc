import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { LinkNode } from '@lexical/link'
import { ListItemNode, ListNode } from '@lexical/list'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import {
    $getRoot,
    $getSelection,
    $isRangeSelection,
    FORMAT_TEXT_COMMAND
} from 'lexical'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'
import './LexicalEditor.css'
import LexicalToolbar from './LexicalToolbar'
import SlashCommandMenu from './SlashCommandMenu'

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

function OnChange({ 
  onChange, 
  onSlashCommand,
  onRTLChange
}: { 
  onChange: (content: string) => void
  onSlashCommand?: (show: boolean, position?: { top: number; left: number }, query?: string) => void
  onRTLChange?: (isRTL: boolean) => void
}) {
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

        // RTL Detection
        if (onRTLChange) {
          const textContent = $getRoot().getTextContent()
          const rtlChars = /[\u0590-\u083F]|[\u08A0-\u08FF]|[\uFB1D-\uFDFF]|[\uFE70-\uFEFF]/mg
          onRTLChange(rtlChars.test(textContent))
        }

        // Check for slash command
        if (onSlashCommand) {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode()
            const textContent = anchorNode.getTextContent()
            const anchorOffset = selection.anchor.offset

            // Look for slash command pattern
            const beforeCursor = textContent.slice(0, anchorOffset)
            const slashMatch = beforeCursor.match(/\/(\w*)$/)
            
            if (slashMatch) {
              const query = slashMatch[1]
              const nativeSelection = window.getSelection()
              if (nativeSelection && nativeSelection.rangeCount > 0) {
                const range = nativeSelection.getRangeAt(0)
                const rect = range.getBoundingClientRect()
                const editorElement = editor.getRootElement()
                
                if (editorElement) {
                  const editorRect = editorElement.getBoundingClientRect()
                  onSlashCommand(true, {
                    top: rect.bottom - editorRect.top + 8,
                    left: rect.left - editorRect.left
                  }, query)
                }
              }
            } else {
              onSlashCommand(false)
            }
          }
        }
      })
    })
  }, [editor, onChange, onSlashCommand])

  // Fix Enter key scrolling to top issue
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.stopPropagation()
      }
    }

    const editorElement = editor.getRootElement()
    if (editorElement) {
      editorElement.addEventListener('keydown', handleKeyDown)
      return () => editorElement.removeEventListener('keydown', handleKeyDown)
    }
  }, [editor])

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

function FloatingToolbar() {
  const [editor] = useLexicalComposerContext()
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection) && !selection.isCollapsed()) {
      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsUnderline(selection.hasFormat('underline'))
      
      const nativeSelection = window.getSelection()
      if (nativeSelection && nativeSelection.rangeCount > 0) {
        const range = nativeSelection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        const editorElement = editor.getRootElement()
        
        if (editorElement) {
          const editorRect = editorElement.getBoundingClientRect()
          setPosition({
            top: rect.top - editorRect.top - 50,
            left: rect.left - editorRect.left + (rect.width / 2) - 75
          })
          setIsVisible(true)
        }
      }
    } else {
      setIsVisible(false)
    }
  }, [editor])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar()
      })
    })
  }, [editor, updateToolbar])

  const formatText = (format: string) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  }

  if (!isVisible) return null

  return (
    <div
      ref={toolbarRef}
      className={`lexical-floating-toolbar ${isVisible ? 'visible' : ''}`}
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <button
        onClick={() => formatText('bold')}
        className={`lexical-toolbar-button ${isBold ? 'active' : ''}`}
        title="Bold"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
        </svg>
      </button>
      <button
        onClick={() => formatText('italic')}
        className={`lexical-toolbar-button ${isItalic ? 'active' : ''}`}
        title="Italic"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="4" x2="10" y2="4"></line>
          <line x1="14" y1="20" x2="5" y2="20"></line>
          <line x1="15" y1="4" x2="9" y2="20"></line>
        </svg>
      </button>
      <button
        onClick={() => formatText('underline')}
        className={`lexical-toolbar-button ${isUnderline ? 'active' : ''}`}
        title="Underline"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
          <line x1="4" y1="21" x2="20" y2="21"></line>
        </svg>
      </button>
    </div>
  )
}

export default function LexicalEditor({ content, onChange, placeholder }: Props) {
  const { showToast } = useToast()
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 })
  const [slashQuery, setSlashQuery] = useState('')
  const [isRTL, setIsRTL] = useState(false)
  const isInternalUpdateRef = useRef(false)

  const handleChange = useCallback((newContent: string) => {
    onChange(newContent)
  }, [onChange])

  const handleSlashCommand = useCallback((show: boolean, position?: { top: number; left: number }, query?: string) => {
    setShowSlashMenu(show)
    if (position) setSlashMenuPosition(position)
    if (query !== undefined) setSlashQuery(query)
  }, [])

  // RTL Detection
  const detectRTL = useCallback((text: string) => {
    const rtlChars = /[\u0590-\u083F]|[\u08A0-\u08FF]|[\uFB1D-\uFDFF]|[\uFE70-\uFEFF]/mg
    return rtlChars.test(text)
  }, [])

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
          <div className="lexical-editor-scroller">
            <div className="editor">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable 
                    className="ContentEditable__root" 
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                }
                placeholder={<Placeholder placeholder={placeholder || 'Enter some rich text...'} />}
                ErrorBoundary={LexicalErrorBoundary}
              />
              <HistoryPlugin />
              <ListPlugin />
              <LinkPlugin />
              <AutoLinkPlugin />
              <MarkdownShortcutPlugin />
              <FloatingLinkEditorPlugin anchorElem={document.body} />
              <OnChange 
                onChange={handleChange} 
                onSlashCommand={handleSlashCommand}
                onRTLChange={setIsRTL}
              />
              <ContentSync content={content} isInternalUpdateRef={isInternalUpdateRef} />
              <FloatingToolbar />
              <SlashCommandMenu
                isVisible={showSlashMenu}
                position={slashMenuPosition}
                query={slashQuery}
                onClose={() => setShowSlashMenu(false)}
              />
            </div>
          </div>
        </div>
      </LexicalComposer>
    </div>
  )
}
