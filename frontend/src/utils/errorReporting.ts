/**
 * Error reporting utility
 * Prepares for integration with error tracking services like Sentry
 */

import { logger } from './logger'

interface ErrorContext {
  userId?: string
  boardId?: string
  itemId?: string
  component?: string
  [key: string]: any
}

class ErrorReportingService {
  private initialized = false

  /**
   * Initialize error reporting service
   * In production, this would set up Sentry or similar service
   */
  init() {
    if (this.initialized) return

    // In production, initialize Sentry here
    // Example: Sentry.init({ dsn: process.env.REACT_APP_SENTRY_DSN })

    this.initialized = true
  }

  /**
   * Report an error to the error tracking service
   */
  reportError(error: Error, context?: ErrorContext) {
    // Log to console in development
    logger.error('Error reported:', error, context)

    // In production, send to error tracking service
    // Example: Sentry.captureException(error, { extra: context })
  }

  /**
   * Set user context for error reporting
   */
  setUser(userId: string, userInfo?: Record<string, any>) {
    // In production, set user context in Sentry
    // Example: Sentry.setUser({ id: userId, ...userInfo })
  }

  /**
   * Clear user context
   */
  clearUser() {
    // In production, clear user context in Sentry
    // Example: Sentry.setUser(null)
  }
}

export const errorReportingService = new ErrorReportingService()

