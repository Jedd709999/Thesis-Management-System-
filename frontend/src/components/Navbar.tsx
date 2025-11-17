import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { AuthContext } from '../context/AuthContext'
import { clearTokens } from '../api/authService'
import NotificationBell from './NotificationBell'
import MenuIcon from '@mui/icons-material/Menu'
import EcoButton from './EcoComponents/EcoButton'
import { useTheme } from '@mui/material/styles'

export default function Navbar(){
  const { user, setUser } = useContext(AuthContext)
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const theme = useTheme()
  
  const logout = ()=>{ 
    clearTokens(); 
    setUser(null)
    navigate('/login')
  }
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  
  const handleClose = () => {
    setAnchorEl(null)
  }
  
  const getNavItems = () => {
    switch(user?.role) {
      case 'ADMIN':
        return [
          { label: 'Dashboard', path: '/' },
          { label: 'Manage Users', path: '/admin/users' },
          { label: 'Groups', path: '/groups' },
          { label: 'Theses', path: '/thesis' },
          { label: 'Schedule', path: '/schedule' },
        ]
      
      case 'STUDENT':
        return [
          { label: 'Dashboard', path: '/' },
          { label: 'My Thesis', path: '/thesis' },
          { label: 'Documents', path: '/documents' },
          { label: 'Feedback', path: '/thesis/workflow' },
          { label: 'Groups', path: '/groups' },
        ]
      
      case 'ADVISER':
        return [
          { label: 'Dashboard', path: '/' },
          { label: 'Theses', path: '/thesis' },
          { label: 'Groups', path: '/groups' },
          { label: 'Schedule', path: '/schedule' },
          { label: 'Feedback', path: '/thesis/workflow' },
        ]
      
      case 'PANEL':
        return [
          { label: 'Dashboard', path: '/' },
          { label: 'Assigned Theses', path: '/thesis' },
          { label: 'Evaluations', path: '/thesis/workflow' },
          { label: 'Groups', path: '/groups' },
        ]
      
      default:
        return [{ label: 'Dashboard', path: '/' }]
    }
  }
  
  const navItems = getNavItems()
  
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          alignItems: 'center',
          background: 'linear-gradient(135deg, #ffffff 0%, #E8F5E9 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 600
        }}>
          🌿 Environmental Science Thesis Management
          {user && (
            <Box sx={{ 
              ml: 2, 
              fontSize: '0.875rem', 
              opacity: 0.8,
              color: 'inherit'
            }}>
              ({user.role})
            </Box>
          )}
        </Typography>

        {user && (
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            {navItems.map((item) => (
              <EcoButton
                key={item.path}
                variant="text"
                onClick={() => navigate(item.path)}
                sx={{ ml: 1 }}
              >
                {item.label}
              </EcoButton>
            ))}
            <NotificationBell />
            <Box sx={{ ml: 2, color: 'white', fontSize: '0.875rem' }}>
              {user.email}
            </Box>
            <EcoButton 
              variant="outlined" 
              onClick={logout}
              sx={{ ml: 2, borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}
            >
              Logout
            </EcoButton>
          </Box>
        )}

        {user && (
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMenu}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              onClick={handleClose}
            >
              {navItems.map((item) => (
                <MenuItem
                  key={item.path}
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </MenuItem>
              ))}
              <MenuItem onClick={logout}>Logout</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )
}
