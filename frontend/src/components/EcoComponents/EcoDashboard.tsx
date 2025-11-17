import React from 'react'
import { 
  Grid, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemText,
  Avatar
} from '@mui/material'
import { EcoCard, EcoProgress, EcoBackground } from './index'
import { 
  School, 
  Schedule, 
  Assignment, 
  People,
  TrendingUp,
  CheckCircle
} from '@mui/icons-material'

interface DashboardStats {
  totalTheses: number
  completedTheses: number
  pendingReviews: number
  upcomingDeadlines: number
}

interface RecentActivity {
  id: string
  type: 'thesis' | 'review' | 'meeting'
  title: string
  time: string
  status: 'completed' | 'pending' | 'upcoming'
}

interface EcoDashboardProps {
  stats: DashboardStats
  recentActivities: RecentActivity[]
  userRole: string
}

const EcoDashboard: React.FC<EcoDashboardProps> = ({
  stats,
  recentActivities,
  userRole
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'thesis':
        return <Assignment color="primary" />
      case 'review':
        return <CheckCircle color="success" />
      case 'meeting':
        return <Schedule color="warning" />
      default:
        return <School color="info" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success.main'
      case 'pending':
        return 'warning.main'
      case 'upcoming':
        return 'info.main'
      default:
        return 'text.secondary'
    }
  }

  const completionPercentage = stats.totalTheses > 0 
    ? (stats.completedTheses / stats.totalTheses) * 100 
    : 0

  return (
    <EcoBackground variant="full">
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            🌿 Welcome to Your Eco Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your thesis journey with nature-inspired efficiency
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <EcoCard
              title="Total Theses"
              icon={<School color="primary" />}
              badge={<TrendingUp color="success" />}
            >
              <Typography variant="h3" color="primary.main" fontWeight="bold">
                {stats.totalTheses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active thesis projects
              </Typography>
            </EcoCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <EcoCard
              title="Completed"
              icon={<CheckCircle color="success" />}
            >
              <Typography variant="h3" color="success.main" fontWeight="bold">
                {stats.completedTheses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Successfully defended
              </Typography>
            </EcoCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <EcoCard
              title="Pending Reviews"
              icon={<Assignment color="warning" />}
            >
              <Typography variant="h3" color="warning.main" fontWeight="bold">
                {stats.pendingReviews}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Awaiting feedback
              </Typography>
            </EcoCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <EcoCard
              title="Upcoming Deadlines"
              icon={<Schedule color="info" />}
            >
              <Typography variant="h3" color="info.main" fontWeight="bold">
                {stats.upcomingDeadlines}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Next 7 days
              </Typography>
            </EcoCard>
          </Grid>
        </Grid>

        {/* Progress Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <EcoCard title="Overall Progress">
              <EcoProgress
                value={completionPercentage}
                label="Thesis Completion Rate"
                size="large"
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  🌱 Growing stronger with each milestone
                </Typography>
              </Box>
            </EcoCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <EcoCard title="Recent Activity">
              <List sx={{ p: 0 }}>
                {recentActivities.slice(0, 5).map((activity) => (
                  <ListItem key={activity.id} sx={{ px: 0, py: 1 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'background.paper' }}>
                      {getActivityIcon(activity.type)}
                    </Avatar>
                    <ListItemText
                      primary={activity.title}
                      secondary={activity.time}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: 500
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        color: getStatusColor(activity.status)
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </EcoCard>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <EcoCard title="Quick Actions" subtitle="Get started with common tasks">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ 
                p: 2, 
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: 'primary.50',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'primary.100',
                  transform: 'translateY(-2px)'
                }
              }}>
                <Assignment color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2" fontWeight={500}>
                  New Thesis
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ 
                p: 2, 
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: 'success.50',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'success.100',
                  transform: 'translateY(-2px)'
                }
              }}>
                <People color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2" fontWeight={500}>
                  View Groups
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ 
                p: 2, 
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: 'warning.50',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'warning.100',
                  transform: 'translateY(-2px)'
                }
              }}>
                <Schedule color="warning" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2" fontWeight={500}>
                  Schedule
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ 
                p: 2, 
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: 'info.50',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'info.100',
                  transform: 'translateY(-2px)'
                }
              }}>
                <School color="info" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2" fontWeight={500}>
                  Documents
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </EcoCard>
      </Box>
    </EcoBackground>
  )
}

export default EcoDashboard
