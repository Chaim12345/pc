import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@monday-clone/shared'
import { api } from '../services/api'

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

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      // No need to set header here - the interceptor handles it
      fetchCurrentUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.data)
    } catch (error) {
      localStorage.removeItem('token')
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    const data = response.data.data
    
    // Check if 2FA is required
    if (data.twoFactorRequired) {
      return { twoFactorRequired: true, tempToken: data.tempToken }
    }
    
    // Normal login flow
    const { user, token } = data
    setUser(user)
    setToken(token)
    localStorage.setItem('token', token)
  }

  const verifyTwoFactor = async (tempToken: string, token: string) => {
    const response = await api.post('/auth/verify-2fa', { tempToken, token })
    const { user, token: fullToken } = response.data.data
    setUser(user)
    setToken(fullToken)
    localStorage.setItem('token', fullToken)
  }

  const register = async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', { email, password, name })
    const { user, token } = response.data.data
    setUser(user)
    setToken(token)
    localStorage.setItem('token', token)
    // No need to set header here - the interceptor handles it
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
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

