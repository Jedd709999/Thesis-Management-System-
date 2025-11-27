import { useEffect, useState, useCallback } from 'react';
import { FileText, CheckCircle, Clock, Users, TrendingUp, Calendar, Upload, Eye, Leaf, Droplets, Loader2, AlertCircle, Megaphone } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { fetchCurrentUserGroups } from '../../api/groupService';
import { fetchUnreadNotifications, fetchRecentActivities, markNotificationAsRead, Activity, ActivityNotification } from '../../api/activityService';
import { Group } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface DashboardProps {
  userRole: 'student' | 'adviser' | 'panel' | 'admin';
  onNavigate: (page: string) => void;
}

export function Dashboard({ userRole, onNavigate }: DashboardProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [loading, setLoading] = useState({
    groups: true,
    activities: true,
    notifications: true
  });
  const [error, setError] = useState<{
    groups: string | null;
    activities: string | null;
    notifications: string | null;
  }>({
    groups: null,
    activities: null,
    notifications: null
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
      throw err;
    } finally {
      setLoading(prev => ({ ...prev, groups: false }));
    }
  }, []);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, activities: true }));
      setError(prev => ({ ...prev, activities: null }));
      
      console.log('Dashboard: Loading recent activities...');
      const recentActivities = await fetchRecentActivities(5);
      console.log('Dashboard: Loaded activities:', recentActivities);
      setActivities(recentActivities);
    } catch (err) {
      console.error('Dashboard: Error loading activities:', err);
      setError(prev => ({ ...prev, activities: 'Failed to load recent activities' }));
    } finally {
      setLoading(prev => ({ ...prev, activities: false }));
    }
  }, []);

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
        await Promise.all([
          loadGroups(),
          loadActivities(),
          loadNotifications()
        ]);
      } catch (err) {
        console.error('Dashboard: Error loading data:', err);
      }
    };

    loadAllData();
  }, [loadGroups, loadActivities, loadNotifications]);
  
  // Function to retry loading data
  const handleRetry = async (type: 'groups' | 'activities' | 'notifications') => {
    try {
      switch (type) {
        case 'groups':
          await loadGroups();
          break;
        case 'activities':
          await loadActivities();
          break;
        case 'notifications':
          await loadNotifications();
          break;
      }
    } catch (err) {
      console.error(`Dashboard: Retry failed for ${type}:`, err);
    }
  };

  const getStatCards = () => {
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
        return [
          { label: 'My Groups', value: uniqueGroups.length.toString(), icon: Users, color: 'text-green-600 bg-green-100' },
          { label: 'Active Groups', value: activeGroups.toString(), icon: CheckCircle, color: 'text-blue-600 bg-blue-100' },
          { label: 'Pending Groups', value: pendingGroups.toString(), icon: Clock, color: 'text-amber-600 bg-amber-100' },
          { label: 'Group Members', value: groupMembers.toString(), icon: Users, color: 'text-purple-600 bg-purple-100' },
        ];
      case 'adviser':
        return [
          { label: 'Advised Groups', value: uniqueGroups.length.toString(), icon: Users, color: 'text-green-600 bg-green-100' },
          { label: 'Active Groups', value: activeGroups.toString(), icon: CheckCircle, color: 'text-blue-600 bg-blue-100' },
          { label: 'Pending Groups', value: pendingGroups.toString(), icon: Clock, color: 'text-amber-600 bg-amber-100' },
          { label: 'Students', value: groupMembers.toString(), icon: Users, color: 'text-purple-600 bg-purple-100' },
        ];
      case 'panel':
        return [
          { label: 'Assigned Groups', value: uniqueGroups.length.toString(), icon: Users, color: 'text-green-600 bg-green-100' },
          { label: 'Active Groups', value: activeGroups.toString(), icon: CheckCircle, color: 'text-blue-600 bg-blue-100' },
          { label: 'Pending Groups', value: pendingGroups.toString(), icon: Clock, color: 'text-amber-600 bg-amber-100' },
          { label: 'Students', value: groupMembers.toString(), icon: Users, color: 'text-purple-600 bg-purple-100' },
        ];
      default: // admin
        return [
          { label: 'Total Groups', value: uniqueGroups.length.toString(), icon: Users, color: 'text-green-600 bg-green-100' },
          { label: 'Active Groups', value: activeGroups.toString(), icon: CheckCircle, color: 'text-blue-600 bg-blue-100' },
          { label: 'Pending Groups', value: pendingGroups.toString(), icon: Clock, color: 'text-amber-600 bg-amber-100' },
          { label: 'Total Members', value: groupMembers.toString(), icon: Users, color: 'text-purple-600 bg-purple-100' },
        ];
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'group':
        return Users;
      case 'document':
        return FileText;
      case 'schedule':
        return Calendar;
      case 'announcement':
        return Megaphone;
      default:
        return Clock;
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

  const quickActions = [
    { 
      label: userRole === 'student' ? 'Create Group' : 'View Groups', 
      icon: Users, 
      action: 'groups', 
      color: 'bg-green-700 hover:bg-green-800' 
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
      color: 'bg-purple-700 hover:bg-purple-800' 
    },
    { 
      label: userRole === 'student' ? 'My Submissions' : 'Review Submissions', 
      icon: FileText, 
      action: 'submissions', 
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
  const isLoading = loading.groups || loading.activities || loading.notifications;
  const hasError = error.groups || error.activities || error.notifications;

  // Show loading state only when initially loading
  if (isLoading && groups.length === 0 && activities.length === 0 && notifications.length === 0) {
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
    category: notification.type.charAt(0).toUpperCase() + notification.type.slice(1),
    unread: !notification.is_read,
    message: notification.body, // Use body instead of message
    read: notification.is_read, // Add read property for compatibility
    action: notification.link ? { url: notification.link } : undefined // Convert link to action
  }));

  // Format activities for display
  const formattedActivities = activities.map(activity => ({
    ...activity,
    time: formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }),
    icon: getActivityIcon(activity.type)
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
                <p className="text-3xl text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-600">{stat.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <Card className="lg:col-span-2 p-6 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-slate-900">Recent Activity</h2>
            <Button variant="ghost" size="sm" className="text-green-700 hover:text-green-800">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {formattedActivities.length > 0 ? (
              formattedActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => {
                      // Navigate to relevant page based on activity type
                      if (activity.group?.id) {
                        onNavigate(`/groups/${activity.group.id}`);
                      } else if (activity.document?.id) {
                        onNavigate(`/documents/${activity.document.id}`);
                      }
                    }}
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                      <Icon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900">{activity.title}</p>
                      <p className="text-sm text-slate-600">
                        {activity.group?.name || activity.document?.title || ''}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">{activity.time}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500">
                {loading.activities ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading activities...</span>
                  </div>
                ) : error.activities ? (
                  <div className="text-red-500">
                    <p>Failed to load activities</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => handleRetry('activities')}
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <p>No recent activities found</p>
                )}
              </div>
            )}
          </div>
        </Card>

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
                  <p className="text-sm text-slate-900 mb-1">{notification.title}</p>
                  <p className="text-sm text-slate-600 mb-1">{notification.message}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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