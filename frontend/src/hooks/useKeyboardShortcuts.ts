import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

interface KeyboardShortcutsProps {
  boardId?: string
}

export function useKeyboardShortcuts({ boardId }: KeyboardShortcutsProps = {}) {
  const navigate = useNavigate()
  const { toggleTheme } = useTheme()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }

      // Ctrl/Cmd + D for dashboard
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        navigate('/dashboard')
      }

      // Ctrl/Cmd + , for dashboards page
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault()
        navigate('/dashboards')
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        const modals = document.querySelectorAll('[class*="fixed"][class*="inset-0"]')
        const lastModal = Array.from(modals).pop() as HTMLElement
        if (lastModal) {
          // Try aria-label first (case-insensitive)
          let closeButton = lastModal.querySelector('button[aria-label*="close" i]') as HTMLButtonElement
          
          // If not found, try to find button with × character by checking text content
          if (!closeButton) {
            const buttons = lastModal.querySelectorAll('button')
            for (const btn of Array.from(buttons)) {
              if (btn.textContent?.includes('×') || btn.innerHTML.includes('×')) {
                closeButton = btn
                break
              }
            }
          }
          
          if (closeButton) {
            closeButton.click()
          }
        }
      }

      // Ctrl/Cmd + Shift + D for dark mode toggle
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        toggleTheme()
      }

      // Number keys for view switching (when on board page)
      if (boardId && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const viewButtons = document.querySelectorAll('button[class*="View"]')
        const viewMap: Record<string, number> = {
          '1': 0, // Table
          '2': 1, // Kanban
          '3': 2, // Calendar
          '4': 3, // Gantt
          '5': 4, // Timeline
        }
        if (viewMap[e.key] !== undefined && viewButtons[viewMap[e.key]]) {
          e.preventDefault()
          ;(viewButtons[viewMap[e.key]] as HTMLButtonElement).click()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, toggleTheme, boardId])
}


