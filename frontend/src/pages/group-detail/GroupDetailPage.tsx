import { useEffect, useState } from 'react';
import { ArrowLeft, Mail, FileText, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { fetchGroup } from '../../api/groupService';
import { Group } from '../../types';

interface GroupDetailProps {
  groupId: string | null;
  onBack: () => void;
}

export function GroupDetail({ groupId, onBack }: GroupDetailProps) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;

    const loadGroup = async () => {
      try {
        setLoading(true);
        const fetchedGroup = await fetchGroup(groupId);
        setGroup(fetchedGroup);
        setError(null);
      } catch (err) {
        console.error('Error fetching group:', err);
        setError('Failed to load group details');
      } finally {
        setLoading(false);
      }
    };

    loadGroup();
  }, [groupId]);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Button variant="ghost" onClick={onBack} className="text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Groups
        </Button>
        <div>Loading group details...</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="p-8 space-y-6">
        <Button variant="ghost" onClick={onBack} className="text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Groups
        </Button>
        <div>Error: {error || 'Group not found'}</div>
      </div>
    );
  }

  // Calculate progress (mock value since we don't have actual progress data)
  const progress = 65;

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
            <Badge className={
              group.status === 'APPROVED'
                ? 'bg-green-100 text-green-800 border-green-200 border'
                : group.status === 'PENDING'
                ? 'bg-amber-100 text-amber-800 border-amber-200 border'
                : 'bg-red-100 text-red-800 border-red-200 border'
            }>
              {group.status}
            </Badge>
          </div>
          <p className="text-slate-600">{group.abstract || 'No abstract provided'}</p>
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
            <p className="text-4xl text-green-900">{progress}%</p>
          </div>
          <div className="w-32 h-32 rounded-full border-8 border-white flex items-center justify-center bg-green-200">
            <div className="text-center">
              <p className="text-2xl text-green-900">{progress}%</p>
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
                        {member.first_name?.charAt(0)}{member.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-slate-900">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-xs text-slate-600">
                        {member.id === group.leader?.id ? 'Leader' : 'Member'}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-900">0</p>
                    <p className="text-xs text-slate-600">contributions</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Adviser & Panel */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Adviser & Panel
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Adviser */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-3">Adviser</h3>
                {group.adviser ? (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-800">
                        {group.adviser.first_name?.charAt(0)}{group.adviser.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-slate-900">
                        {group.adviser.first_name} {group.adviser.last_name}
                      </p>
                      <p className="text-xs text-slate-600">{group.adviser.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No adviser assigned</p>
                )}
              </div>

              {/* Panel */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-3">Panel Members</h3>
                {group.panels && group.panels.length > 0 ? (
                  <div className="space-y-3">
                    {group.panels.map((panelMember, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                        <Avatar>
                          <AvatarFallback className="bg-purple-100 text-purple-800 text-xs">
                            {panelMember.first_name?.charAt(0)}{panelMember.last_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm text-slate-900">
                            {panelMember.first_name} {panelMember.last_name}
                          </p>
                          <p className="text-xs text-slate-600">{panelMember.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No panel members assigned</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-4">Statistics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-slate-600">Documents</span>
                </div>
                <span className="text-slate-900">0</span>
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
                <span className="text-slate-900">0</span>
              </div>
            </div>
          </Card>

          {/* Thesis Info */}
          {group.thesis && (
            <Card className="p-6 border-0 shadow-sm">
              <h2 className="text-slate-900 mb-4">Thesis Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-600">Title</p>
                  <p className="text-sm text-slate-900">{group.thesis.title}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Status</p>
                  <Badge variant="secondary" className="text-xs">
                    {group.thesis.status}
                  </Badge>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}