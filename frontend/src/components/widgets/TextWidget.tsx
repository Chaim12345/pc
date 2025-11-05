import React from 'react'
import { Widget } from '@monday-clone/shared'

interface TextWidgetProps {
  widget: Widget
}

export default function TextWidget({ widget }: TextWidgetProps) {
  const config = widget.config || {}
  const { content = '' } = config

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <div className="text-sm font-semibold text-gray-900 mb-3">{widget.title}</div>
      <div className="text-sm text-gray-700 whitespace-pre-wrap">{content || 'No content'}</div>
    </div>
  )
}



