import React from 'react'
import { Box, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import { Leaf, LayoutDashboard, FileText, Users, FolderOpen, Calendar, Bell, Settings } from 'lucide-react'

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: '256px',
  height: '100vh',
  background: 'linear-gradient(180deg, #14532d 0%, #1B5E20 50%, #2E7D32 100%)',
  position: 'fixed',
  left: 0,
  top: 0,
  overflowY: 'auto',
  color: '#ffffff',
  zIndex: 1200,
  boxShadow: '2px 0 8px rgba(46, 125, 50, 0.3)',
  display: 'flex',
  flexDirection: 'column',
}))

const LogoSection = styled(Box)(({ theme }) => ({
  padding: '24px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
}))

const NavigationSection = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}))

const RoleSection = styled(Box)(({ theme }) => ({
  padding: '16px',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
}))

const NavItem = styled(Box, { shouldForwardProp: (prop) => prop !== 'active' })<{ active?: boolean }>(({ theme, active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 12px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: active ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
  color: '#ffffff',
  boxShadow: active ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none',
  '&:hover': {
    backgroundColor: active ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
  },
}))

interface ENVISysSidebarProps {
  userRole: string
  currentPage?: string
  onNavigate?: (page: string) => void
}

const ENVISysSidebar: React.FC<ENVISysSidebarProps> = ({ userRole, currentPage = 'dashboard', onNavigate }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'thesis', label: 'Thesis', icon: FileText },
    { id: 'groups', label: userRole === 'STUDENT' ? 'Group' : 'Groups', icon: Users },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const handleNavigation = (itemId: string) => {
    if (onNavigate) {
      onNavigate(itemId)
    } else {
      // Fallback navigation using window.location
      const routes: Record<string, string> = {
        dashboard: '/',
        thesis: '/thesis',
        groups: '/groups',
        documents: '/documents',
        schedule: '/schedule',
        notifications: '/notifications',
        settings: '/settings',
      }
      window.location.href = routes[itemId] || '/'
    }
  }

  return (
    <SidebarContainer>
      <LogoSection>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{
            width: 40,
            height: 40,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Leaf style={{ width: '24px', height: '24px', color: '#86EFAC' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{
              fontWeight: 600,
              fontSize: '18px',
              lineHeight: 1.2,
              color: '#ffffff'
            }}>
              ENVISys
            </Typography>
            <Typography variant="caption" sx={{
              color: '#86EFAC',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Environmental Science Thesis Management
            </Typography>
          </Box>
        </Box>
      </LogoSection>

      <NavigationSection>
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id ||
            (item.id === 'thesis' && (currentPage === 'thesis-detail' || currentPage === 'thesis-workflow')) ||
            (item.id === 'groups' && currentPage === 'group-detail')

          return (
            <NavItem
              key={item.id}
              active={isActive}
              onClick={() => handleNavigation(item.id)}
            >
              <Icon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
              <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 400, color: '#ffffff', letterSpacing: '0.3px' }}>
                {item.label}
              </Typography>
            </NavItem>
          )
        })}
      </NavigationSection>

      <RoleSection>
        <Box sx={{
          px: 2,
          py: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
        }}>
          <Typography variant="caption" sx={{
            color: '#86EFAC',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 600,
            mb: 0.5
          }}>
            Role
          </Typography>
          <Typography variant="body2" sx={{
            textTransform: 'capitalize',
            fontSize: '14px',
            fontWeight: 500,
            color: '#ffffff'
          }}>
            {userRole.toLowerCase()}
          </Typography>
        </Box>
      </RoleSection>
    </SidebarContainer>
  )
}

export default ENVISysSidebar
