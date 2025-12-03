import React, { useState, useMemo, useEffect } from 'react';
import { Group, GroupMember } from '../../types/group';
import { GroupCard } from './GroupCard';
import { AssignPanelDialog } from '../group-detail/AssignPanelDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Users, Plus, ChevronDown, ChevronRight, AlertCircle, UserPlus } from 'lucide-react';
import { Search, Filter, User } from 'lucide-react';
import { fetchCurrentUserGroups, fetchOtherGroups, createGroup, searchUsers, fetchGroups, fetchPendingProposals, approveGroup, rejectGroup, resubmitGroup, deleteGroup, updateGroup, removeGroupMember, assignAdviser, assignPanel } from '../../api/groupService';
import { Group as ApiGroup } from '../../types';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { useAuth } from '../../hooks/useAuth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';

// Helper function to transform API Group to frontend Group
const transformGroup = (apiGroup: any): Group => {
  // Handle members from either group_members (backend structure) or members (fallback)
  let members: GroupMember[] = [];
  if (apiGroup.group_members && Array.isArray(apiGroup.group_members)) {
    // Backend sends members as group_members with user objects
    members = apiGroup.group_members.map((membership: any) => {
      // Extract user data from membership object
      const user = membership.user || membership;
      return {
        id: String(user.id),
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || ''
      };
    });
  } else if (apiGroup.members && Array.isArray(apiGroup.members)) {
    // Fallback to direct members array
    members = apiGroup.members.map((member: any) => ({
      id: String(member.id),
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      email: member.email || ''
    }));
  }

  return {
    id: apiGroup.id,
    name: apiGroup.name,
    status: apiGroup.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT',
    possible_topics: apiGroup.possible_topics,
    abstract: apiGroup.abstract,
    keywords: apiGroup.keywords,
    description: apiGroup.description,
    members: members,
    leader: apiGroup.leader ? {
      id: String(apiGroup.leader.id),
      first_name: apiGroup.leader.first_name || '',
      last_name: apiGroup.leader.last_name || '',
      email: apiGroup.leader.email || '',
      role: (apiGroup.leader.role || 'student').toLowerCase() as 'student' | 'adviser' | 'panel' | 'admin'
    } : undefined,
    adviser: apiGroup.adviser ? {
      id: String(apiGroup.adviser.id),
      first_name: apiGroup.adviser.first_name || '',
      last_name: apiGroup.adviser.last_name || '',
      email: apiGroup.adviser.email || '',
      role: (apiGroup.adviser.role || 'adviser').toLowerCase() as 'student' | 'adviser' | 'panel' | 'admin'
    } : undefined,
    panels: Array.isArray(apiGroup.panels) ? apiGroup.panels.map((panel: any) => ({
      id: String(panel.id),
      first_name: panel.first_name || '',
      last_name: panel.last_name || '',
      email: panel.email || '',
      role: (panel.role || 'panel').toLowerCase() as 'student' | 'adviser' | 'panel' | 'admin'
    })) : [],
    created_at: apiGroup.created_at,
    updated_at: apiGroup.updated_at,
    thesis: apiGroup.thesis ? {
      id: apiGroup.thesis.id,
      title: apiGroup.thesis.title,
      status: apiGroup.thesis.status
    } : undefined,
    preferred_adviser: apiGroup.preferred_adviser ? {
      id: String(apiGroup.preferred_adviser.id),
      first_name: apiGroup.preferred_adviser.first_name || '',
      last_name: apiGroup.preferred_adviser.last_name || '',
      email: apiGroup.preferred_adviser.email || '',
      role: (apiGroup.preferred_adviser.role || 'adviser').toLowerCase() as 'student' | 'adviser' | 'panel' | 'admin'
    } : undefined
  };
};

interface GroupManagementProps {
  userRole?: 'student' | 'admin' | 'adviser' | 'panel';
  onViewDetail: (groupId: string) => void;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

const GroupManagementPage: React.FC<GroupManagementProps> = ({ userRole, onViewDetail }) => {
  const { user: currentUser } = useAuth();
  const [groups, setGroups] = useState<{ my: Group[]; others: Group[] }>({
    my: [],
    others: [],
  });
  const [pendingProposals, setPendingProposals] = useState<Group[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [adviserFilter, setAdviserFilter] = useState('all');
  const [searchType, setSearchType] = useState('general'); // 'general', 'keywords', 'topics'
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignAdviserDialogOpen, setIsAssignAdviserDialogOpen] = useState(false);
  const [isAssignPanelDialogOpen, setIsAssignPanelDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');
  const [researchTopics, setResearchTopics] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [preferredAdviser, setPreferredAdviser] = useState<number | null>(null);
  const [selectedAdviser, setSelectedAdviser] = useState<number | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [availableAdvisers, setAvailableAdvisers] = useState<User[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isMemberSelectionOpen, setIsMemberSelectionOpen] = useState(false);
  const [isAdviserSelectionOpen, setIsAdviserSelectionOpen] = useState(false);

  // Filter helper - enhanced with multiple filter criteria
  const filterGroups = (list: Group[]) => {
    return list.filter((g) => {
      // Text search filter
      const matchesSearch = searchTerm.trim() === '' || 
        (searchType === 'general' && (
          g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (g.possible_topics && g.possible_topics.toLowerCase().includes(searchTerm.toLowerCase()))
        )) ||
        (searchType === 'keywords' && g.keywords && g.keywords.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (searchType === 'topics' && g.possible_topics && g.possible_topics.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
      
      // Adviser filter
      const matchesAdviser = adviserFilter === 'all' || 
        (g.adviser && String(g.adviser.id) === adviserFilter);
      
      return matchesSearch && matchesStatus && matchesAdviser;
    });
  };

  // Enhanced search function that uses backend API
  const performSearch = async () => {
    try {
      const searchParams: any = {};
      
      // Add search term based on search type
      if (searchTerm.trim() !== '') {
        if (searchType === 'general') {
          searchParams.search = searchTerm;
        } else if (searchType === 'keywords') {
          searchParams.keywords = searchTerm;
        } else if (searchType === 'topics') {
          searchParams.topics = searchTerm;
        }
      }
      
      // Add status filter
      if (statusFilter !== 'all') {
        searchParams.status = statusFilter;
      }
      
      // Add adviser filter (admin only)
      if (userRole === 'admin' && adviserFilter !== 'all') {
        searchParams.adviser = adviserFilter;
      }
      
      // Only perform API search if we have search parameters
      if (Object.keys(searchParams).length > 0) {
        const searchResults = await fetchGroups(searchParams);
        const transformedResults = searchResults.map(transformGroup);
        
        // Update the appropriate state based on user role
        if (userRole === 'admin') {
          setAllGroups(transformedResults);
        } else {
          // For non-admin users, we update both my groups and other groups
          // In a production environment, you might want to implement separate
          // search endpoints for each tab
          const myGroups = await fetchCurrentUserGroups();
          const otherGroups = await fetchOtherGroups();
          setGroups({
            my: myGroups.map(transformGroup),
            others: otherGroups.map(transformGroup)
          });
        }
      } else {
        // If no search parameters, reload all groups
        const myGroups = await fetchCurrentUserGroups();
        const otherGroups = await fetchOtherGroups();
        setGroups({ 
          my: myGroups.map(transformGroup), 
          others: otherGroups.map(transformGroup) 
        });
        
        // For admin users, also fetch all groups and pending proposals
        if (userRole === 'admin') {
          const allGroupsResponse = await fetchGroups();
          setAllGroups(allGroupsResponse.map(transformGroup));
          
          const pendingProposalsResponse = await fetchPendingProposals();
          setPendingProposals(pendingProposalsResponse.map(transformGroup));
        }
      }
    } catch (error) {
      console.error('Error performing search:', error);
    }
  };

  // Simple frontend filtering for immediate feedback
  const simpleFilterGroups = (list: Group[]) => {
    if (!searchTerm.trim() && statusFilter === 'all' && (adviserFilter === 'all' || userRole !== 'admin')) {
      return list;
    }
    
    return list.filter((g) => {
      // Text search filter
      const matchesSearch = searchTerm.trim() === '' || 
        (searchType === 'general' && (
          g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (g.possible_topics && g.possible_topics.toLowerCase().includes(searchTerm.toLowerCase()))
        )) ||
        (searchType === 'keywords' && g.keywords && g.keywords.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (searchType === 'topics' && g.possible_topics && g.possible_topics.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
      
      // Adviser filter
      const matchesAdviser = adviserFilter === 'all' || 
        (userRole === 'admin' && g.adviser && String(g.adviser.id) === adviserFilter);
      
      return matchesSearch && matchesStatus && matchesAdviser;
    });
  };

  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, searchType, statusFilter, adviserFilter, userRole]);

  const filteredGroups = useMemo(
    () => ({
      my: simpleFilterGroups(groups.my),
      others: simpleFilterGroups(groups.others),
      all: simpleFilterGroups(allGroups),
      proposals: simpleFilterGroups(pendingProposals),
    }),
    [groups, allGroups, pendingProposals, searchTerm, statusFilter, adviserFilter, searchType]
  );

  // Handlers
  const handleViewDetailInternal = (groupId: string) => {
    onViewDetail(groupId);
  };

  const handleEditGroup = (group: Group) => {
    // Allow both admin and group leaders to edit
    const isGroupLeader = (userRole === 'student' || userRole === 'panel') && group.leader?.id === String(currentUser?.id);
    if (userRole !== 'admin' && !isGroupLeader) return;
    
    // Set the group to be edited
    setEditingGroup(group);
    
    // Populate the form with group data
    setGroupName(group.name || '');
    setResearchTopics(group.possible_topics || '');
    
    // Set selected members (convert string IDs to numbers)
    const memberIds = (group.members || []).map(member => {
      const id = typeof member.id === 'string' ? parseInt(member.id, 10) : member.id;
      return isNaN(id) ? 0 : id;
    }).filter(id => id > 0);
    setSelectedMembers(memberIds);
    
    // Set preferred adviser
    const adviserId = group.preferred_adviser?.id;
    if (adviserId) {
      const id = typeof adviserId === 'string' ? parseInt(adviserId, 10) : adviserId;
      setPreferredAdviser(isNaN(id) ? null : id);
    } else {
      setPreferredAdviser(null);
    }
    
    // Clear any previous errors
    setFormErrors({});
    
    // Open the edit dialog
    setIsEditDialogOpen(true);
  };

  const handleDeleteGroup = async (group: Group) => {
    // Allow both admin and group leaders to delete
    const isGroupLeader = (userRole === 'student' || userRole === 'panel') && group.leader?.id === String(currentUser?.id);
    if (userRole !== 'admin' && !isGroupLeader) return;
    
    // Confirm deletion
    const confirmed = window.confirm(`Are you sure you want to delete the group "${group.name}"? This action cannot be undone.`);
    if (!confirmed) return;
    
    try {
      await deleteGroup(group.id);
      
      // Refresh groups
      const myGroups = await fetchCurrentUserGroups();
      const otherGroups = await fetchOtherGroups();
      setGroups({ 
        my: myGroups.map(transformGroup), 
        others: otherGroups.map(transformGroup) 
      });
      
      // For admin users, also refresh all groups and pending proposals
      if (userRole === 'admin') {
        const allGroupsResponse = await fetchGroups();
        setAllGroups(allGroupsResponse.map(transformGroup));
        
        const pendingProposalsResponse = await fetchPendingProposals();
        setPendingProposals(pendingProposalsResponse.map(transformGroup));
      }
      
      alert(`Group "${group.name}" has been deleted successfully.`);
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group. Please try again.');
    }
  };

  const handleApproveGroup = async (group: Group) => {
    if (userRole !== 'admin') return;
    try {
      const updatedGroup = await approveGroup(group.id);
      // Refresh the pending proposals list
      const pendingProposalsResponse = await fetchPendingProposals();
      setPendingProposals(pendingProposalsResponse.map(transformGroup));
      // Also refresh the all groups list
      const allGroupsResponse = await fetchGroups();
      setAllGroups(allGroupsResponse.map(transformGroup));
      alert(`Group "${updatedGroup.name}" has been approved.`);
    } catch (error: any) {
      console.error('Error approving group:', error);
      // Check if it's the specific error about adviser not being assigned
      if (error.response && error.response.data && error.response.data.error) {
        alert(error.response.data.error);
      } else {
        alert('Failed to approve group. Please try again.');
      }
    }
  };

  const handleRejectGroup = async (group: Group) => {
    if (userRole !== 'admin') return;
    const reason = prompt('Enter a reason for rejecting this group proposal (optional):');
    try {
      const updatedGroup = await rejectGroup(group.id, reason || undefined);
      // Refresh the pending proposals list
      const pendingProposalsResponse = await fetchPendingProposals();
      setPendingProposals(pendingProposalsResponse.map(transformGroup));
      alert(`Group "${updatedGroup.name}" has been rejected.`);
    } catch (error) {
      console.error('Error rejecting group:', error);
      alert('Failed to reject group. Please try again.');
    }
  };

  const handleResubmitGroup = async (group: Group) => {
    if (userRole !== 'student' && userRole !== 'panel') return;
    try {
      const updatedGroup = await resubmitGroup(group.id);
      // Refresh the user's groups list
      const myGroupsResponse = await fetchCurrentUserGroups();
      setGroups(prev => ({
        ...prev,
        my: myGroupsResponse.map(transformGroup)
      }));
      alert(`Group "${updatedGroup.name}" has been resubmitted for approval.`);
    } catch (error) {
      console.error('Error resubmitting group:', error);
      alert('Failed to resubmit group. Please try again.');
    }
  };

  const handleAssignAdviser = async (group: Group) => {
    if (userRole !== 'admin') return;
    if (!selectedAdviser) {
      alert('Please select an adviser.');
      return;
    }
    
    try {
      const updatedGroup = await assignAdviser(group.id, selectedAdviser);
      // Refresh the pending proposals list
      const pendingProposalsResponse = await fetchPendingProposals();
      setPendingProposals(pendingProposalsResponse.map(transformGroup));
      // Also refresh the all groups list
      const allGroupsResponse = await fetchGroups();
      setAllGroups(allGroupsResponse.map(transformGroup));
      
      // For admin users, also refresh my groups and other groups
      if (userRole === 'admin') {
        const myGroupsResponse = await fetchCurrentUserGroups();
        const otherGroupsResponse = await fetchOtherGroups();
        setGroups({
          my: myGroupsResponse.map(transformGroup),
          others: otherGroupsResponse.map(transformGroup)
        });
      }
      
      // Close the dialog and reset state
      setIsAssignAdviserDialogOpen(false);
      setSelectedAdviser(null);
      setEditingGroup(null);
      
      alert(`Adviser assigned to group "${updatedGroup.name}" successfully.`);
    } catch (error) {
      console.error('Error assigning adviser:', error);
      alert('Failed to assign adviser. Please try again.');
    }
  };

  // Add handler for assigning panel members
  const handleAssignPanel = async (groupId: string, panelIds: (number | string)[]) => {
    try {
      const updatedGroup = await assignPanel(groupId, panelIds);
      
      // Refresh groups to show updated panel assignments
      const myGroups = await fetchCurrentUserGroups();
      const otherGroups = await fetchOtherGroups();
      setGroups({ 
        my: myGroups.map(transformGroup), 
        others: otherGroups.map(transformGroup) 
      });
      
      // For admin users, also refresh all groups and pending proposals
      if (userRole === 'admin') {
        const allGroupsResponse = await fetchGroups();
        setAllGroups(allGroupsResponse.map(transformGroup));
        
        const pendingProposalsResponse = await fetchPendingProposals();
        setPendingProposals(pendingProposalsResponse.map(transformGroup));
      }
      
      setIsAssignPanelDialogOpen(false);
      alert('Panel members assigned successfully.');
    } catch (error: any) {
      console.error('Error assigning panel members:', error);
      // Check if it's a permission error
      if (error.response?.status === 403) {
        alert('You do not have permission to assign panel members. Only administrators or the group adviser can perform this action.');
      } else {
        alert('Failed to assign panel members. Please try again.');
      }
    }
  };

  // Add handler for opening assign panel dialog
  const handleOpenAssignPanelDialog = (group: Group) => {
    setEditingGroup(group);
    setIsAssignPanelDialogOpen(true);
  };

  const handleLeaveGroup = async (group: Group) => {
    if (!currentUser) return;
    
    // Confirm leaving the group
    const confirmed = window.confirm(`Are you sure you want to leave the group "${group.name}"?`);
    if (!confirmed) return;
    
    try {
      await removeGroupMember(group.id, currentUser.id);
      
      // Refresh groups
      const myGroupsResponse = await fetchCurrentUserGroups();
      const otherGroupsResponse = await fetchOtherGroups();
      setGroups({
        my: myGroupsResponse.map(transformGroup),
        others: otherGroupsResponse.map(transformGroup)
      });
      
      alert(`You have successfully left the group "${group.name}".`);
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Failed to leave group. Please try again.');
    }
  };

  const handleOpenAssignAdviserDialog = async (group: Group) => {
    if (userRole !== 'admin') return;
    
    // Set the group to be edited
    setEditingGroup(group);
    
    // Set the currently assigned adviser if any
    const adviserId = group.adviser?.id;
    if (adviserId) {
      const id = typeof adviserId === 'string' ? parseInt(adviserId, 10) : adviserId;
      setSelectedAdviser(isNaN(id) ? null : id);
    } else {
      setSelectedAdviser(null);
    }
    
    // Load advisers if not already loaded
    if (availableAdvisers.length === 0) {
      try {
        const response = await searchUsers('');
        const users = response.data.results || response.data;
        const advisers = users.filter((user: User) => user.role === 'ADVISER');
        setAvailableAdvisers(advisers);
      } catch (error) {
        console.error('Error loading advisers:', error);
      }
    }
    
    // Open the assign adviser dialog
    setIsAssignAdviserDialogOpen(true);
  };

  const handleCreateGroup = async () => {
    // Validate form
    const errors: Record<string, string> = {};
    if (!groupName.trim()) {
      errors.name = 'Group name is required';
    }
    if (!researchTopics.trim()) {
      errors.possible_topics = 'Research topics are required';
    }
    // Ensure the current user is included as the leader
    if (!currentUser || selectedMembers.length === 0 || selectedMembers[0] !== currentUser.id) {
      errors.members = 'Current user must be the group leader';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      // Prepare group data
      const groupData: any = {
        name: groupName,
        possible_topics: researchTopics,
        member_ids: selectedMembers.map(id => String(id)),
        adviser_id: preferredAdviser ? String(preferredAdviser) : null,
      };

      // Add leader ID (first member is the leader)
      if (selectedMembers.length > 0) {
        groupData.leader_id = String(selectedMembers[0]);
      }

      await createGroup(groupData);
      
      // Refresh groups
      const myGroups = await fetchCurrentUserGroups();
      const otherGroups = await fetchOtherGroups();
      setGroups({ 
        my: myGroups.map(transformGroup), 
        others: otherGroups.map(transformGroup) 
      });
      
      // Reset form and close dialog
      setGroupName('');
      setResearchTopics('');
      setSelectedMembers([]);
      setPreferredAdviser(null);
      setFormErrors({});
      setIsCreateDialogOpen(false);
      
      // Show success message
      alert('Group proposal submitted successfully! It will be reviewed by an administrator.');
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to submit group proposal. Please try again.');
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;
    
    // Validate form
    const errors: Record<string, string> = {};
    if (!groupName.trim()) {
      errors.name = 'Group name is required';
    }
    if (!researchTopics.trim()) {
      errors.possible_topics = 'Research topics are required';
    }
    // Ensure the current user is included as the leader
    if (selectedMembers.length === 0 || selectedMembers[0] !== currentUser?.id) {
      errors.members = 'Current user must be the group leader';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      // Prepare group data
      const groupData: any = {
        name: groupName,
        possible_topics: researchTopics,
        member_ids: selectedMembers.map(id => String(id)),
        adviser_id: preferredAdviser ? String(preferredAdviser) : null,
      };

      // Add leader ID (first member is the leader)
      if (selectedMembers.length > 0) {
        groupData.leader_id = String(selectedMembers[0]);
      }

      await updateGroup(editingGroup.id, groupData);
      
      // Refresh groups
      const myGroups = await fetchCurrentUserGroups();
      const otherGroups = await fetchOtherGroups();
      setGroups({ 
        my: myGroups.map(transformGroup), 
        others: otherGroups.map(transformGroup) 
      });
      
      // For admin users, also refresh all groups and pending proposals
      if (userRole === 'admin') {
        const allGroupsResponse = await fetchGroups();
        setAllGroups(allGroupsResponse.map(transformGroup));
        
        const pendingProposalsResponse = await fetchPendingProposals();
        setPendingProposals(pendingProposalsResponse.map(transformGroup));
      }
      
      // Reset form and close dialog
      setEditingGroup(null);
      setGroupName('');
      setResearchTopics('');
      setSelectedMembers([]);
      setPreferredAdviser(null);
      setFormErrors({});
      setIsEditDialogOpen(false);
      
      // Show success message
      alert('Group updated successfully!');
    } catch (error) {
      console.error('Error updating group:', error);
      alert('Failed to update group. Please try again.');
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    // Load all users when query is empty (for initial load)
    try {
      const response = await searchUsers(query || '');
      const users = response.data.results || response.data;
      
      // Filter users by role
      let students = users.filter((user: User) => user.role === 'STUDENT');
      const advisers = users.filter((user: User) => user.role === 'ADVISER');
      
      // Only filter out students who are already in groups if we have group data
      if (groups.my.length > 0 || groups.others.length > 0) {
        // Flatten all group members from both my groups and other groups
        const allGroupMembers = [
          ...groups.my.flatMap(group => group.members || []),
          ...groups.others.flatMap(group => group.members || [])
        ];
        
        // Get IDs of students who are already in groups
        const studentsInGroups = new Set(
          allGroupMembers
            .filter(member => member && member.id)
            .map(member => {
              // Handle both string and number IDs
              let idValue: number | null = null;
              if (typeof member.id === 'string') {
                const id = parseInt(member.id, 10);
                idValue = isNaN(id) ? null : id;
              } else if (typeof member.id === 'number') {
                idValue = member.id;
              }
              return idValue;
            })
            .filter((id): id is number => id !== null)
        );
        
        // Filter out students who are already in groups
        students = students.filter((student: User) => !studentsInGroups.has(student.id));
      }
      
      setAvailableUsers(students);
      setAvailableAdvisers(advisers);
    } catch (error) {
      console.error('Error searching users:', error);
      // On error, at least set empty arrays to avoid undefined issues
      setAvailableUsers([]);
      setAvailableAdvisers([]);
    }
  };
  
  const toggleMemberSelection = (userId: number) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  // Renders a set of group cards
  const renderGroups = (list: Group[], tabType: 'my' | 'others' | 'all' | 'proposals') => {
    // Check if this is a true empty state (no groups at all) vs filtered empty state (groups exist but don't match filter)
    const isFiltered = searchTerm.trim() !== '';
    const isEmptyState = !isFiltered && list.length === 0;
    
    if (!list.length) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {isEmptyState 
              ? tabType === 'my' 
                ? 'You haven\'t joined any groups yet' 
                : tabType === 'proposals'
                ? 'No pending group proposals'
                : tabType === 'all'
                ? 'No groups available'
                : 'No other groups available'
              : 'No groups found'}
          </h3>
          <p className="text-slate-500 max-w-md">
            {isEmptyState 
              ? tabType === 'my'
                ? 'Join or create a group to get started with your research collaboration.'
                : tabType === 'proposals'
                ? 'There are currently no group proposals pending approval.'
                : tabType === 'all'
                ? 'There are currently no groups in the system.'
                : 'There are currently no other groups to display.'
              : 'Try adjusting your search criteria to find what you\'re looking for.'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((group, i) => (
          <GroupCard
            key={group.id || i}
            group={group}
            onViewDetail={() => handleViewDetailInternal(group.id)}
            isGroupLeader={userRole === 'admin' || ((userRole === 'student' || userRole === 'panel') && group.leader?.id === String(currentUser?.id))}
            isGroupMember={isGroupMember(group)}
            onEdit={(userRole === 'admin' || ((userRole === 'student' || userRole === 'panel') && group.leader?.id === String(currentUser?.id))) ? handleEditGroup : undefined}
            onDelete={(userRole === 'admin' || ((userRole === 'student' || userRole === 'panel') && group.leader?.id === String(currentUser?.id))) ? handleDeleteGroup : undefined}
            onApprove={userRole === 'admin' && tabType === 'proposals' ? handleApproveGroup : undefined}
            onReject={userRole === 'admin' && tabType === 'proposals' ? handleRejectGroup : undefined}
            onResubmit={(userRole === 'student' || userRole === 'panel') && tabType === 'my' ? handleResubmitGroup : undefined}
            onLeaveGroup={userRole === 'student' && tabType === 'my' && isGroupMember(group) ? handleLeaveGroup : undefined}
            onAssignAdviser={userRole === 'admin' && group.status === 'PENDING' ? handleOpenAssignAdviserDialog : undefined}
            onAssignPanel={(userRole === 'admin' || (userRole === 'adviser' && group.status === 'APPROVED' && group.adviser?.id === String(currentUser?.id))) ? handleOpenAssignPanelDialog : undefined}
            currentUser={currentUser}
            userRole={userRole}
          />
        ))}
      </div>
    );
  };

  useEffect(() => {
    const fetchAllGroups = async () => {
      try {
        const myGroups = await fetchCurrentUserGroups();
        const otherGroups = await fetchOtherGroups();
        setGroups({ 
          my: myGroups.map(transformGroup), 
          others: otherGroups.map(transformGroup) 
        });
        
        // For admin users, also fetch all groups and pending proposals
        if (userRole === 'admin') {
          const allGroupsResponse = await fetchGroups();
          setAllGroups(allGroupsResponse.map(transformGroup));
          
          const pendingProposalsResponse = await fetchPendingProposals();
          setPendingProposals(pendingProposalsResponse.map(transformGroup));
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };

    const loadAdvisers = async () => {
      try {
        const response = await searchUsers('');
        const users = response.data.results || response.data;
        const advisers = users.filter((user: User) => user.role === 'ADVISER');
        setAvailableAdvisers(advisers);
      } catch (error) {
        console.error('Error loading advisers:', error);
      }
    };

    fetchAllGroups();
    
    // Load advisers for filtering
    if (userRole === 'admin') {
      loadAdvisers();
    }
  }, [userRole]);

  // Load all users when dialog opens
  useEffect(() => {
    if (isCreateDialogOpen || isEditDialogOpen) {
      // Ensure we have the latest groups data
      const refreshAndSearch = async () => {
        try {
          // Fetch all groups to get complete data for filtering
          const allGroupsResponse = await fetchGroups();
          const allGroups = allGroupsResponse.map(transformGroup);
          
          // Get all student IDs that are already in groups
          const studentIdsInGroups = new Set<number>();
          allGroups.forEach(group => {
            if (group.members && Array.isArray(group.members)) {
              group.members.forEach(member => {
                if (member && member.id) {
                  // Convert ID to number regardless of whether it's string or number
                  const memberId = typeof member.id === 'string' ? parseInt(member.id, 10) : member.id;
                  if (!isNaN(memberId)) {
                    studentIdsInGroups.add(memberId);
                  }
                }
              });
            }
          });
          
          console.log('Student IDs already in groups:', Array.from(studentIdsInGroups));
          
          // Now search for all users
          const response = await searchUsers('');
          const users = response.data.results || response.data;
          
          // Filter users by role
          const students = users.filter((user: User) => user.role === 'STUDENT');
          const advisers = users.filter((user: User) => user.role === 'ADVISER');
          
          // Filter out students who are already in groups
          const availableStudents = students.filter((student: User) => {
            const isAlreadyInGroup = studentIdsInGroups.has(student.id);
            console.log(`Student ${student.first_name} ${student.last_name} (ID: ${student.id}) - Already in group: ${isAlreadyInGroup}`);
            return !isAlreadyInGroup;
          });
          
          console.log('Available students after filtering:', availableStudents);
          
          setAvailableUsers(availableStudents);
          setAvailableAdvisers(advisers);
        } catch (error) {
          console.error('Error refreshing groups and searching users:', error);
          // Still try to search users even if groups refresh fails
          handleSearchUsers('');
        }
      };
      
      refreshAndSearch();
      
      // Automatically add the current user as the first member (leader) for create dialog only
      if (isCreateDialogOpen && currentUser && !selectedMembers.includes(currentUser.id)) {
        setSelectedMembers([currentUser.id]);
      }
      
      // Reset form when create dialog opens (but keep current user as leader)
      if (isCreateDialogOpen) {
        setGroupName('');
        setResearchTopics('');
        setPreferredAdviser(null);
        setFormErrors({});
        setIsMemberSelectionOpen(false);
        setIsAdviserSelectionOpen(false);
      }
    }
  }, [isCreateDialogOpen, isEditDialogOpen, currentUser]);

  // Check if current user is already in a group
  const isUserInGroup = useMemo(() => {
    if (!currentUser) return false;
    
    // Check if user is in any of their groups
    return groups.my.some(group => 
      group.members?.some(member => String(member.id) === String(currentUser.id))
    );
  }, [groups.my, currentUser]);

  // Check if current user is a member of a group (but not the leader)
  const isGroupMember = (group: Group) => {
    if (!currentUser) return false;
    
    // Check if user is in the group
    const isMember = group.members?.some(member => String(member.id) === String(currentUser.id));
    
    // Check if user is the leader
    const isLeader = group.leader?.id === String(currentUser.id);
    
    // Return true if user is a member but not the leader
    return isMember && !isLeader;
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-slate-900 mb-2">Group Management</h1>
          <p className="text-slate-600">Manage your research groups and collaborations</p>
        </div>
        <div className="flex flex-col items-end">
          {isUserInGroup && (
            <p className="text-yellow-600 text-sm mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              You are already in a group. Students can only be in one group.
            </p>
          )}
          {userRole === 'student' && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2 rounded-md px-4 py-2 disabled:opacity-50"
                  disabled={isUserInGroup}
                >
                  <Plus className="w-4 h-4" />
                  Propose Group
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Propose New Group</DialogTitle>
                  <DialogDescription>
                    Create a new research group proposal. This proposal will need to be approved by an administrator. Fill in the details below.
                  </DialogDescription>
                </DialogHeader>
                {/* Scrollable form container - scrollbar always visible */}
                <div style={{ 
                  maxHeight: '60vh', 
                  overflowY: 'scroll',
                  paddingRight: '0.5rem'
                }}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="group-name" className="text-right">
                        Group Name *
                      </Label>
                      <div className="col-span-3">
                        <Input
                          id="group-name"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          className={formErrors.name ? 'border-red-500' : ''}
                        />
                        {formErrors.name && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="research-topics" className="text-right pt-2">
                        Research Topics *
                      </Label>
                      <div className="col-span-3">
                        <Textarea
                          id="research-topics"
                          value={researchTopics}
                          onChange={(e) => setResearchTopics(e.target.value)}
                          placeholder="Enter possible research topics, one per line"
                          className={`min-h-[120px] ${formErrors.possible_topics ? 'border-red-500' : ''}`}
                        />
                        {formErrors.possible_topics && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.possible_topics}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2">
                        Members *
                      </Label>
                      <div className="col-span-3">
                        <div className="space-y-2">
                          {/* Collapsible header for member selection */}
                          <div 
                            className="flex items-center justify-between p-3 border rounded-md cursor-pointer bg-slate-50 hover:bg-slate-100"
                            onClick={() => setIsMemberSelectionOpen(!isMemberSelectionOpen)}
                          >
                            <div className="flex items-center gap-2">
                              {isMemberSelectionOpen ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                              <span>
                                Add Additional Members ({selectedMembers.length > 0 ? selectedMembers.length - 1 : 0} selected)
                                <span className="text-xs text-slate-500 ml-2">
                                  (You are automatically the leader)
                                </span>
                              </span>
                            </div>
                            {selectedMembers.length > 1 && (
                              <button
                                type="button"
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Only clear additional members, keep the leader (first member)
                                  setSelectedMembers(selectedMembers.length > 0 ? [selectedMembers[0]] : []);
                                }}
                              >
                                Clear Additional
                              </button>
                            )}
                          </div>
                          
                          {/* Collapsible member selection content */}
                          {isMemberSelectionOpen && (
                            <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                              {availableUsers
                                .filter(user => !selectedMembers.includes(user.id)) // Hide already selected members
                                .map((user) => (
                                  <div 
                                    key={user.id} 
                                    className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded"
                                  >
                                    <input
                                      type="checkbox"
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedMembers([...selectedMembers, user.id]);
                                        }
                                      }}
                                      className="cursor-pointer"
                                    />
                                    <div>
                                      <div className="font-medium">{user.first_name} {user.last_name}</div>
                                      <div className="text-sm text-slate-500">{user.email}</div>
                                    </div>
                                  </div>
                                ))}
                              {availableUsers.filter(user => !selectedMembers.includes(user.id)).length === 0 && (
                                <div className="p-2 text-slate-500">No additional users available</div>
                              )}
                            </div>
                          )}
                          
                          {/* Always visible selected members display */}
                          {selectedMembers.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm text-slate-600 mb-1">Group members:</p>
                              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1">
                                {selectedMembers.map((id, index) => {
                                  const user = [...availableUsers, ...availableAdvisers].find(u => u.id === id);
                                  return user ? (
                                    <span 
                                      key={id} 
                                      className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0 ${
                                        index === 0 
                                          ? 'bg-green-700 text-white' 
                                          : 'bg-green-100 text-green-800'
                                      }`}
                                    >
                                      {user.first_name} {user.last_name}
                                      {index === 0 && (
                                        <span className="text-xs font-bold">(Leader)</span>
                                      )}
                                      {index > 0 && (
                                        <button 
                                          type="button" 
                                          onClick={() => setSelectedMembers(selectedMembers.filter(memberId => memberId !== id))}
                                          className="text-green-800 hover:text-green-900"
                                        >
                                          ×
                                        </button>
                                      )}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                          {formErrors.members && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.members}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2">
                        Preferred Adviser
                      </Label>
                      <div className="col-span-3">
                        <div className="space-y-2">
                          {/* Collapsible header for adviser selection */}
                          <div 
                            className="flex items-center justify-between p-3 border rounded-md cursor-pointer bg-slate-50 hover:bg-slate-100"
                            onClick={() => setIsAdviserSelectionOpen(!isAdviserSelectionOpen)}
                          >
                            <div className="flex items-center gap-2">
                              {isAdviserSelectionOpen ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                              <span>Select Preferred Adviser</span>
                            </div>
                            {preferredAdviser && (
                              <button
                                type="button"
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreferredAdviser(null);
                                }}
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          
                          {/* Collapsible adviser selection content */}
                          {isAdviserSelectionOpen && (
                            <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                              {availableAdvisers
                                .map((adviser) => (
                                  <div 
                                    key={adviser.id} 
                                    className={`flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer ${
                                      preferredAdviser === adviser.id ? 'bg-blue-50 border border-blue-200' : ''
                                    }`}
                                    onClick={() => setPreferredAdviser(adviser.id === preferredAdviser ? null : adviser.id)}
                                  >
                                    <input
                                      type="radio"
                                      checked={preferredAdviser === adviser.id}
                                      onChange={() => {}}
                                      className="cursor-pointer"
                                    />
                                    <div>
                                      <div className="font-medium">{adviser.first_name} {adviser.last_name}</div>
                                      <div className="text-sm text-slate-500">{adviser.email}</div>
                                    </div>
                                  </div>
                                ))}
                              {availableAdvisers.length === 0 && (
                                <div className="p-2 text-slate-500">No advisers available</div>
                              )}
                            </div>
                          )}
                          
                          {/* Always visible selected adviser display */}
                          {preferredAdviser && (
                            <div className="mt-2">
                              <p className="text-sm text-slate-600 mb-1">Selected adviser:</p>
                              <div className="max-h-12 overflow-y-auto p-1">
                                <div className="flex items-center gap-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full w-fit">
                                  {(() => {
                                    const adviser = availableAdvisers.find(a => a.id === preferredAdviser);
                                    return adviser ? `${adviser.first_name} ${adviser.last_name}` : 'Unknown';
                                  })()}
                                  <button 
                                    type="button" 
                                    onClick={() => setPreferredAdviser(null)}
                                    className="text-blue-800 hover:text-blue-900"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          <p className="text-sm text-slate-500 mt-1">
                            Optional: Select a preferred adviser for your group proposal
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* End scrollable form container */}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGroup}>Submit Proposal</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {/* Edit Group Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              // Reset form when dialog closes
              setEditingGroup(null);
              setGroupName('');
              setResearchTopics('');
              setSelectedMembers([]);
              setPreferredAdviser(null);
              setFormErrors({});
            }
          }}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Edit Group</DialogTitle>
                <DialogDescription>
                  Update your research group details. Fill in the details below.
                </DialogDescription>
              </DialogHeader>
              {/* Scrollable form container - scrollbar always visible */}
              <div style={{ 
                maxHeight: '60vh', 
                overflowY: 'scroll',
                paddingRight: '0.5rem'
              }}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-group-name" className="text-right">
                      Group Name *
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="edit-group-name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className={formErrors.name ? 'border-red-500' : ''}
                      />
                      {formErrors.name && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="edit-research-topics" className="text-right pt-2">
                      Research Topics *
                    </Label>
                    <div className="col-span-3">
                      <Textarea
                        id="edit-research-topics"
                        value={researchTopics}
                        onChange={(e) => setResearchTopics(e.target.value)}
                        placeholder="Enter possible research topics, one per line"
                        className={`min-h-[120px] ${formErrors.possible_topics ? 'border-red-500' : ''}`}
                      />
                      {formErrors.possible_topics && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.possible_topics}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">
                      Members *
                    </Label>
                    <div className="col-span-3">
                      <div className="space-y-2">
                        {/* Collapsible header for member selection */}
                        <div 
                          className="flex items-center justify-between p-3 border rounded-md cursor-pointer bg-slate-50 hover:bg-slate-100"
                          onClick={() => setIsMemberSelectionOpen(!isMemberSelectionOpen)}
                        >
                          <div className="flex items-center gap-2">
                            {isMemberSelectionOpen ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <span>
                              Add Additional Members ({selectedMembers.length > 0 ? selectedMembers.length - 1 : 0} selected)
                              <span className="text-xs text-slate-500 ml-2">
                                (You are automatically the leader)
                              </span>
                            </span>
                          </div>
                          {selectedMembers.length > 1 && (
                            <button
                              type="button"
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Only clear additional members, keep the leader (first member)
                                setSelectedMembers(selectedMembers.length > 0 ? [selectedMembers[0]] : []);
                              }}
                            >
                              Clear Additional
                            </button>
                          )}
                        </div>
                        
                        {/* Collapsible member selection content */}
                        {isMemberSelectionOpen && (
                          <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                            {availableUsers
                              .filter(user => !selectedMembers.includes(user.id)) // Hide already selected members
                              .map((user) => (
                                <div 
                                  key={user.id} 
                                  className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedMembers([...selectedMembers, user.id]);
                                      }
                                    }}
                                    className="cursor-pointer"
                                  />
                                  <div>
                                    <div className="font-medium">{user.first_name} {user.last_name}</div>
                                    <div className="text-sm text-slate-500">{user.email}</div>
                                  </div>
                                </div>
                              ))}
                            {availableUsers.filter(user => !selectedMembers.includes(user.id)).length === 0 && (
                              <div className="p-2 text-slate-500">No additional users available</div>
                            )}
                          </div>
                        )}
                        
                        {/* Always visible selected members display */}
                        {selectedMembers.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-slate-600 mb-1">Group members:</p>
                            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1">
                              {selectedMembers.map((id, index) => {
                                const user = [...availableUsers, ...availableAdvisers].find(u => u.id === id);
                                return user ? (
                                  <span 
                                    key={id} 
                                    className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0 ${
                                      index === 0 
                                        ? 'bg-green-700 text-white' 
                                        : 'bg-green-100 text-green-800'
                                    }`}
                                  >
                                    {user.first_name} {user.last_name}
                                    {index === 0 && (
                                      <span className="text-xs font-bold">(Leader)</span>
                                    )}
                                    {index > 0 && (
                                      <button 
                                        type="button" 
                                        onClick={() => setSelectedMembers(selectedMembers.filter(memberId => memberId !== id))}
                                        className="text-green-800 hover:text-green-900"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                        {formErrors.members && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.members}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">
                      Preferred Adviser
                    </Label>
                    <div className="col-span-3">
                      <div className="space-y-2">
                        {/* Collapsible header for adviser selection */}
                        <div 
                          className="flex items-center justify-between p-3 border rounded-md cursor-pointer bg-slate-50 hover:bg-slate-100"
                          onClick={() => setIsAdviserSelectionOpen(!isAdviserSelectionOpen)}
                        >
                          <div className="flex items-center gap-2">
                            {isAdviserSelectionOpen ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <span>Select Preferred Adviser</span>
                          </div>
                          {preferredAdviser && (
                            <button
                              type="button"
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreferredAdviser(null);
                              }}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        
                        {/* Collapsible adviser selection content */}
                        {isAdviserSelectionOpen && (
                          <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                            {availableAdvisers
                              .map((adviser) => (
                                <div 
                                  key={adviser.id} 
                                  className={`flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer ${
                                    preferredAdviser === adviser.id ? 'bg-blue-50 border border-blue-200' : ''
                                  }`}
                                  onClick={() => setPreferredAdviser(adviser.id === preferredAdviser ? null : adviser.id)}
                                >
                                  <input
                                    type="radio"
                                    checked={preferredAdviser === adviser.id}
                                    onChange={() => {}}
                                    className="cursor-pointer"
                                  />
                                  <div>
                                    <div className="font-medium">{adviser.first_name} {adviser.last_name}</div>
                                    <div className="text-sm text-slate-500">{adviser.email}</div>
                                  </div>
                                </div>
                              ))}
                            {availableAdvisers.length === 0 && (
                              <div className="p-2 text-slate-500">No advisers available</div>
                            )}
                          </div>
                        )}
                        
                        {/* Always visible selected adviser display */}
                        {preferredAdviser && (
                          <div className="mt-2">
                            <p className="text-sm text-slate-600 mb-1">Selected adviser:</p>
                            <div className="max-h-12 overflow-y-auto p-1">
                              <div className="flex items-center gap-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full w-fit">
                                {(() => {
                                  const adviser = availableAdvisers.find(a => a.id === preferredAdviser);
                                  return adviser ? `${adviser.first_name} ${adviser.last_name}` : 'Unknown';
                                })()}
                                <button 
                                  type="button" 
                                  onClick={() => setPreferredAdviser(null)}
                                  className="text-blue-800 hover:text-blue-900"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        <p className="text-sm text-slate-500 mt-1">
                          Optional: Select a preferred adviser for your group proposal
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* End scrollable form container */}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateGroup}>Update Group</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Assign Adviser Dialog */}
      <Dialog open={isAssignAdviserDialogOpen} onOpenChange={(open) => {
        setIsAssignAdviserDialogOpen(open);
        if (!open) {
          setSelectedAdviser(null);
          setEditingGroup(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Assign Adviser to Group</DialogTitle>
            <DialogDescription>
              Select an adviser to assign to this group. This is required before the group can be approved.
            </DialogDescription>
          </DialogHeader>
          {/* Scrollable form container - scrollbar always visible */}
          <div style={{ 
            maxHeight: '60vh', 
            overflowY: 'scroll',
            paddingRight: '0.5rem'
          }}>
            <div className="grid gap-4 py-4">
              {editingGroup && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Group</Label>
                  <div className="col-span-3">
                    <div className="font-medium">{editingGroup.name}</div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  Select Adviser *
                </Label>
                <div className="col-span-3">
                  <div className="space-y-2">
                    {/* Collapsible header for adviser selection */}
                    <div 
                      className="flex items-center justify-between p-3 border rounded-md cursor-pointer bg-slate-50 hover:bg-slate-100"
                      onClick={() => setIsAdviserSelectionOpen(!isAdviserSelectionOpen)}
                    >
                      <div className="flex items-center gap-2">
                        {isAdviserSelectionOpen ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <span>Select Adviser</span>
                      </div>
                      {selectedAdviser && (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAdviser(null);
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    
                    {/* Collapsible adviser selection content */}
                    {isAdviserSelectionOpen && (
                      <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                        {availableAdvisers
                          .map((adviser) => (
                            <div 
                              key={adviser.id} 
                              className={`flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer ${
                                selectedAdviser === adviser.id ? 'bg-blue-50 border border-blue-200' : ''
                              }`}
                              onClick={() => setSelectedAdviser(adviser.id === selectedAdviser ? null : adviser.id)}
                            >
                              <input
                                type="radio"
                                checked={selectedAdviser === adviser.id}
                                onChange={() => {}}
                                className="cursor-pointer"
                              />
                              <div>
                                <div className="font-medium">{adviser.first_name} {adviser.last_name}</div>
                                <div className="text-sm text-slate-500">{adviser.email}</div>
                              </div>
                            </div>
                          ))}
                        {availableAdvisers.length === 0 && (
                          <div className="p-2 text-slate-500">No advisers available</div>
                        )}
                      </div>
                    )}

                    {/* Always visible selected adviser display */}
                    {selectedAdviser && (
                      <div className="mt-2">
                        <p className="text-sm text-slate-600 mb-1">Selected adviser:</p>
                        <div className="max-h-12 overflow-y-auto p-1">
                          <div className="flex items-center gap-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full w-fit">
                            {(() => {
                              const adviser = availableAdvisers.find(a => a.id === selectedAdviser);
                              return adviser ? `${adviser.first_name} ${adviser.last_name}` : 'Unknown';
                            })()}
                            <button 
                              type="button" 
                              onClick={() => setSelectedAdviser(null)}
                              className="text-blue-800 hover:text-blue-900"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* End scrollable form container */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignAdviserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => editingGroup && handleAssignAdviser(editingGroup)}>Assign Adviser</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Panel Dialog */}
      <AssignPanelDialog
        open={isAssignPanelDialogOpen}
        onOpenChange={setIsAssignPanelDialogOpen}
        group={editingGroup}
        onAssignPanel={handleAssignPanel}
      />

      <Card className="p-6 border-0 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Search Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="keywords">Keywords</SelectItem>
                <SelectItem value="topics">Topics</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
            {userRole === 'admin' && (
              <Select value={adviserFilter} onValueChange={setAdviserFilter}>
                <SelectTrigger className="w-[180px]">
                  <User className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Adviser" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Advisers</SelectItem>
                  {availableAdvisers.map((adviser) => (
                    <SelectItem key={adviser.id} value={String(adviser.id)}>
                      {adviser.first_name} {adviser.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSearchType('general');
                if (userRole === 'admin') {
                  setAdviserFilter('all');
                }
              }}
              className="flex items-center gap-2"
            >
              <span>Reset</span>
            </Button>
          </div>
        </div>
      </Card>

      <Tabs defaultValue={(userRole === 'admin') ? "all" : "my"}>
        {(userRole === 'admin') ? (
          <>
            <TabsList>
              <TabsTrigger value="all">Groups</TabsTrigger>
              <TabsTrigger value="proposals">Group Proposals</TabsTrigger>
            </TabsList>
            <TabsContent value="all">{renderGroups(filteredGroups.all, 'all')}</TabsContent>
            <TabsContent value="proposals">{renderGroups(filteredGroups.proposals, 'proposals')}</TabsContent>
          </>
        ) : (
          <>
            <TabsList>
              <TabsTrigger value="my">{userRole === 'adviser' || userRole === 'panel' ? 'My Groups' : 'My Group'}</TabsTrigger>
              <TabsTrigger value="others">Other Groups</TabsTrigger>
            </TabsList>
            <TabsContent value="my">{renderGroups(filteredGroups.my, 'my')}</TabsContent>
            <TabsContent value="others">{renderGroups(filteredGroups.others, 'others')}</TabsContent>
          </>
        )}
      </Tabs>
    </div>

  );
};

export default GroupManagementPage;