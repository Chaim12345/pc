import React, { useState, useEffect } from 'react'
import { Widget } from '@monday-clone/shared'
import { format } from 'date-fns'

interface ClockWidgetProps {
  widget: Widget
}

export default function ClockWidget({ widget }: ClockWidgetProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col items-center justify-center">
      <div className="text-sm text-gray-600 mb-2">{widget.title}</div>
      <div className="text-3xl font-bold text-gray-900">{format(time, 'HH:mm:ss')}</div>
      <div className="text-sm text-gray-500 mt-2">{format(time, 'EEEE, MMMM d, yyyy')}</div>
    </div>
  )
}



