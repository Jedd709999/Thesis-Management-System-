import React, { useContext } from 'react'
import { Box, TextField, InputAdornment, Avatar, Badge, Typography, IconButton, Button } from '@mui/material'
import { styled } from '@mui/material/styles'
import { Search, Notifications, Settings, Logout } from '@mui/icons-material'
import { Leaf, Droplets, Bell, LogOut, User } from 'lucide-react'
import { AuthContext } from '../../context/AuthContext'

const HeaderContainer = styled(Box)(({ theme }) => ({
  height: '64px',
  backgroundColor: '#ffffff',
  borderBottom: '1px solid #e2e8f0',
  padding: '0 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'fixed',
  top: 0,
  left: '256px',
  right: 0,
  zIndex: 1100,
}))

const SearchContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  maxWidth: '576px',
  position: 'relative',
}))

const SearchBar = styled(TextField)(({ theme }) => ({
  width: '100%',
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '14px',
    '&:hover': {
      borderColor: '#cbd5e1',
      backgroundColor: '#f1f5f9',
    },
    '&.Mui-focused': {
      borderColor: '#4CAF50',
      borderWidth: '2px',
      backgroundColor: '#ffffff',
      boxShadow: '0 0 0 3px rgba(76, 175, 80, 0.1)',
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '8px 12px 8px 40px',
  },
}))

const ProfileSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  paddingLeft: '16px',
  borderLeft: '1px solid #e2e8f0',
}))

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: '36px',
  height: '36px',
  fontSize: '14px',
  fontWeight: 500,
  backgroundColor: '#E8F5E9',
  color: '#2E7D32',
}))

const NotificationButton = styled(IconButton)(({ theme }) => ({
  width: '40px',
  height: '40px',
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: '#f8fafc',
  },
}))

const RoleBadge = styled(Box)<{ role: string }>(({ theme, role }) => {
  const getRoleColors = (role: string) => {
    switch(role) {
      case 'ADMIN': return { bg: '#F3E8FF', color: '#7C3AED' }
      case 'ADVISER': return { bg: '#DBEAFE', color: '#2563EB' }
      case 'PANEL': return { bg: '#FEF3C7', color: '#D97706' }
      default: return { bg: '#DCFCE7', color: '#15803D' }
    }
  }
  
  const colors = getRoleColors(role)
  
  return {
    backgroundColor: colors.bg,
    color: colors.color,
    fontSize: '11px',
    fontWeight: 500,
    padding: '2px 8px',
    borderRadius: '12px',
    textTransform: 'capitalize',
    display: 'inline-block',
  }
})

interface ENVISysHeaderProps {
  userName?: string
  userRole?: string
  notificationCount?: number
  onSearch?: (value: string) => void
}

const ENVISysHeader: React.FC<ENVISysHeaderProps> = ({
  userName = 'John Doe',
  userRole = 'STUDENT',
  notificationCount = 0,
  onSearch
}) => {
  const { logout } = useContext(AuthContext)

  return (
    <HeaderContainer>
      <SearchContainer>
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            zIndex: 1,
            pointerEvents: 'none'
          }}>
            <Search style={{ width: '16px', height: '16px', color: '#94A3B8' }} />
          </Box>
          <TextField
            fullWidth
            placeholder="Search theses, documents, groups..."
            variant="outlined"
            onChange={(e) => onSearch?.(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                '&:hover': {
                  borderColor: '#cbd5e1',
                  backgroundColor: '#f1f5f9',
                },
                '&.Mui-focused': {
                  borderColor: '#4CAF50',
                  borderWidth: '2px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 0 0 3px rgba(76, 175, 80, 0.1)',
                },
              },
              '& .MuiOutlinedInput-input': {
                padding: '10px 12px 10px 40px',
                fontSize: '14px',
              },
            }}
          />
        </Box>
      </SearchContainer>

      <ProfileSection>
        <NotificationButton>
          <Badge 
            badgeContent={notificationCount} 
            color="primary"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#EF4444',
                color: '#ffffff',
                fontSize: '10px',
                height: '16px',
                minWidth: '16px',
              }
            }}
          >
            <Bell style={{ width: '20px', height: '20px', color: '#475569' }} />
          </Badge>
        </NotificationButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ProfileAvatar>
            <User style={{ width: '18px', height: '18px' }} />
          </ProfileAvatar>
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body1" sx={{ 
              fontSize: '14px', 
              fontWeight: 500, 
              color: '#0f172a', 
              lineHeight: '20px' 
            }}>
              {userName}
            </Typography>
            <RoleBadge role={userRole}>
              {userRole.toLowerCase()}
            </RoleBadge>
          </Box>
        </Box>

        <IconButton 
          onClick={logout}
          sx={{ 
            width: '40px', 
            height: '40px',
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: '#f8fafc',
            },
          }}
          title="Logout"
        >
          <LogOut style={{ width: '16px', height: '16px', color: '#64748B' }} />
        </IconButton>
      </ProfileSection>
    </HeaderContainer>
  )
}

export default ENVISysHeader
