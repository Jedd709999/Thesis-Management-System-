import { Plus, Users, Eye, TrendingUp } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';

interface GroupManagementProps {
  userRole: 'student' | 'adviser' | 'panel' | 'admin';
  onViewDetail: (groupId: string) => void;
}

const mockGroups = [
  {
    id: '1',
    name: 'Rainforest Biodiversity Team',
    members: [
      { name: 'John Smith', avatar: 'JS' },
      { name: 'Maria Garcia', avatar: 'MG' },
      { name: 'David Chen', avatar: 'DC' },
      { name: 'Sarah Johnson', avatar: 'SJ' },
    ],
    adviser: 'Dr. Maria Santos',
    panel: ['Dr. James Wilson', 'Dr. Elena Rodriguez'],
    thesis: 'Climate Change Impact on Rainforests',
    progress: 65,
    documents: 8,
    status: 'Active',
  },
  {
    id: '2',
    name: 'Marine Conservation Team',
    members: [
      { name: 'Emily Wong', avatar: 'EW' },
      { name: 'Michael Brown', avatar: 'MB' },
      { name: 'Lisa Park', avatar: 'LP' },
    ],
    adviser: 'Dr. Elena Rodriguez',
    panel: ['Dr. David Park', 'Dr. Sarah Johnson'],
    thesis: 'Marine Microplastic Pollution Study',
    progress: 30,
    documents: 5,
    status: 'Active',
  },
  {
    id: '3',
    name: 'Urban Ecology Group',
    members: [
      { name: 'Robert Lee', avatar: 'RL' },
      { name: 'Anna Martinez', avatar: 'AM' },
      { name: 'Kevin Zhang', avatar: 'KZ' },
      { name: 'Nicole Adams', avatar: 'NA' },
    ],
    adviser: 'Dr. James Wilson',
    panel: ['Dr. Maria Santos', 'Dr. Michael Chen'],
    thesis: 'Sustainable Waste Management Practices',
    progress: 100,
    documents: 12,
    status: 'Completed',
  },
  {
    id: '4',
    name: 'Sustainable Energy Group',
    members: [
      { name: 'Thomas White', avatar: 'TW' },
      { name: 'Jessica Kim', avatar: 'JK' },
      { name: 'Daniel Lopez', avatar: 'DL' },
    ],
    adviser: 'Dr. Michael Chen',
    panel: ['Dr. James Wilson', 'Dr. Elena Rodriguez'],
    thesis: 'Renewable Energy in Rural Communities',
    progress: 85,
    documents: 10,
    status: 'Active',
  },
  {
    id: '5',
    name: 'Soil Conservation Team',
    members: [
      { name: 'Amanda Green', avatar: 'AG' },
      { name: 'Chris Taylor', avatar: 'CT' },
    ],
    adviser: 'Dr. Sarah Johnson',
    panel: ['Dr. David Park', 'Dr. Maria Santos'],
    thesis: 'Soil Erosion Prevention Study',
    progress: 45,
    documents: 6,
    status: 'Active',
  },
  {
    id: '6',
    name: 'Coastal Ecology Group',
    members: [
      { name: 'Steven Harris', avatar: 'SH' },
      { name: 'Rachel Moore', avatar: 'RM' },
      { name: 'Brandon Clark', avatar: 'BC' },
      { name: 'Olivia Turner', avatar: 'OT' },
    ],
    adviser: 'Dr. David Park',
    panel: ['Dr. Elena Rodriguez', 'Dr. Sarah Johnson'],
    thesis: 'Water Quality in Coastal Ecosystems',
    progress: 70,
    documents: 9,
    status: 'Active',
  },
];

export function GroupManagement({ userRole, onViewDetail }: GroupManagementProps) {
  const activeGroups = mockGroups.filter(g => g.status === 'Active').length;
  const completedGroups = mockGroups.filter(g => g.status === 'Completed').length;
  const totalMembers = mockGroups.reduce((sum, g) => sum + g.members.length, 0);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-slate-900 mb-2">Group Management</h1>
          <p className="text-slate-600">Manage research groups and team collaborations</p>
        </div>
        {(userRole === 'admin' || userRole === 'adviser') && (
          <Button className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Group
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-3xl text-slate-900">{activeGroups}</p>
            <p className="text-sm text-slate-600">Active Groups</p>
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-3xl text-slate-900">{completedGroups}</p>
            <p className="text-sm text-slate-600">Completed Projects</p>
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-3xl text-slate-900">{totalMembers}</p>
            <p className="text-sm text-slate-600">Total Students</p>
          </div>
        </Card>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockGroups.map((group) => (
          <Card key={group.id} className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-slate-900">{group.name}</h3>
                  <Badge
                    variant="secondary"
                    className={
                      group.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }
                  >
                    {group.status}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-3">{group.thesis}</p>
              </div>
            </div>

            {/* Members */}
            <div className="mb-4">
              <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Members</p>
              <div className="flex -space-x-2">
                {group.members.map((member, index) => (
                  <Avatar key={index} className="border-2 border-white">
                    <AvatarFallback className="bg-green-100 text-green-800 text-xs">
                      {member.avatar}
                    </AvatarFallback>
                  </Avatar>
                ))}
                <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-slate-600">{group.members.length}</span>
                </div>
              </div>
            </div>

            {/* Adviser & Panel */}
            <div className="space-y-2 mb-4">
              <div>
                <p className="text-xs text-slate-600">Adviser</p>
                <p className="text-sm text-slate-900">{group.adviser}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Panel</p>
                <p className="text-sm text-slate-900">{group.panel.join(', ')}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-600">Progress</p>
                <span className="text-xs text-slate-600">{group.progress}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full"
                  style={{ width: `${group.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span>{group.documents} documents</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetail(group.id)}
                className="text-green-700 hover:text-green-800 hover:bg-green-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
