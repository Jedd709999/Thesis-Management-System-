// Formatting utilities
import { format, formatDistanceToNow, parseISO } from 'date-fns'

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date, formatString = 'PPP'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, formatString)
  } catch {
    return 'Invalid date'
  }
}

/**
 * Format date and time
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'PPp')
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(dateObj, { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Format user name
 */
export function formatUserName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim() || 'Unknown User'
}

/**
 * Get initials from name
 */
export function getInitials(firstName: string, lastName: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  const last = lastName?.charAt(0)?.toUpperCase() || ''
  return first + last || '?'
}

/**
 * Format status for display
 */
export function formatStatus(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Get status color class (for Tailwind)
 */
export function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase()
  
  if (statusLower.includes('approved') || statusLower.includes('completed')) {
    return 'bg-green-100 text-green-800'
  }
  if (statusLower.includes('pending') || statusLower.includes('draft')) {
    return 'bg-yellow-100 text-yellow-800'
  }
  if (statusLower.includes('rejected') || statusLower.includes('cancelled')) {
    return 'bg-red-100 text-red-800'
  }
  if (statusLower.includes('revision') || statusLower.includes('review')) {
    return 'bg-blue-100 text-blue-800'
  }
  
  return 'bg-gray-100 text-gray-800'
}

/**
 * Parse keywords string to array
 */
export function parseKeywords(keywords: string | string[]): string[] {
  if (Array.isArray(keywords)) return keywords
  if (!keywords) return []
  return keywords.split(',').map(k => k.trim()).filter(Boolean)
}

/**
 * Format keywords array to string
 */
export function formatKeywords(keywords: string[]): string {
  return keywords.join(', ')
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
