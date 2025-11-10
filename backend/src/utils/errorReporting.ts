/**
 * Error reporting utility with Sentry integration for backend
 */

import * as Sentry from '@sentry/node'
import { ProfilingIntegration } from '@sentry/profiling-node'
import { logger } from './logger'

interface ErrorContext {
  userId?: string
  boardId?: string
  itemId?: string
  endpoint?: string
  method?: string
  [key: string]: any
}

class ErrorReportingService {
  private initialized = false

  /**
   * Initialize error reporting service with Sentry
   */
  init() {
    if (this.initialized) return

    const dsn = process.env.SENTRY_DSN
    const environment = process.env.NODE_ENV || 'development'

    if (!dsn) {
      logger.warn('Sentry DSN not configured. Error reporting will be limited to console logs.')
      this.initialized = true
      return
    }

    Sentry.init({
      dsn,
      environment,
      integrations: [
        // Enable profiling
        new ProfilingIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      // Profiling
      profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
      // Filter out common non-critical errors
      beforeSend(event, hint) {
        // Filter out common non-critical errors
        if (event.exception) {
          const error = hint.originalException
          if (error instanceof Error) {
            // Filter out validation errors (handled by API)
            if (
              error.message.includes('validation') ||
              error.message.includes('ValidationError') ||
              error.name === 'ZodError'
            ) {
              return null
            }
            // Filter out authentication errors (expected)
            if (
              error.message.includes('Unauthorized') ||
              error.message.includes('Forbidden') ||
              error.message.includes('Token')
            ) {
              return null
            }
          }
        }
        return event
      },
    })

    this.initialized = true
    logger.info('Sentry error reporting initialized')
  }

  /**
   * Report an error to Sentry
   */
  reportError(error: Error, context?: ErrorContext) {
    // Log to console
    logger.error('Error reported:', error, context)

    if (!this.initialized) {
      this.init()
    }

    // Send to Sentry with context
    Sentry.captureException(error, {
      extra: context,
      tags: {
        endpoint: context?.endpoint || 'unknown',
        method: context?.method || 'unknown',
      },
    })
  }

  /**
   * Set user context for error reporting
   */
  setUser(userId: string, userInfo?: Record<string, any>) {
    if (!this.initialized) {
      this.init()
    }

    Sentry.setUser({
      id: userId,
      ...userInfo,
    })
  }

  /**
   * Clear user context
   */
  clearUser() {
    if (!this.initialized) {
      this.init()
    }

    Sentry.setUser(null)
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category?: string, level?: Sentry.SeverityLevel, data?: Record<string, any>) {
    if (!this.initialized) {
      this.init()
    }

    Sentry.addBreadcrumb({
      message,
      category: category || 'default',
      level: level || 'info',
      data,
    })
  }

  /**
   * Set context for error reporting
   */
  setContext(name: string, context: Record<string, any>) {
    if (!this.initialized) {
      this.init()
    }

    Sentry.setContext(name, context)
  }

  /**
   * Capture message (non-error)
   */
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: ErrorContext) {
    if (!this.initialized) {
      this.init()
    }

    Sentry.captureMessage(message, level, {
      extra: context,
    })
  }
}

export const errorReportingService = new ErrorReportingService()

