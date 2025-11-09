/**
 * Error message formatting utility
 * Formats API errors and validation errors for display
 */

export function formatErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error
  }

  if (error?.response?.data?.error) {
    return error.response.data.error
  }

  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error?.message) {
    return error.message
  }

  if (Array.isArray(error?.errors)) {
    return error.errors.map((e: any) => e.message || e).join(', ')
  }

  return 'An unexpected error occurred'
}

export function formatValidationErrors(errors: any[]): Record<string, string> {
  const formatted: Record<string, string> = {}
  
  errors.forEach((error) => {
    if (error.path && error.message) {
      formatted[error.path.join('.')] = error.message
    }
  })

  return formatted
}

