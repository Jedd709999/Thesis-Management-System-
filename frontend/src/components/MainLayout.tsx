import React, { useContext } from 'react'
import { Box } from '@mui/material'
import { useLocation } from 'react-router-dom'
import ENVISysHeader from './ENVISysComponents/ENVISysHeader'
import ENVISysSidebar from './ENVISysComponents/ENVISysSidebar'
import { AuthContext } from '../context/AuthContext'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useContext(AuthContext)
  const location = useLocation()
  const userRole = user?.role || 'STUDENT'
  const userName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User'

  // Determine current page based on URL path
  const getCurrentPage = () => {
    const path = location.pathname
    
    if (path === '/' || path === '/admin/users') return 'dashboard'
    if (path.startsWith('/groups')) {
      return path.includes('/:id') || (path.split('/').length > 2) ? 'group-detail' : 'groups'
    }
    if (path.startsWith('/thesis')) {
      return path.includes('/workflow') ? 'thesis-workflow' : 'thesis'
    }
    if (path.startsWith('/documents')) return 'documents'
    if (path.startsWith('/schedule')) return 'schedule'
    if (path.startsWith('/notifications')) return 'notifications'
    if (path.startsWith('/settings')) return 'settings'
    
    return 'dashboard'
  }

  const currentPage = getCurrentPage()

  return (
    <>
      <ENVISysSidebar userRole={userRole} currentPage={currentPage} />
      <ENVISysHeader userName={userName} userRole={userRole} />
      <Box
        sx={{
          ml: '256px', // Sidebar width
          mt: '64px',  // Header height
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </>
  )
}
