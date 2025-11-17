import React, { createContext, useEffect, useState, useCallback } from 'react'
import { fetchProfile, isAuthenticated, clearTokens, getAccessToken, willTokenExpireSoon } from '../api/authService'
import api from '../api/api'

type User = { 
  id: number
  email: string
  role: string
  first_name?: string
  last_name?: string
  is_active: boolean
  is_staff: boolean
} | null

interface AuthContextType {
  user: User
  setUser: (u: User) => void
  loading: boolean
  logout: () => void
  refreshToken: () => Promise<void>
  isTokenValid: () => boolean
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  logout: () => {},
  refreshToken: async () => {},
  isTokenValid: () => false
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)
  const [tokenRefreshInterval, setTokenRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Logout function
  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval)
      setTokenRefreshInterval(null)
    }
    // Redirect to login page
    window.location.href = '/login'
  }, [tokenRefreshInterval])

  // Refresh token and user data
  const refreshToken = useCallback(async () => {
    try {
      // The api interceptor will handle the actual token refresh
      // We just need to fetch the updated user profile
      const userProfile = await fetchProfile()
      setUser(userProfile)
    } catch (error) {
      console.error('Failed to refresh user data:', error)
      logout()
    }
  }, [logout])

  // Check if current token is valid
  const isTokenValid = useCallback((): boolean => {
    const token = getAccessToken()
    if (!token) return false
    
    // Check if token will expire within the next 2 minutes
    return !willTokenExpireSoon(token, 2)
  }, [])

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAccessToken()
      
      if (token && isAuthenticated()) {
        try {
          const userProfile = await fetchProfile()
          setUser(userProfile)
          
          // Set up proactive token refresh
          const refreshInterval = setInterval(() => {
            const currentToken = getAccessToken()
            if (currentToken && willTokenExpireSoon(currentToken, 3)) {
              // Make a dummy API call to trigger the refresh interceptor
              api.get('auth/me/').catch(() => {
                // The interceptor will handle the refresh, we ignore errors here
              })
            }
          }, 60000) // Check every minute
          
          setTokenRefreshInterval(refreshInterval)
        } catch (error) {
          console.error('Failed to fetch user profile:', error)
          clearTokens()
        }
      }
      
      setLoading(false)
    }

    initializeAuth()

    // Cleanup interval on unmount
    return () => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval)
      }
    }
  }, [])

  // Handle visibility change to refresh token when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isTokenValid()) {
        refreshToken()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isTokenValid, refreshToken])

  // Setup global error handler for authentication failures
  useEffect(() => {
    const handleAuthError = (event: CustomEvent) => {
      if (event.detail?.type === 'AUTH_ERROR') {
        logout()
      }
    }

    window.addEventListener('authError', handleAuthError as EventListener)
    
    return () => {
      window.removeEventListener('authError', handleAuthError as EventListener)
    }
  }, [logout])

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      loading, 
      logout, 
      refreshToken, 
      isTokenValid 
    }}>
      {children}
    </AuthContext.Provider>
  )
}
