import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, Clock, Users, TrendingUp, Calendar, Upload, Leaf, Droplets, Loader2, Megaphone, BookOpen } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

import { fetchCurrentUserGroups } from '../../api/groupService';
import { fetchUnreadNotifications, fetchRecentActivities, markNotificationAsRead, Activity, ActivityNotification } from '../../api/activityService';
import { fetchCurrentUserTheses, fetchThesisStatistics } from '../../api/thesisService';
import { getGroupStatistics } from '../../api/groupService';
import { Group, Thesis } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../hooks/useAuth'; // Import useAuth hook

interface DashboardProps {
  userRole: 'student' | 'adviser' | 'panel' | 'admin';
  onNavigate: (page: string) => void;
}

export function Dashboard({ userRole, onNavigate }: DashboardProps) {
  const { user } = useAuth(); // Get user data from AuthContext
  const [groups, setGroups] = useState<Group[]>([]);
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [groupStats, setGroupStats] = useState<{
    total_registered_groups: number;
    active_groups: number;
    pending_groups: number;
    rejected_groups: number;
  } | null>(null);
  const [thesisStats, setThesisStats] = useState<{
    total_theses: number;
    topic_submitted: number;
    topic_approved: number;
    topic_rejected: number;
    concept_submitted: number;
    concept_approved: number;
    proposal_submitted: number;
    proposal_approved: number;
    final_submitted: number;
    final_approved: number;
    archived: number;
  } | null>(null);
  const [loading, setLoading] = useState({
    groups: true,
    theses: true,
    notifications: true,
    stats: true
  });
  const [error, setError] = useState<{
    groups: string | null;
    theses: string | null;
    notifications: string | null;
    stats: string | null;
  }>({
    groups: null,
    theses: null,
    notifications: null,
    stats: null
  });

  const loadGroups = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, groups: true }));
      setError(prev => ({ ...prev, groups: null }));
      
      console.log('Dashboard: Loading user groups...');
      const userGroups = await fetchCurrentUserGroups();
      console.log('Dashboard: Loaded groups:', userGroups);
      
      // Deduplicate groups by ID to prevent duplicates
      const uniqueGroups = userGroups.filter((group, index, self) => 
        index === self.findIndex(g => g.id === group.id)
      );
      
      console.log('Dashboard: Unique groups after deduplication:', uniqueGroups);
      setGroups(uniqueGroups);
    } catch (err) {
      console.error('Dashboard: Error loading groups:', err);
      setError(prev => ({ ...prev, groups: 'Failed to load groups' }));
    } finally {
      setLoading(prev => ({ ...prev, groups: false }));
    }
  }, []);

  const loadTheses = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, theses: true }));
      setError(prev => ({ ...prev, theses: null }));
      
      console.log('Dashboard: Loading user theses...');
      let userTheses: Thesis[] = [];
      
      // For students, fetch all theses and filter by access
      if (userRole === 'student') {
        const allTheses = await fetchCurrentUserTheses();
        // Filter to only show theses the student has access to
        userTheses = allTheses.filter(thesis => {
          // Student has access if they are the proposer or a member of the group
          const isProposer = thesis.proposer && String(thesis.proposer.id) === String(user?.id);
          
          // Check if student is a member of the group
          let isMember = false;
          if (typeof thesis.group === 'object' && thesis.group !== null && 'members' in thesis.group) {
            isMember = thesis.group.members.some((member: any) => 
              String(member.id) === String(user?.id)
            );
          }
          
          return isProposer || isMember;
        });
      } else {
        // For other roles, fetch their assigned theses
        userTheses = await fetchCurrentUserTheses();
      }
      
      console.log('Dashboard: Loaded theses:', userTheses);
      setTheses(userTheses);
    } catch (err) {
      console.error('Dashboard: Error loading theses:', err);
      setError(prev => ({ ...prev, theses: 'Failed to load theses' }));
    } finally {
      setLoading(prev => ({ ...prev, theses: false }));
    }
  }, [userRole, user?.id]);

  const loadStats = useCallback(async () => {
    if (userRole !== 'admin') return;
    
    try {
      setLoading(prev => ({ ...prev, stats: true }));
      setError(prev => ({ ...prev, stats: null }));
      
      console.log('Dashboard: Loading admin statistics...');
      
      // Load group statistics
      const groupStatistics = await getGroupStatistics();
      console.log('Dashboard: Loaded group statistics:', groupStatistics);
      setGroupStats(groupStatistics);
      
      // Load thesis statistics
      const thesisStatistics = await fetchThesisStatistics();
      console.log('Dashboard: Loaded thesis statistics:', thesisStatistics);
      setThesisStats(thesisStatistics);
    } catch (err) {
      console.error('Dashboard: Error loading statistics:', err);
      setError(prev => ({ ...prev, stats: 'Failed to load statistics' }));
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, [userRole]);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, notifications: true }));
      setError(prev => ({ ...prev, notifications: null }));
      
      console.log('Dashboard: Loading notifications...');
      const unreadNotifications = await fetchUnreadNotifications();
      console.log('Dashboard: Loaded notifications:', unreadNotifications);
      setNotifications(unreadNotifications);
    } catch (err) {
      console.error('Dashboard: Error loading notifications:', err);
      setError(prev => ({ ...prev, notifications: 'Failed to load notifications' }));
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Initial data load
  useEffect(() => {
    const loadAllData = async () => {
      try {
        if (userRole === 'admin') {
          // For admins, load stats separately
          await Promise.all([
            loadGroups(),
            loadTheses(),
            loadNotifications(),
            loadStats()
          ]);
        } else {
          await Promise.all([
            loadGroups(),
            loadTheses(),
            loadNotifications()
          ]);
        }
      } catch (err) {
        console.error('Dashboard: Error loading data:', err);
      }
    };

    loadAllData();
  }, [loadGroups, loadTheses, loadNotifications, loadStats, userRole]);
  
  // Function to retry loading data
  const handleRetry = async (type: 'groups' | 'theses' | 'notifications' | 'stats') => {
    try {
      switch (type) {
        case 'groups':
          await loadGroups();
          break;
        case 'theses':
          await loadTheses();
          break;
        case 'notifications':
          await loadNotifications();
          break;
        case 'stats':
          if (userRole === 'admin') {
            await loadStats();
          }
          break;
      }
    } catch (err) {
      console.error(`Dashboard: Retry failed for ${type}:`, err);
    }
  };

  const getStatCards = () => {
    // For admin users, use dedicated statistics endpoints
    if (userRole === 'admin' && groupStats && thesisStats) {
      return [
        { label: 'Total Groups', value: groupStats.total_registered_groups.toString(), icon: Users, color: 'text-green-600 bg-green-100' },
        { label: 'Active Groups', value: groupStats.active_groups.toString(), icon: CheckCircle, color: 'text-blue-600 bg-blue-100' },
        { label: 'Pending Groups', value: groupStats.pending_groups.toString(), icon: Clock, color: 'text-amber-600 bg-amber-100' },
        { label: 'Total Theses', value: thesisStats.total_theses.toString(), icon: BookOpen, color: 'text-purple-600 bg-purple-100' },
      ];
    }
    
    // For non-admin users, calculate stats from fetched data
    // Deduplicate groups by ID to prevent counting duplicates
    const uniqueGroups = groups.filter((group, index, self) => 
      index === self.findIndex(g => g.id === group.id)
    );
    
    // Calculate real stats based on deduplicated data
    const activeGroups = uniqueGroups.filter(g => g.status === 'APPROVED').length;
    const pendingGroups = uniqueGroups.filter(g => g.status === 'PENDING').length;
    const groupMembers = uniqueGroups.reduce((sum, g) => sum + (g.members?.length || 0), 0);
    
    switch (userRole) {
      case 'student':
        // For students, show their single group and thesis
        const studentGroup = uniqueGroups.length > 0 ? uniqueGroups[0] : null;
        const studentThesis = theses.length > 0 ? theses[0] : null;
        
        return [
          { 
            label: 'My Group', 
            value: studentGroup ? studentGroup.name : 'None', 
            icon: Users, 
            color: 'text-green-600 bg-green-100'
          },
          { 
            label: 'Group Status', 
            value: studentGroup ? studentGroup.status : 'N/A', 
            icon: CheckCircle, 
            color: studentGroup?.status === 'APPROVED' ? 'text-blue-600 bg-blue-100' : 
                   studentGroup?.status === 'PENDING' ? 'text-amber-600 bg-amber-100' : 
                   'text-gray-600 bg-gray-100',
            detail: studentGroup ? (studentGroup.status === 'APPROVED' ? 'Approved' : 
                                   studentGroup.status === 'PENDING' ? 'Pending Approval' : 
                                   'Not Available') : ''
          },
          { 
            label: 'My Thesis', 
            value: studentThesis ? studentThesis.title : 'None', 
            icon: BookOpen, 
            color: 'text-purple-600 bg-purple-100'
          },
          { 
            label: 'Thesis Status', 
            value: studentThesis ? studentThesis.status : 'N/A', 
            icon: TrendingUp, 
            color: studentThesis ? 
                   (studentThesis.status.includes('APPROVED') ? 'text-green-600 bg-green-100' : 
                    studentThesis.status.includes('SUBMITTED') ? 'text-blue-600 bg-blue-100' : 
                    studentThesis.status.includes('REJECTED') ? 'text-red-600 bg-red-100' : 
                    'text-amber-600 bg-amber-100') : 
                   'text-gray-600 bg-gray-100',
            detail: studentThesis ? studentThesis.status.replace(/_/g, ' ') : ''
          },
        ];
      case 'adviser':
        return [
          { label: 'Advised Groups', value: uniqueGroups.length.toString(), icon: Users, color: 'text-green-600 bg-green-100' },
          { label: 'Active Groups', value: activeGroups.toString(), icon: CheckCircle, color: 'text-blue-600 bg-blue-100' },
          { label: 'Pending Groups', value: pendingGroups.toString(), icon: Clock, color: 'text-amber-600 bg-amber-100' },
          { label: 'Assigned Theses', value: theses.length.toString(), icon: BookOpen, color: 'text-purple-600 bg-purple-100' },
        ];
      case 'panel':
        return [
          { label: 'Assigned Groups', value: uniqueGroups.length.toString(), icon: Users, color: 'text-green-600 bg-green-100' },
          { label: 'Active Groups', value: activeGroups.toString(), icon: CheckCircle, color: 'text-blue-600 bg-blue-100' },
          { label: 'Pending Groups', value: pendingGroups.toString(), icon: Clock, color: 'text-amber-600 bg-amber-100' },
          { label: 'Assigned Theses', value: theses.length.toString(), icon: BookOpen, color: 'text-purple-600 bg-purple-100' },
        ];
      default: // admin fallback (should not happen with the new logic)
        return [
          { label: 'Total Groups', value: uniqueGroups.length.toString(), icon: Users, color: 'text-green-600 bg-green-100' },
          { label: 'Active Groups', value: activeGroups.toString(), icon: CheckCircle, color: 'text-blue-600 bg-blue-100' },
          { label: 'Pending Groups', value: pendingGroups.toString(), icon: Clock, color: 'text-amber-600 bg-amber-100' },
          { label: 'Total Theses', value: theses.length.toString(), icon: BookOpen, color: 'text-purple-600 bg-purple-100' },
        ];
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-amber-100 text-amber-800';
      default: // info
        return 'bg-blue-100 text-blue-800';
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TOPIC_APPROVED':
      case 'CONCEPT_APPROVED':
      case 'PROPOSAL_APPROVED':
      case 'FINAL_APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'TOPIC_SUBMITTED':
      case 'CONCEPT_SUBMITTED':
      case 'PROPOSAL_SUBMITTED':
      case 'FINAL_SUBMITTED':
      case 'CONCEPT_SCHEDULED':
      case 'PROPOSAL_SCHEDULED':
      case 'FINAL_SCHEDULED':
      case 'CONCEPT_DEFENDED':
      case 'PROPOSAL_DEFENDED':
      case 'FINAL_DEFENDED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESEARCH_IN_PROGRESS':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DRAFT':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'TOPIC_REJECTED':
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'REVISIONS_REQUIRED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };



  const quickActions = [
    { 
      label: userRole === 'student' ? 'My Group' : 'View Groups', 
      icon: Users, 
      action: 'groups', 
      color: 'bg-green-700 hover:bg-green-800' 
    },
    { 
      label: userRole === 'student' ? 'My Thesis' : 'View Theses', 
      icon: BookOpen, 
      action: 'thesis', 
      color: 'bg-purple-700 hover:bg-purple-800' 
    },
    { 
      label: 'Upload Document', 
      icon: Upload, 
      action: 'documents', 
      color: 'bg-blue-700 hover:bg-blue-800' 
    },
    { 
      label: 'View Calendar', 
      icon: Calendar, 
      action: 'schedule', 
      color: 'bg-amber-700 hover:bg-amber-800' 
    },
    // Add pending proposals action for admins
    ...(userRole === 'admin' ? [{
      label: 'Review Proposals',
      icon: Clock,
      action: 'groups/pending',
      color: 'bg-red-700 hover:bg-red-800'
    }] : [])
  ];

  const statCards = getStatCards();
  const isLoading = loading.groups || loading.theses || loading.notifications || (userRole === 'admin' && loading.stats);
  const hasError = error.groups || error.theses || error.notifications || (userRole === 'admin' && error.stats);

  // Show loading state only when initially loading
  if (isLoading && groups.length === 0 && theses.length === 0 && notifications.length === 0 && (userRole !== 'admin' || !groupStats || !thesisStats)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg font-medium text-slate-700">Loading your dashboard...</p>
          <p className="text-sm text-slate-500">This may take a moment</p>
        </div>
      </div>
    );
  }

  // Format notifications for display
  const formattedNotifications = notifications.map(notification => ({
    ...notification,
    time: formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }),
    category: notification.type && typeof notification.type === 'string' 
      ? notification.type.charAt(0).toUpperCase() + notification.type.slice(1)
      : 'Info',
    unread: !notification.is_read,
    message: notification.body,
    read: notification.is_read,
    action: notification.link ? { url: notification.link } : undefined
  }));

  return (
    <div className="p-8 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-slate-900 mb-2">Welcome back</h1>
          <p className="text-slate-600 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-600" />
            Here's what's happening with your research groups
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-900">Sustainable Research</span>
          </div>
        </div>
      </div>






      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-base text-slate-900 font-semibold truncate whitespace-nowrap overflow-hidden" title={stat.value}>{stat.value}</p>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>

              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Notifications Panel */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-slate-900">Notifications</h2>
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              {notifications.filter(n => !n.is_read).length} new
            </Badge>
          </div>
          <div className="space-y-3">
            {formattedNotifications.length > 0 ? (
              formattedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    notification.unread
                      ? 'bg-green-50 border-green-200 hover:bg-green-100'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      handleMarkAsRead(notification.id);
                    }
                    if (notification.action) {
                      onNavigate(notification.action.url);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getNotificationTypeColor(notification.type)}`}
                    >
                      {notification.category}
                    </Badge>
                    {notification.unread && (
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-slate-900 mb-1 truncate whitespace-nowrap overflow-hidden" title={notification.title}>{notification.title}</p>
                  <p className="text-sm text-slate-600 mb-1 truncate whitespace-nowrap overflow-hidden" title={notification.message}>{notification.message}</p>
                  <p className="text-xs text-slate-500">{notification.time}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                {loading.notifications ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading notifications...</span>
                  </div>
                ) : error.notifications ? (
                  <div className="text-red-500">
                    <p>Failed to load notifications</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => handleRetry('notifications')}
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <p>No new notifications</p>
                )}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => onNavigate('notifications')}
          >
            View All Notifications
          </Button>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 border-0 shadow-sm">
        <h2 className="text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                onClick={() => onNavigate(action.action)}
                className={`${action.color} text-white py-6 rounded-xl flex items-center justify-center gap-3`}
              >
                <Icon className="w-5 h-5" />
                <span>{action.label}</span>
              </Button>
            );
          })}
        </div>
      </Card>




    </div>
  );
}
