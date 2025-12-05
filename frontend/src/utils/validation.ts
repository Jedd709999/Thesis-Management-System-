// Form validation utilities

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface ValidationErrors {
  [field: string]: string
}

/**
 * Validate a single field
 */
export function validateField(
  value: any,
  rules: ValidationRule
): string | null {
  if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return 'This field is required'
  }

  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `Must be at most ${rules.maxLength} characters`
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return 'Invalid format'
    }
  }

  if (rules.custom) {
    return rules.custom(value)
  }

  return null
}

/**
 * Validate entire form
 */
export function validateForm(
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): ValidationErrors {
  const errors: ValidationErrors = {}

  Object.keys(rules).forEach(field => {
    const error = validateField(data[field], rules[field])
    if (error) {
      errors[field] = error
    }
  })

  return errors
}

/**
 * Check if form has errors
 */
export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0
}

/**
 * Email validation
 */
export function validateEmail(email: string): string | null {
  if (!email) return 'Email is required'
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email)) {
    return 'Invalid email format'
  }
  
  return null
}

/**
 * Password validation
 */
export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required'
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters'
  }
  
  return null
}

/**
 * URL validation
 */
export function validateUrl(url: string): string | null {
  if (!url) return null
  
  try {
    new URL(url)
    return null
  } catch {
    return 'Invalid URL'
  }
}

/**
 * Date validation
 */
export function validateDate(date: string): string | null {
  if (!date) return 'Date is required'
  
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date'
  }
  
  return null
}

/**
 * Future date validation
 */
export function validateFutureDate(date: string): string | null {
  const error = validateDate(date)
  if (error) return error
  
  const dateObj = new Date(date)
  if (dateObj <= new Date()) {
    return 'Date must be in the future'
  }
  
  return null
}

/**
 * File validation
 */
export function validateFile(
  file: File | null,
  options: {
    required?: boolean
    maxSize?: number // in bytes
    allowedTypes?: string[]
  } = {}
): string | null {
  if (options.required && !file) {
    return 'File is required'
  }
  
  if (!file) return null
  
  if (options.maxSize && file.size > options.maxSize) {
    const maxSizeMB = options.maxSize / (1024 * 1024)
    return `File size must be less than ${maxSizeMB}MB`
  }
  
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return `File type must be one of: ${options.allowedTypes.join(', ')}`
  }
  
  return null
}

/**
 * Array validation
 */
export function validateArray(
  arr: any[],
  options: {
    required?: boolean
    minLength?: number
    maxLength?: number
  } = {}
): string | null {
  if (options.required && (!arr || arr.length === 0)) {
    return 'At least one item is required'
  }
  
  if (!arr) return null
  
  if (options.minLength && arr.length < options.minLength) {
    return `Must have at least ${options.minLength} items`
  }
  
  if (options.maxLength && arr.length > options.maxLength) {
    return `Must have at most ${options.maxLength} items`
  }
  
  return null
}
