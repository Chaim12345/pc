import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { ListItemNode, ListNode } from '@lexical/list'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin'
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import {
    $getRoot,
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_LOW,
    FORMAT_TEXT_COMMAND,
    KEY_ENTER_COMMAND,
    SELECTION_CHANGE_COMMAND
} from 'lexical'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'
import './LexicalEditor.css'
import LexicalToolbar from './LexicalToolbar'
import SlashCommandMenu from './SlashCommandMenu'

// Import transformers for markdown shortcuts
import {
    TRANSFORMERS
} from '@lexical/markdown'

interface Props {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

// Enhanced theme with better styling
const theme = {
  paragraph: 'editor-paragraph',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
    h6: 'editor-heading-h6',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem',
    listitemChecked: 'editor-listitem-checked',
    listitemUnchecked: 'editor-listitem-unchecked',
  },
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    code: 'editor-text-code',
    highlight: 'editor-text-highlight',
    subscript: 'editor-text-subscript',
    superscript: 'editor-text-superscript',
  },
  link: 'editor-link',
  quote: 'editor-quote',
  code: 'editor-code',
  codeHighlight: {
    atrule: 'editor-tokenAttr',
    attr: 'editor-tokenAttr',
    boolean: 'editor-tokenProperty',
    builtin: 'editor-tokenSelector',
    cdata: 'editor-tokenComment',
    char: 'editor-tokenSelector',
    class: 'editor-tokenFunction',
    'class-name': 'editor-tokenFunction',
    comment: 'editor-tokenComment',
    constant: 'editor-tokenProperty',
    deleted: 'editor-tokenProperty',
    doctype: 'editor-tokenComment',
    entity: 'editor-tokenOperator',
    function: 'editor-tokenFunction',
    important: 'editor-tokenVariable',
    inserted: 'editor-tokenSelector',
    keyword: 'editor-tokenAttr',
    namespace: 'editor-tokenVariable',
    number: 'editor-tokenProperty',
    operator: 'editor-tokenOperator',
    prolog: 'editor-tokenComment',
    property: 'editor-tokenProperty',
    punctuation: 'editor-tokenPunctuation',
    regex: 'editor-tokenVariable',
    selector: 'editor-tokenSelector',
    string: 'editor-tokenSelector',
    symbol: 'editor-tokenProperty',
    tag: 'editor-tokenProperty',
    url: 'editor-tokenOperator',
    variable: 'editor-tokenVariable',
  },
  table: 'editor-table',
  tableCell: 'editor-tableCell',
  tableCellHeader: 'editor-tableCellHeader',
  hr: 'editor-hr',
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
  onSlashCommand 
}: { 
  onChange: (content: string) => void
  onSlashCommand?: (show: boolean, position?: { top: number; left: number }, query?: string) => void
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

  // Fix Enter key scrolling issue
  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (event) {
          event.stopPropagation()
        }
        return false // Let Lexical handle the enter key
      },
      COMMAND_PRIORITY_LOW
    )
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
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isCode, setIsCode] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection) && !selection.isCollapsed()) {
      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsUnderline(selection.hasFormat('underline'))
      setIsStrikethrough(selection.hasFormat('strikethrough'))
      setIsCode(selection.hasFormat('code'))
      
      const nativeSelection = window.getSelection()
      if (nativeSelection && nativeSelection.rangeCount > 0) {
        const range = nativeSelection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        const editorElement = editor.getRootElement()
        
        if (editorElement) {
          const editorRect = editorElement.getBoundingClientRect()
          setPosition({
            top: rect.top - editorRect.top - 50,
            left: rect.left - editorRect.left + (rect.width / 2) - 100
          })
          setIsVisible(true)
        }
      }
    } else {
      setIsVisible(false)
    }
  }, [editor])

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar()
        return false
      },
      COMMAND_PRIORITY_LOW
    )
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
        title="Bold (Ctrl+B)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
        </svg>
      </button>
      <button
        onClick={() => formatText('italic')}
        className={`lexical-toolbar-button ${isItalic ? 'active' : ''}`}
        title="Italic (Ctrl+I)"
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
        title="Underline (Ctrl+U)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
          <line x1="4" y1="21" x2="20" y2="21"></line>
        </svg>
      </button>
      <button
        onClick={() => formatText('strikethrough')}
        className={`lexical-toolbar-button ${isStrikethrough ? 'active' : ''}`}
        title="Strikethrough"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 16c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2"></path>
          <line x1="4" y1="12" x2="20" y2="12"></line>
        </svg>
      </button>
      <button
        onClick={() => formatText('code')}
        className={`lexical-toolbar-button ${isCode ? 'active' : ''}`}
        title="Code"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      </button>
    </div>
  )
}

export default function AdvancedLexicalEditor({ content, onChange, placeholder }: Props) {
  const { showToast } = useToast()
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 })
  const [slashQuery, setSlashQuery] = useState('')
  const isInternalUpdateRef = useRef(false)

  const handleChange = useCallback((newContent: string) => {
    onChange(newContent)
  }, [onChange])

  const handleSlashCommand = useCallback((show: boolean, position?: { top: number; left: number }, query?: string) => {
    setShowSlashMenu(show)
    if (position) setSlashMenuPosition(position)
    if (query !== undefined) setSlashQuery(query)
  }, [])

  const initialConfig = {
    namespace: 'AdvancedLexicalEditor',
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
      AutoLinkNode,
      HorizontalRuleNode,
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
    <div className="lexical-editor-wrapper advanced-editor">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="lexical-editor-container">
          <LexicalToolbar onImageUpload={handleImageUpload} isUploadingImage={isUploadingImage} />
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="ContentEditable__root" />
              }
              placeholder={<Placeholder placeholder={placeholder || 'Type \'/\' for commands, or start writing...'} />}
              ErrorBoundary={LexicalErrorBoundary}
            />
            
            {/* Core Plugins */}
            <HistoryPlugin />
            <AutoFocusPlugin />
            <ListPlugin />
            <CheckListPlugin />
            <LinkPlugin />
            <ClickableLinkPlugin />
            <HorizontalRulePlugin />
            <TabIndentationPlugin />
            <TablePlugin />
            
            {/* Advanced Plugins */}
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
            <ClearEditorPlugin />
            
            {/* Custom Plugins */}
            <OnChange onChange={handleChange} onSlashCommand={handleSlashCommand} />
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
      </LexicalComposer>
    </div>
  )
}