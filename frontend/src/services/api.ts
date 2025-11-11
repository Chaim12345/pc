import axios from 'axios'
import { formatErrorMessage } from '../utils/errorMessages'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Track when login happens to prevent immediate token clearing
let lastLoginTime = 0
const LOGIN_GRACE_PERIOD = 10000 // 10 seconds grace period after login
let consecutive401Errors = 0
const MAX_CONSECUTIVE_401 = 3 // Only clear token after 3 consecutive 401 errors

export const setLastLoginTime = () => {
  lastLoginTime = Date.now()
  consecutive401Errors = 0 // Reset error count on successful login
  // Also store in window for access from other modules
  if (typeof window !== 'undefined') {
    (window as any).__lastLoginTime = lastLoginTime
  }
}

// Add request interceptor to include auth token from localStorage on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle auth errors and format error messages
api.interceptors.response.use(
  (response) => {
    // Reset consecutive 401 error counter on successful responses
    consecutive401Errors = 0
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      const requestUrl = error.config?.url || ''
      
      // Don't clear token or redirect if we're on auth pages or if the request was to an auth endpoint
      const isAuthEndpoint = requestUrl.includes('/auth/login') || 
                             requestUrl.includes('/auth/register') ||
                             requestUrl.includes('/auth/verify-2fa') ||
                             requestUrl.includes('/auth/me') // Don't clear token on /auth/me failures - let AuthContext handle it
      
      // Check if we're in the grace period after login (prevent clearing token immediately after login)
      const timeSinceLogin = Date.now() - lastLoginTime
      const isInGracePeriod = timeSinceLogin < LOGIN_GRACE_PERIOD
      
      // Track consecutive 401 errors (only outside grace period and for non-auth endpoints)
      if (!isAuthEndpoint && error.response?.status === 401 && !isInGracePeriod) {
        consecutive401Errors++
      } else if (error.response?.status !== 401 || isAuthEndpoint) {
        consecutive401Errors = 0 // Reset on non-401 errors or auth endpoint errors
      }
      
      // Only clear token and redirect if:
      // 1. Not an auth endpoint
      // 2. Not already on login/register pages
      // 3. The error is actually a 401 (not a network error)
      // 4. Not in grace period after login (to prevent race conditions)
      // 5. Multiple consecutive 401 errors (to prevent clearing on transient errors)
      if (!isAuthEndpoint && 
          currentPath !== '/login' && 
          currentPath !== '/register' &&
          error.response?.status === 401 &&
          !isInGracePeriod &&
          consecutive401Errors >= MAX_CONSECUTIVE_401) {
        // Token is invalid or expired - clear it
        consecutive401Errors = 0 // Reset counter
        localStorage.removeItem('token')
        // Use a small delay to avoid race conditions with React Router
        setTimeout(() => {
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login'
          }
        }, 100)
      }
    }
    
    // Format error message for better UX
    if (error.response) {
      error.formattedMessage = formatErrorMessage(error)
    }
    
    return Promise.reject(error)
  }
)

export { api }

