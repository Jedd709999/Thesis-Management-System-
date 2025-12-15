import { useEffect, useState } from 'react';
import { ArrowLeft, Mail, FileText, TrendingUp, Users, MessageSquare, Plus } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { fetchGroup, assignPanel } from '../../api/groupService';
import { Group, GroupMember } from '../../types/group';
import { useAuth } from '../../hooks/useAuth';
import { AssignPanelDialog } from './AssignPanelDialog';

interface GroupDetailProps {
  groupId: string | null;
  onBack: () => void;
}

export function GroupDetail({ groupId, onBack }: GroupDetailProps) {
  const { user: currentUser } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAssignPanelDialogOpen, setIsAssignPanelDialogOpen] = useState(false);

  useEffect(() => {
    if (!groupId) {
      setError('No group ID provided');
      setLoading(false);
      return;
    }

    const loadGroup = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching group with ID:', groupId);
        const fetchedGroup: any = await fetchGroup(groupId);
        console.log('Received group data:', fetchedGroup);
        
        // Transform the group data to ensure members are properly structured
        // Extract members from group_members field (sent by backend) or members field
        let rawMembers: any[] = [];
        if (fetchedGroup.group_members && Array.isArray(fetchedGroup.group_members)) {
          // Backend sends members as group_members field
          rawMembers = fetchedGroup.group_members.map((membership: any) => membership.user || membership);
        } else if (fetchedGroup.members && Array.isArray(fetchedGroup.members)) {
          // Fallback to members field if group_members doesn't exist
          rawMembers = fetchedGroup.members;
        } else {
          console.warn('No members found in group data');
        }
        
        // Transform members to GroupMember[] type
        const members: GroupMember[] = rawMembers.map((member: any) => ({
          id: String(member.id),
          first_name: member.first_name || '',
          last_name: member.last_name || '',
          email: member.email || ''
        }));
        
        // Transform leader
        const leader = fetchedGroup.leader ? {
          id: String(fetchedGroup.leader.id),
          first_name: fetchedGroup.leader.first_name || '',
          last_name: fetchedGroup.leader.last_name || '',
          email: fetchedGroup.leader.email || '',
          role: (fetchedGroup.leader.role || 'student').toLowerCase() as 'student' | 'adviser' | 'panel' | 'admin'
        } : undefined;
        
        // Transform adviser
        const adviser = fetchedGroup.adviser ? {
          id: String(fetchedGroup.adviser.id),
          first_name: fetchedGroup.adviser.first_name || '',
          last_name: fetchedGroup.adviser.last_name || '',
          email: fetchedGroup.adviser.email || '',
          role: (fetchedGroup.adviser.role || 'adviser').toLowerCase() as 'student' | 'adviser' | 'panel' | 'admin'
        } : undefined;
        
        // Transform panels
        const panels = fetchedGroup.panels && Array.isArray(fetchedGroup.panels) ? 
          fetchedGroup.panels.map((panel: any) => ({
            id: String(panel.id),
            first_name: panel.first_name || '',
            last_name: panel.last_name || '',
            email: panel.email || '',
            role: (panel.role || 'panel').toLowerCase() as 'student' | 'adviser' | 'panel' | 'admin'
          })) : undefined;
        
        // Transform thesis if it exists
        let thesis: Group['thesis'] | undefined;
        if (fetchedGroup.thesis) {
          thesis = {
            id: String(fetchedGroup.thesis.id),
            title: fetchedGroup.thesis.title || '',
            status: fetchedGroup.thesis.status || 'DRAFT'
          };
        }
        
        // Create transformed group object
        const transformedGroup: Group = {
          id: String(fetchedGroup.id),
          name: fetchedGroup.name || '',
          status: (fetchedGroup.status || 'PENDING') as 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT',
          possible_topics: fetchedGroup.possible_topics || undefined,
          members: members,
          leader: leader,
          adviser: adviser,
          panels: panels,
          created_at: fetchedGroup.created_at || new Date().toISOString(),
          updated_at: fetchedGroup.updated_at || new Date().toISOString(),
          abstract: fetchedGroup.abstract || undefined,
          keywords: fetchedGroup.keywords || undefined,
          description: fetchedGroup.description || undefined,
          preferred_adviser: fetchedGroup.preferred_adviser || undefined,
          thesis: thesis
        };
        
        setGroup(transformedGroup);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching group:', err);
        setError(`Failed to load group details: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
    };

    loadGroup();
  }, [groupId]);

  const handleAssignPanel = async (groupId: string, panelIds: (number | string)[]) => {
    try {
      const updatedGroup = await assignPanel(groupId, panelIds);
      
      // Transform the updated group data
      const panels = updatedGroup.panels && Array.isArray(updatedGroup.panels) ? 
        updatedGroup.panels.map((panel: any) => ({
          id: String(panel.id),
          first_name: panel.first_name || '',
          last_name: panel.last_name || '',
          email: panel.email || '',
          role: (panel.role || 'panel').toLowerCase() as 'student' | 'adviser' | 'panel' | 'admin'
        })) : [];
      
      // Update the group state with the new panel assignments
      if (group) {
        setGroup({
          ...group,
          panels: panels
        });
      }
      
      alert('Panel members assigned successfully.');
    } catch (error: any) {
      console.error('Error assigning panel members:', error);
      alert(`Failed to assign panel members. Please try again. Error: ${error.message || error}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Button variant="ghost" onClick={onBack} className="text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Groups
        </Button>
        <div>Loading group details... (Group ID: {groupId || 'None'})</div>
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
        <div className="text-red-500">Error: {error || 'Group not found'}</div>
        <div>Group ID: {groupId || 'None'}</div>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  // Check if current user is the adviser for this group
  const isGroupAdviser = currentUser?.role === 'ADVISER' && group.adviser?.id === String(currentUser.id);
  
  // Check if current user is a panel member for this group
  const isGroupPanel = currentUser?.role === 'PANEL' && group.panels?.some(panel => panel.id === String(currentUser.id));

  // Get leader name
  const getLeaderName = () => {
    if (group.leader) {
      const firstName = group.leader.first_name || '';
      const lastName = group.leader.last_name || '';
      return `${firstName} ${lastName}`.trim() || 'Unknown';
    }
    return 'No leader assigned';
  };

  // Calculate progress based on thesis status
  const calculateProgress = () => {
    if (!group?.thesis) return 0;
    
    switch (group.thesis.status) {
      case 'TOPIC_SUBMITTED':
        return 20;
      case 'TOPIC_APPROVED':
        return 30;
      case 'CONCEPT_SUBMITTED':
        return 40;
      case 'CONCEPT_APPROVED':
        return 50;
      case 'PROPOSAL_SUBMITTED':
        return 60;
      case 'PROPOSAL_APPROVED':
        return 70;
      case 'FINAL_SUBMITTED':
        return 80;
      case 'FINAL_APPROVED':
        return 100;
      default:
        return 0;
    }
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
            <Badge className={
              group.status === 'APPROVED'
                ? 'bg-blue-100 text-blue-800 border-blue-200 border'
                : group.status === 'PENDING'
                ? 'bg-amber-100 text-amber-800 border-amber-200 border'
                : 'bg-red-100 text-red-800 border-red-200 border'
            }>
              {group.status}
            </Badge>
          </div>
          <p className="text-slate-600">
            {group.thesis 
              ? group.thesis.title 
              : (group.abstract || 'No abstract provided')}
          </p>
          {group.thesis && (
            <Button 
              variant="link" 
              className="p-0 h-auto text-green-700 hover:text-green-800"
              onClick={() => {
                // Navigate to thesis detail page
                window.location.href = `/thesis/${group.thesis?.id}`;
              }}
            >
              View Thesis Details
            </Button>
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
            <p className="text-4xl text-green-900">{calculateProgress()}%</p>
            {group.thesis && (
              <p className="text-sm text-green-700 mt-1">
                Thesis Status: {group.thesis.status.replace(/_/g, ' ')}
              </p>
            )}
          </div>
          <div className="w-32 h-32 rounded-full border-8 border-white flex items-center justify-center bg-green-200">
            <div className="text-center">
              <p className="text-2xl text-green-900">{calculateProgress()}%</p>
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
                <h3 className="text-sm font-medium text-slate-900 mb-3">
                  {group.status === 'APPROVED' ? 'Adviser' : 'Preferred Adviser'}
                </h3>
                {group.status === 'APPROVED' && group.adviser ? (
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
                ) : group.status === 'PENDING' && group.preferred_adviser ? (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-800">
                        {group.preferred_adviser.first_name?.charAt(0)}{group.preferred_adviser.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-slate-900">
                        {group.preferred_adviser.first_name} {group.preferred_adviser.last_name}
                      </p>
                      <p className="text-xs text-slate-600">{group.preferred_adviser.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No adviser assigned</p>
                )}
              </div>

              {/* Panel */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-slate-900">Panel Members</h3>
                  {/* Show Assign Panel button only for advisers of approved groups */}
                  {isGroupAdviser && group.status === 'APPROVED' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsAssignPanelDialogOpen(true)}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      Assign Panel
                    </Button>
                  )}
                </div>
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
                  <div className="flex flex-col items-center justify-center p-6 text-center bg-slate-50 rounded-lg">
                    <Users className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500 mb-2">No panel members assigned</p>
                    {isGroupAdviser && group.status === 'APPROVED' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsAssignPanelDialogOpen(true)}
                        className="flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Assign Panel Members
                      </Button>
                    )}
                  </div>
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
                <span className="text-slate-900">{Array.isArray(group.members) ? group.members.length : 0}</span>
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

      {/* Assign Panel Dialog */}
      <AssignPanelDialog
        open={isAssignPanelDialogOpen}
        onOpenChange={setIsAssignPanelDialogOpen}
        group={group}
        onAssignPanel={handleAssignPanel}
      />
    </div>
  );
}