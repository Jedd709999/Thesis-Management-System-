import { useState, useEffect } from 'react';
import { Bell, FileText, Calendar, Upload, CheckCircle, Filter, Trash2, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

export function NotificationCenter() {
  const [filter, setFilter] = useState('all');
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    markRead, 
    markAllRead, 
    deleteNotif 
  } = useNotifications();

  console.log('NotificationCenter: notifications', notifications);
  console.log('NotificationCenter: unreadCount', unreadCount);
  console.log('NotificationCenter: loading', loading);
  console.log('NotificationCenter: error', error);

  // Map notification types to categories
  const mapNotificationTypeToCategory = (type) => {
    if (!type) return 'Other'; // Handle undefined/null types
    
    const typeMap = {
      'thesis_submitted': 'Thesis',
      'defense_scheduled': 'Schedule',
      'defense_reminder': 'Schedule',
      'defense_cancelled': 'Schedule',
      'document_uploaded': 'Documents',
      'document_approved': 'Documents',
      'document_rejected': 'Documents',
      'evaluation_submitted': 'Thesis',
      'thesis_approved': 'Thesis',
      'thesis_rejected': 'Thesis',
      'new_comment': 'Documents',
      'mention': 'Documents',
      'system_alert': 'System',
      'schedule_created': 'Schedule',
      'topic_proposal_reviewed': 'Thesis',
      'document_updated': 'Documents',
      'adviser_changed': 'Thesis',
      'approval_sheet_submitted': 'Thesis',
      'other': 'Other'
    };
    return typeMap[type] || 'Other';
  };

  // Map categories to icons
  const getCategoryIcon = (category) => {
    if (!category) return Bell; // Handle undefined/null categories
    
    switch (category) {
      case 'Thesis': return FileText;
      case 'Documents': return Upload;
      case 'Schedule': return Calendar;
      default: return Bell;
    }
  };

  // Ensure notifications is an array before mapping
  const notificationsArray = Array.isArray(notifications) ? notifications : [];
  
  // Format notifications for display
  const formattedNotifications = notificationsArray
    .filter(notification => notification) // Filter out any undefined/null notifications
    .map(notification => ({
      ...notification,
      category: mapNotificationTypeToCategory(notification.type),
      icon: getCategoryIcon(mapNotificationTypeToCategory(notification.type)),
      time: notification.created_at ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }) : 'Unknown time',
      unread: !notification.is_read,
      message: notification.body,
    }));

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Thesis':
        return 'text-green-600 bg-green-100';
      case 'Documents':
        return 'text-blue-600 bg-blue-100';
      case 'Schedule':
        return 'text-amber-600 bg-amber-100';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  };

  const filteredNotifications = formattedNotifications.filter((notif) => {
    if (!notif) return false; // Filter out any undefined/null notifications
    if (filter === 'all') return true;
    if (filter === 'unread') return notif.unread;
    return notif.category && notif.category.toLowerCase() === filter.toLowerCase();
  });

  // Calculate category counts
  const thesisCount = Array.isArray(formattedNotifications) ? 
    formattedNotifications.filter(n => n && n.category === 'Thesis').length : 0;
  const documentsCount = Array.isArray(formattedNotifications) ? 
    formattedNotifications.filter(n => n && n.category === 'Documents').length : 0;
  const scheduleCount = Array.isArray(formattedNotifications) ? 
    formattedNotifications.filter(n => n && n.category === 'Schedule').length : 0;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-slate-900 mb-2">Notification Center</h1>
          <p className="text-slate-600">Stay updated with your thesis progress and team activities</p>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={markAllRead}
          disabled={unreadCount === 0}
        >
          <CheckCircle className="w-4 h-4" />
          Mark All as Read
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total</p>
              <p className="text-2xl text-slate-900">{Array.isArray(formattedNotifications) ? formattedNotifications.length : 0}</p>
            </div>
            <Bell className="w-8 h-8 text-slate-300" />
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-sm bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Unread</p>
              <p className="text-2xl text-green-900">{unreadCount}</p>
            </div>
            <Bell className="w-8 h-8 text-green-300" />
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Thesis</p>
              <p className="text-2xl text-slate-900">{thesisCount}</p>
            </div>
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Documents</p>
              <p className="text-2xl text-slate-900">{documentsCount}</p>
            </div>
            <Upload className="w-8 h-8 text-slate-300" />
          </div>
        </Card>
      </div>

      {/* Filters and Notifications */}
      <Card className="border-0 shadow-sm">
        <Tabs value={filter} onValueChange={setFilter} className="w-full">
          <div className="border-b border-slate-200 px-6 pt-6">
            <TabsList className="bg-transparent border-b-0 gap-2">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-900"
              >
                All
                <Badge variant="secondary" className="ml-2 bg-slate-100">
                  {Array.isArray(formattedNotifications) ? formattedNotifications.length : 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-900"
              >
                Unread
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                  {unreadCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="thesis"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-900"
              >
                Thesis
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-900"
              >
                Documents
              </TabsTrigger>
              <TabsTrigger
                value="schedule"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-900"
              >
                Schedules
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={filter} className="p-6 space-y-3 mt-0">
            {loading ? (
              <div className="py-12 text-center">
                <Loader2 className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-spin" />
                <p className="text-slate-500">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <Bell className="w-12 h-12 text-red-300 mx-auto mb-4" />
                <p className="text-red-500 mb-2">Failed to load notifications</p>
                <p className="text-slate-500 text-sm">{error}</p>
              </div>
            ) : Array.isArray(filteredNotifications) && filteredNotifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No notifications in this category</p>
              </div>
            ) : (
              Array.isArray(filteredNotifications) && filteredNotifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-all ${
                      notification.unread
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getCategoryColor(
                          notification.category
                        )}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm text-slate-900 font-medium">{notification.title}</h3>
                            {notification.unread && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              notification.category === 'Thesis'
                                ? 'bg-green-100 text-green-800'
                                : notification.category === 'Documents'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {notification.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-500">{notification.time}</p>
                          <div className="flex items-center gap-2">
                            {notification.unread && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs h-7"
                                onClick={() => markRead(notification.id)}
                              >
                                Mark as Read
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs h-7 text-slate-400"
                              onClick={() => deleteNotif(notification.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}