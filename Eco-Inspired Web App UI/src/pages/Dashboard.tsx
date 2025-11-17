import { FileText, CheckCircle, Clock, Users, TrendingUp, Calendar, Upload, Eye, Leaf, Droplets } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

interface DashboardProps {
  userRole: 'student' | 'adviser' | 'panel' | 'admin';
  onNavigate: (page: string) => void;
}

export function Dashboard({ userRole, onNavigate }: DashboardProps) {
  const getStatCards = () => {
    switch (userRole) {
      case 'student':
        return [
          { label: 'My Thesis', value: '1', icon: FileText, color: 'text-green-600 bg-green-100' },
          { label: 'Documents', value: '12', icon: Upload, color: 'text-blue-600 bg-blue-100' },
          { label: 'Pending Reviews', value: '2', icon: Clock, color: 'text-amber-600 bg-amber-100' },
          { label: 'Group Members', value: '4', icon: Users, color: 'text-purple-600 bg-purple-100' },
        ];
      case 'adviser':
        return [
          { label: 'Advised Theses', value: '8', icon: FileText, color: 'text-green-600 bg-green-100' },
          { label: 'Pending Reviews', value: '5', icon: Clock, color: 'text-amber-600 bg-amber-100' },
          { label: 'Approved', value: '12', icon: CheckCircle, color: 'text-blue-600 bg-blue-100' },
          { label: 'Students', value: '24', icon: Users, color: 'text-purple-600 bg-purple-100' },
        ];
      case 'panel':
        return [
          { label: 'Assigned Theses', value: '6', icon: FileText, color: 'text-green-600 bg-green-100' },
          { label: 'To Review', value: '3', icon: Clock, color: 'text-amber-600 bg-amber-100' },
          { label: 'Upcoming Defenses', value: '2', icon: Calendar, color: 'text-blue-600 bg-blue-100' },
          { label: 'Reviewed', value: '18', icon: CheckCircle, color: 'text-purple-600 bg-purple-100' },
        ];
      default:
        return [
          { label: 'Total Theses', value: '42', icon: FileText, color: 'text-green-600 bg-green-100' },
          { label: 'Active Groups', value: '28', icon: Users, color: 'text-blue-600 bg-blue-100' },
          { label: 'Total Documents', value: '324', icon: Upload, color: 'text-amber-600 bg-amber-100' },
          { label: 'This Month', value: '+12', icon: TrendingUp, color: 'text-purple-600 bg-purple-100' },
        ];
    }
  };

  const recentActivities = [
    {
      type: 'thesis',
      title: 'Thesis proposal submitted',
      group: 'Rainforest Biodiversity Team',
      time: '2 hours ago',
      icon: FileText,
    },
    {
      type: 'document',
      title: 'Chapter 3 uploaded',
      group: 'Marine Ecology Group',
      time: '4 hours ago',
      icon: Upload,
    },
    {
      type: 'schedule',
      title: 'Defense scheduled',
      group: 'Climate Change Analysis',
      time: '5 hours ago',
      icon: Calendar,
    },
    {
      type: 'thesis',
      title: 'Review completed',
      group: 'Soil Conservation Study',
      time: '1 day ago',
      icon: CheckCircle,
    },
  ];

  const notifications = [
    { category: 'Thesis', message: 'Your thesis proposal needs revisions', time: '1 hour ago', unread: true },
    { category: 'Documents', message: 'Adviser commented on Chapter 2', time: '3 hours ago', unread: true },
    { category: 'Schedule', message: 'Defense date confirmed: Dec 20, 2025', time: '5 hours ago', unread: false },
    { category: 'Documents', message: 'Document version 3 approved', time: '1 day ago', unread: false },
  ];

  const quickActions = [
    { label: 'Submit Proposal', icon: FileText, action: 'thesis', color: 'bg-green-700 hover:bg-green-800' },
    { label: 'Upload Document', icon: Upload, action: 'documents', color: 'bg-blue-700 hover:bg-blue-800' },
    { label: 'View Group', icon: Users, action: 'groups', color: 'bg-purple-700 hover:bg-purple-800' },
    { label: 'Schedule Defense', icon: Calendar, action: 'schedule', color: 'bg-amber-700 hover:bg-amber-800' },
  ];

  const statCards = getStatCards();

  return (
    <div className="p-8 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-slate-900 mb-2">Welcome back, John</h1>
          <p className="text-slate-600 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-600" />
            Here's what's happening with your environmental research
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
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                    <Icon className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">{activity.title}</p>
                    <p className="text-sm text-slate-600">{activity.group}</p>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{activity.time}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Notifications Panel */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-slate-900">Notifications</h2>
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              2 new
            </Badge>
          </div>
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  notification.unread
                    ? 'bg-green-50 border-green-200 hover:bg-green-100'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
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
                  {notification.unread && (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-slate-900 mb-1">{notification.message}</p>
                <p className="text-xs text-slate-500">{notification.time}</p>
              </div>
            ))}
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
