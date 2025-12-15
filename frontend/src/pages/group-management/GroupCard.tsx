import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Eye, Users, BookOpen, Clock, TrendingUp, Edit, Trash2, Check, X, RotateCcw, LogOut, UserPlus } from "lucide-react";
import { GroupMember, User, Group as GroupType } from "../../types/group";
import { User as AuthUser } from "../../types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { useMemo } from "react";

interface GroupCardProps {
  group: GroupType;
  onViewDetail: (groupId: string) => void;
  showJoinButton?: boolean;
  isGroupLeader?: boolean;
  isGroupMember?: boolean;
  onEdit?: (group: GroupType) => void;
  onDelete?: (group: GroupType) => void;
  onApprove?: (group: GroupType) => void;
  onReject?: (group: GroupType) => void;
  onResubmit?: (group: GroupType) => void;
  onLeaveGroup?: (group: GroupType) => void;
  onAssignAdviser?: (group: GroupType) => void;
  onAssignPanel?: (group: GroupType) => void;
  // Add currentUser prop to determine access
  currentUser?: AuthUser | null;
  userRole?: string;
}

export function GroupCard({ 
  group, 
  onViewDetail, 
  showJoinButton = false,
  isGroupLeader = false,
  isGroupMember = false,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onResubmit,
  onLeaveGroup,
  onAssignAdviser,
  onAssignPanel,
  currentUser,
  userRole
}: GroupCardProps) {
  // Ensure members array exists and is properly formatted
  const safeMembers = Array.isArray(group.members) ? group.members : [];
  
  // Format topics from newline-separated string to array
  const topics = group.possible_topics?.split('\n').filter(topic => topic.trim()) || [];
  
  // Format keywords from comma-separated string to array
  const keywords = Array.isArray(group.keywords) ? group.keywords : (group.keywords?.split(',').map(k => k.trim()).filter(k => k) || []);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 border">Pending Approval</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 border">Active</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800 border-red-200 border">Rejected</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 border-slate-200 border">{status}</Badge>;
    }
  };
  
  const getProgressPercentage = () => {
    // Use thesis_progress if available, otherwise calculate based on status
    if (group.thesis_progress !== undefined && group.thesis_progress !== null) {
      return Math.min(Math.max(group.thesis_progress, 0), 100);
    }
    
    switch (group.status) {
      case 'PENDING':
        return 10;
      case 'APPROVED':
        return 65;
      default:
        return 0;
    }
  };
  
  const getThesisTitle = () => {
    // If the group has a thesis, show the thesis title
    if (group.thesis && typeof group.thesis !== 'string') {
      return group.thesis.title || 'Untitled Thesis';
    }
    
    // For pending groups, show the first possible topic as a placeholder
    if (group.status === 'PENDING' && group.possible_topics) {
      return group.possible_topics.split('\n')[0];
    }
    
    // Fallback
    return 'No thesis defined';
  };
  
  // Get leader name - use the actual leader if available, otherwise fallback to first member
  const getLeaderName = () => {
    // If we have leader data, use it
    if (group.leader) {
      const firstName = group.leader.first_name || '';
      const lastName = group.leader.last_name || '';
      return `${firstName} ${lastName}`.trim() || 'Unknown';
    }
    
    // Fallback to first member if no leader data
    if (safeMembers.length > 0) {
      const firstMember = safeMembers[0];
      const firstName = firstMember.first_name || '';
      const lastName = firstMember.last_name || '';
      return `${firstName} ${lastName}`.trim() || 'Unknown';
    }
    
    return 'No members';
  };
  
  // Get adviser name
  const getAdviserName = () => {
    // For approved groups, show assigned adviser
    if (group.status === 'APPROVED' && group.adviser) {
      const firstName = group.adviser.first_name || '';
      const lastName = group.adviser.last_name || '';
      return `${firstName} ${lastName}`.trim() || 'Unknown';
    }
    // For pending groups, show assigned adviser if available (after assignment)
    if (group.status === 'PENDING' && group.adviser) {
      const firstName = group.adviser.first_name || '';
      const lastName = group.adviser.last_name || '';
      return `${firstName} ${lastName}`.trim() || 'Unknown';
    }
    // For pending groups, show preferred adviser if available
    if (group.status === 'PENDING' && group.preferred_adviser) {
      const firstName = group.preferred_adviser.first_name || '';
      const lastName = group.preferred_adviser.last_name || '';
      return `${firstName} ${lastName}`.trim() || 'Unknown';
    }
    // For pending groups with no preferred adviser, or other statuses
    return 'Not assigned';
  };
  
  // Get panel members names
  const getPanelNames = () => {
    if (!group.panels || !Array.isArray(group.panels) || group.panels.length === 0) {
      return 'Not assigned';
    }
    
    return group.panels
      .map(panel => {
        const firstName = panel.first_name || '';
        const lastName = panel.last_name || '';
        return `${firstName} ${lastName}`.trim() || 'Unknown';
      })
      .join(', ');
  };
  
  // Convert member ID to string for comparison
  const getMemberIdString = (member: GroupMember | User) => {
    return String(member.id);
  };

  // Get member name with better error handling
  const getMemberName = (member: GroupMember) => {
    if (!member) return 'Unknown';
    const firstName = member.first_name || '';
    const lastName = member.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || 'Unknown';
  };

  // Determine if the current user has access to view this group
  const canViewGroup = useMemo(() => {
    // For admins, always allow viewing
    if (!currentUser || userRole === 'admin') {
      return true;
    }
    
    // For students, advisers, and panel members, check if they have access to this group
    // They can access if they are:
    // 1. A member of the group
    // 2. The leader of the group
    // 3. The adviser of the group
    // 4. A panel member of the group
    
    // Check if user is a member
    const isMember = group.members?.some(member => 
      String(member.id) === String(currentUser.id)
    );
    
    // Check if user is the leader
    const isLeader = group.leader?.id === String(currentUser.id);
    
    // Check if user is the adviser
    const isAdviser = group.adviser?.id === String(currentUser.id);
    
    // Check if user is a panel member
    const isPanel = group.panels?.some(panel => 
      String(panel.id) === String(currentUser.id)
    );
    
    return isMember || isLeader || isAdviser || isPanel;
  }, [group, currentUser, userRole]);

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow max-w-full">
      <CardHeader className="pb-4 max-w-full">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-slate-900 truncate max-w-full">{group.name}</CardTitle>
              {getStatusBadge(group.status)}
            </div>
            <p className="text-sm text-slate-600 mb-3 line-clamp-2 max-w-full">{getThesisTitle()}</p>
            {/* Adviser - Show below group name and thesis title */}
            <div>
              <p className="text-xs text-slate-600 mb-1 truncate">
                {group.status === 'PENDING' ? (group.adviser ? 'Assigned Adviser' : 'Preferred Adviser') : 'Adviser'}
              </p>
              <p className="text-sm text-slate-900 truncate max-w-full">{getAdviserName()}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 max-w-full">

        
        
        
        {/* Panel Members - Show names as plain text separated by commas */}
        {group.status === 'APPROVED' && group.panels && group.panels.length > 0 && (
          <div className="max-w-full">
            <p className="text-xs text-slate-600 uppercase tracking-wider mb-2 truncate">Panel Members</p>
            <p className="text-sm text-slate-900">
              {group.panels.map((panel, index) => {
                const panelName = `${panel.first_name || ''} ${panel.last_name || ''}`.trim() || 'Unknown';
                return panelName;
              }).join(', ')}
            </p>
          </div>
        )}
        
        {/* Members Avatars */}
        <div className="max-w-full">
          <p className="text-xs text-slate-600 uppercase tracking-wider mb-2 truncate">Members</p>
          <div className="flex -space-x-2 max-w-full overflow-hidden">
            {Array.isArray(safeMembers) && safeMembers.length > 0 ? (
              safeMembers.slice(0, 5).map((member, index) => {                // Add better error handling for member data
                if (!member || !member.id) return null;
                
                const memberId = getMemberIdString(member);
                const memberName = getMemberName(member);
                
                return (
                  <div key={memberId || index} className="relative group">
                    <Avatar className="border-2 border-white">
                      <AvatarFallback className="bg-green-100 text-green-800 text-xs">
                        {(member.first_name?.charAt(0) || '') + (member.last_name?.charAt(0) || '') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 max-w-xs truncate z-10">
                      {memberName}
                      {group.leader && String(group.leader.id) === memberId && ' (Leader)'}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                <span className="text-xs text-slate-600">0</span>
              </div>
            )}
            {Array.isArray(safeMembers) && safeMembers.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                <span className="text-xs text-slate-600">+{safeMembers.length - 5}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Topics Preview - Only show for pending groups */}
        {group.status === 'PENDING' && Array.isArray(topics) && topics.length > 0 && (
          <div className="max-w-full">
            <p className="text-xs text-slate-600 uppercase tracking-wider mb-2 truncate">Research Topics</p>
            <div className="space-y-1 max-w-full">
              {topics.slice(0, 2).map((topic, index) => (
                <div key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full max-w-full truncate">
                  {topic}
                </div>
              ))}
              {Array.isArray(topics) && topics.length > 2 && (
                <div className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full truncate">
                  +{topics.length - 2} more
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Progress Visualization */}
        <div className="rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-slate-700">Progress</span>
            </div>
            <span className="text-xs font-medium text-slate-700">{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="h-2 bg-green-600 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {Array.isArray(safeMembers) ? safeMembers.length : 0}
          </span>
        </div>
        <TooltipProvider delayDuration={300}>
          <div className="flex gap-1">
            {isGroupLeader && onEdit && onDelete && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onEdit(group)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md p-2"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit Group</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onDelete(group)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete Group</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
            {onApprove && onReject && group.status === 'PENDING' && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onApprove(group)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md p-2"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Approve Proposal</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onReject(group)}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md p-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reject Proposal</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
            {onAssignAdviser && group.status === 'PENDING' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onAssignAdviser(group)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md p-2"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Assign Adviser</p>
                </TooltipContent>
              </Tooltip>
            )}
            {onAssignPanel && group.status === 'APPROVED' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onAssignPanel(group)}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md p-2"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Assign Panel</p>
                </TooltipContent>
              </Tooltip>
            )}
            {onResubmit && group.status === 'REJECTED' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onResubmit(group)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md p-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Resubmit Proposal</p>
                </TooltipContent>
              </Tooltip>
            )}
            {isGroupMember && onLeaveGroup && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onLeaveGroup(group)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md p-2"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Leave Group</p>
                </TooltipContent>
              </Tooltip>
            )}
            {canViewGroup && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onViewDetail(group.id)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md p-2"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Details</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}