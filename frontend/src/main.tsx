import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/config'

// Ensure root element exists before rendering
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a <div id="root"></div> in your HTML.')
}

// Render with error boundary
try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} catch (error) {
  console.error('Failed to render app:', error)
  // Render a fallback UI if rendering fails
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
      <h1 style="color: #dc2626; margin-bottom: 16px;">Application Error</h1>
      <p style="color: #6b7280; margin-bottom: 24px;">Failed to load the application. Please refresh the page.</p>
      <button onclick="window.location.reload()" style="padding: 12px 24px; background: #0073ea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
        Refresh Page
      </button>
      ${process.env.NODE_ENV === 'development' ? `<pre style="margin-top: 24px; padding: 16px; background: #f3f4f6; border-radius: 8px; overflow: auto; max-width: 800px; font-size: 12px;">${error instanceof Error ? error.stack : String(error)}</pre>` : ''}
    </div>
  `
}

