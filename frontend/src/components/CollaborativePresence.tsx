import React from 'react'

interface Collaborator {
  id: string
  name: string
  avatar?: string
  color: string
  cursor?: {
    x: number
    y: number
  }
}

interface CollaborativePresenceProps {
  collaborators: Collaborator[]
  maxDisplay?: number
}

export default function CollaborativePresence({ 
  collaborators, 
  maxDisplay = 3 
}: CollaborativePresenceProps) {
  const displayedCollaborators = collaborators.slice(0, maxDisplay)
  const remainingCount = Math.max(0, collaborators.length - maxDisplay)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getColorFromString = (str: string) => {
    const colors = [
      '#FF6900', '#FCB900', '#7BDCB5', '#00D084',
      '#8ED1FC', '#0693E3', '#ABB8C3', '#EB144C',
      '#F78DA7', '#9900EF'
    ]
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  if (collaborators.length === 0) {
    return null
  }

  return (
    <div className="flex items-center -space-x-2">
      {displayedCollaborators.map((collaborator) => (
        <div
          key={collaborator.id}
          className="relative group"
        >
          {collaborator.avatar ? (
            <img
              src={collaborator.avatar}
              alt={collaborator.name}
              className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-gray-800 hover:z-10 transition-all"
              style={{ borderColor: collaborator.color || getColorFromString(collaborator.id) }}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-gray-800 flex items-center justify-center text-xs font-semibold text-white hover:z-10 transition-all"
              style={{ 
                backgroundColor: collaborator.color || getColorFromString(collaborator.id),
                borderColor: collaborator.color || getColorFromString(collaborator.id)
              }}
            >
              {getInitials(collaborator.name)}
            </div>
          )}
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
            {collaborator.name}
          </div>
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300">
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
