import React, { useState } from 'react'
import { Column } from '@monday-clone/shared'
import VibeButton from './VibeButton'

interface SortRule {
  id: string
  columnId: string
  direction: 'asc' | 'desc'
}

interface SortModalProps {
  isOpen: boolean
  onClose: () => void
  columns: Column[]
  onApplySort: (rules: SortRule[]) => void
}

export default function SortModal({ isOpen, onClose, columns, onApplySort }: SortModalProps) {
  const [sortRules, setSortRules] = useState<SortRule[]>([
    { id: '1', columnId: '', direction: 'asc' }
  ])

  if (!isOpen) return null

  const addRule = () => {
    setSortRules([
      ...sortRules,
      {
        id: Date.now().toString(),
        columnId: '',
        direction: 'asc'
      }
    ])
  }

  const removeRule = (id: string) => {
    setSortRules(sortRules.filter(rule => rule.id !== id))
  }

  const updateRule = (id: string, field: keyof SortRule, value: string) => {
    setSortRules(sortRules.map(rule =>
      rule.id === id ? { ...rule, [field]: value } : rule
    ))
  }

  const handleApply = () => {
    const validRules = sortRules.filter(rule => rule.columnId)
    onApplySort(validRules)
    onClose()
  }

  const handleClear = () => {
    setSortRules([{ id: '1', columnId: '', direction: 'asc' }])
    onApplySort([])
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--vibe-bg-primary)] rounded-2xl shadow-2xl w-full max-w-xl transform transition-all">
        <div className="border-b border-[var(--vibe-border-light)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--vibe-primary-text)]">Sort Items</h2>
              <p className="text-sm text-[var(--vibe-secondary-text)] mt-1">
                Order items by column values
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--vibe-bg-hover)] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-[var(--vibe-secondary-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            {sortRules.map((rule, index) => (
              <div key={rule.id} className="flex items-center gap-3 p-4 bg-[var(--vibe-bg-secondary)] rounded-lg border border-[var(--vibe-border-light)]">
                {index > 0 && (
                  <div className="text-sm font-medium text-[var(--vibe-secondary-text)] mr-2">
                    THEN
                  </div>
                )}
                
                {/* Column Selection */}
                <select
                  value={rule.columnId}
                  onChange={(e) => updateRule(rule.id, 'columnId', e.target.value)}
                  className="flex-1 px-3 py-2 border border-[var(--vibe-border-light)] rounded-lg bg-[var(--vibe-bg-primary)] text-[var(--vibe-primary-text)] focus:outline-none focus:border-[var(--vibe-primary)] focus:ring-2 focus:ring-[var(--vibe-primary-light)] transition-all"
                >
                  <option value="">Select column</option>
                  {columns.map(column => (
                    <option key={column.id} value={column.id}>{column.title}</option>
                  ))}
                </select>

                {/* Direction Selection */}
                <select
                  value={rule.direction}
                  onChange={(e) => updateRule(rule.id, 'direction', e.target.value as 'asc' | 'desc')}
                  className="w-40 px-3 py-2 border border-[var(--vibe-border-light)] rounded-lg bg-[var(--vibe-bg-primary)] text-[var(--vibe-primary-text)] focus:outline-none focus:border-[var(--vibe-primary)] focus:ring-2 focus:ring-[var(--vibe-primary-light)] transition-all"
                >
                  <option value="asc">
                    ↑ Ascending (A→Z, 0→9)
                  </option>
                  <option value="desc">
                    ↓ Descending (Z→A, 9→0)
                  </option>
                </select>

                {/* Remove Rule Button */}
                {sortRules.length > 1 && (
                  <button
                    onClick={() => removeRule(rule.id)}
                    className="p-2 hover:bg-[var(--vibe-negative-light)] hover:text-[var(--vibe-negative)] rounded-lg transition-colors"
                    title="Remove rule"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addRule}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-[var(--vibe-primary)] hover:bg-[var(--vibe-bg-hover)] rounded-lg transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add sort level
          </button>
        </div>

        <div className="border-t border-[var(--vibe-border-light)] px-6 py-4 flex justify-between">
          <VibeButton
            variant="tertiary"
            onClick={handleClear}
          >
            Clear sorting
          </VibeButton>
          <div className="flex gap-3">
            <VibeButton
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </VibeButton>
            <VibeButton
              onClick={handleApply}
            >
              Apply Sort
            </VibeButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export type { SortRule }

