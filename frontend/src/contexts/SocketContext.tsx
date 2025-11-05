import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'

interface SocketContextType {
  socket: Socket | null
  joinBoard: (boardId: string) => void
  leaveBoard: (boardId: string) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    if (token) {
      const newSocket = io('http://localhost:3001', {
        auth: { token },
      })

      newSocket.on('connect', () => {
        console.log('Socket connected')
      })

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected')
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    } else {
      setSocket(null)
    }
  }, [token])

  const joinBoard = (boardId: string) => {
    if (socket) {
      socket.emit('JOIN_BOARD', boardId)
    }
  }

  const leaveBoard = (boardId: string) => {
    if (socket) {
      socket.emit('LEAVE_BOARD', boardId)
    }
  }

  return (
    <SocketContext.Provider value={{ socket, joinBoard, leaveBoard }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

