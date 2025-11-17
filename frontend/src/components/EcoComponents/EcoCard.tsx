import React from 'react'
import { Card, CardContent, CardProps, Box, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'

const StyledCard = styled(Card)<CardProps>(({ theme }) => ({
  background: 'linear-gradient(135deg, #ffffff 0%, #F1F8E9 100%)',
  border: `1px solid ${theme.palette.divider}`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 50%, #81C784 100%)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 60,
    height: 60,
    background: 'radial-gradient(circle, rgba(76, 175, 80, 0.1) 0%, transparent 70%)',
    borderRadius: '50%',
  },
}))

interface EcoCardProps extends CardProps {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  badge?: React.ReactNode
}

const EcoCard: React.FC<EcoCardProps> = ({
  children,
  title,
  subtitle,
  icon,
  badge,
  ...props
}) => {
  return (
    <StyledCard {...props}>
      <CardContent>
        {(title || subtitle || icon) && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {icon && (
              <Box sx={{ mr: 2, color: 'primary.main' }}>
                {icon}
              </Box>
            )}
            <Box sx={{ flex: 1 }}>
              {title && (
                <Typography variant="h6" component="h3" gutterBottom={false}>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            {badge && <Box>{badge}</Box>}
          </Box>
        )}
        {children}
      </CardContent>
    </StyledCard>
  )
}

export default EcoCard
