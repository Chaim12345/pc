/**
 * Environment variable configuration for frontend
 * Uses Vite's import.meta.env for environment variables
 */

export const env = {
  // API and Socket configuration
  get API_URL() {
    return import.meta.env.VITE_API_URL || 'http://localhost:3001';
  },
  
  get SOCKET_URL() {
    return import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
  },
  
  // Environment
  get NODE_ENV() {
    return import.meta.env.MODE || 'development';
  },
  
  get IS_DEVELOPMENT() {
    return this.NODE_ENV === 'development';
  },
  
  get IS_PRODUCTION() {
    return this.NODE_ENV === 'production';
  }
};
