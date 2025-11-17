import { useState } from 'react';
import { Bell, FileText, Calendar, Upload, CheckCircle, Filter, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export function NotificationCenter() {
  const [filter, setFilter] = useState('all');

  const notifications = [
    {
      id: '1',
      category: 'Thesis',
      icon: FileText,
      title: 'Thesis proposal needs revision',
      message: 'Dr. Maria Santos has requested revisions to your thesis proposal. Please review the feedback and update accordingly.',
      time: '1 hour ago',
      unread: true,
      link: '/thesis/1',
    },
    {
      id: '2',
      category: 'Documents',
      icon: Upload,
      title: 'New document uploaded',
      message: 'Maria Garcia uploaded "Chapter 3 Draft" to Rainforest Biodiversity Team documents.',
      time: '2 hours ago',
      unread: true,
      link: '/documents',
    },
    {
      id: '3',
      category: 'Thesis',
      icon: CheckCircle,
      title: 'Thesis chapter approved',
      message: 'Your Chapter 1: Introduction has been approved by Dr. Maria Santos. You can now proceed with Chapter 2.',
      time: '3 hours ago',
      unread: true,
      link: '/thesis/1',
    },
    {
      id: '4',
      category: 'Schedule',
      icon: Calendar,
      title: 'Defense date confirmed',
      message: 'Your thesis defense has been scheduled for December 20, 2024 at 10:00 AM in Room 301.',
      time: '5 hours ago',
      unread: false,
      link: '/schedule',
    },
    {
      id: '5',
      category: 'Documents',
      icon: FileText,
      title: 'Adviser commented on document',
      message: 'Dr. Maria Santos added 3 comments to your Chapter 2 draft. Review and respond to the feedback.',
      time: '1 day ago',
      unread: false,
      link: '/google-docs',
    },
    {
      id: '6',
      category: 'Thesis',
      icon: Upload,
      title: 'Document version updated',
      message: 'Version 2.1 of your thesis proposal is now available. Changes include updated methodology section.',
      time: '1 day ago',
      unread: false,
      link: '/thesis/1',
    },
    {
      id: '7',
      category: 'Schedule',
      icon: Calendar,
      title: 'Progress review scheduled',
      message: 'A progress review meeting has been scheduled with your adviser for December 15, 2024 at 2:00 PM.',
      time: '2 days ago',
      unread: false,
      link: '/schedule',
    },
    {
      id: '8',
      category: 'Documents',
      icon: CheckCircle,
      title: 'Document approved by panel',
      message: 'Dr. James Wilson approved your literature review document. No further changes required.',
      time: '2 days ago',
      unread: false,
      link: '/documents',
    },
    {
      id: '9',
      category: 'Thesis',
      icon: FileText,
      title: 'Group member added content',
      message: 'David Chen updated the research methodology section. Review the changes in the shared document.',
      time: '3 days ago',
      unread: false,
      link: '/thesis/1',
    },
    {
      id: '10',
      category: 'Schedule',
      icon: Calendar,
      title: 'Reminder: Upcoming defense',
      message: 'Your final thesis defense is in 5 days. Make sure all required documents are submitted.',
      time: '3 days ago',
      unread: false,
      link: '/schedule',
    },
  ];

  const getCategoryColor = (category: string) => {
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

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return notif.unread;
    return notif.category.toLowerCase() === filter.toLowerCase();
  });

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-slate-900 mb-2">Notification Center</h1>
          <p className="text-slate-600">Stay updated with your thesis progress and team activities</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
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
              <p className="text-2xl text-slate-900">{notifications.length}</p>
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
              <p className="text-2xl text-slate-900">
                {notifications.filter((n) => n.category === 'Thesis').length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Documents</p>
              <p className="text-2xl text-slate-900">
                {notifications.filter((n) => n.category === 'Documents').length}
              </p>
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
                  {notifications.length}
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
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No notifications in this category</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      notification.unread
                        ? 'bg-green-50 border-green-200 hover:bg-green-100'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
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
                            <h3 className="text-sm text-slate-900">{notification.title}</h3>
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
                              <Button variant="ghost" size="sm" className="text-xs h-7">
                                Mark as Read
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="text-xs h-7 text-slate-400">
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
