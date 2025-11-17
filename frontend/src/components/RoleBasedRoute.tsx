import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Container, Typography, Box } from '@mui/material'

interface RoleBasedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
}

export default function RoleBasedRoute({ children, allowedRoles }: RoleBasedRouteProps){
  const { user, loading } = useContext(AuthContext)
  
  if (loading) return <Container><Typography>Loading...</Typography></Container>
  
  if (!user) return <Navigate to="/login" replace />
  
  if (!allowedRoles.includes(user.role || '')) {
    return (
      <Container>
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You don't have permission to access this page.
          </Typography>
        </Box>
      </Container>
    )
  }
  
  return <>{children}</>
}
