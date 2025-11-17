import React from 'react'
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material'
import { styled } from '@mui/material/styles'
import {
  School,
  Assignment,
  Schedule,
  People,
  TrendingUp,
  CheckCircle
} from '@mui/icons-material'

const StatCardContainer = styled(Card)(({ theme }) => ({
  backgroundColor: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  padding: '24px',
  transition: 'all 150ms ease',
  height: '100%',
  '&:hover': {
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-2px)',
  },
}))

const IconContainer = styled(Avatar)<{ color?: string }>(({ theme, color = '#15803d' }) => ({
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  backgroundColor: `${color}15`,
  color: color,
  marginBottom: '16px',
}))

const StatValue = styled(Typography)(({ theme }) => ({
  fontSize: '30px',
  fontWeight: 600,
  lineHeight: '36px',
  color: '#0f172a',
  marginBottom: '4px',
}))

const StatLabel = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  fontWeight: 400,
  lineHeight: '20px',
  color: '#475569',
}))

const TrendIndicator = styled(Box)<{ trend?: 'up' | 'down' | 'neutral' }>(({ theme, trend = 'neutral' }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  marginTop: '8px',
  fontSize: '12px',
  fontWeight: 500,
  color: trend === 'up' ? '#15803d' : trend === 'down' ? '#dc2626' : '#64748b',
}))

interface ENVISysStatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  color?: string
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: string
  }
  subtitle?: string
}

const ENVISysStatCard: React.FC<ENVISysStatCardProps> = ({
  title,
  value,
  icon,
  color = '#15803d',
  trend,
  subtitle
}) => {
  const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch(direction) {
      case 'up': return '↑'
      case 'down': return '↓'
      default: return '→'
    }
  }

  return (
    <StatCardContainer>
      <CardContent sx={{ p: 0 }}>
        <IconContainer color={color}>
          {icon}
        </IconContainer>
        
        <StatValue>
          {value}
        </StatValue>
        
        <StatLabel>
          {title}
        </StatLabel>
        
        {subtitle && (
          <Typography variant="body2" sx={{ fontSize: '12px', color: '#64748b', mt: 1 }}>
            {subtitle}
          </Typography>
        )}
        
        {trend && (
          <TrendIndicator trend={trend.direction}>
            <span>{getTrendIcon(trend.direction)}</span>
            <span>{trend.value}</span>
          </TrendIndicator>
        )}
      </CardContent>
    </StatCardContainer>
  )
}

export default ENVISysStatCard
