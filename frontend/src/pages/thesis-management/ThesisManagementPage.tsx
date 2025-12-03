import { useEffect, useState, useMemo } from 'react';
import { Search, Filter, Plus, Eye, Edit, Trash2, AlertCircle, Check, X, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAuth } from '../../hooks/useAuth';
import { fetchTheses, fetchCurrentUserTheses, fetchOtherTheses, createThesis, updateThesis, deleteThesis, adviserReview } from '../../api/thesisService';
import { fetchCurrentUserGroups } from '../../api/groupService';
import { accountLinkingService } from '../../services/accountLinkingService';
import { Thesis, Group } from '../../types';

interface ThesisManagementProps {
  userRole: 'student' | 'adviser' | 'panel' | 'admin' | string;
  onViewDetail: (thesisId: string) => void;
}

export function ThesisManagement({ userRole, onViewDetail }: ThesisManagementProps) {
  const { user: currentUser } = useAuth();
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [adviserFilter, setAdviserFilter] = useState('all');
  const [hasApprovedGroup, setHasApprovedGroup] = useState(false);
  const [approvedGroupId, setApprovedGroupId] = useState<string | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [keywords, setKeywords] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [otherTheses, setOtherTheses] = useState<Thesis[]>([]);
  
  // Adviser approval/rejection state
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedThesis, setSelectedThesis] = useState<Thesis | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGoogleConnectDialog, setShowGoogleConnectDialog] = useState(false);
  const [isCheckingGoogle, setIsCheckingGoogle] = useState(false);
  
  // Debug log
  console.log('ThesisManagement component mounted with:', { userRole, currentUser: currentUser?.id, currentUserRole: currentUser?.role });
  
  // Additional debug logs
  console.log('User role check:', { 
    userRole, 
    isPanel: userRole?.toLowerCase() === 'panel',
    isAdviser: userRole?.toLowerCase() === 'adviser'
  });
  
  // Check if user role is correctly set
  if (currentUser) {
    console.log('Current user role from context:', currentUser.role);
    console.log('User role comparison:', {
      contextRole: currentUser.role,
      contextRoleLower: currentUser.role?.toLowerCase(),
      passedRole: userRole,
      rolesMatch: currentUser.role?.toLowerCase() === userRole
    });
  }

  useEffect(() => {
    const loadTheses = async () => {
      try {
        setLoading(true);
        let fetchedTheses: Thesis[] = [];
        let fetchedOtherTheses: Thesis[] = [];
        
        // For advisers and panels, fetch both their assigned theses and other theses
        if (userRole?.toLowerCase() === 'adviser' || userRole?.toLowerCase() === 'panel') {
          console.log('Fetching theses for adviser/panel user');
          const [currentUserTheses, otherTheses] = await Promise.all([
            fetchCurrentUserTheses(),
            fetchOtherTheses()
          ]);
          console.log('Fetched current user theses:', currentUserTheses);
          console.log('Fetched other theses:', otherTheses);
          fetchedTheses = currentUserTheses;
          fetchedOtherTheses = otherTheses;
        } else if (userRole?.toLowerCase() === 'student') {
          // For students, fetch all theses and categorize them properly
          console.log('Fetching theses for student user');
          fetchedTheses = await fetchTheses();
          console.log('Fetched all theses for student:', fetchedTheses);
        } else {
          // For admins, fetch all theses
          console.log('Fetching theses for admin user');
          fetchedTheses = await fetchTheses();
          console.log('Fetched theses:', fetchedTheses);
        }
        
        setTheses(fetchedTheses);
        setOtherTheses(fetchedOtherTheses);
        setError(null);
      } catch (err) {
        console.error('Error fetching theses:', err);
        setError('Failed to load theses');
      } finally {
        setLoading(false);
      }
    };

    const loadUserGroups = async () => {
      if (userRole?.toLowerCase() === 'student') {
        try {
          setGroupsLoading(true);
          const userGroups = await fetchCurrentUserGroups();
          const approvedGroup = userGroups.find(group => group.status === 'APPROVED');
          if (approvedGroup) {
            setHasApprovedGroup(true);
            setApprovedGroupId(approvedGroup.id);
          } else {
            setHasApprovedGroup(false);
            setApprovedGroupId(null);
          }
        } catch (err) {
          console.error('Error fetching user groups:', err);
        } finally {
          setGroupsLoading(false);
        }
      } else {
        setGroupsLoading(false);
      }
    };

    loadTheses();
    loadUserGroups();
  }, [userRole]);

  // Group theses by user role for tab organization
  const groupedTheses = useMemo(() => {
    const groups: Record<string, Thesis[]> = {
      all: [],
      my: [],
      others: []
    };

    theses.forEach(thesis => {
      groups.all.push(thesis);
      
      // For students, categorize by access rights
      if (userRole?.toLowerCase() === 'student') {
        // Check if user has access to view this thesis (same logic as canViewThesis)
        let hasAccess = false;
        
        // Check if user is the proposer of the thesis
        const isProposer = thesis.proposer && (
          (typeof thesis.proposer === 'object' && String(thesis.proposer.id) === String(currentUser?.id)) ||
          (typeof thesis.proposer === 'number' && thesis.proposer === currentUser?.id) ||
          (typeof thesis.proposer === 'string' && thesis.proposer === currentUser?.id)
        );
        
        // Check if the group is a Group object
        if (typeof thesis.group === 'object' && thesis.group !== null) {
          // Check if user is a member or leader of the group
          let isMemberOrLeader = false;
          if ('members' in thesis.group && Array.isArray(thesis.group.members)) {
            isMemberOrLeader = thesis.group.members.some(member => 
              member && typeof member === 'object' && 'id' in member && String(member.id) === String(currentUser?.id)
            );
          }
          
          // Check if user is the leader of the group
          if (!isMemberOrLeader && 'leader' in thesis.group && thesis.group.leader) {
            isMemberOrLeader = String(thesis.group.leader.id) === String(currentUser?.id);
          }
          
          // Check if user is the adviser of the group
          let isAdviser = false;
          if ('adviser' in thesis.group && thesis.group.adviser) {
            isAdviser = String(thesis.group.adviser.id) === String(currentUser?.id);
          }
          
          // Check if user is a panel member of the group
          let isPanel = false;
          if ('panels' in thesis.group && Array.isArray(thesis.group.panels)) {
            isPanel = thesis.group.panels.some(panel => {
              return panel && typeof panel === 'object' && 'id' in panel && String(panel.id) === String(currentUser?.id);
            });
          }
          
          // User has access if they are proposer, member/leader, adviser, or panel member
          hasAccess = isProposer || isMemberOrLeader || isAdviser || isPanel;
        } else {
          // If we can't determine group access, only allow proposer access
          hasAccess = isProposer;
        }
        
        if (hasAccess) {
          groups.my.push(thesis);
        } else {
          groups.others.push(thesis);
        }
      } 
      // For advisers and panels, all fetched theses are their assigned theses
      else if (userRole?.toLowerCase() === 'adviser' || userRole?.toLowerCase() === 'panel') {
        groups.my.push(thesis);
      }
      // For admins, show all theses in "my" tab for now
      else {
        groups.my.push(thesis);
      }
    });

    // For advisers and panels, use the separately fetched other theses
    if (userRole?.toLowerCase() === 'adviser' || userRole?.toLowerCase() === 'panel') {
      groups.others = otherTheses;
    }

    return groups;
  }, [theses, otherTheses, userRole, currentUser]);

  // Filter theses based on search and filters
  const getFilteredTheses = (thesisList: Thesis[]) => {
    return thesisList.filter((thesis) => {
      const matchesSearch = searchQuery === '' || 
                           thesis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (thesis.group && typeof thesis.group !== 'string' && thesis.group.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || thesis.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  // Get filtered theses for current view
  const filteredTheses = getFilteredTheses(theses);

  // Render thesis table for a specific group
  const renderThesisTable = (thesisList: Thesis[], tabType: string) => {
    const filteredList = getFilteredTheses(thesisList);
    
    console.log('Rendering thesis table with user role:', userRole, 'tab:', tabType, 'theses count:', filteredList.length);
    
    return (
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                  Thesis Title
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                  Group
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                  Last Updated
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredList.map((thesis) => (
                <tr key={thesis.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-900 max-w-md">{thesis.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {thesis.group ? (typeof thesis.group === 'string' ? thesis.group : thesis.group.name) : 'No Group'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`border ${getStatusColor(thesis.status)}`}>
                      {thesis.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {new Date(thesis.updated_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const canView = canViewThesis(thesis);
                        console.log('Render view button check:', { thesisId: thesis.id, canView });
                        return canView && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => onViewDetail(thesis.id)}
                                className="text-green-700 hover:text-green-800 hover:bg-green-50 p-2"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Details</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })()}
                      {(userRole?.toLowerCase() === 'student' || userRole?.toLowerCase() === 'admin') && isThesisOwner(thesis) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditThesis(thesis)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Thesis</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {(userRole?.toLowerCase() === 'admin' || (userRole?.toLowerCase() === 'student' && isThesisOwner(thesis))) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteThesis(thesis.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete Thesis</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {userRole?.toLowerCase() === 'adviser' && isAdviserForThesis(thesis) && thesis.status === 'TOPIC_SUBMITTED' && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleApproveClick(thesis)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Approve Topic</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRejectClick(thesis)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Reject Topic</p>
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredList.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-500">No theses found matching your criteria</p>
          </div>
        )}
      </Card>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TOPIC_APPROVED':
      case 'CONCEPT_APPROVED':
      case 'PROPOSAL_APPROVED':
      case 'FINAL_APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'TOPIC_SUBMITTED':
      case 'CONCEPT_SUBMITTED':
      case 'PROPOSAL_SUBMITTED':
      case 'FINAL_SUBMITTED':
      case 'CONCEPT_SCHEDULED':
      case 'PROPOSAL_SCHEDULED':
      case 'FINAL_SCHEDULED':
      case 'CONCEPT_DEFENDED':
      case 'PROPOSAL_DEFENDED':
      case 'FINAL_DEFENDED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESEARCH_IN_PROGRESS':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DRAFT':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'TOPIC_REJECTED':
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'REVISIONS_REQUIRED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const checkGoogleConnection = async () => {
    try {
      setIsCheckingGoogle(true);
      const isConnected = await accountLinkingService.isGoogleConnected();
      console.log('Google connection status:', isConnected);
      return isConnected;
    } catch (error) {
      console.error('Error checking Google connection:', error);
      return false;
    } finally {
      setIsCheckingGoogle(false);
    }
  };

  const handleCreateThesis = async () => {
    // Validate form
    const errors: Record<string, string> = {};
    if (!title.trim()) {
      errors.title = 'Title is required';
    }
    if (!abstract.trim()) {
      errors.abstract = 'Abstract is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Check Google connection before proceeding
    const isGoogleConnected = await checkGoogleConnection();
    if (!isGoogleConnected) {
      setShowGoogleConnectDialog(true);
      return;
    }

    // Check if we have an approved group
    if (!approvedGroupId) {
      alert('You must have an approved group to create a thesis proposal.');
      return;
    }

    try {
      // Create thesis data with group ID
      const thesisData = {
        title,
        abstract,
        keywords,
        group_id: approvedGroupId
      };
      
      await createThesis(thesisData);
      
      // Refresh theses based on user role
      let fetchedTheses: Thesis[] = [];
      let fetchedOtherTheses: Thesis[] = [];
      if (userRole === 'adviser' || userRole === 'panel') {
        const [currentUserTheses, otherTheses] = await Promise.all([
          fetchCurrentUserTheses(),
          fetchOtherTheses()
        ]);
        fetchedTheses = currentUserTheses;
        fetchedOtherTheses = otherTheses;
      } else {
        fetchedTheses = await fetchTheses();
      }
      setTheses(fetchedTheses);
      setOtherTheses(fetchedOtherTheses);
      
      // Reset form and close dialog
      setTitle('');
      setAbstract('');
      setKeywords('');
      setFormErrors({});
      setIsCreateDialogOpen(false);
      
      // Show success message
      alert('Thesis proposal created successfully!');
    } catch (error) {
      console.error('Error creating thesis:', error);
      alert('Failed to create thesis proposal. Please try again.');
    }
  };

  const handleDeleteThesis = async (thesisId: string) => {
    if (window.confirm('Are you sure you want to delete this thesis? This action cannot be undone.')) {
      try {
        await deleteThesis(thesisId);
        // Refresh theses based on user role
        let fetchedTheses: Thesis[] = [];
        let fetchedOtherTheses: Thesis[] = [];
        if (userRole === 'adviser' || userRole === 'panel') {
          const [currentUserTheses, otherTheses] = await Promise.all([
            fetchCurrentUserTheses(),
            fetchOtherTheses()
          ]);
          fetchedTheses = currentUserTheses;
          fetchedOtherTheses = otherTheses;
        } else {
          fetchedTheses = await fetchTheses();
        }
        setTheses(fetchedTheses);
        setOtherTheses(fetchedOtherTheses);
        alert('Thesis deleted successfully!');
      } catch (error) {
        console.error('Error deleting thesis:', error);
        alert('Failed to delete thesis. Please try again.');
      }
    }
  };

  // Function to check if current user is the adviser for a thesis
  const isAdviserForThesis = (thesis: Thesis): boolean => {
    // First check if current user is an adviser and we have a user
    if (userRole?.toLowerCase() !== 'adviser' || !currentUser) return false;
    
    console.log('Checking if user is adviser for thesis:', {
      thesisId: thesis.id,
      userRole,
      currentUserId: currentUser?.id,
      thesisGroup: thesis.group,
      groupType: typeof thesis.group
    });
    
    // Check if the group is a Group object and has an adviser
    if (typeof thesis.group === 'object' && thesis.group !== null && 'adviser' in thesis.group) {
      // The adviser object might be nested within the group object
      const adviser = thesis.group.adviser;
      if (adviser && typeof adviser === 'object' && 'id' in adviser) {
        const result = adviser.id === currentUser.id;
        console.log('Adviser check result:', result);
        return result;
      }
    }
    
    console.log('Group is not a valid object or has no adviser');
    return false;
  };

  // Function to check if current user has access to view a thesis
  const canViewThesis = (thesis: Thesis): boolean => {
    // Admins always have access to all theses
    if (userRole?.toLowerCase() === 'admin') return true;
    
    // If we don't have a current user, deny access
    if (!currentUser) return false;
    
    console.log('canViewThesis check:', { 
      userRole, 
      currentUser: currentUser.id, 
      thesisId: thesis.id, 
      thesisGroup: thesis.group 
    });
    
    // Check if user is the proposer of the thesis
    const isProposer = thesis.proposer && (
      (typeof thesis.proposer === 'object' && String(thesis.proposer.id) === String(currentUser.id)) ||
      (typeof thesis.proposer === 'number' && thesis.proposer === currentUser.id) ||
      (typeof thesis.proposer === 'string' && thesis.proposer === currentUser.id)
    );
    
    // Check if the group is a Group object
    if (typeof thesis.group === 'object' && thesis.group !== null) {
      console.log('Checking group access for thesis:', thesis.id);
      
      // Check if user is a member or leader of the group
      let isMemberOrLeader = false;
      if ('members' in thesis.group && Array.isArray(thesis.group.members)) {
        isMemberOrLeader = thesis.group.members.some(member => 
          member && typeof member === 'object' && 'id' in member && String(member.id) === String(currentUser.id)
        );
      }
      
      // Check if user is the leader of the group
      if (!isMemberOrLeader && 'leader' in thesis.group && thesis.group.leader) {
        isMemberOrLeader = String(thesis.group.leader.id) === String(currentUser.id);
      }
      
      // Check if user is the adviser of the group
      let isAdviser = false;
      if ('adviser' in thesis.group && thesis.group.adviser) {
        isAdviser = String(thesis.group.adviser.id) === String(currentUser.id);
      }
      
      // Check if user is a panel member of the group
      let isPanel = false;
      if ('panels' in thesis.group && Array.isArray(thesis.group.panels)) {
        console.log('Checking panels:', thesis.group.panels);
        console.log('Current user ID:', currentUser.id);
        isPanel = thesis.group.panels.some(panel => {
          const result = panel && typeof panel === 'object' && 'id' in panel && String(panel.id) === String(currentUser.id);
          console.log('Panel check result:', { panel, userId: currentUser.id, result });
          return result;
        });
      }
      
      console.log('Access check results:', { isProposer, isMemberOrLeader, isAdviser, isPanel });
      
      // Return true if user is proposer, member/leader, adviser, or panel member
      return isProposer || isMemberOrLeader || isAdviser || isPanel;
    }
    
    // If we can't determine group access, only allow proposer access
    return isProposer;
  };

  // Function to handle approve action
  const handleApproveClick = (thesis: Thesis) => {
    setSelectedThesis(thesis);
    setIsApproveDialogOpen(true);
  };

  // Function to handle reject action
  const handleRejectClick = (thesis: Thesis) => {
    setSelectedThesis(thesis);
    setIsRejectDialogOpen(true);
  };

  // Function to submit approval
  const handleApproveSubmit = async () => {
    if (!selectedThesis) return;
    
    try {
      setIsSubmitting(true);
      let action: 'approve_topic' | 'approve_thesis' | 'approve_proposal' | 'approve_final' = 'approve_topic';
      
      // Determine the appropriate action based on current status
      if (selectedThesis.status === 'TOPIC_SUBMITTED') {
        action = 'approve_topic';
      } else if (selectedThesis.status === 'TOPIC_APPROVED') {
        action = 'approve_thesis'; // Move to proposal phase
      } else if (selectedThesis.status === 'PROPOSAL_DEFENDED') {
        action = 'approve_proposal'; // Move to research phase
      } else if (selectedThesis.status === 'FINAL_DEFENDED') {
        action = 'approve_final'; // Final approval
      }
      
      const updatedThesis = await adviserReview(selectedThesis.id, action as any, feedback);
      
      // Update the thesis in state
      const updateThesisInState = (thesisList: Thesis[]) => {
        return thesisList.map(thesis => 
          thesis.id === updatedThesis.id ? updatedThesis : thesis
        );
      };
      
      setTheses(prev => updateThesisInState(prev));
      setOtherTheses(prev => updateThesisInState(prev));
      
      setIsApproveDialogOpen(false);
      setFeedback('');
      setSelectedThesis(null);
      alert('Thesis approved successfully!');
    } catch (error) {
      console.error('Error approving thesis:', error);
      alert('Failed to approve thesis. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to submit rejection
  const handleRejectSubmit = async () => {
    if (!selectedThesis) return;
    
    try {
      setIsSubmitting(true);
      const updatedThesis = await adviserReview(selectedThesis.id, 'reject', feedback);
      
      // Update the thesis in state
      const updateThesisInState = (thesisList: Thesis[]) => {
        return thesisList.map(thesis => 
          thesis.id === updatedThesis.id ? updatedThesis : thesis
        );
      };
      
      setTheses(prev => updateThesisInState(prev));
      setOtherTheses(prev => updateThesisInState(prev));
      
      setIsRejectDialogOpen(false);
      setFeedback('');
      setSelectedThesis(null);
      alert('Thesis rejected successfully!');
    } catch (error) {
      console.error('Error rejecting thesis:', error);
      alert('Failed to reject thesis. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditThesis = (thesis: Thesis) => {
    // For now, we'll just navigate to the detail view
    // In a full implementation, this would open an edit dialog
    onViewDetail(thesis.id);
  };

  const isThesisOwner = (thesis: Thesis) => {
    // Check if the current user is the proposer of the thesis
    // The proposer can be either a full User object or just the user ID
    const proposerId = typeof thesis.proposer === 'object' && thesis.proposer !== null 
      ? thesis.proposer.id 
      : thesis.proposer;
      
    return String(proposerId) === String(currentUser?.id);
  };
  
  // Check if the current student already has a thesis
  const hasExistingThesis = useMemo(() => {
    if (userRole?.toLowerCase() !== 'student' || !currentUser) return false;
    
    // Check if any thesis in the 'my' group belongs to the current user
    // A student has a thesis if they are the proposer
    return groupedTheses.my.some(thesis => {
      // Check if the current user is the proposer of the thesis
      const proposerId = typeof thesis.proposer === 'object' && thesis.proposer !== null 
        ? thesis.proposer.id 
        : thesis.proposer;
      return String(proposerId) === String(currentUser?.id);
    });
  }, [groupedTheses, userRole, currentUser]);

  if (loading || groupsLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-slate-900 mb-2">Thesis Management</h1>
            <p className="text-slate-600">Loading theses...</p>
          </div>
        </div>
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-slate-900 mb-2">Thesis Management</h1>
            <p className="text-slate-600">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <TooltipProvider delayDuration={300}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-slate-900 mb-2">Thesis Management</h1>
          <p className="text-slate-600">Manage and track environmental science research projects</p>
        </div>
        {(userRole === 'student' || userRole === 'admin') && (
          <div className="flex flex-col items-end">
            <div className="flex flex-col items-end w-full">
              {!hasApprovedGroup && userRole === 'student' && (
                <p className="text-yellow-600 text-sm mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  You need an approved group to create a thesis proposal
                </p>
              )}
              {hasExistingThesis && userRole === 'student' && (
                <p className="text-yellow-600 text-sm mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  You already have a thesis proposal. Students can only have one thesis.
                </p>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2 rounded-md px-4 py-2 disabled:opacity-50 whitespace-nowrap"
                  disabled={userRole === 'student' && (!hasApprovedGroup || hasExistingThesis)}
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Create Thesis Proposal
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a new thesis proposal</p>
              </TooltipContent>
            </Tooltip>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Create New Thesis Proposal</DialogTitle>
                  <DialogDescription>
                    Submit a new research thesis proposal for your group. This proposal will need to be approved by your adviser.
                  </DialogDescription>
                </DialogHeader>
                <div style={{ 
                  maxHeight: '60vh', 
                  overflowY: 'scroll',
                  paddingRight: '0.5rem'
                }}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="title" className="text-right">
                        Title *
                      </Label>
                      <div className="col-span-3">
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className={formErrors.title ? 'border-red-500' : ''}
                        />
                        {formErrors.title && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="abstract" className="text-right pt-2">
                        Abstract *
                      </Label>
                      <div className="col-span-3">
                        <Textarea
                          id="abstract"
                          value={abstract}
                          onChange={(e) => setAbstract(e.target.value)}
                          placeholder="Describe your research topic in detail"
                          className={`min-h-[120px] ${formErrors.abstract ? 'border-red-500' : ''}`}
                        />
                        {formErrors.abstract && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.abstract}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="keywords" className="text-right pt-2">
                        Keywords
                      </Label>
                      <div className="col-span-3">
                        <Input
                          id="keywords"
                          value={keywords}
                          onChange={(e) => setKeywords(e.target.value)}
                          placeholder="Enter keywords separated by commas"
                        />
                        <p className="text-sm text-slate-500 mt-1">
                          Enter keywords related to your research topic, separated by commas
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateThesis} disabled={isCheckingGoogle}>
                    {isCheckingGoogle ? 'Checking Google Connection...' : 'Create Thesis Proposal'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by thesis title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="TOPIC_SUBMITTED">Topic Submitted</SelectItem>
                <SelectItem value="TOPIC_APPROVED">Topic Approved</SelectItem>
                <SelectItem value="TOPIC_REJECTED">Topic Rejected</SelectItem>
                <SelectItem value="CONCEPT_SUBMITTED">Concept Submitted</SelectItem>
                <SelectItem value="CONCEPT_APPROVED">Concept Approved</SelectItem>
                <SelectItem value="PROPOSAL_SUBMITTED">Proposal Submitted</SelectItem>
                <SelectItem value="PROPOSAL_APPROVED">Proposal Approved</SelectItem>
                <SelectItem value="RESEARCH_IN_PROGRESS">Research In Progress</SelectItem>
                <SelectItem value="FINAL_SUBMITTED">Final Submitted</SelectItem>
                <SelectItem value="FINAL_APPROVED">Final Approved</SelectItem>
                <SelectItem value="REVISIONS_REQUIRED">Revisions Required</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tabs for different thesis views */}
      <Tabs defaultValue={userRole === 'student' ? "my" : (userRole === 'adviser' || userRole === 'panel') ? "my" : "all"}>
        {userRole === 'student' ? (
          <>
            <TabsList>
              <TabsTrigger value="my">My Thesis</TabsTrigger>
              <TabsTrigger value="others">Others' Theses</TabsTrigger>
            </TabsList>
            <TabsContent value="my">{renderThesisTable(groupedTheses.my, 'my')}</TabsContent>
            <TabsContent value="others">{renderThesisTable(groupedTheses.others, 'others')}</TabsContent>
          </>
        ) : (userRole === 'adviser' || userRole === 'panel') ? (
          <>
            <TabsList>
              <TabsTrigger value="my">My Theses</TabsTrigger>
              <TabsTrigger value="others">Others' Theses</TabsTrigger>
            </TabsList>
            <TabsContent value="my">{renderThesisTable(groupedTheses.my, 'my')}</TabsContent>
            <TabsContent value="others">{renderThesisTable(groupedTheses.others, 'others')}</TabsContent>
          </>
        ) : (
          <>
            <TabsList>
              <TabsTrigger value="all">All Theses</TabsTrigger>
            </TabsList>
            <TabsContent value="all">{renderThesisTable(groupedTheses.all, 'all')}</TabsContent>
          </>
        )}
      </Tabs>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          'DRAFT', 
          'TOPIC_SUBMITTED', 
          'TOPIC_APPROVED', 
          'PROPOSAL_SUBMITTED', 
          'FINAL_APPROVED'
        ].map((status) => {
          const count = theses.filter((t) => t.status === status).length;
          return (
            <Card key={status} className="p-4 border-0 shadow-sm">
              <p className="text-sm text-slate-600 mb-1">{status.replace('_', ' ')}</p>
              <p className="text-2xl text-slate-900">{count}</p>
            </Card>
          );
        })}
      </div>

      {/* Approve Thesis Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={(open) => {
        setIsApproveDialogOpen(open);
        if (!open) {
          setFeedback('');
          setSelectedThesis(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Thesis</DialogTitle>
            <DialogDescription>
              {selectedThesis?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approve-feedback">Feedback (Optional)</Label>
              <Textarea
                id="approve-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback for the student (optional)"
                className="mt-1"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-green-700 hover:bg-green-800 text-white"
                onClick={handleApproveSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Approving...' : 'Approve'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Thesis Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={(open) => {
        setIsRejectDialogOpen(open);
        if (!open) {
          setFeedback('');
          setSelectedThesis(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Thesis</DialogTitle>
            <DialogDescription>
              {selectedThesis?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-feedback">Reason (Optional)</Label>
              <Textarea
                id="reject-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide reason for rejection (optional)"
                className="mt-1"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleRejectSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Rejecting...' : 'Reject'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Google Connect Dialog */}
      <Dialog open={showGoogleConnectDialog} onOpenChange={setShowGoogleConnectDialog}>
        <DialogContent className="sm:max-w-[425px] p-6 w-[95%] max-w-[calc(100%-1rem)]">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-2 bg-yellow-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-lg">Google Account Required</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Connect a Google account to create a Google Drive folder for your thesis.
              </DialogDescription>
            </DialogHeader>
            <div className="w-full flex flex-col sm:flex-row justify-between gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowGoogleConnectDialog(false)}
                size="sm"
                className="w-full sm:w-auto flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="default"
                onClick={async () => {
                  try {
                    setIsCheckingGoogle(true);
                    await accountLinkingService.connectGoogleAccount();
                    setShowGoogleConnectDialog(false);
                    // Check connection again to ensure it was successful
                    const isConnected = await checkGoogleConnection();
                    if (isConnected) {
                      await handleCreateThesis();
                    } else {
                      alert('Failed to verify Google account connection. Please try again.');
                    }
                  } catch (error) {
                    console.error('Error connecting Google account:', error);
                    alert(`Failed to connect Google account: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  } finally {
                    setIsCheckingGoogle(false);
                  }
                }}
                className="w-full sm:w-auto flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isCheckingGoogle}
              >
                {isCheckingGoogle ? 'Connecting...' : 'Connect with Google'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
    </div>
  );
}
