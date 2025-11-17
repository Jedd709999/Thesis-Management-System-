import React from 'react'
import { Button, ButtonProps } from '@mui/material'
import { styled } from '@mui/material/styles'

const EcoButtonStyled = styled(Button)<ButtonProps>(({ theme, variant }) => ({
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.3)',
    transform: 'translate(-50%, -50%)',
    transition: 'width 0.6s, height 0.6s',
  },
  '&:hover::before': {
    width: '300px',
    height: '300px',
  },
  ...(variant === 'outlined' && {
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: 'rgba(76, 175, 80, 0.04)',
      borderColor: theme.palette.primary.dark,
    },
  }),
  ...(variant === 'text' && {
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: 'rgba(76, 175, 80, 0.04)',
    },
  }),
}))

interface EcoButtonProps extends ButtonProps {
  ripple?: boolean
}

const EcoButton: React.FC<EcoButtonProps> = ({ children, ripple = true, ...props }) => {
  return (
    <EcoButtonStyled {...props}>
      {children}
    </EcoButtonStyled>
  )
}

export default EcoButton
