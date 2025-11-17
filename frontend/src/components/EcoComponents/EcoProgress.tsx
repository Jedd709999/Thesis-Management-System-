import React from 'react'
import { Box, LinearProgress, linearProgressClasses, Typography, Stack } from '@mui/material'
import { styled } from '@mui/material/styles'

const EcoLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 12,
  borderRadius: 6,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 6,
    background: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 50%, #81C784 100%)',
  },
}))

interface EcoProgressProps {
  value: number
  label?: string
  showPercentage?: boolean
  size?: 'small' | 'medium' | 'large'
}

const EcoProgress: React.FC<EcoProgressProps> = ({
  value,
  label,
  showPercentage = true,
  size = 'medium'
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { height: 8, fontSize: '0.75rem' }
      case 'large':
        return { height: 16, fontSize: '1rem' }
      default:
        return { height: 12, fontSize: '0.875rem' }
    }
  }

  const sizeStyles = getSizeStyles()

  return (
    <Box>
      {label && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          {showPercentage && (
            <Typography variant="body2" color="primary.main" fontWeight={500}>
              {Math.round(value)}%
            </Typography>
          )}
        </Stack>
      )}
      <Box sx={{ position: 'relative' }}>
        <EcoLinearProgress
          variant="determinate"
          value={value}
          sx={{ height: sizeStyles.height }}
        />
        {/* Leaf indicator at the end of progress */}
        {value > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: `${value}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: size === 'small' ? '0.75rem' : size === 'large' ? '1.25rem' : '1rem',
            }}
          >
            🌿
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default EcoProgress
