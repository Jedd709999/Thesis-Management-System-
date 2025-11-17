import React from 'react'
import { Box, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'

const BadgeContainer = styled(Box)<{ variant?: 'status' | 'priority' | 'role' | 'progress' }>(({ theme, variant = 'status' }) => {
  const getVariantStyles = (variant: string) => {
    switch(variant) {
      case 'priority':
        return {
          backgroundColor: '#fef3c7',
          color: '#92400e',
          border: '1px solid #fde68a',
        }
      case 'role':
        return {
          backgroundColor: '#dbeafe',
          color: '#1e40af',
          border: '1px solid #bfdbfe',
        }
      case 'progress':
        return {
          backgroundColor: '#ede9fe',
          color: '#5b21b6',
          border: '1px solid #ddd6fe',
        }
      default: // status
        return {
          backgroundColor: '#dcfce7',
          color: '#166534',
          border: '1px solid #bbf7d0',
        }
    }
  }

  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: '16px',
    border: '1px solid',
    ...getVariantStyles(variant),
  }
})

const StatusDot = styled(Box)<{ color: string }>(({ theme, color }) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: color,
  marginRight: '6px',
}))

interface ENVISysBadgeProps {
  children: React.ReactNode
  variant?: 'status' | 'priority' | 'role' | 'progress'
  status?: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  role?: 'admin' | 'adviser' | 'panel' | 'student'
  progress?: 'draft' | 'review' | 'approved' | 'submitted'
}

const ENVISysBadge: React.FC<ENVISysBadgeProps> = ({
  children,
  variant = 'status',
  status,
  priority,
  role,
  progress
}) => {
  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'active': return '#15803d'
      case 'completed': return '#15803d'
      case 'pending': return '#d97706'
      case 'inactive': return '#64748b'
      case 'cancelled': return '#dc2626'
      default: return '#15803d'
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch(priority) {
      case 'critical': return '#dc2626'
      case 'high': return '#ea580c'
      case 'medium': return '#d97706'
      case 'low': return '#15803d'
      default: return '#15803d'
    }
  }

  const getRoleColor = (role?: string) => {
    switch(role) {
      case 'admin': return '#9333ea'
      case 'adviser': return '#2563eb'
      case 'panel': return '#d97706'
      case 'student': return '#15803d'
      default: return '#15803d'
    }
  }

  const getProgressColor = (progress?: string) => {
    switch(progress) {
      case 'approved': return '#15803d'
      case 'review': return '#2563eb'
      case 'submitted': return '#d97706'
      case 'draft': return '#64748b'
      default: return '#15803d'
    }
  }

  const getDotColor = () => {
    switch(variant) {
      case 'priority': return getPriorityColor(priority)
      case 'role': return getRoleColor(role)
      case 'progress': return getProgressColor(progress)
      default: return getStatusColor(status)
    }
  }

  return (
    <BadgeContainer variant={variant}>
      {(status || priority || role || progress) && (
        <StatusDot color={getDotColor()} />
      )}
      {children}
    </BadgeContainer>
  )
}

export default ENVISysBadge
