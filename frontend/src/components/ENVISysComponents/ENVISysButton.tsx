import React from 'react'
import { Button, ButtonProps } from '@mui/material'
import { styled } from '@mui/material/styles'

interface ENVISysButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'small' | 'medium' | 'large'
}

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => !['variant', 'size'].includes(prop as string),
})<{ variant?: string; size?: string }>(({ theme, variant = 'primary', size = 'medium' }) => {
  const getSizeStyles = (size: string) => {
    switch(size) {
      case 'small':
        return {
          padding: '6px 12px',
          fontSize: '12px',
          height: '32px',
        }
      case 'large':
        return {
          padding: '12px 24px',
          fontSize: '16px',
          height: '48px',
        }
      default:
        return {
          padding: '8px 16px',
          fontSize: '14px',
          height: '40px',
        }
    }
  }

  const getVariantStyles = (variant: string) => {
    switch(variant) {
      case 'secondary':
        return {
          backgroundColor: '#2563eb',
          color: '#ffffff',
          border: 'none',
          '&:hover': {
            backgroundColor: '#1d4ed8',
            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
          },
        }
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: '#15803d',
          border: '1px solid #15803d',
          '&:hover': {
            backgroundColor: '#15803d',
            color: '#ffffff',
            boxShadow: '0 10px 15px -3px rgba(21, 128, 61, 0.3)',
          },
        }
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: '#15803d',
          border: 'none',
          '&:hover': {
            backgroundColor: '#f0fdf4',
          },
        }
      case 'danger':
        return {
          backgroundColor: '#dc2626',
          color: '#ffffff',
          border: 'none',
          '&:hover': {
            backgroundColor: '#b91c1c',
            boxShadow: '0 10px 15px -3px rgba(220, 38, 38, 0.3)',
          },
        }
      default: // primary
        return {
          backgroundColor: '#15803d',
          color: '#ffffff',
          border: 'none',
          '&:hover': {
            backgroundColor: '#166534',
            boxShadow: '0 10px 15px -3px rgba(21, 128, 61, 0.3)',
          },
        }
    }
  }

  return {
    borderRadius: '8px',
    fontWeight: 500,
    textTransform: 'none',
    transition: 'all 150ms ease',
    boxShadow: 'none',
    ...getSizeStyles(size),
    ...getVariantStyles(variant),
  }
})

const ENVISysButton: React.FC<ENVISysButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  ...props
}) => {
  return (
    <StyledButton
      variant={variant as any}
      size={size as any}
      {...props}
    >
      {children}
    </StyledButton>
  )
}

export default ENVISysButton
