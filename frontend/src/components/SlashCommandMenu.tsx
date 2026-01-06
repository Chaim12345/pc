import { $createCodeNode } from '@lexical/code'
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text'
import { $createParagraphNode, $getSelection, $isRangeSelection } from 'lexical'
import { useCallback, useEffect, useState } from 'react'

interface SlashCommand {
  id: string
  title: string
  description: string
  icon: string
  keywords: string[]
  action: () => void
}

interface SlashCommandMenuProps {
  isVisible: boolean
  position: { top: number; left: number }
  query: string
  onClose: () => void
}

export default function SlashCommandMenu({ isVisible, position, query, onClose }: SlashCommandMenuProps) {
  const [editor] = useLexicalComposerContext()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const commands: SlashCommand[] = [
    {
      id: 'heading1',
      title: 'Heading 1',
      description: 'Large section heading',
      icon: '📝',
      keywords: ['h1', 'heading', 'title', 'large'],
      action: () => {
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const heading = $createHeadingNode('h1')
            selection.insertNodes([heading])
          }
        })
      }
    },
    {
      id: 'heading2',
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: '📄',
      keywords: ['h2', 'heading', 'subtitle', 'medium'],
      action: () => {
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const heading = $createHeadingNode('h2')
            selection.insertNodes([heading])
          }
        })
      }
    },
    {
      id: 'heading3',
      title: 'Heading 3',
      description: 'Small section heading',
      icon: '📃',
      keywords: ['h3', 'heading', 'small'],
      action: () => {
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const heading = $createHeadingNode('h3')
            selection.insertNodes([heading])
          }
        })
      }
    },
    {
      id: 'bulletlist',
      title: 'Bullet List',
      description: 'Create a simple bullet list',
      icon: '•',
      keywords: ['list', 'bullet', 'ul', 'unordered'],
      action: () => {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
      }
    },
    {
      id: 'numberlist',
      title: 'Numbered List',
      description: 'Create a numbered list',
      icon: '1.',
      keywords: ['list', 'number', 'ol', 'ordered'],
      action: () => {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
      }
    },
    {
      id: 'quote',
      title: 'Quote',
      description: 'Capture a quote or citation',
      icon: '💬',
      keywords: ['quote', 'blockquote', 'citation'],
      action: () => {
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const quote = $createQuoteNode()
            selection.insertNodes([quote])
          }
        })
      }
    },
    {
      id: 'code',
      title: 'Code Block',
      description: 'Create a code block',
      icon: '💻',
      keywords: ['code', 'block', 'programming'],
      action: () => {
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const codeBlock = $createCodeNode()
            selection.insertNodes([codeBlock])
          }
        })
      }
    },
    {
      id: 'divider',
      title: 'Divider',
      description: 'Add a horizontal divider',
      icon: '➖',
      keywords: ['divider', 'separator', 'hr', 'line'],
      action: () => {
        // For now, insert a simple paragraph with a line
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const paragraph = $createParagraphNode()
            paragraph.setTextContent('---')
            selection.insertNodes([paragraph])
          }
        })
      }
    }
  ]

  const filteredCommands = commands.filter(command => {
    if (!query) return true
    const searchQuery = query.toLowerCase()
    return (
      command.title.toLowerCase().includes(searchQuery) ||
      command.description.toLowerCase().includes(searchQuery) ||
      command.keywords.some(keyword => keyword.includes(searchQuery))
    )
  })

  const executeCommand = useCallback((command: SlashCommand) => {
    command.action()
    onClose()
  }, [onClose])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (event.key === 'Enter') {
        event.preventDefault()
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex])
        }
      } else if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, selectedIndex, filteredCommands, executeCommand, onClose])

  if (!isVisible || filteredCommands.length === 0) return null

  return (
    <div
      className="slash-command-menu"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.98)',
        border: '1px solid rgba(55, 53, 47, 0.16)',
        borderRadius: '8px',
        padding: '8px',
        minWidth: '280px',
        maxHeight: '320px',
        overflowY: 'auto',
        boxShadow: `
          0 16px 32px rgba(0, 0, 0, 0.12),
          0 4px 8px rgba(0, 0, 0, 0.08),
          0 0 0 1px rgba(0, 0, 0, 0.04)
        `,
        backdropFilter: 'blur(16px)',
        animation: 'slideUp 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {filteredCommands.map((command, index) => (
        <div
          key={command.id}
          className={`slash-command-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => executeCommand(command)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            background: index === selectedIndex ? 'rgba(35, 131, 226, 0.08)' : 'transparent',
            transition: 'background 0.1s ease'
          }}
        >
          <span style={{ fontSize: '18px', flexShrink: 0 }}>{command.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 500, 
              color: 'rgba(55, 53, 47, 0.9)',
              marginBottom: '2px'
            }}>
              {command.title}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: 'rgba(55, 53, 47, 0.6)',
              lineHeight: 1.3
            }}>
              {command.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}