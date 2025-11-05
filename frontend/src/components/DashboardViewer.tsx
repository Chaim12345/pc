import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dashboard, Board } from '@monday-clone/shared'
import { api } from '../services/api'
import NumbersWidget from './widgets/NumbersWidget'
import ChartWidget from './widgets/ChartWidget'
import ClockWidget from './widgets/ClockWidget'
import BoardWidget from './widgets/BoardWidget'
import TextWidget from './widgets/TextWidget'
import { WidgetType } from '@monday-clone/shared'

interface DashboardViewerProps {
  dashboardId: string
}

export default function DashboardViewer({ dashboardId }: DashboardViewerProps) {
  const { data: dashboard, isLoading } = useQuery<Dashboard>({
    queryKey: ['dashboard', dashboardId],
    queryFn: async () => {
      const response = await api.get(`/dashboards/${dashboardId}`)
      return response.data.data
    },
  })

  const { data: boards } = useQuery<Board[]>({
    queryKey: ['boards'],
    queryFn: async () => {
      const response = await api.get('/boards')
      return response.data.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Dashboard not found</div>
      </div>
    )
  }

  const renderWidget = (widget: any) => {
    const style = {
      gridColumn: `span ${widget.position.w || 1}`,
      gridRow: `span ${widget.position.h || 1}`,
    }

    switch (widget.type) {
      case WidgetType.NUMBERS:
        return (
          <div key={widget.id} style={style}>
            <NumbersWidget widget={widget} boards={boards} />
          </div>
        )
      case WidgetType.CHART:
        return (
          <div key={widget.id} style={style}>
            <ChartWidget widget={widget} boards={boards} />
          </div>
        )
      case WidgetType.CLOCK:
        return (
          <div key={widget.id} style={style}>
            <ClockWidget widget={widget} />
          </div>
        )
      case WidgetType.BOARD:
        return (
          <div key={widget.id} style={style}>
            <BoardWidget widget={widget} boards={boards} />
          </div>
        )
      case WidgetType.TEXT:
        return (
          <div key={widget.id} style={style}>
            <TextWidget widget={widget} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{dashboard.name}</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {dashboard.widgets?.map(renderWidget)}
      </div>
      {dashboard.widgets?.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No widgets yet. Add widgets to customize your dashboard.</p>
        </div>
      )}
    </div>
  )
}



