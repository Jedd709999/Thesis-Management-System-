import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { isAuthenticated, getAccessToken, willTokenExpireSoon } from '../api/authService'

/**
 * Custom hook for accessing authentication state and functionality
 * Provides easy access to user data, authentication status, and auth actions
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return {
    // User data
    user: context.user,
    loading: context.loading,
    
    // Authentication status
    isAuthenticated: isAuthenticated(),
    hasValidToken: context.isTokenValid(),
    
    // User role helpers
    isAdmin: context.user?.role === 'ADMIN',
    isAdviser: context.user?.role === 'ADVISER',
    isStudent: context.user?.role === 'STUDENT',
    isPanel: context.user?.role === 'PANEL',
    
    // User display info
    displayName: context.user 
      ? `${context.user.first_name} ${context.user.last_name}`.trim() || context.user.email
      : '',
    
    // Actions
    login: context.setUser,
    logout: context.logout,
    refreshToken: context.refreshToken,
    checkAuthStatus: context.checkAuthStatus,
    
    // Token utilities
    getAccessToken: getAccessToken,
    willTokenExpireSoon: () => {
      const token = getAccessToken()
      return token ? willTokenExpireSoon(token) : true
    }
  }
}

/**
 * Hook for protected routes - redirects to login if not authenticated
 */
export const useRequireAuth = () => {
  const auth = useAuth()
  
  if (!auth.isAuthenticated) {
    // You might want to use React Router's navigate instead
    window.location.href = '/login'
    return null
  }
  
  return auth
}

/**
 * Hook for role-based access control
 */
export const useRequireRole = (requiredRole: string | string[]) => {
  const auth = useAuth()
  
  if (!auth.isAuthenticated) {
    window.location.href = '/login'
    return null
  }
  
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  
  if (!auth.user?.role || !roles.includes(auth.user.role)) {
    // Redirect to unauthorized page or show error
    window.location.href = '/unauthorized'
    return null
  }
  
  return auth
}
