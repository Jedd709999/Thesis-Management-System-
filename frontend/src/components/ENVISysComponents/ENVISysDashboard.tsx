import React from 'react'
import { Box, Grid, Typography, Card, CardContent, List, ListItem, ListItemText } from '@mui/material'
import { 
  ENVISysSidebar, 
  ENVISysHeader, 
  ENVISysStatCard, 
  ENVISysButton, 
  ENVISysBadge 
} from './index'
import {
  School,
  Assignment,
  Schedule,
  People,
  Description,
  TrendingUp,
  CheckCircle,
  Pending,
  Update,
  Group
} from '@mui/icons-material'

interface ENVISysDashboardProps {
  userRole?: string
  userName?: string
  currentPath?: string
}

const ENVISysDashboard: React.FC<ENVISysDashboardProps> = ({
  userRole = 'STUDENT',
  userName = 'John Doe',
  currentPath = '/'
}) => {
  const getRoleBasedStats = () => {
    switch(userRole) {
      case 'ADMIN':
        return [
          { title: 'Total Users', value: '156', icon: <People />, color: '#2563eb' },
          { title: 'Active Theses', value: '48', icon: <School />, color: '#15803d' },
          { title: 'Groups', value: '12', icon: <Group />, color: '#d97706' },
          { title: 'Documents', value: '234', icon: <Description />, color: '#9333ea' },
        ]
      case 'ADVISER':
        return [
          { title: 'Advisees', value: '8', icon: <People />, color: '#2563eb' },
          { title: 'Active Theses', value: '8', icon: <School />, color: '#15803d' },
          { title: 'Pending Reviews', value: '3', icon: <Assignment />, color: '#d97706' },
          { title: 'Upcoming Defenses', value: '2', icon: <Schedule />, color: '#9333ea' },
        ]
      case 'PANEL':
        return [
          { title: 'Assigned Theses', value: '6', icon: <School />, color: '#15803d' },
          { title: 'Pending Evaluations', value: '2', icon: <Assignment />, color: '#d97706' },
          { title: 'Completed Reviews', value: '14', icon: <CheckCircle />, color: '#2563eb' },
          { title: 'Upcoming Defenses', value: '4', icon: <Schedule />, color: '#9333ea' },
        ]
      default: // STUDENT
        return [
          { title: 'Current Thesis', value: '1', icon: <School />, color: '#15803d' },
          { title: 'Documents', value: '12', icon: <Description />, color: '#2563eb' },
          { title: 'Feedback', value: '8', icon: <Assignment />, color: '#d97706' },
          { title: 'Completion', value: '75%', icon: <TrendingUp />, color: '#9333ea' },
        ]
    }
  }

  const getRecentActivity = () => {
    switch(userRole) {
      case 'ADMIN':
        return [
          { text: 'New user registration: Jane Smith', time: '2 hours ago', type: 'info' },
          { text: 'Thesis proposal submitted by Group A', time: '4 hours ago', type: 'success' },
          { text: 'System backup completed', time: '6 hours ago', type: 'success' },
          { text: 'Defense scheduled for Group B', time: '8 hours ago', type: 'warning' },
        ]
      case 'ADVISER':
        return [
          { text: 'John Doe submitted draft chapter', time: '1 hour ago', type: 'success' },
          { text: 'Meeting with Group A tomorrow', time: '2 hours ago', type: 'info' },
          { text: '3 thesis reviews pending', time: '4 hours ago', type: 'warning' },
          { text: 'Defense for Group B scheduled', time: '1 day ago', type: 'info' },
        ]
      case 'PANEL':
        return [
          { text: 'New evaluation assigned: Thesis #12', time: '30 mins ago', type: 'warning' },
          { text: 'Defense review completed', time: '2 hours ago', type: 'success' },
          { text: 'Panel meeting next week', time: '4 hours ago', type: 'info' },
          { text: 'Evaluation deadline in 3 days', time: '6 hours ago', type: 'warning' },
        ]
      default: // STUDENT
        return [
          { text: 'Feedback received on Chapter 3', time: '1 hour ago', type: 'success' },
          { text: 'Document uploaded: Final Draft', time: '3 hours ago', type: 'info' },
          { text: 'Meeting with adviser tomorrow', time: '5 hours ago', type: 'info' },
          { text: 'Thesis progress updated', time: '1 day ago', type: 'success' },
        ]
    }
  }

  const getQuickActions = () => {
    switch(userRole) {
      case 'ADMIN':
        return [
          { label: 'Add User', path: '/admin/users/add' },
          { label: 'Create Group', path: '/groups/create' },
          { label: 'View Reports', path: '/admin/reports' },
          { label: 'System Settings', path: '/admin/settings' },
        ]
      case 'ADVISER':
        return [
          { label: 'Review Thesis', path: '/thesis/review' },
          { label: 'Schedule Meeting', path: '/schedule/meeting' },
          { label: 'View Groups', path: '/groups' },
          { label: 'Documents', path: '/documents' },
        ]
      case 'PANEL':
        return [
          { label: 'Evaluate Thesis', path: '/thesis/evaluate' },
          { label: 'View Schedule', path: '/schedule' },
          { label: 'Assigned Groups', path: '/groups/assigned' },
          { label: 'Reports', path: '/reports' },
        ]
      default: // STUDENT
        return [
          { label: 'Upload Document', path: '/documents/upload' },
          { label: 'View Thesis', path: '/thesis' },
          { label: 'Request Feedback', path: '/thesis/feedback' },
          { label: 'View Schedule', path: '/schedule' },
        ]
    }
  }

  const stats = getRoleBasedStats()
  const activities = getRecentActivity()
  const quickActions = getQuickActions()

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <ENVISysSidebar currentPath={currentPath} userRole={userRole} />
      
      <Box sx={{ flex: 1, marginLeft: '256px' }}>
        <ENVISysHeader 
          userName={userName}
          userRole={userRole}
          notificationCount={3}
        />
        
        <Box sx={{ padding: '24px', paddingTop: '88px' }}>
          <Typography variant="h4" sx={{ fontSize: '30px', fontWeight: 600, color: '#0f172a', marginBottom: '24px' }}>
            Dashboard
          </Typography>
          
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ marginBottom: '32px' }}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <ENVISysStatCard
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.color}
                />
              </Grid>
            ))}
          </Grid>
          
          <Grid container spacing={3}>
            {/* Recent Activity */}
            <Grid item xs={12} md={8}>
              <Card sx={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: 'none' }}>
                <CardContent sx={{ padding: '24px' }}>
                  <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
                    Recent Activity
                  </Typography>
                  <List sx={{ padding: 0 }}>
                    {activities.map((activity, index) => (
                      <ListItem key={index} sx={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Typography variant="body1" sx={{ fontSize: '14px', color: '#0f172a' }}>
                                {activity.text}
                              </Typography>
                              <ENVISysBadge 
                                variant="status" 
                                status={activity.type === 'success' ? 'active' : activity.type === 'warning' ? 'pending' : 'inactive'}
                              >
                                {activity.type}
                              </ENVISysBadge>
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" sx={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                              {activity.time}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Quick Actions */}
            <Grid item xs={12} md={4}>
              <Card sx={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: 'none' }}>
                <CardContent sx={{ padding: '24px' }}>
                  <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {quickActions.map((action, index) => (
                      <ENVISysButton
                        key={index}
                        variant="outline"
                        size="medium"
                        onClick={() => window.location.href = action.path}
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        {action.label}
                      </ENVISysButton>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  )
}

export default ENVISysDashboard
