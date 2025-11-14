import React, { useContext } from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import { AuthContext } from '../context/AuthContext'
import { clearTokens } from '../api/authService'
import NotificationBell from './NotificationBell'

export default function Navbar(){
  const { user, setUser } = useContext(AuthContext)
  const logout = ()=>{ clearTokens(); setUser(null) }
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow:1 }}>Thesis Management</Typography>
        <NotificationBell />
        {user && <Box sx={{ ml:2 }}>{user.email}</Box>}
        {user && <Button color="inherit" onClick={logout}>Logout</Button>}
      </Toolbar>
    </AppBar>
  )
}
