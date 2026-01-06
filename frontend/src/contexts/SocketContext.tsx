import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { logger } from '../utils/logger'
import { env } from '../config/env'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  connectionError: string | null
  joinBoard: (boardId: string) => void
  leaveBoard: (boardId: string) => void
  retryConnection: () => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const connectSocket = () => {
    if (!token) {
      setSocket(null)
      setIsConnected(false)
      setConnectionError(null)
      return
    }

    try {
      const newSocket = io(env.SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      newSocket.on('connect', () => {
        logger.log('Socket connected successfully')
        setIsConnected(true)
        setConnectionError(null)
      })

      newSocket.on('disconnect', (reason) => {
        logger.log(`Socket disconnected: ${reason}`)
        setIsConnected(false)
        if (reason === 'io server disconnect') {
          // Server disconnected, need to manually reconnect
          newSocket.connect()
        }
      })

      newSocket.on('connect_error', (error) => {
        logger.error('Socket connection error:', error.message)
        setIsConnected(false)
        setConnectionError(`Connection failed: ${error.message}`)
      })

      newSocket.on('reconnect_failed', () => {
        logger.error('Socket reconnection failed')
        setConnectionError('Unable to reconnect to server')
      })

      setSocket(newSocket)

      return newSocket
    } catch (error) {
      logger.error('Failed to create socket connection:', error)
      setConnectionError('Failed to initialize socket connection')
      return null
    }
  }

  const retryConnection = () => {
    if (socket) {
      socket.close()
    }
    setConnectionError(null)
    connectSocket()
  }

  useEffect(() => {
    const newSocket = connectSocket()

    return () => {
      if (newSocket) {
        newSocket.close()
      }
    }
  }, [token])

  useEffect(() => {
    // Log connection status changes for debugging
    if (env.IS_DEVELOPMENT) {
      logger.log(`Socket connection status: ${isConnected ? 'Connected' : 'Disconnected'}`)
      if (connectionError) {
        logger.error(`Socket error: ${connectionError}`)
      }
    }
  }, [isConnected, connectionError])

  const joinBoard = (boardId: string) => {
    if (socket && isConnected) {
      socket.emit('JOIN_BOARD', boardId)
    } else {
      logger.warn('Cannot join board: socket not connected')
    }
  }

  const leaveBoard = (boardId: string) => {
    if (socket && isConnected) {
      socket.emit('LEAVE_BOARD', boardId)
    } else {
      logger.warn('Cannot leave board: socket not connected')
    }
  }

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected, 
      connectionError, 
      joinBoard, 
      leaveBoard, 
      retryConnection 
    }}>
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

