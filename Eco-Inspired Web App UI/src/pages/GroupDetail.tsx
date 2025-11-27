import { 
  ArrowLeft, 
  Mail, 
  FileText, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Clock, 
  User,
  BookOpen
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { useEffect, useState } from 'react';
import { fetchGroup } from '../../../frontend/src/api/groupService';
import { Group } from '../../../frontend/src/types';

interface GroupDetailProps {
  groupId: string | null;
  onBack: () => void;
}

export function GroupDetail({ groupId, onBack }: GroupDetailProps) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGroup = async () => {
      if (!groupId) return;
      
      try {
        setLoading(true);
        const groupData = await fetchGroup(groupId);
        setGroup(groupData);
      } catch (err) {
        setError('Failed to load group details');
        console.error('Error fetching group:', err);
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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
        </div>
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
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600 bg-red-50 p-4 rounded-lg">
            <p>Error: {error || 'Group not found'}</p>
            <Button 
              className="mt-2 bg-green-700 hover:bg-green-800 text-white"
              onClick={onBack}
            >
              Back to Groups
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

  const getThesisTitle = () => {
    if (group.thesis?.title) {
      return group.thesis.title;
    }
    if (group.possible_topics) {
      return group.possible_topics;
    }
    return 'No thesis topic defined';
  };

  const getRejectionReason = () => {
    if (group.status === 'REJECTED' && group.rejection_reason) {
      return group.rejection_reason;
    }
    return null;
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
            {getStatusBadge(group.status)}
          </div>
          <p className="text-slate-600">{getThesisTitle()}</p>
          {getRejectionReason() && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <span className="font-medium">Rejection Reason:</span> {getRejectionReason()}
              </p>
            </div>
          )}
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
            <p className="text-4xl text-green-900">{getProgressPercentage(group.status)}%</p>
          </div>
          <div className="w-32 h-32 rounded-full border-8 border-white flex items-center justify-center bg-green-200">
            <div className="text-center">
              <p className="text-2xl text-green-900">{getProgressPercentage(group.status)}%</p>
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
              {group.members && group.members.length > 0 ? (
                group.members.map((member, index) => (
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
                          {group.leader?.id === member.id && (
                            <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">Leader</Badge>
                          )}
                        </p>
                        <p className="text-xs text-slate-600 capitalize">{member.role?.toLowerCase()}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" />
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-600 text-center py-4">No members in this group</p>
              )}
            </div>
          </Card>

          {/* Linked Documents */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Linked Documents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.thesis?.documents && group.thesis.documents.length > 0 ? (
                group.thesis.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <FileText className="w-5 h-5 text-slate-600" />
                      <Badge
                        variant="secondary"
                        className="text-xs bg-green-100 text-green-800"
                      >
                        {doc.mime_type?.includes('google') ? 'Google Doc' : 'Document'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-900 mb-1">{doc.title}</p>
                    <p className="text-xs text-slate-600">
                      v{doc.version} • {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No documents uploaded yet</p>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Recent Activity
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-slate-900">
                    Group created on {new Date(group.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(group.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              {group.updated_at !== group.created_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">
                      Last updated on {new Date(group.updated_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(group.updated_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Adviser */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              {group.status === 'APPROVED' ? 'Adviser' : 'Preferred Adviser'}
            </h2>
            {group.adviser ? (
              <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-blue-100 text-blue-800">
                    {group.adviser.first_name?.charAt(0)}{group.adviser.last_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-slate-900">
                    {group.adviser.first_name} {group.adviser.last_name}
                  </p>
                  <p className="text-xs text-slate-600 mb-2">Adviser</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {group.adviser.email}
                  </p>
                </div>
              </div>
            ) : group.status === 'PENDING' && group.preferred_adviser ? (
              <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-blue-100 text-blue-800">
                    {group.preferred_adviser.first_name?.charAt(0)}{group.preferred_adviser.last_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-slate-900">
                    {group.preferred_adviser.first_name} {group.preferred_adviser.last_name}
                  </p>
                  <p className="text-xs text-slate-600 mb-2">Preferred Adviser</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {group.preferred_adviser.email}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-600 text-sm">No adviser assigned yet</p>
            )}
            <Button variant="outline" className="w-full mt-4" size="sm" disabled={!group.adviser}>
              Send Message
            </Button>
          </Card>

          {/* Panel Members */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Panel Members
            </h2>
            {group.panels && group.panels.length > 0 ? (
              <div className="space-y-3">
                {group.panels.map((member, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-purple-100 text-purple-800 text-xs">
                        {member.first_name?.charAt(0)}{member.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-slate-900">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-xs text-slate-600">Panel Member</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-sm">No panel members assigned yet</p>
            )}
          </Card>

          {/* Quick Stats */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-slate-600">Documents</span>
                </div>
                <span className="text-slate-900">{group.thesis?.documents?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-slate-600">Members</span>
                </div>
                <span className="text-slate-900">{group.members?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-slate-600">Status</span>
                </div>
                <span className="text-slate-900 capitalize">{group.status.toLowerCase()}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}