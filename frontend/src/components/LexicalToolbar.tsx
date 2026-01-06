import { $createCodeNode } from '@lexical/code'
import { $createLinkNode, $isLinkNode } from '@lexical/link'
import { $isListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createHeadingNode, $createQuoteNode, $isHeadingNode } from '@lexical/rich-text'
import { $getSelection, $insertNodes, $isRangeSelection, FORMAT_TEXT_COMMAND, REDO_COMMAND, UNDO_COMMAND } from 'lexical'
import { useCallback, useEffect, useState } from 'react'

interface LexicalToolbarProps {
  onImageUpload: (file: File) => Promise<string | null>
  isUploadingImage: boolean
}

function ToolbarButton({ 
  onClick, 
  isActive, 
  disabled, 
  title, 
  shortcut, 
  children 
}: { 
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title?: string
  shortcut?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${title} (${shortcut})` : title}
      className={`lexical-toolbar-button ${isActive ? 'active' : ''}`}
      aria-label={shortcut ? `${title} (${shortcut})` : title}
      aria-pressed={isActive}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="lexical-toolbar-divider" role="separator" />
}

function ToolbarGroup({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="lexical-toolbar-group" role="group" aria-label={label}>
      {children}
    </div>
  )
}

export default function LexicalToolbar({ onImageUpload, isUploadingImage }: LexicalToolbarProps) {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isCode, setIsCode] = useState(false)
  const [headingLevel, setHeadingLevel] = useState<number | null>(null)
  const [isList, setIsList] = useState(false)
  const [isLink, setIsLink] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [fontSize, setFontSize] = useState('15px')
  const [fontColor, setFontColor] = useState('#000000')
  const [showColorPicker, setShowColorPicker] = useState(false)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsUnderline(selection.hasFormat('underline'))
      setIsStrikethrough(selection.hasFormat('strikethrough'))
      setIsCode(selection.hasFormat('code'))

      const anchorNode = selection.anchor.getNode()
      const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow()
      const elementKey = element.getKey()
      const elementDOM = editor.getElementByKey(elementKey)

      if (elementDOM !== null) {
        if ($isHeadingNode(element)) {
          const level = element.getTag()
          setHeadingLevel(level === 'h1' ? 1 : level === 'h2' ? 2 : level === 'h3' ? 3 : null)
        } else {
          setHeadingLevel(null)
        }

        if ($isListNode(element)) {
          setIsList(true)
        } else {
          setIsList(false)
        }

        const parent = anchorNode.getParent()
        if ($isLinkNode(parent)) {
          setIsLink(true)
        } else {
          setIsLink(false)
        }
      }
    }
  }, [editor])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar()
      })
    })
  }, [editor, updateToolbar])

  useEffect(() => {
    return editor.registerCommand(
      UNDO_COMMAND,
      () => {
        setCanUndo(true)
        return false
      },
      1
    )
  }, [editor])

  useEffect(() => {
    return editor.registerCommand(
      REDO_COMMAND,
      () => {
        setCanRedo(true)
        return false
      },
      1
    )
  }, [editor])

  const formatText = (format: string) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  }

  const formatHeading = (level: 1 | 2 | 3) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode()
        const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow()
        
        if ($isHeadingNode(element) && element.getTag() === `h${level}`) {
          const paragraph = $createHeadingNode('h1')
          paragraph.append(...element.getChildren())
          element.replace(paragraph)
        } else {
          const heading = $createHeadingNode(`h${level}`)
          heading.append(...element.getChildren())
          element.replace(heading)
        }
      }
    })
  }

  const formatList = (listType: 'bullet' | 'number') => {
    if (isList) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
    } else {
      if (listType === 'bullet') {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
      } else {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
      }
    }
  }

  const insertQuote = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const quote = $createQuoteNode()
        $insertNodes([quote])
      }
    })
  }

  const insertCodeBlock = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const codeBlock = $createCodeNode()
        $insertNodes([codeBlock])
      }
    })
  }

  const insertHorizontalRule = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        // Insert horizontal rule as HTML for now
        const hr = document.createElement('hr')
        hr.className = 'my-6 border-t-2 border-[var(--vibe-border-light)]'
        const root = editor.getRootElement()
        if (root) {
          const range = selection.getCharacterOffsets()
          const textNode = selection.anchor.getNode()
          const parent = textNode.getParent()
          if (parent) {
            // This is a simplified approach - would need proper HorizontalRuleNode
          }
        }
      }
    })
  }

  const handleAddLink = () => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      const selectedText = selection.getTextContent()
      setLinkText(selectedText)
      setShowLinkModal(true)
    }
  }

  const applyStyleText = (styles: Record<string, string>) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if (node.getType() === 'text') {
            Object.entries(styles).forEach(([key, value]) => {
              node.setStyle(key, value)
            })
          }
        })
      }
    })
  }

  const handleFontSizeChange = (newSize: string) => {
    setFontSize(newSize)
    applyStyleText({ 'font-size': newSize })
  }

  const handleColorChange = (color: string) => {
    setFontColor(color)
    applyStyleText({ color })
    setShowColorPicker(false)
  }

  const handleSaveLink = () => {
    if (!linkUrl.trim()) return

    let finalUrl = linkUrl.trim()
    if (!finalUrl.match(/^https?:\/\//i)) {
      finalUrl = 'https://' + finalUrl
    }

    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const linkNode = $createLinkNode(finalUrl)
        if (linkText.trim()) {
          linkNode.setTextContent(linkText.trim())
        }
        selection.insertNodes([linkNode])
      }
    })

    setShowLinkModal(false)
    setLinkUrl('')
    setLinkText('')
  }

  const handleImageClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const imageUrl = await onImageUpload(file)
        if (imageUrl) {
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              // Insert image - would need proper ImageNode
            }
          })
        }
      }
    }
    input.click()
  }

  return (
    <>
      <div className="lexical-main-toolbar" role="toolbar" aria-label="Text formatting toolbar">
        {/* Text Formatting Group */}
        <ToolbarGroup label="Text formatting">
          <ToolbarButton
            onClick={() => formatText('bold')}
            isActive={isBold}
            title="Bold"
            shortcut="Ctrl+B"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => formatText('italic')}
            isActive={isItalic}
            title="Italic"
            shortcut="Ctrl+I"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="4" x2="10" y2="4"></line>
              <line x1="14" y1="20" x2="5" y2="20"></line>
              <line x1="15" y1="4" x2="9" y2="20"></line>
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => formatText('underline')}
            isActive={isUnderline}
            title="Underline"
            shortcut="Ctrl+U"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
              <line x1="4" y1="21" x2="20" y2="21"></line>
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => formatText('strikethrough')}
            isActive={isStrikethrough}
            title="Strikethrough"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 16c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2"></path>
              <line x1="4" y1="12" x2="20" y2="12"></line>
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => formatText('code')}
            isActive={isCode}
            title="Inline Code"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Font Controls Group */}
        <ToolbarGroup label="Font controls">
          <select
            value={fontSize}
            onChange={(e) => handleFontSizeChange(e.target.value)}
            className="lexical-toolbar-select"
            title="Font Size"
          >
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="15px">15px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="32px">32px</option>
          </select>
          
          <div className="color-picker-wrapper">
            <ToolbarButton
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Text Color"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9l-5.91 5.74L17.18 22 12 19.27 6.82 22l1.09-7.26L2 9l6.91-.74L12 2z"></path>
              </svg>
            </ToolbarButton>
            {showColorPicker && (
              <div className="color-picker-dropdown">
                <div className="color-grid">
                  {['#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
                    '#ff0000', '#ff6600', '#ffcc00', '#33cc33', '#0066cc', '#6600cc',
                    '#ff3366', '#ff9933', '#ffff33', '#66ff66', '#3399ff', '#9966ff'].map((color) => (
                    <button
                      key={color}
                      className="color-option"
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Headings Group */}
        <ToolbarGroup label="Headings">
          <ToolbarButton
            onClick={() => formatHeading(1)}
            isActive={headingLevel === 1}
            title="Heading 1"
          >
            <span style={{ fontSize: '14px', fontWeight: 700 }}>H1</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => formatHeading(2)}
            isActive={headingLevel === 2}
            title="Heading 2"
          >
            <span style={{ fontSize: '14px', fontWeight: 700 }}>H2</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => formatHeading(3)}
            isActive={headingLevel === 3}
            title="Heading 3"
          >
            <span style={{ fontSize: '14px', fontWeight: 700 }}>H3</span>
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Lists Group */}
        <ToolbarGroup label="Lists">
          <ToolbarButton
            onClick={() => formatList('bullet')}
            isActive={isList}
            title="Bullet List"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => formatList('number')}
            isActive={isList}
            title="Numbered List"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="10" y1="6" x2="21" y2="6"></line>
              <line x1="10" y1="12" x2="21" y2="12"></line>
              <line x1="10" y1="18" x2="21" y2="18"></line>
              <path d="m6 6 2 2 2-2"></path>
              <path d="M8 12V8l-2 2"></path>
              <path d="M6 18c.5-1 2.5-1 2.5-1s2 0 2.5 1c.5 1-2.5 1-2.5 1s-3 0-2.5-1"></path>
            </svg>
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Insert Group */}
        <ToolbarGroup label="Insert content">
          <ToolbarButton
            onClick={handleAddLink}
            isActive={isLink}
            title="Add Link"
            shortcut="Ctrl+K"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={handleImageClick}
            title="Add Image"
            disabled={isUploadingImage}
          >
            {isUploadingImage ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            )}
          </ToolbarButton>
          <ToolbarButton
            onClick={insertQuote}
            title="Blockquote"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={insertCodeBlock}
            title="Code Block"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <polyline points="8 8 12 12 8 16"></polyline>
              <line x1="16" y1="16" x2="16" y2="16"></line>
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={insertHorizontalRule}
            title="Horizontal Rule"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </ToolbarButton>
        </ToolbarGroup>

        <div style={{ marginLeft: 'auto' }} />

        {/* Actions Group */}
        <ToolbarGroup label="Actions">
          <ToolbarButton
            onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
            title="Undo"
            shortcut="Ctrl+Z"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6"></path>
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
            title="Redo"
            shortcut="Ctrl+Shift+Z"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 7v6h-6"></path>
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"></path>
            </svg>
          </ToolbarButton>
        </ToolbarGroup>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="lexical-link-modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="lexical-link-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'var(--vibe-primary-text)' }}>
              Add Link
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--vibe-secondary-text)' }}>
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--vibe-border-light)',
                    borderRadius: '8px',
                    background: 'var(--vibe-bg-secondary)',
                    color: 'var(--vibe-primary-text)',
                    fontSize: '14px',
                  }}
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
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--vibe-secondary-text)' }}>
                  Text (optional)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Link text"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--vibe-border-light)',
                    borderRadius: '8px',
                    background: 'var(--vibe-bg-secondary)',
                    color: 'var(--vibe-primary-text)',
                    fontSize: '14px',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveLink()
                    } else if (e.key === 'Escape') {
                      setShowLinkModal(false)
                    }
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
                <button
                  onClick={() => setShowLinkModal(false)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--vibe-secondary-text)',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLink}
                  disabled={!linkUrl.trim()}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'white',
                    background: 'var(--vibe-primary)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: linkUrl.trim() ? 'pointer' : 'not-allowed',
                    opacity: linkUrl.trim() ? 1 : 0.5,
                  }}
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
