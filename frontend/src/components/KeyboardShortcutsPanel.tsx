import React from 'react'

interface KeyboardShortcutsPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface Shortcut {
  keys: string[]
  description: string
  category: string
}

const shortcuts: Shortcut[] = [
  { keys: ['Ctrl', 'K'], description: 'Open global search', category: 'Navigation' },
  { keys: ['Ctrl', 'B'], description: 'Toggle sidebar', category: 'Navigation' },
  { keys: ['Ctrl', 'D'], description: 'Toggle dark mode', category: 'Appearance' },
  { keys: ['N'], description: 'Create new item', category: 'Items' },
  { keys: ['E'], description: 'Edit selected item', category: 'Items' },
  { keys: ['Del'], description: 'Delete selected item', category: 'Items' },
  { keys: ['Ctrl', 'S'], description: 'Save changes', category: 'General' },
  { keys: ['Esc'], description: 'Close dialog/modal', category: 'General' },
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Help' },
]

export default function KeyboardShortcutsPanel({ isOpen, onClose }: KeyboardShortcutsPanelProps) {
  if (!isOpen) return null

  const categories = Array.from(new Set(shortcuts.map(s => s.category)))

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-monday-darkLight rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-monday-blue to-monday-purple p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <span>Keyboard Shortcuts</span>
              </h2>
              <p className="text-white/80 mt-1">Master these shortcuts to work faster</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-sm font-bold text-monday-textLight dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                  <div className="w-1 h-4 bg-monday-primary rounded-full mr-2"></div>
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter((s) => s.category === category)
                    .map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-monday-background dark:bg-monday-dark rounded-lg hover:bg-monday-primaryLight/10 dark:hover:bg-gray-800 transition-colors group"
                      >
                        <span className="text-monday-text dark:text-white font-medium group-hover:text-monday-primary transition-colors">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center space-x-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <React.Fragment key={keyIndex}>
                              <kbd className="px-3 py-1.5 text-sm font-semibold text-monday-text dark:text-white bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-sm min-w-[40px] text-center group-hover:border-monday-primary group-hover:scale-110 transition-all">
                                {key}
                              </kbd>
                              {keyIndex < shortcut.keys.length - 1 && (
                                <span className="text-monday-textLight dark:text-gray-500 text-sm font-medium">
                                  +
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-monday-background dark:bg-monday-dark p-4 border-t border-monday-border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-monday-textLight dark:text-gray-500 flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Press <kbd className="px-2 py-0.5 text-xs font-semibold bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">?</kbd> anytime to show this panel</span>
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-lg font-medium transition-all hover:scale-105 hover:shadow-lg"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


