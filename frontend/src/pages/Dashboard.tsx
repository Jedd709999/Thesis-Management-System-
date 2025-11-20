import React, { useContext, useState, useEffect } from 'react'
import { AuthContext } from '../context/AuthContext'
import { Box, Typography, Grid, Card, CardContent, Button, Badge, useTheme, CircularProgress } from '@mui/material'
import { Leaf, Droplets, FileText, Users, Clock, CheckCircle, TrendingUp, Calendar, Upload, Eye } from 'lucide-react'
import { listThesis } from '../api/thesisService'
import { listGroups, getCurrentUserGroups } from '../api/groupService'
import { listDocuments } from '../api/documentService'
import { listNotifications } from '../api/notificationService'
import { listSchedules } from '../api/scheduleService'

// Dashboard component - Fixed icon issues
export default function Dashboard(){
  const { user } = useContext(AuthContext)
  const theme = useTheme()
  const userRole = user?.role || 'STUDENT'
  const userName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User'
  
  const [loading, setLoading] = useState(true)
  const [theses, setTheses] = useState([])
  const [groups, setGroups] = useState([])
  const [documents, setDocuments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [schedules, setSchedules] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch data based on user role
        if (userRole === 'ADMIN') {
          const [thesisRes, groupRes, docRes, notifRes, schedRes] = await Promise.all([
            listThesis(),
            listGroups(),
            listDocuments(),
            listNotifications(),
            listSchedules()
          ])
          setTheses(thesisRes.data || [])
          setGroups(groupRes.data || [])
          setDocuments(docRes.data || [])
          setNotifications(notifRes.data || [])
          setSchedules(schedRes.data || [])
        } else {
          // For non-admin users, fetch their specific data
          const thesisRes = await listThesis()
          const notifRes = await listNotifications()
          
          const allTheses = thesisRes.data || []
          const userTheses = allTheses.filter(t => {
            if (userRole === 'STUDENT') return t.proposer === user?.id
            if (userRole === 'ADVISER') {
              const adviserId = typeof t.group === 'object' ? t.group?.adviser : undefined
              return adviserId === user?.id
            }
            if (userRole === 'PANEL') {
              const panels = typeof t.group === 'object' ? t.group?.panels : undefined
              return panels?.some((p: any) => p.id === user?.id)
            }
            return false
          })
          
          setTheses(userTheses)
          setNotifications(notifRes.data || [])
          
          // Fetch groups if user is adviser or student
          if (userRole === 'ADVISER' || userRole === 'STUDENT') {
            console.log('Fetching groups for user:', user?.email, 'Role:', userRole)
            try {
              const groupRes = await getCurrentUserGroups()
              console.log('Groups response:', groupRes.data)
              console.log('Groups response length:', groupRes.data?.length)
              if (groupRes.data && groupRes.data.length > 0) {
                console.log('First group details:', groupRes.data[0])
                console.log('Group members:', groupRes.data[0].members)
                console.log('Group name:', groupRes.data[0].name)
              }
              setGroups(groupRes.data || [])
            } catch (error) {
              console.error('Error fetching groups:', error)
              setGroups([])
            }
          }
          
          // Fetch documents for student's theses
          if (userRole === 'STUDENT' && userTheses.length > 0) {
            const docRes = await listDocuments()
            const allDocs = docRes.data || []
            const userDocs = allDocs.filter(d => 
              userTheses.some(t => t.id === d.thesis)
            )
            setDocuments(userDocs)
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Set empty arrays on error to prevent undefined errors
        setTheses([])
        setGroups([])
        setDocuments([])
        setNotifications([])
        setSchedules([])
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user, userRole])
  
  const getStatCards = () => {
    switch (userRole) {
      case 'STUDENT':
        return [
          { label: 'My Thesis', value: theses.length.toString(), icon: FileText, color: '#10B981', bgColor: '#D1FAE5' },
          { label: 'Documents', value: documents.length.toString(), icon: Upload, color: '#3B82F6', bgColor: '#DBEAFE' },
          { label: 'Pending Reviews', value: theses.filter(t => t.status === 'PENDING_REVIEW').length.toString(), icon: Clock, color: '#F59E0B', bgColor: '#FEF3C7' },
          { label: 'Group Members', value: groups.length > 0 ? groups[0]?.members?.length?.toString() || '0' : '0', icon: Users, color: '#8B5CF6', bgColor: '#EDE9FE' },
        ];
      case 'ADVISER':
        return [
          { label: 'Advised Theses', value: theses.length.toString(), icon: FileText, color: '#10B981', bgColor: '#D1FAE5' },
          { label: 'Pending Reviews', value: theses.filter(t => t.status === 'CONCEPT_SUBMITTED').length.toString(), icon: Clock, color: '#F59E0B', bgColor: '#FEF3C7' },
          { label: 'Approved', value: theses.filter(t => t.status === 'FINAL_APPROVED').length.toString(), icon: CheckCircle, color: '#3B82F6', bgColor: '#DBEAFE' },
          { label: 'Students', value: groups.reduce((acc, g) => acc + (g.members?.length || 0), 0).toString(), icon: Users, color: '#8B5CF6', bgColor: '#EDE9FE' },
        ];
      case 'PANEL':
        return [
          { label: 'Assigned Theses', value: theses.length.toString(), icon: FileText, color: '#10B981', bgColor: '#D1FAE5' },
          { label: 'To Review', value: theses.filter(t => t.status === 'PROPOSAL_APPROVED').length.toString(), icon: Clock, color: '#F59E0B', bgColor: '#FEF3C7' },
          { label: 'Upcoming Defenses', value: schedules.filter(s => new Date(s.start_at) > new Date()).length.toString(), icon: Calendar, color: '#3B82F6', bgColor: '#DBEAFE' },
          { label: 'Reviewed', value: theses.filter(t => ['FINAL_APPROVED', 'REJECTED'].includes(t.status)).length.toString(), icon: CheckCircle, color: '#8B5CF6', bgColor: '#EDE9FE' },
        ];
      default:
        return [
          { label: 'Total Theses', value: theses.length.toString(), icon: FileText, color: '#10B981', bgColor: '#D1FAE5' },
          { label: 'Active Groups', value: groups.length.toString(), icon: Users, color: '#3B82F6', bgColor: '#DBEAFE' },
          { label: 'Total Documents', value: documents.length.toString(), icon: Upload, color: '#F59E0B', bgColor: '#FEF3C7' },
          { label: 'This Month', value: theses.filter(t => new Date(t.created_at) > new Date(Date.now() - 30*24*60*60*1000)).length.toString(), icon: TrendingUp, color: '#8B5CF6', bgColor: '#EDE9FE' },
        ];
    }
  };

  const getRecentActivities = () => {
    const activities = []
    
    // Add thesis activities
    theses.slice(0, 3).forEach(thesis => {
      console.log('Thesis data:', thesis)
      console.log('Thesis group:', thesis.group)
      activities.push({
        type: 'thesis',
        title: thesis.title || 'Untitled Thesis',
        group: typeof thesis.group === 'string' ? thesis.group : thesis.group?.name || 'No Group',
        time: new Date(thesis.created_at).toLocaleString(),
        status: thesis.status,
        icon: FileText
      })
    })
    
    // Add document activities
    documents.slice(0, 2).forEach(doc => {
      activities.push({
        type: 'document',
        title: doc.file_name || 'Document uploaded',
        group: doc.thesis_title || 'No Thesis',
        time: new Date(doc.uploaded_at).toLocaleString(),
        status: 'uploaded',
        icon: Upload
      })
    })
    
    return activities
  }

  const recentActivities = getRecentActivities();

  const getNotifications = () => {
    return notifications.slice(0, 4).map(notif => ({
      category: notif.type || 'System',
      message: notif.message || 'New notification',
      time: new Date(notif.created_at).toLocaleString(),
      unread: !notif.is_read
    }))
  }

  const notificationList = getNotifications();

  const statCards = getStatCards();

  const quickActions = [
    { label: 'Submit Proposal', icon: FileText, action: 'thesis', color: '#059669' },
    { label: 'Upload Document', icon: Upload, action: 'documents', color: '#1D4ED8' },
    { label: 'View Group', icon: Users, action: 'groups', color: '#7C3AED' },
    { label: 'Schedule Defense', icon: Calendar, action: 'schedule', color: '#D97706' },
  ];

  if (loading) {
    return (
      <Box sx={{ p: 4, backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ color: '#10B981' }} />
      </Box>
    )
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Thesis': return { bg: '#D1FAE5', color: '#065F46' };
      case 'Documents': return { bg: '#DBEAFE', color: '#1E40AF' };
      default: return { bg: '#FEF3C7', color: '#92400E' };
    }
  };

  return (
    <Box sx={{ p: 4, backgroundColor: '#F8FAFC' }}>
      {/* Welcome Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 6 }}>
        <Box>
          <Typography variant="h3" sx={{ color: '#1E293B', fontWeight: 600, mb: 1 }}>
            Welcome back, {userName.split(' ')[0]}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Leaf style={{ width: '16px', height: '16px', color: '#10B981' }} />
            <Typography variant="body1" sx={{ color: '#64748B' }}>
              Here's what's happening with your environmental research
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{
            px: 3,
            py: 1.5,
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Droplets style={{ width: '16px', height: '16px', color: '#10B981' }} />
            <Typography variant="body2" sx={{ color: '#065F46', fontWeight: 500 }}>
              Sustainable Research
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{
                p: 3,
                border: 'none',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                '&:hover': {
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: stat.bgColor,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon style={{ width: '24px', height: '24px', color: stat.color }} />
                  </Box>
                </Box>
                <Box sx={{ spaceY: 1 }}>
                  <Typography variant="h4" sx={{ color: '#1E293B', fontWeight: 700 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Activity Feed */}
        <Grid item xs={12} md={8}>
          <Card sx={{
            p: 4,
            border: 'none',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
              <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600 }}>
                Recent Activity
              </Typography>
              <Button
                variant="text"
                size="small"
                sx={{ color: '#059669', '&:hover': { color: '#047857' } }}
              >
                View All
              </Button>
            </Box>
            <Box sx={{ spaceY: 3 }}>
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 3,
                      p: 3,
                      backgroundColor: '#F8FAFC',
                      borderRadius: 2,
                      '&:hover': { backgroundColor: '#F1F5F9' },
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <Box sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: '#ffffff',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #E2E8F0',
                    }}>
                      <Icon style={{ width: '20px', height: '20px', color: '#64748B' }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500 }}>
                        {activity.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>
                        {activity.group}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#94A3B8', whiteSpace: 'nowrap' }}>
                      {activity.time}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Card>
        </Grid>

        {/* Notifications Panel */}
        <Grid item xs={12} md={4}>
          <Card sx={{
            p: 4,
            border: 'none',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
              <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600 }}>
                Notifications
              </Typography>
              <Badge badgeContent="2" color="error" sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#EF4444',
                  color: '#ffffff',
                }
              }} />
            </Box>
            <Box sx={{ spaceY: 2, mb: 3 }}>
              {notificationList.map((notification, index) => {
                const categoryColors = getCategoryColor(notification.category);
                return (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: notification.unread ? '#BBF7D0' : '#E2E8F0',
                      backgroundColor: notification.unread ? '#F0FDF4' : '#F8FAFC',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: notification.unread ? '#E6FFFA' : '#F1F5F9',
                      },
                      transition: 'all 0.2s',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                      <Badge
                        badgeContent={notification.category}
                        sx={{
                          '& .MuiBadge-badge': {
                            backgroundColor: categoryColors.bg,
                            color: categoryColors.color,
                            fontSize: '10px',
                            height: '20px',
                            padding: '0 6px',
                            borderRadius: '10px',
                          }
                        }}
                      />
                      {notification.unread && (
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#10B981',
                        }} />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#1E293B', mb: 1, fontSize: '14px' }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      {notification.time}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
            <Button
              variant="outlined"
              fullWidth
              sx={{
                borderColor: '#E2E8F0',
                color: '#64748B',
                '&:hover': {
                  borderColor: '#CBD5E1',
                  backgroundColor: '#F8FAFC',
                }
              }}
            >
              View All Notifications
            </Button>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{
        p: 4,
        mt: 4,
        border: 'none',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      }}>
        <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600, mb: 3 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={3}>
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Button
                  fullWidth
                  sx={{
                    backgroundColor: action.color,
                    color: '#ffffff',
                    py: 3,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    '&:hover': {
                      backgroundColor: action.color,
                      filter: 'brightness(0.9)',
                    },
                  }}
                >
                  <Icon style={{ width: '20px', height: '20px' }} />
                  {action.label}
                </Button>
              </Grid>
            );
          })}
        </Grid>
      </Card>
    </Box>
  )
}
