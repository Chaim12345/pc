import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { User } from '@monday-clone/shared'
import { api, setLastLoginTime } from '../services/api'
import { errorReportingService } from '../utils/errorReporting'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<{ twoFactorRequired?: boolean; tempToken?: string } | void>
  verifyTwoFactor: (tempToken: string, token: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const hasInitialized = useRef(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me')
      const userData = response.data.data
      setUser(userData)
      // Set user context in Sentry
      errorReportingService.setUser(userData.id, {
        email: userData.email,
        name: userData.name,
      })
    } catch (error: any) {
      // Only clear token if it's an authentication error (401)
      // Don't clear on network errors or other issues
      // Also check if we're in grace period after login - don't clear token during grace period
      // And don't clear if user is already set (they might be logged in from a previous session)
      const lastLogin = (window as any).__lastLoginTime || 0
      const timeSinceLogin = Date.now() - lastLogin
      const isInGracePeriod = lastLogin > 0 && timeSinceLogin < 5000
      
      // Only clear token if:
      // 1. It's a 401 error
      // 2. We're not in grace period
      // 3. User is not already set (to prevent clearing valid sessions)
      if (error.response?.status === 401 && !isInGracePeriod && !user) {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
        errorReportingService.clearUser()
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only initialize once on mount
    if (hasInitialized.current) return
    hasInitialized.current = true

    // Set a timeout to ensure loading doesn't last forever (max 10 seconds)
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('Auth initialization timeout - setting loading to false')
      setLoading(false)
    }, 10000)

    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      // No need to set header here - the interceptor handles it
      fetchCurrentUser().finally(() => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current)
          loadingTimeoutRef.current = null
        }
      })
    } else {
      setLoading(false)
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    const data = response.data.data
    
    // Check if 2FA is required
    if (data.twoFactorRequired) {
      return { twoFactorRequired: true, tempToken: data.tempToken }
    }
    
    // Normal login flow
    const { user, token } = data
    // Set token in localStorage FIRST before setting state
    localStorage.setItem('token', token)
    setToken(token)
    setUser(user)
    setLoading(false) // Ensure loading is set to false after successful login
    // Mark login time to prevent immediate token clearing on API errors
    setLastLoginTime()
    // Set user context in Sentry
    errorReportingService.setUser(user.id, {
      email: user.email,
      name: user.name,
    })
  }

  const verifyTwoFactor = async (tempToken: string, token: string) => {
    const response = await api.post('/auth/verify-2fa', { tempToken, token })
    const { user, token: fullToken } = response.data.data
    // Set token in localStorage FIRST before setting state
    localStorage.setItem('token', fullToken)
    setToken(fullToken)
    setUser(user)
    setLoading(false) // Ensure loading is set to false after successful 2FA verification
    // Mark login time to prevent immediate token clearing on API errors
    setLastLoginTime()
    // Set user context in Sentry
    errorReportingService.setUser(user.id, {
      email: user.email,
      name: user.name,
    })
  }

  const register = async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', { email, password, name })
    const { user, token } = response.data.data
    // Set token in localStorage FIRST before setting state
    localStorage.setItem('token', token)
    setToken(token)
    setUser(user)
    setLoading(false) // Ensure loading is set to false after successful registration
    // Mark login time to prevent immediate token clearing on API errors
    setLastLoginTime()
    // Set user context in Sentry
    errorReportingService.setUser(user.id, {
      email: user.email,
      name: user.name,
    })
    // No need to set header here - the interceptor handles it
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    // Clear user context in Sentry
    errorReportingService.clearUser()
    // No need to delete header here - the interceptor handles it
  }

  return (
    <AuthContext.Provider value={{ user, token, login, verifyTwoFactor, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

