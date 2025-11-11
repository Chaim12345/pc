import { Editor } from '@tiptap/react'
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import 'tippy.js/dist/tippy.css'

export interface SlashCommand {
  title: string
  description: string
  icon: string
  command: (editor: Editor) => void
  aliases?: string[]
}

export const slashCommands: SlashCommand[] = [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: '📝',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    aliases: ['h1', 'heading1', 'title']
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: '📄',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    aliases: ['h2', 'heading2', 'subtitle']
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: '📃',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    aliases: ['h3', 'heading3']
  },
  {
    title: 'Bullet List',
    description: 'Create a bulleted list',
    icon: '•',
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
    aliases: ['ul', 'list', 'bullet']
  },
  {
    title: 'Numbered List',
    description: 'Create a numbered list',
    icon: '1️⃣',
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
    aliases: ['ol', 'numbers', 'ordered']
  },
  {
    title: 'Quote',
    description: 'Insert a blockquote',
    icon: '💬',
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
    aliases: ['blockquote', 'cite']
  },
  {
    title: 'Code Block',
    description: 'Insert a code block',
    icon: '💻',
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    aliases: ['code', 'pre', 'snippet']
  },
  {
    title: 'Divider',
    description: 'Insert a horizontal divider',
    icon: '➖',
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
    aliases: ['hr', 'line', 'separator']
  },
  {
    title: 'Bold',
    description: 'Make text bold',
    icon: '**B**',
    command: (editor) => editor.chain().focus().toggleBold().run(),
    aliases: ['strong', 'b']
  },
  {
    title: 'Italic',
    description: 'Make text italic',
    icon: '*I*',
    command: (editor) => editor.chain().focus().toggleItalic().run(),
    aliases: ['em', 'i']
  }
]

interface SlashCommandsMenuProps {
  items: SlashCommand[]
  command: (item: SlashCommand) => void
  editor: Editor | null
}

export interface SlashCommandsMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export const SlashCommandsMenu = forwardRef<SlashCommandsMenuRef, SlashCommandsMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = (index: number) => {
      const item = items[index]
      if (item) {
        command(item)
      }
    }

    const upHandler = () => {
      setSelectedIndex((selectedIndex + items.length - 1) % items.length)
    }

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % items.length)
    }

    const enterHandler = () => {
      selectItem(selectedIndex)
    }

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          upHandler()
          return true
        }

        if (event.key === 'ArrowDown') {
          downHandler()
          return true
        }

        if (event.key === 'Enter') {
          enterHandler()
          return true
        }

        return false
      }
    }))

    return (
      <div className="slash-commands-menu bg-[var(--vibe-bg-primary)] border border-[var(--vibe-border-light)] rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
        {items.length > 0 ? (
          <div className="p-2">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => selectItem(index)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-colors
                  ${
                    index === selectedIndex
                      ? 'bg-[var(--vibe-primary)] text-white'
                      : 'text-[var(--vibe-primary-text)] hover:bg-[var(--vibe-bg-hover)]'
                  }
                `}
              >
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${index === selectedIndex ? 'text-white' : 'text-[var(--vibe-primary-text)]'}`}>
                    {item.title}
                  </div>
                  <div className={`text-xs ${index === selectedIndex ? 'text-white/80' : 'text-[var(--vibe-secondary-text)]'}`}>
                    {item.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-[var(--vibe-secondary-text)] text-sm">
            No commands found
          </div>
        )}
      </div>
    )
  }
)

SlashCommandsMenu.displayName = 'SlashCommandsMenu'

export function renderSlashCommands() {
  let component: React.ReactElement | null = null
  let popup: TippyInstance | null = null
  let root: any = null

  const createOrUpdateRoot = (container: HTMLElement) => {
    if (!root) {
      import('react-dom/client').then(({ createRoot }) => {
        root = createRoot(container)
        if (component) {
          root.render(component)
        }
      }).catch(() => {
        // Fallback: use ReactDOM.render for older React versions
        const ReactDOM = require('react-dom')
        if (component) {
          ReactDOM.render(component, container)
        }
      })
    } else if (component) {
      root.render(component)
    }
  }

  const renderComponent = (container: HTMLElement) => {
    if (!container) return
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      createOrUpdateRoot(container)
    })
  }

  return {
    onStart: (props: any) => {
      const { editor, clientRect, command } = props

      if (!clientRect) return

      const filteredItems = slashCommands.filter(item => {
        const query = props.query.toLowerCase()
        return (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.aliases?.some(alias => alias.toLowerCase().includes(query))
        )
      })

      component = (
        <SlashCommandsMenu
          items={filteredItems}
          command={(item: SlashCommand) => {
            item.command(editor)
            command({ id: item.title })
          }}
          editor={editor}
        />
      )

      if (!props.clientRect) {
        return
      }

      popup = tippy(document.body, {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: document.createElement('div'),
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
        theme: 'slash-commands',
        maxWidth: 400
      })

      const container = popup.popper.querySelector('.tippy-content') as HTMLElement
      if (container) {
        renderComponent(container)
      }
    },

    onUpdate(props: any) {
      const filteredItems = slashCommands.filter(item => {
        const query = props.query.toLowerCase()
        return (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.aliases?.some(alias => alias.toLowerCase().includes(query))
        )
      })

      component = (
        <SlashCommandsMenu
          items={filteredItems}
          command={(item: SlashCommand) => {
            item.command(props.editor)
            props.command({ id: item.title })
          }}
          editor={props.editor}
        />
      )

      if (!props.clientRect) {
        return
      }

      popup?.setProps({
        getReferenceClientRect: props.clientRect
      })

      const container = popup?.popper.querySelector('.tippy-content') as HTMLElement
      if (container) {
        renderComponent(container)
      }
    },

    onKeyDown(props: any) {
      if (props.event.key === 'Escape') {
        popup?.hide()
        return true
      }

      // Handle keyboard navigation through the menu component
      // The menu component handles its own keyboard events via useImperativeHandle
      return false
    },

    onExit() {
      if (popup) {
        popup.destroy()
        popup = null
      }

      if (root) {
        try {
          root.unmount()
        } catch (e) {
          // Ignore unmount errors
        }
        root = null
      }
      
      component = null
    }
  }
}

