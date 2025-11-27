import { Plus, Users, Eye, Clock } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { useEffect, useState } from 'react';
import { fetchCurrentUserGroups } from '../../../frontend/src/api/groupService';
import { Group } from '../../../frontend/src/types';

interface GroupManagementProps {
  userRole: 'student' | 'adviser' | 'panel' | 'admin';
  onViewDetail: (groupId: string) => void;
}

export function GroupManagement({ userRole, onViewDetail }: GroupManagementProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true);
        const userGroups = await fetchCurrentUserGroups();
        setGroups(userGroups);
      } catch (err) {
        setError('Failed to load groups');
        console.error('Error fetching groups:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-slate-900 mb-2">Group Management</h1>
            <p className="text-slate-600">Loading your groups...</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-slate-900 mb-2">Group Management</h1>
            <p className="text-slate-600">Manage research groups and team collaborations</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600 bg-red-50 p-4 rounded-lg">
            <p>Error: {error}</p>
            <Button 
              className="mt-2 bg-green-700 hover:bg-green-800 text-white"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const pendingGroups = groups.filter(g => g.status === 'PENDING');
  const approvedGroups = groups.filter(g => g.status === 'APPROVED');
  const totalMembers = groups.reduce((sum, g) => sum + (g.members?.length || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 border">Pending Approval</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 border-green-200 border">Active</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800 border-red-200 border">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 10;
      case 'APPROVED':
        return 65;
      case 'REJECTED':
        return 0;
      default:
        return 0;
    }
  };

  const getThesisTitle = (group: Group) => {
    if (group.thesis?.title) {
      return group.thesis.title;
    }
    if (group.possible_topics) {
      return group.possible_topics;
    }
    return 'No thesis topic defined';
  };

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
            <p className="text-3xl text-slate-900">{approvedGroups.length}</p>
            <p className="text-sm text-slate-600">Active Groups</p>
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-3xl text-slate-900">{pendingGroups.length}</p>
            <p className="text-sm text-slate-600">Pending Proposals</p>
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
        {groups.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No groups found</h3>
            <p className="text-slate-600 mb-4">
              {userRole === 'student' 
                ? "You haven't created or joined any groups yet." 
                : "No groups available."}
            </p>
            {userRole === 'student' && (
              <Button className="bg-green-700 hover:bg-green-800 text-white">
                Create New Group
              </Button>
            )}
          </div>
        ) : (
          groups.map((group) => (
            <Card key={group.id} className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-slate-900">{group.name}</h3>
                    {getStatusBadge(group.status)}
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{getThesisTitle(group)}</p>
                </div>
              </div>

              {/* Members */}
              <div className="mb-4">
                <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Members</p>
                <div className="flex -space-x-2">
                  {group.members?.slice(0, 4).map((member, index) => (
                    <Avatar key={index} className="border-2 border-white">
                      <AvatarFallback className="bg-green-100 text-green-800 text-xs">
                        {member.first_name?.charAt(0)}{member.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {group.members && group.members.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                      <span className="text-xs text-slate-600">+{group.members.length - 4}</span>
                    </div>
                  )}
                  {(!group.members || group.members.length === 0) && (
                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                      <span className="text-xs text-slate-600">0</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Adviser & Panel */}
              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-xs text-slate-600">{group.status === 'APPROVED' ? 'Adviser' : 'Preferred Adviser'}</p>
                  <p className="text-sm text-slate-900">
                    {group.status === 'APPROVED' && group.adviser
                      ? `${group.adviser.first_name} ${group.adviser.last_name}`
                      : group.status === 'PENDING' && (group as any).preferred_adviser
                        ? `${(group as any).preferred_adviser.first_name} ${(group as any).preferred_adviser.last_name}`
                        : 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Panel</p>
                  <p className="text-sm text-slate-900">
                    {group.panels && group.panels.length > 0
                      ? group.panels.map(p => `${p.first_name} ${p.last_name}`).join(', ')
                      : 'Not assigned'}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-600">Progress</p>
                  <span className="text-xs text-slate-600">{getProgressPercentage(group.status)}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 rounded-full"
                    style={{ width: `${getProgressPercentage(group.status)}%` }}
                  ></div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span>{group.members?.length || 0} members</span>
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
          ))
        )}
      </div>
    </div>
  );
}