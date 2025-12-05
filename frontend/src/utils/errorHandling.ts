// Error handling utilities
import { AxiosError } from 'axios'

export interface ApiError {
  message: string
  status?: number
  errors?: Record<string, string[]>
  detail?: string
}

/**
 * Extract error message from API error response
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const axiosError = error as AxiosError<any>
    
    if (axiosError.response) {
      const data = axiosError.response.data
      
      // Handle DRF error formats
      if (data?.detail) {
        return data.detail
      }
      
      if (data?.message) {
        return data.message
      }
      
      // Handle field errors
      if (data && typeof data === 'object') {
        const firstError = Object.values(data)[0]
        if (Array.isArray(firstError) && firstError.length > 0) {
          return String(firstError[0])
        }
      }
      
      return `Server error: ${axiosError.response.status}`
    }
    
    if (axiosError.request) {
      return 'Network error: Unable to reach the server'
    }
    
    return error.message
  }
  
  return 'An unexpected error occurred'
}

/**
 * Parse API error into structured format
 */
export function parseApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    const axiosError = error as AxiosError<any>
    
    if (axiosError.response) {
      return {
        message: getErrorMessage(error),
        status: axiosError.response.status,
        errors: axiosError.response.data,
        detail: axiosError.response.data?.detail
      }
    }
    
    return {
      message: getErrorMessage(error)
    }
  }
  
  return {
    message: 'An unexpected error occurred'
  }
}

/**
 * Display error notification (hook into notification system)
 */
export function showErrorNotification(error: unknown, fallbackMessage?: string): void {
  const message = fallbackMessage || getErrorMessage(error)
  
  // Dispatch custom event that can be caught by notification system
  window.dispatchEvent(new CustomEvent('showNotification', {
    detail: {
      type: 'error',
      message
    }
  }))
}

/**
 * Display success notification
 */
export function showSuccessNotification(message: string): void {
  window.dispatchEvent(new CustomEvent('showNotification', {
    detail: {
      type: 'success',
      message
    }
  }))
}

/**
 * Display info notification
 */
export function showInfoNotification(message: string): void {
  window.dispatchEvent(new CustomEvent('showNotification', {
    detail: {
      type: 'info',
      message
    }
  }))
}

/**
 * Display warning notification
 */
export function showWarningNotification(message: string): void {
  window.dispatchEvent(new CustomEvent('showNotification', {
    detail: {
      type: 'warning',
      message
    }
  }))
}

/**
 * Check if error is authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const axiosError = error as AxiosError
    return axiosError.response?.status === 401
  }
  return false
}

/**
 * Check if error is permission error
 */
export function isPermissionError(error: unknown): boolean {
  if (error instanceof Error) {
    const axiosError = error as AxiosError
    return axiosError.response?.status === 403
  }
  return false
}

/**
 * Check if error is not found error
 */
export function isNotFoundError(error: unknown): boolean {
  if (error instanceof Error) {
    const axiosError = error as AxiosError
    return axiosError.response?.status === 404
  }
  return false
}

/**
 * Check if error is validation error
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof Error) {
    const axiosError = error as AxiosError
    return axiosError.response?.status === 400
  }
  return false
}
