import React, { Component, ErrorInfo, ReactNode } from 'react'
import { logger } from '../utils/logger'
import { errorReportingService } from '../utils/errorReporting'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console/logger
    logger.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Report to error tracking service
    errorReportingService.reportError(error, {
      component: errorInfo.componentStack?.split('\n')[0] || 'Unknown',
      errorInfo: errorInfo.componentStack,
    })
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-monday-background dark:bg-monday-dark p-4">
          <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-lg p-8 max-w-md w-full border-2 border-red-200 dark:border-red-800">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-monday-text dark:text-white mb-2 text-center">
              Something went wrong
            </h2>
            <p className="text-monday-textLight dark:text-gray-400 mb-6 text-center">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
                <summary className="cursor-pointer font-semibold text-monday-text dark:text-white mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <strong className="text-red-600 dark:text-red-400">Error:</strong>
                    <pre className="mt-1 text-xs overflow-auto text-gray-800 dark:text-gray-300">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong className="text-red-600 dark:text-red-400">Stack Trace:</strong>
                      <pre className="mt-1 text-xs overflow-auto text-gray-800 dark:text-gray-300">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-monday-text dark:text-white rounded-lg font-medium transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

