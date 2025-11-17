import api from './api'
import axios from 'axios'

export type Tokens = { 
  access: string
  refresh: string
}

export type User = {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  is_staff: boolean
}

// Login function
export async function login(email: string, password: string): Promise<Tokens> {
  const res = await api.post('auth/login/', { email, password })
  return res.data as Tokens
}

// Save tokens to localStorage
export function saveTokens(t: Tokens): void {
  localStorage.setItem('access_token', t.access)
  localStorage.setItem('refresh_token', t.refresh)
}

// Clear tokens from localStorage
export function clearTokens(): void {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

// Get current access token
export function getAccessToken(): string | null {
  return localStorage.getItem('access_token')
}

// Get current refresh token
export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token')
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

// Refresh access token using refresh token
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken()
  
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/'}auth/refresh/`,
      { refresh: refreshToken }
    )
    
    const { access } = response.data
    localStorage.setItem('access_token', access)
    
    return access
  } catch (error) {
    // Refresh failed, clear tokens
    clearTokens()
    throw error
  }
}

// Logout function (optional - if backend has logout endpoint)
export async function logout(): Promise<void> {
  try {
    // Optional: Call backend logout endpoint if available
    await api.post('auth/logout/')
  } catch (error) {
    // Even if logout fails, clear local tokens
    console.warn('Logout endpoint failed, clearing local tokens:', error)
  } finally {
    clearTokens()
  }
}

// Fetch user profile
export async function fetchProfile(): Promise<User> {
  const res = await api.get('auth/me/')
  return res.data as User
}

// Check if token is expired (basic check - you might want to add JWT parsing)
export function isTokenExpired(token: string): boolean {
  try {
    // Basic JWT parsing - you might want to use a proper JWT library
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    return payload.exp < currentTime
  } catch {
    // If we can't parse the token, assume it's expired
    return true
  }
}

// Get token expiration time
export function getTokenExpiration(token: string): Date | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return new Date(payload.exp * 1000)
  } catch {
    return null
  }
}

// Check if token will expire within the next X minutes
export function willTokenExpireSoon(token: string, minutesThreshold: number = 5): boolean {
  const expiration = getTokenExpiration(token)
  if (!expiration) return true
  
  const thresholdTime = new Date(Date.now() + minutesThreshold * 60 * 1000)
  return expiration <= thresholdTime
}

// Proactive token refresh (call this before making important API calls)
export async function ensureValidToken(): Promise<string> {
  const token = getAccessToken()
  
  if (!token) {
    throw new Error('No access token available')
  }
  
  // If token is expired or will expire soon, refresh it
  if (isTokenExpired(token) || willTokenExpireSoon(token)) {
    return await refreshAccessToken()
  }
  
  return token
}
