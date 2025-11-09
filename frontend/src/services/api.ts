import axios from 'axios'
import { formatErrorMessage } from '../utils/errorMessages'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired - clear it
      localStorage.removeItem('token')
      // Only redirect to login if we're not already on the login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
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

