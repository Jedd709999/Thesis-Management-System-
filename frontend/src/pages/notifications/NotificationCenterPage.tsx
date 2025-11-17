import React, { useEffect, useState, useContext } from 'react'
import { Box, Typography, Paper, Button, Chip, Avatar, IconButton, Tooltip, Tabs, Tab, Badge, Card, CardContent } from '@mui/material'
import { Notifications, CheckCircle, Description, Upload, EventNote, Delete, MarkEmailRead } from '@mui/icons-material'
import { listNotifications, markRead } from '../../api/notificationService'
import { NotificationContext } from '../../context/NotificationContext'
import { useAuth } from '../../hooks/useAuth'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export default function NotificationCenterPage() {
  const { user } = useAuth()
  const { items: notifications, refresh } = useContext(NotificationContext)
  const [tabValue, setTabValue] = useState(0)
  const [localNotifications, setLocalNotifications] = useState<any[]>([])

  useEffect(() => {
    setLocalNotifications(notifications)
  }, [notifications])

  const unreadCount = localNotifications.filter(n => !n.read_at).length

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Thesis':
        return '#10B981'
      case 'Documents':
        return '#2563EB'
      case 'Schedule':
        return '#F59E0B'
      default:
        return '#64748B'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Thesis':
        return <Description sx={{ fontSize: 20 }} />
      case 'Documents':
        return <Upload sx={{ fontSize: 20 }} />
      case 'Schedule':
        return <EventNote sx={{ fontSize: 20 }} />
      default:
        return <Notifications sx={{ fontSize: 20 }} />
    }
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      await markRead(id)
      refresh()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = localNotifications.filter(n => !n.read_at)
    for (const notification of unreadNotifications) {
      try {
        await markRead(notification.id)
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    }
    refresh()
  }

  const getFilteredNotifications = () => {
    switch (tabValue) {
      case 1: // Unread
        return localNotifications.filter(n => !n.read_at)
      case 2: // Thesis
        return localNotifications.filter(n => n.category === 'Thesis')
      case 3: // Documents
        return localNotifications.filter(n => n.category === 'Documents')
      case 4: // Schedule
        return localNotifications.filter(n => n.category === 'Schedule')
      default: // All
        return localNotifications
    }
  }

  const filteredNotifications = getFilteredNotifications()

  return (
    <Box sx={{ p: 4, backgroundColor: '#F8FAFC' }}>
      {/* Welcome Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 6 }}>
        <Box>
          <Typography variant="h3" sx={{ color: '#1E293B', fontWeight: 600, mb: 1 }}>
            Notification Center
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Notifications sx={{ width: 16, height: 16, color: '#10B981' }} />
            <Typography variant="body1" sx={{ color: '#64748B' }}>
              Stay updated with your thesis progress and team activities
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<CheckCircle />}
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          sx={{
            borderColor: '#E2E8F0',
            color: '#64748B',
            '&:hover': {
              borderColor: '#CBD5E1',
              backgroundColor: '#F8FAFC'
            }
          }}
        >
          Mark All as Read
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Card sx={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 0.5 }}>
                  Total
                </Typography>
                <Typography variant="h4" sx={{ color: '#1E293B', fontWeight: 600 }}>
                  {localNotifications.length}
                </Typography>
              </Box>
              <Notifications sx={{ fontSize: 32, color: '#E2E8F0' }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', backgroundColor: '#F0FDF4' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#10B981', mb: 0.5 }}>
                  Unread
                </Typography>
                <Typography variant="h4" sx={{ color: '#047857', fontWeight: 600 }}>
                  {unreadCount}
                </Typography>
              </Box>
              <Notifications sx={{ fontSize: 32, color: '#86EFAC' }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 0.5 }}>
                  Thesis
                </Typography>
                <Typography variant="h4" sx={{ color: '#1E293B', fontWeight: 600 }}>
                  {localNotifications.filter(n => n.category === 'Thesis').length}
                </Typography>
              </Box>
              <Description sx={{ fontSize: 32, color: '#E2E8F0' }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 0.5 }}>
                  Documents
                </Typography>
                <Typography variant="h4" sx={{ color: '#1E293B', fontWeight: 600 }}>
                  {localNotifications.filter(n => n.category === 'Documents').length}
                </Typography>
              </Box>
              <Upload sx={{ fontSize: 32, color: '#E2E8F0' }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Notifications List */}
      <Card sx={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Box sx={{ borderBottom: '1px solid #E2E8F0' }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                color: '#64748B',
                '&.Mui-selected': {
                  color: '#10B981'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#10B981'
              }
            }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  All
                  <Badge
                    badgeContent={localNotifications.length}
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: '#F1F5F9',
                        color: '#64748B'
                      }
                    }}
                  />
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Unread
                  <Badge
                    badgeContent={unreadCount}
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: '#DCFCE7',
                        color: '#16A34A'
                      }
                    }}
                  />
                </Box>
              }
            />
            <Tab label="Thesis" />
            <Tab label="Documents" />
            <Tab label="Schedules" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Notifications sx={{ fontSize: 48, color: '#E2E8F0', mb: 2 }} />
              <Typography variant="body1" sx={{ color: '#64748B' }}>
                No notifications found
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredNotifications.map((notification) => (
                <Box
                  key={notification.id}
                  sx={{
                    p: 3,
                    border: '1px solid #E2E8F0',
                    borderRadius: 2,
                    backgroundColor: notification.read_at ? '#FFFFFF' : '#F0FDF4',
                    '&:hover': { backgroundColor: notification.read_at ? '#F8FAFC' : '#DCFCE7' },
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        backgroundColor: getCategoryColor(notification.category),
                        color: '#FFFFFF'
                      }}
                    >
                      {getCategoryIcon(notification.category)}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600, fontSize: '14px' }}>
                            {notification.title}
                          </Typography>
                          {!notification.read_at && (
                            <Box sx={{ width: 8, height: 8, backgroundColor: '#10B981', borderRadius: '50%' }} />
                          )}
                        </Box>
                        <Chip
                          label={notification.category}
                          size="small"
                          sx={{
                            backgroundColor: notification.category === 'Thesis' ? '#DCFCE7' :
                                           notification.category === 'Documents' ? '#DBEAFE' :
                                           '#FEF3C7',
                            color: notification.category === 'Thesis' ? '#166534' :
                                   notification.category === 'Documents' ? '#1E40AF' :
                                   '#92400E',
                            fontWeight: 500,
                            fontSize: '12px'
                          }}
                        />
                      </Box>

                      <Typography variant="body2" sx={{ color: '#64748B', mb: 2, lineHeight: 1.5 }}>
                        {notification.message}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                          {new Date(notification.created_at).toLocaleString()}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {!notification.read_at && (
                            <Button
                              variant="text"
                              size="small"
                              startIcon={<MarkEmailRead sx={{ fontSize: 14 }} />}
                              onClick={() => handleMarkAsRead(notification.id)}
                              sx={{
                                textTransform: 'none',
                                fontSize: '12px',
                                color: '#10B981'
                              }}
                            >
                              Mark as Read
                            </Button>
                          )}
                          <Tooltip title="Delete">
                            <IconButton size="small" sx={{ color: '#94A3B8' }}>
                              <Delete sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  )
}
