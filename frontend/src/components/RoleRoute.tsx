import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { UserRole } from '../types'
import { Spinner } from './ui'

interface RoleRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  redirectTo?: string
}

/**
 * Route wrapper that checks if user has required role
 * Redirects to login if not authenticated, or to dashboard if unauthorized
 */
export const RoleRoute: React.FC<RoleRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/dashboard'
}) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="size-12" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
