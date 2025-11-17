import React from 'react'
import { Box, BoxProps } from '@mui/material'
import { styled } from '@mui/material/styles'

const EcoBackgroundContainer = styled(Box)<BoxProps>(({ theme }) => ({
  position: 'relative',
  minHeight: '100vh',
  background: `
    linear-gradient(135deg, #F1F8E9 0%, #E8F5E9 25%, #F1F8E9 50%, #E8F5E9 75%, #F1F8E9 100%),
    radial-gradient(circle at 20% 80%, rgba(76, 175, 80, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(102, 187, 106, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(129, 199, 132, 0.05) 0%, transparent 50%)
  `,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      radial-gradient(circle at 10% 20%, rgba(76, 175, 80, 0.03) 1px, transparent 1px),
      radial-gradient(circle at 30% 70%, rgba(102, 187, 106, 0.03) 1px, transparent 1px),
      radial-gradient(circle at 50% 40%, rgba(129, 199, 132, 0.03) 1px, transparent 1px),
      radial-gradient(circle at 70% 90%, rgba(76, 175, 80, 0.03) 1px, transparent 1px),
      radial-gradient(circle at 90% 10%, rgba(102, 187, 106, 0.03) 1px, transparent 1px)
    `,
    backgroundSize: '200px 200px',
    animation: 'float 20s ease-in-out infinite',
    pointerEvents: 'none',
  },
  '@keyframes float': {
    '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
    '33%': { transform: 'translate(10px, -10px) scale(1.05)' },
    '66%': { transform: 'translate(-10px, 10px) scale(0.95)' },
  },
}))

interface EcoBackgroundProps extends BoxProps {
  children: React.ReactNode
  variant?: 'full' | 'section' | 'card'
}

const EcoBackground: React.FC<EcoBackgroundProps> = ({
  children,
  variant = 'full',
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'section':
        return {
          minHeight: '400px',
          borderRadius: 2,
          p: 3,
          my: 2,
        }
      case 'card':
        return {
          minHeight: '200px',
          borderRadius: 2,
          p: 2,
        }
      default:
        return {}
    }
  }

  return (
    <EcoBackgroundContainer {...props} sx={{ ...getVariantStyles(), ...props.sx }}>
      {children}
    </EcoBackgroundContainer>
  )
}

export default EcoBackground
