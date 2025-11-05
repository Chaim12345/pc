import React, { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dashboard, Widget, WidgetType, Board } from '@monday-clone/shared'
import { api } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import NumbersWidget from './widgets/NumbersWidget'
import ChartWidget from './widgets/ChartWidget'
import ClockWidget from './widgets/ClockWidget'
import BoardWidget from './widgets/BoardWidget'
import TextWidget from './widgets/TextWidget'

interface DashboardBuilderProps {
  dashboardId?: string
  organizationId: string
  onClose: () => void
}

export default function DashboardBuilder({ dashboardId, organizationId, onClose }: DashboardBuilderProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null)

  const { data: boards } = useQuery<Board[]>({
    queryKey: ['boards'],
    queryFn: async () => {
      const response = await api.get('/boards')
      return response.data.data
    },
  })

  const { data: dashboard } = useQuery<Dashboard>({
    queryKey: ['dashboard', dashboardId],
    queryFn: async () => {
      const response = await api.get(`/dashboards/${dashboardId}`)
      return response.data.data
    },
    enabled: !!dashboardId,
  })

  // Handle dashboard data changes
  useEffect(() => {
    if (dashboard) {
      setName(dashboard.name)
      setWidgets(dashboard.widgets || [])
    }
  }, [dashboard])

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/dashboards', {
        organizationId,
        name,
        widgets: widgets.map((w, index) => ({
          type: w.type,
          title: w.title,
          position: w.position || { x: 0, y: 0, w: 1, h: 1 },
          config: w.config || {},
        })),
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] })
      showToast('Dashboard created successfully!', 'success')
      onClose()
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to create dashboard', 'error')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put(`/dashboards/${dashboardId}`, {
        name,
        widgets: widgets.map((w, index) => ({
          type: w.type,
          title: w.title,
          position: w.position || { x: 0, y: 0, w: 1, h: 1 },
          config: w.config || {},
        })),
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', dashboardId] })
      showToast('Dashboard updated successfully!', 'success')
      onClose()
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to update dashboard', 'error')
    },
  })

  const handleAddWidget = (type: WidgetType) => {
    const newWidget: Widget = {
      id: `temp_${Date.now()}`,
      type,
      title: `${type} Widget`,
      position: { x: 0, y: 0, w: 1, h: 1 },
      config: {},
    }
    setWidgets([...widgets, newWidget])
    setSelectedWidget(newWidget)
  }

  const handleUpdateWidget = (updatedWidget: Widget) => {
    setWidgets(widgets.map(w => w.id === updatedWidget.id ? updatedWidget : w))
    setSelectedWidget(null)
  }

  const handleDeleteWidget = (widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId))
    if (selectedWidget?.id === widgetId) {
      setSelectedWidget(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (dashboardId) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  const renderWidget = (widget: Widget) => {
    const style = {
      gridColumn: `span ${widget.position.w || 1}`,
      gridRow: `span ${widget.position.h || 1}`,
    }

    const widgetProps = {
      widget,
      boards,
    }

    switch (widget.type) {
      case WidgetType.NUMBERS:
        return (
          <div key={widget.id} style={style} className="cursor-pointer" onClick={() => setSelectedWidget(widget)}>
            <NumbersWidget {...widgetProps} />
          </div>
        )
      case WidgetType.CHART:
        return (
          <div key={widget.id} style={style} className="cursor-pointer" onClick={() => setSelectedWidget(widget)}>
            <ChartWidget {...widgetProps} />
          </div>
        )
      case WidgetType.CLOCK:
        return (
          <div key={widget.id} style={style} className="cursor-pointer" onClick={() => setSelectedWidget(widget)}>
            <ClockWidget {...widgetProps} />
          </div>
        )
      case WidgetType.BOARD:
        return (
          <div key={widget.id} style={style} className="cursor-pointer" onClick={() => setSelectedWidget(widget)}>
            <BoardWidget {...widgetProps} />
          </div>
        )
      case WidgetType.TEXT:
        return (
          <div key={widget.id} style={style} className="cursor-pointer" onClick={() => setSelectedWidget(widget)}>
            <TextWidget {...widgetProps} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            {dashboardId ? 'Edit Dashboard' : 'Create Dashboard'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dashboard Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="My Dashboard"
                required
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Widgets</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleAddWidget(WidgetType.NUMBERS)}
                    className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    + Numbers
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddWidget(WidgetType.CHART)}
                    className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    + Chart
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddWidget(WidgetType.CLOCK)}
                    className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    + Clock
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddWidget(WidgetType.BOARD)}
                    className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    + Board
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddWidget(WidgetType.TEXT)}
                    className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    + Text
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-h-[200px] p-4 bg-gray-50 rounded">
                {widgets.map(renderWidget)}
                {widgets.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    No widgets yet. Click the buttons above to add widgets.
                  </div>
                )}
              </div>
            </div>

            {selectedWidget && (
              <WidgetConfig
                widget={selectedWidget}
                boards={boards}
                onUpdate={handleUpdateWidget}
                onDelete={handleDeleteWidget}
                onClose={() => setSelectedWidget(null)}
              />
            )}
          </div>

          <div className="flex justify-end space-x-2 p-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              {dashboardId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function WidgetConfig({
  widget,
  boards,
  onUpdate,
  onDelete,
  onClose,
}: {
  widget: Widget
  boards?: Board[]
  onUpdate: (widget: Widget) => void
  onDelete: (widgetId: string) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(widget.title)
  const [config, setConfig] = useState(widget.config || {})

  const handleSave = () => {
    onUpdate({
      ...widget,
      title,
      config,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Configure Widget</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
            ×
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {widget.type === WidgetType.NUMBERS && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
                <select
                  value={config.boardId || ''}
                  onChange={(e) => setConfig({ ...config, boardId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select board</option>
                  {boards?.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.name}
                    </option>
                  ))}
                </select>
              </div>
              {config.boardId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Column</label>
                    <select
                      value={config.columnId || ''}
                      onChange={(e) => setConfig({ ...config, columnId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Count items</option>
                      {boards
                        ?.find((b) => b.id === config.boardId)
                        ?.columns?.filter((c) => c.type === 'NUMBER')
                        .map((column) => (
                          <option key={column.id} value={column.id}>
                            {column.title}
                          </option>
                        ))}
                    </select>
                  </div>
                  {config.columnId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Operation</label>
                      <select
                        value={config.operation || 'sum'}
                        onChange={(e) => setConfig({ ...config, operation: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="sum">Sum</option>
                        <option value="average">Average</option>
                        <option value="count">Count</option>
                        <option value="min">Min</option>
                        <option value="max">Max</option>
                      </select>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {widget.type === WidgetType.CHART && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
                <select
                  value={config.boardId || ''}
                  onChange={(e) => setConfig({ ...config, boardId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select board</option>
                  {boards?.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.name}
                    </option>
                  ))}
                </select>
              </div>
              {config.boardId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Column</label>
                  <select
                    value={config.columnId || ''}
                    onChange={(e) => setConfig({ ...config, columnId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Group by group</option>
                    {boards
                      ?.find((b) => b.id === config.boardId)
                      ?.columns?.map((column) => (
                        <option key={column.id} value={column.id}>
                          {column.title}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </>
          )}

          {widget.type === WidgetType.BOARD && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
              <select
                value={config.boardId || ''}
                onChange={(e) => setConfig({ ...config, boardId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select board</option>
                {boards?.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {widget.type === WidgetType.TEXT && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={config.content || ''}
                onChange={(e) => setConfig({ ...config, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={5}
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => onDelete(widget.id)}
              className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

