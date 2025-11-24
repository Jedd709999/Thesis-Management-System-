import { ArrowLeft, Mail, FileText, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';

interface GroupDetailProps {
  groupId: string | null;
  onBack: () => void;
}

export function GroupDetail({ groupId, onBack }: GroupDetailProps) {
  const group = {
    id: groupId,
    name: 'Rainforest Biodiversity Team',
    status: 'Active',
    thesis: 'Impact of Climate Change on Rainforest Biodiversity in Southeast Asia',
    progress: 65,
    members: [
      {
        name: 'John Smith',
        avatar: 'JS',
        role: 'Lead Researcher',
        email: 'jsmith@university.edu',
        contributions: 24,
      },
      {
        name: 'Maria Garcia',
        avatar: 'MG',
        role: 'Data Analyst',
        email: 'mgarcia@university.edu',
        contributions: 18,
      },
      {
        name: 'David Chen',
        avatar: 'DC',
        role: 'Field Researcher',
        email: 'dchen@university.edu',
        contributions: 21,
      },
      {
        name: 'Sarah Johnson',
        avatar: 'SJ',
        role: 'Documentation',
        email: 'sjohnson@university.edu',
        contributions: 15,
      },
    ],
    adviser: {
      name: 'Dr. Maria Santos',
      email: 'msantos@university.edu',
      specialization: 'Tropical Ecology',
    },
    panel: [
      { name: 'Dr. James Wilson', specialization: 'Climate Science' },
      { name: 'Dr. Elena Rodriguez', specialization: 'Biodiversity' },
    ],
    documents: [
      { name: 'Thesis Proposal', type: 'PDF', date: '2024-11-10', status: 'Approved' },
      { name: 'Chapter 1: Introduction', type: 'DOCX', date: '2024-11-12', status: 'Under Review' },
      { name: 'Research Data', type: 'XLSX', date: '2024-11-14', status: 'Draft' },
      { name: 'Literature Review', type: 'DOCX', date: '2024-11-08', status: 'Approved' },
    ],
    recentActivity: [
      { user: 'Maria Garcia', action: 'uploaded Chapter 3 draft', time: '2 hours ago' },
      { user: 'Dr. Maria Santos', action: 'commented on Chapter 1', time: '5 hours ago' },
      { user: 'John Smith', action: 'updated thesis proposal', time: '1 day ago' },
      { user: 'David Chen', action: 'shared field research data', time: '2 days ago' },
    ],
  };

  return (
    <div className="p-8 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Groups
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl text-slate-900">{group.name}</h1>
            <Badge className="bg-green-100 text-green-800 border-green-200 border">
              {group.status}
            </Badge>
          </div>
          <p className="text-slate-600">{group.thesis}</p>
        </div>
        <Button className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Message Group
        </Button>
      </div>

      {/* Progress Overview */}
      <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-700 mb-1">Overall Progress</p>
            <p className="text-4xl text-green-900">{group.progress}%</p>
          </div>
          <div className="w-32 h-32 rounded-full border-8 border-white flex items-center justify-center bg-green-200">
            <div className="text-center">
              <p className="text-2xl text-green-900">{group.progress}%</p>
              <p className="text-xs text-green-700">Complete</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Group Members */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Group Members
            </h2>
            <div className="space-y-4">
              {group.members.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-green-100 text-green-800">
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-600">{member.role}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-900">{member.contributions}</p>
                    <p className="text-xs text-slate-600">contributions</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Linked Documents */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-6">Linked Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.documents.map((doc, index) => (
                <div
                  key={index}
                  className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        doc.status === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : doc.status === 'Under Review'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {doc.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-900 mb-1">{doc.name}</p>
                  <p className="text-xs text-slate-600">
                    {doc.type} • {doc.date}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {group.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">
                      <span className="text-green-700">{activity.user}</span>{' '}
                      {activity.action}
                    </p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Adviser */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-4">Assigned Adviser</h2>
            <div className="flex items-start gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-blue-100 text-blue-800">
                  MS
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-slate-900">{group.adviser.name}</p>
                <p className="text-xs text-slate-600 mb-2">{group.adviser.specialization}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {group.adviser.email}
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4" size="sm">
              Send Message
            </Button>
          </Card>

          {/* Panel Members */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-4">Panel Members</h2>
            <div className="space-y-3">
              {group.panel.map((member, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-purple-100 text-purple-800 text-xs">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-600">{member.specialization}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-4">Statistics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-slate-600">Documents</span>
                </div>
                <span className="text-slate-900">{group.documents.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-slate-600">Members</span>
                </div>
                <span className="text-slate-900">{group.members.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-slate-600">Contributions</span>
                </div>
                <span className="text-slate-900">
                  {group.members.reduce((sum, m) => sum + m.contributions, 0)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
