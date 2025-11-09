import { useState, Suspense, lazy } from 'react'
import { Board } from '@monday-clone/shared'
import { FilterRule } from './FilterModal'
import { SortRule } from './SortModal'

// Lazy load views for better performance
const TableView = lazy(() => import('../views/TableView'))
const KanbanView = lazy(() => import('../views/KanbanView'))
const CalendarView = lazy(() => import('../views/CalendarView'))
const GanttView = lazy(() => import('../views/GanttView'))
const TimelineView = lazy(() => import('../views/TimelineView'))

interface ViewSelectorProps {
  board: Board
  filterRules?: FilterRule[]
  sortRules?: SortRule[]
  onSortChange?: (rules: SortRule[]) => void
}

export default function ViewSelector({ board, filterRules = [], sortRules = [], onSortChange }: ViewSelectorProps) {
  const [view, setView] = useState<'table' | 'kanban' | 'calendar' | 'gantt' | 'timeline'>('table')

  const viewButtonClass = (isActive: boolean) => `
    px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105
    ${isActive
      ? 'bg-monday-primary text-white shadow-md'
      : 'bg-white dark:bg-monday-darkLight text-monday-text dark:text-white hover:bg-monday-background dark:hover:bg-gray-800 border border-monday-border dark:border-gray-700'
    }
  `

  return (
    <div className="flex flex-col h-full">
      {/* View Tabs */}
      <div className="flex space-x-2 mb-4 flex-wrap gap-2">
        <button
          onClick={() => setView('table')}
          className={viewButtonClass(view === 'table')}
        >
          Table
        </button>
        <button
          onClick={() => setView('kanban')}
          className={viewButtonClass(view === 'kanban')}
        >
          Kanban
        </button>
        <button
          onClick={() => setView('calendar')}
          className={viewButtonClass(view === 'calendar')}
        >
          Calendar
        </button>
        <button
          onClick={() => setView('gantt')}
          className={viewButtonClass(view === 'gantt')}
        >
          Gantt
        </button>
        <button
          onClick={() => setView('timeline')}
          className={viewButtonClass(view === 'timeline')}
        >
          Timeline
        </button>
      </div>

      {/* View Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {view === 'table' && (
          <Suspense fallback={<div className="flex items-center justify-center h-64">Loading Table View...</div>}>
            <TableView board={board} filterRules={filterRules} sortRules={sortRules} onSortChange={onSortChange} />
          </Suspense>
        )}
        {view === 'kanban' && (
          <Suspense fallback={<div className="flex items-center justify-center h-64">Loading Kanban View...</div>}>
            <KanbanView board={board} filterRules={filterRules} sortRules={sortRules} />
          </Suspense>
        )}
        {view === 'calendar' && (
          <Suspense fallback={<div className="flex items-center justify-center h-64">Loading Calendar View...</div>}>
            <CalendarView board={board} filterRules={filterRules} sortRules={sortRules} />
          </Suspense>
        )}
        {view === 'gantt' && (
          <Suspense fallback={<div className="flex items-center justify-center h-64">Loading Gantt View...</div>}>
            <GanttView board={board} filterRules={filterRules} sortRules={sortRules} />
          </Suspense>
        )}
        {view === 'timeline' && (
          <Suspense fallback={<div className="flex items-center justify-center h-64">Loading Timeline View...</div>}>
            <TimelineView board={board} filterRules={filterRules} sortRules={sortRules} />
          </Suspense>
        )}
      </div>
    </div>
  )
}

