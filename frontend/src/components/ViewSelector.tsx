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
}

export default function ViewSelector({ board, filterRules = [], sortRules = [] }: ViewSelectorProps) {
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
      <nav className="flex space-x-2 mb-4 flex-wrap gap-2" role="tablist" aria-label="Board view options">
        <button
          onClick={() => setView('table')}
          className={viewButtonClass(view === 'table')}
          role="tab"
          aria-selected={view === 'table'}
          aria-controls="table-view"
          id="table-tab"
        >
          Table
        </button>
        <button
          onClick={() => setView('kanban')}
          className={viewButtonClass(view === 'kanban')}
          role="tab"
          aria-selected={view === 'kanban'}
          aria-controls="kanban-view"
          id="kanban-tab"
        >
          Kanban
        </button>
        <button
          onClick={() => setView('calendar')}
          className={viewButtonClass(view === 'calendar')}
          role="tab"
          aria-selected={view === 'calendar'}
          aria-controls="calendar-view"
          id="calendar-tab"
        >
          Calendar
        </button>
        <button
          onClick={() => setView('gantt')}
          className={viewButtonClass(view === 'gantt')}
          role="tab"
          aria-selected={view === 'gantt'}
          aria-controls="gantt-view"
          id="gantt-tab"
        >
          Gantt
        </button>
        <button
          onClick={() => setView('timeline')}
          className={viewButtonClass(view === 'timeline')}
          role="tab"
          aria-selected={view === 'timeline'}
          aria-controls="timeline-view"
          id="timeline-tab"
        >
          Timeline
        </button>
      </nav>

      {/* View Content */}
      <div className="flex-1 min-h-0 overflow-hidden" role="tabpanel">
        {view === 'table' && (
          <div id="table-view" role="region" aria-labelledby="table-tab" aria-hidden={view !== 'table'}>
            <Suspense fallback={<div className="flex items-center justify-center h-64" role="status" aria-live="polite">Loading Table View...</div>}>
              <TableView board={board} filterRules={filterRules} sortRules={sortRules} />
            </Suspense>
          </div>
        )}
        {view === 'kanban' && (
          <div id="kanban-view" role="region" aria-labelledby="kanban-tab" aria-hidden={view !== 'kanban'}>
            <Suspense fallback={<div className="flex items-center justify-center h-64" role="status" aria-live="polite">Loading Kanban View...</div>}>
              <KanbanView board={board} filterRules={filterRules} sortRules={sortRules} />
            </Suspense>
          </div>
        )}
        {view === 'calendar' && (
          <div id="calendar-view" role="region" aria-labelledby="calendar-tab" aria-hidden={view !== 'calendar'}>
            <Suspense fallback={<div className="flex items-center justify-center h-64" role="status" aria-live="polite">Loading Calendar View...</div>}>
              <CalendarView board={board} filterRules={filterRules} sortRules={sortRules} />
            </Suspense>
          </div>
        )}
        {view === 'gantt' && (
          <div id="gantt-view" role="region" aria-labelledby="gantt-tab" aria-hidden={view !== 'gantt'}>
            <Suspense fallback={<div className="flex items-center justify-center h-64" role="status" aria-live="polite">Loading Gantt View...</div>}>
              <GanttView board={board} filterRules={filterRules} sortRules={sortRules} />
            </Suspense>
          </div>
        )}
        {view === 'timeline' && (
          <div id="timeline-view" role="region" aria-labelledby="timeline-tab" aria-hidden={view !== 'timeline'}>
            <Suspense fallback={<div className="flex items-center justify-center h-64" role="status" aria-live="polite">Loading Timeline View...</div>}>
              <TimelineView board={board} filterRules={filterRules} sortRules={sortRules} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  )
}

