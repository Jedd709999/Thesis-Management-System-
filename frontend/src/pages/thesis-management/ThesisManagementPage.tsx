import { useEffect, useState, useMemo } from 'react';
import { Search, Filter, Plus, Eye, Edit, Trash2, AlertCircle, Check, X, AlertTriangle, RotateCcw, Clock, FileText } from 'lucide-react';
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
import { fetchTheses, fetchCurrentUserTheses, fetchOtherTheses, createThesis, updateThesis, deleteThesis, adviserReview, archiveThesis, submitThesis, findSimilarTheses } from '../../api/thesisService';
import { fetchCurrentUserGroups } from '../../api/groupService';
import { fetchSchedules } from '../../api/scheduleService';
import { panelActions } from '../../services/panelService'; // Correct import
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
  const [keywords, setKeywords] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [otherTheses, setOtherTheses] = useState<Thesis[]>([]);
  const [similarityWarnings, setSimilarityWarnings] = useState<Record<string, any>>({});
  const [loadingSimilarities, setLoadingSimilarities] = useState(false);

  // Adviser approval/rejection state
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedThesis, setSelectedThesis] = useState<Thesis | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGoogleConnectDialog, setShowGoogleConnectDialog] = useState(false);
  const [isCheckingGoogle, setIsCheckingGoogle] = useState(false);

  
  // Panel action state
  const [isPanelActionDialogOpen, setIsPanelActionDialogOpen] = useState(false);
  const [panelActionType, setPanelActionType] = useState<'approve' | 'request_revision' | 'reject' | null>(null);
  const [selectedThesisForPanelAction, setSelectedThesisForPanelAction] = useState<Thesis | null>(null);
  const [panelComments, setPanelComments] = useState('');
  const [isPanelActionSubmitting, setIsPanelActionSubmitting] = useState(false);
  
  // Panel scheduled defenses state
  const [scheduledDefenses, setScheduledDefenses] = useState<Record<string, any>>({});
  const [loadingScheduledDefenses, setLoadingScheduledDefenses] = useState(false);
  
  // Archive state
  const [isArchiving, setIsArchiving] = useState(false);
  



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
          fetchedTheses = await fetchCurrentUserTheses();
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

  // Load similarity warnings when theses change (for all users)
  useEffect(() => {
    if (theses && theses.length > 0) {
      loadSimilarityWarnings();
    }
  }, [theses]);

  // Load similarity warnings
  const loadSimilarityWarnings = async () => {
    // Load for all users who can see theses
    if (!theses || theses.length === 0) {
      return;
    }

    try {
      setLoadingSimilarities(true);
      const similarities: Record<string, any> = {};
      
      // Load similarity warnings for a subset of theses to avoid performance issues
      const thesesToCheck = theses.slice(0, 10); // Limit to first 10 theses
      
      for (const thesis of thesesToCheck) {
        try {
          const result = await findSimilarTheses(thesis.id);
          if (result.count > 0) {
            similarities[thesis.id] = result;
          }
        } catch (error) {
          console.error(`Error loading similarity for thesis ${thesis.id}:`, error);
        }
      }
      
      setSimilarityWarnings(similarities);
    } catch (error) {
      console.error('Error loading similarity warnings:', error);
    } finally {
      setLoadingSimilarities(false);
    }
  };

  // Load scheduled defenses for panel members
  useEffect(() => {
    const loadScheduledDefenses = async () => {
      // Only load for panel members
      if (userRole?.toUpperCase() !== 'PANEL' || !currentUser) {
        return;
      }

      console.log('Checking if we should load scheduled defenses:', {
        userRole: userRole?.toUpperCase(),
        isPanel: userRole?.toUpperCase() === 'PANEL',
        hasCurrentUser: !!currentUser,
        thesesLength: Array.isArray(theses) ? theses.length : 0,
        otherThesesLength: Array.isArray(otherTheses) ? otherTheses.length : 0
      });

      // Check if we have theses to load defenses for
      // Ensure both arrays are actually arrays before concatenating
      const thesesArray = Array.isArray(theses) ? theses : [];
      const otherThesesArray = Array.isArray(otherTheses) ? otherTheses : [];
      const allTheses = [...thesesArray, ...otherThesesArray];
      if (allTheses.length === 0) {
        return;
      }

      console.log('Loading scheduled defenses');
      console.log('Loading scheduled defenses for panel user:', {
        currentUser: currentUser.id,
        thesesCount: Array.isArray(thesesArray) ? thesesArray.length : 0,
        otherThesesCount: Array.isArray(otherThesesArray) ? otherThesesArray.length : 0
      });

      try {
        setLoadingScheduledDefenses(true);
        const defenses: Record<string, any> = {};

        // Process theses in batches to avoid overwhelming the API
        console.log('Processing theses for scheduled defenses:', Array.isArray(allTheses) ? allTheses.length : 0);
        for (const thesis of allTheses) {
          try {
            console.log('Fetching schedules for thesis:', thesis.id);
            const schedules = await fetchSchedules({ thesis_id: thesis.id });
            console.log('Fetched schedules for thesis:', thesis.id, schedules);
            
            // Find scheduled defenses (status = 'scheduled') where current user is a panel member
            const scheduled = schedules.find((schedule: any) => {
              return schedule.status === 'scheduled' && 
                     Array.isArray(schedule.panel_members) && 
                     schedule.panel_members.some((panel: any) => {
                       // Handle different panel member ID formats
                       const panelId = typeof panel === 'object' && panel !== null ? panel.id : panel;
                       
                       // Safely handle currentUser.id which might be null
                       if (!currentUser?.id) return false;
                       
                       // Simple approach: just compare the IDs directly
                       return String(panelId) === String(currentUser!.id);
                     });
            });
            
            if (scheduled) {
              defenses[thesis.id] = scheduled;
            }
          } catch (err) {
            console.error('Error fetching schedules for thesis:', thesis.id, err);
          }
        }

        console.log('Setting scheduled defenses:', defenses);
        setScheduledDefenses(defenses);
      } catch (err) {
        console.error('Error loading scheduled defenses:', err);
      } finally {
        setLoadingScheduledDefenses(false);
      }
    };

    loadScheduledDefenses();
  }, [userRole, currentUser, theses, otherTheses]);

  // Group theses by user role for tab organization
  const groupedTheses = useMemo(() => {
    const groups: Record<string, Thesis[]> = {
      all: [],
      my: [],
      others: []
    };

    // Ensure theses is an array before using forEach
    const thesesArray = Array.isArray(theses) ? theses : [];
    
    console.log('Processing theses for grouping:', {
      userRole,
      thesesCount: thesesArray.length,
      theses: thesesArray
    });
    
    thesesArray.forEach(thesis => {
      groups.all.push(thesis);

      // For students, categorize by access rights
      if (userRole?.toLowerCase() === 'student') {
        // Check if user has access to view this thesis (same logic as canViewThesis)
        let hasAccess = false;

        // Check if user is the proposer of the thesis
        const isProposer = thesis.proposer && (
          (typeof thesis.proposer === 'object' && String(thesis.proposer.id) === String(currentUser?.id)) ||
          (typeof thesis.proposer === 'number' && String(thesis.proposer) === String(currentUser?.id)) ||
          (typeof thesis.proposer === 'string' && String(thesis.proposer) === String(currentUser?.id))


        // Check if the group is a Group object
        );
        
        console.log('Thesis proposer check:', {
          thesisId: thesis.id,
          proposer: thesis.proposer,
          proposerType: typeof thesis.proposer,
          currentUserId: currentUser?.id,
          isProposer
        });
        
        // Check if the group is a Group object



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
            console.log('Checking panels:', thesis.group.panels);
            console.log('Current user ID:', currentUser?.id);
            isPanel = thesis.group.panels.some(panel => {
              const result = panel && typeof panel === 'object' && 'id' in panel && String(panel.id) === String(currentUser?.id);
              console.log('Panel check result:', { panel, userId: currentUser?.id, result });
              return result;
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
        console.log('Adding thesis to admin "my" group:', thesis.id);
        groups.my.push(thesis);
      }
    });

    // For advisers and panels, use the separately fetched other theses
    // Ensure otherTheses is an array
    groups.others = Array.isArray(otherTheses) ? otherTheses : [];
    
    console.log('Final grouped theses:', groups);

    return groups;
  }, [theses, otherTheses, userRole, currentUser]);

  // Filter theses based on search and filters
  const getFilteredTheses = (thesisList: Thesis[]) => {

    // Ensure thesisList is an array before filtering
    const thesesArray = Array.isArray(thesisList) ? thesisList : [];
    
    return thesesArray.filter((thesis) => {
      const matchesSearch = searchQuery === '' ||

                           thesis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           thesis.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           thesis.keywords.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-slate-900 max-w-md">{thesis.title}</p>
                      {similarityWarnings[thesis.id] && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertTriangle className="w-5 h-5 text-yellow-500 cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{similarityWarnings[thesis.id].count} similar thesis{similarityWarnings[thesis.id].count !== 1 ? 'es' : ''} found</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {thesis.group ? (typeof thesis.group === 'string' ? thesis.group : thesis.group.name) : 'No Group'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`border ${getStatusColor(thesis.status)}`}>
                      {getStatusDisplayText(thesis.status)}
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
                      {/* Submit button for students when thesis status is REVISIONS_REQUIRED */}
                      {userRole?.toLowerCase() === 'student' && isThesisOwner(thesis) && (
                        thesis.status === 'CONCEPT_REVISIONS_REQUIRED' || 
                        thesis.status === 'PROPOSAL_REVISIONS_REQUIRED' || 
                        thesis.status === 'FINAL_REVISIONS_REQUIRED'
                      ) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleResubmitThesis(thesis)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Resubmit Thesis</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {userRole?.toLowerCase() === 'admin' && thesis.status === 'FINAL_APPROVED' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleArchiveThesis(thesis.id)}
                              disabled={isArchiving}
                              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 p-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Archive Thesis</p>
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
                      
                      {/* Panel Action Buttons - Check if user is a panel member and thesis has scheduled defense */}
                      {userRole?.toUpperCase() === 'PANEL' && isPanelMemberForThesis(thesis) && hasScheduledDefenses(thesis) && tabType === 'my' && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handlePanelAction(thesis, 'approve')}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Approve Thesis</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handlePanelAction(thesis, 'request_revision')}
                                className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 p-2"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Request Revisions</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handlePanelAction(thesis, 'reject')}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Reject Thesis</p>
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}                    </div>
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
      case 'READY_FOR_CONCEPT_DEFENSE':
      case 'READY_FOR_PROPOSAL_DEFENSE':
      case 'READY_FOR_FINAL_DEFENSE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONCEPT_SCHEDULED':
      case 'PROPOSAL_SCHEDULED':
      case 'FINAL_SCHEDULED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
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
      case 'CONCEPT_REVISIONS_REQUIRED':
      case 'PROPOSAL_REVISIONS_REQUIRED':
      case 'FINAL_REVISIONS_REQUIRED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };
  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case 'REVISIONS_REQUIRED':
        // Determine the specific revision type based on the current thesis stage
        return 'Revisions Required';
      case 'CONCEPT_REVISIONS_REQUIRED':
        return 'Concept Revisions Required';
      case 'PROPOSAL_REVISIONS_REQUIRED':
        return 'Proposal Revisions Required';
      case 'FINAL_REVISIONS_REQUIRED':
        return 'Final Revisions Required';
      default:
        // For other statuses, format them nicely
        return status
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
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
      alert('You must have an approved group to create a topic proposal.');
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
      
      // Debug logging
      console.log('Sending thesis data:', thesisData);
      
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
        fetchedTheses = await fetchCurrentUserTheses();
      }
      setTheses(fetchedTheses);
      setOtherTheses(fetchedOtherTheses);

      // Reset form and close dialog
      setTitle('');
      setAbstract('');
      setKeywords([]);
      setFormErrors({});
      setIsCreateDialogOpen(false);

      // Show success message
      alert('Topic proposal created successfully!');
    } catch (error) {
      console.error('Error creating thesis:', error);
      alert('Failed to create topic proposal. Please try again.');
    }
  };

  const handleDeleteThesis = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this thesis? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteThesis(id);
      setTheses(prev => prev.filter(thesis => thesis.id !== id));
      setOtherTheses(prev => prev.filter(thesis => thesis.id !== id));
      alert('Thesis deleted successfully!');
    } catch (error) {
      console.error('Error deleting thesis:', error);
      alert('Failed to delete thesis. Please try again.');
    }
  };

  const handleArchiveThesis = async (id: string) => {
    if (!window.confirm('Are you sure you want to archive this thesis? This will change the status to ARCHIVED and move it to the archive page.')) {
      return;
    }
    
    try {
      setIsArchiving(true);
      await archiveThesis(id);
      
      // Update the thesis status in state
      setTheses(prev => prev.map(thesis => 
        thesis.id === id ? { ...thesis, status: 'ARCHIVED' } : thesis
      ));
      setOtherTheses(prev => prev.map(thesis => 
        thesis.id === id ? { ...thesis, status: 'ARCHIVED' } : thesis
      ));
      
      alert('Thesis archived successfully!');
    } catch (error) {
      console.error('Error archiving thesis:', error);
      alert('Failed to archive thesis. Please try again.');
    } finally {
      setIsArchiving(false);
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
      (typeof thesis.proposer === 'number' && String(thesis.proposer) === String(currentUser.id)) ||
      (typeof thesis.proposer === 'string' && String(thesis.proposer) === String(currentUser.id))
    );

    
    console.log('canViewThesis - isProposer check:', {
      thesisId: thesis.id,
      proposer: thesis.proposer,
      proposerType: typeof thesis.proposer,
      currentUserId: currentUser.id,
      isProposer
    });
    



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

  const handleResubmitThesis = async (thesis: Thesis) => {
    try {
      // Call the submit function from thesisService
      const updatedThesis = await submitThesis(thesis.id);
      
      // Update the thesis in state
      const updateThesisInState = (thesisList: Thesis[]) => {
        return thesisList.map(t => 
          t.id === updatedThesis.id ? updatedThesis : t
        );
      };
      
      setTheses(prev => updateThesisInState(prev));
      setOtherTheses(prev => updateThesisInState(prev));
      
      alert('Thesis resubmitted successfully!');
    } catch (error) {
      console.error('Error resubmitting thesis:', error);
      alert('Failed to resubmit thesis. Please try again.');
    }
  };

  const isThesisOwner = (thesis: Thesis) => {
    // Check if the current user is the proposer of the thesis
    // The proposer can be either a full User object or just the user ID
    const proposerId = typeof thesis.proposer === 'object' && thesis.proposer !== null
      ? thesis.proposer.id
      : thesis.proposer;

      
    const result = String(proposerId) === String(currentUser?.id);
    
    console.log('isThesisOwner check:', {
      thesisId: thesis.id,
      proposerId,
      proposerType: typeof thesis.proposer,
      currentUserId: currentUser?.id,
      result
    });
      
    return result;
  };
  
  // Function to check if current user is a panel member for a thesis
  const isPanelMemberForThesis = (thesis: Thesis): boolean => {
    // First check if current user is a panel member and we have a user
    if (userRole?.toUpperCase() !== 'PANEL' || !currentUser) return false;
    
    console.log('Checking if user is panel member for thesis:', {
      thesisId: thesis.id,
      userRole,
      currentUserId: currentUser?.id,
      thesisGroup: thesis.group,
      groupType: typeof thesis.group
    });
    
    // Check if the group is a Group object and has panels
    if (typeof thesis.group === 'object' && thesis.group !== null && 'panels' in thesis.group) {
      // Check if user is in the panels array
      const panels = thesis.group.panels;
      if (Array.isArray(panels)) {
        const result = panels.some(panel => {
          if (panel && typeof panel === 'object' && 'id' in panel) {
            return String(panel.id) === String(currentUser.id);
          }
          return false;
        });
        console.log('Panel member check result:', result);
        return result;
      }
    }
    
    console.log('Group is not a valid object or has no panels');
    return false;
  };
  
  // Function to check if a thesis has a scheduled defense
  const isThesisScheduledForDefense = (thesis: Thesis): boolean => {
    // For the table view, we'll check if the thesis has any scheduled oral defenses
    // In the detail view, this is done by fetching schedules with status 'scheduled'
    // For now, we'll use the thesis status as an indicator
    const scheduledStatuses = ['CONCEPT_SCHEDULED', 'PROPOSAL_SCHEDULED', 'FINAL_SCHEDULED'];
    const result = scheduledStatuses.includes(thesis.status);
    
    console.log('Thesis scheduled check:', { 
      thesisId: thesis.id, 
      status: thesis.status, 
      scheduledStatuses,
      isScheduled: result 
    });
    return result;
  };
  
  // Updated function to check if a thesis has scheduled defenses
  // Simplified to check only thesis status
  const hasScheduledDefenses = (thesis: Thesis): boolean => {
    // Check if thesis has a scheduled status
    const scheduledStatuses = ['CONCEPT_SCHEDULED', 'PROPOSAL_SCHEDULED', 'FINAL_SCHEDULED'];
    const result = scheduledStatuses.includes(thesis.status);
    
    console.log('Thesis scheduled check:', { 
      thesisId: thesis.id, 
      status: thesis.status, 
      scheduledStatuses,
      isScheduled: result 
    });
    return result;
  };
  
  // Function to handle panel actions
  const handlePanelAction = (thesis: Thesis, action: 'approve' | 'request_revision' | 'reject') => {
    console.log('Panel action triggered:', { thesisId: thesis.id, action });
    
    // Check if thesis has a scheduled status
    const scheduledStatuses = ['CONCEPT_SCHEDULED', 'PROPOSAL_SCHEDULED', 'FINAL_SCHEDULED'];
    if (!scheduledStatuses.includes(thesis.status)) {
      alert('This thesis does not have a scheduled defense.');
      return;
    }
    
    // Set the action type and open the dialog
    setPanelActionType(action);
    setSelectedThesisForPanelAction(thesis);
    setPanelComments('');
    setIsPanelActionDialogOpen(true);
  };
  
  // Function to submit panel action
  const handlePanelActionSubmit = async () => {
    if (!selectedThesisForPanelAction || !panelActionType) return;
    
    try {
      setIsPanelActionSubmitting(true);
      
      // Instead of getting a schedule ID, we'll directly call the panel action
      // with the thesis ID and the action type
      let response;
      
      // Perform the appropriate action based on the action type
      switch (panelActionType) {
        case 'approve':
          response = await panelActions.approveByThesis(selectedThesisForPanelAction.id, panelComments);
          break;
        case 'request_revision':
          response = await panelActions.requestRevisionByThesis(selectedThesisForPanelAction.id, panelComments);
          break;
        case 'reject':
          response = await panelActions.rejectByThesis(selectedThesisForPanelAction.id, panelComments);
          break;
        default:
          throw new Error('Invalid action type');
      }
      
      // Update the thesis in state based on the action
      const updateThesisInState = (thesisList: Thesis[]) => {
        return thesisList.map(thesis => {
          if (thesis.id === selectedThesisForPanelAction.id) {
            // Update the thesis status based on the action
            let newStatus = thesis.status;
            switch (panelActionType) {
              case 'approve':
                // Change status based on current status
                if (thesis.status === 'CONCEPT_SCHEDULED') {
                  newStatus = 'CONCEPT_APPROVED';
                } else if (thesis.status === 'PROPOSAL_SCHEDULED') {
                  newStatus = 'PROPOSAL_APPROVED';
                } else if (thesis.status === 'FINAL_SCHEDULED') {
                  newStatus = 'FINAL_APPROVED';
                }
                break;
              case 'request_revision':
                // Update thesis status to stage-specific revision status
                if (selectedThesisForPanelAction.status === 'CONCEPT_SCHEDULED') {
                  newStatus = 'CONCEPT_REVISIONS_REQUIRED';
                } else if (selectedThesisForPanelAction.status === 'PROPOSAL_SCHEDULED') {
                  newStatus = 'PROPOSAL_REVISIONS_REQUIRED';
                } else if (selectedThesisForPanelAction.status === 'FINAL_SCHEDULED') {
                  newStatus = 'FINAL_REVISIONS_REQUIRED';
                } else {
                  // Fallback to concept revision status for other cases
                  newStatus = 'CONCEPT_REVISIONS_REQUIRED';
                }
                break;
              case 'reject':
                newStatus = 'REJECTED';
                break;
            }
            
            return {
              ...thesis,
              status: newStatus
            };
          }
          return thesis;
        });
      };
      
      setTheses(prev => updateThesisInState(prev));
      setOtherTheses(prev => updateThesisInState(prev));
      
      // Close the dialog and reset state
      setIsPanelActionDialogOpen(false);
      setPanelActionType(null);
      setSelectedThesisForPanelAction(null);
      setPanelComments('');
      
      alert(`Thesis ${panelActionType.replace('_', ' ')}d successfully!`);
    } catch (error: any) {
      console.error('Error performing panel action:', error);
      alert(`Failed to ${panelActionType} the thesis. Please try again. Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsPanelActionSubmitting(false);
    }
  };

  // Function to cancel panel action
  const handlePanelActionCancel = () => {
    setIsPanelActionDialogOpen(false);
    setPanelActionType(null);
    setSelectedThesisForPanelAction(null);
    setPanelComments('');

  };

  // Check if the current student already has a thesis
  const hasExistingThesis = useMemo(() => {
    if (userRole?.toLowerCase() !== 'student' || !currentUser) return false;

    // Check if any thesis belongs to the current user
    // A student has a thesis if they are the proposer
    const result = theses.some(thesis => {
      // Check if the current user is the proposer of the thesis
      const proposerId = typeof thesis.proposer === 'object' && thesis.proposer !== null
        ? thesis.proposer.id
        : thesis.proposer;
      return String(proposerId) === String(currentUser?.id);
    });
    
    console.log('hasExistingThesis check:', {
      userRole,
      currentUser: currentUser?.id,
      thesesCount: Array.isArray(theses) ? theses.length : 0,
      theses: Array.isArray(theses) ? theses.map(t => ({
        id: t.id,
        title: t.title,
        proposer: t.proposer,
        proposerType: typeof t.proposer
      })) : [],
      result
    });
    
    return result;
  }, [theses, userRole, currentUser]);

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

  // Simple Progress Bar Component
  const SimpleProgressBar = ({ thesis }: { thesis: Thesis }) => {
    // Define progress percentages for different thesis statuses
    const getStatusProgress = (status: string): number => {
      switch (status) {
        case 'DRAFT':
          return 10;
        case 'TOPIC_SUBMITTED':
          return 15;
        case 'TOPIC_APPROVED':
          return 20;
        case 'CONCEPT_SUBMITTED':
          return 30;
        case 'CONCEPT_APPROVED':
          return 40;
        case 'PROPOSAL_SUBMITTED':
          return 50;
        case 'PROPOSAL_APPROVED':
          return 60;
        case 'RESEARCH_IN_PROGRESS':
          return 70;
        case 'FINAL_SUBMITTED':
          return 85;
        case 'FINAL_APPROVED':
          return 100;
        case 'TOPIC_REJECTED':
        case 'REJECTED':
          return 15; // Reset to early stage if rejected
        default:
          return 0;
      }
    };

    const progress = getStatusProgress(thesis.status);
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Thesis Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3">
          <div 
            className="bg-green-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-xs text-slate-500 mt-2">
          Current status: {thesis.status.replace(/_/g, ' ')}
        </div>
      </div>
    );
  };



  return (
    <TooltipProvider delayDuration={300}>
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-slate-900 mb-2">Thesis Management</h1>
          <p className="text-slate-600">Manage and track environmental science research projects</p>
        </div>
        {(userRole === 'student' || userRole === 'admin') && (
          <div className="flex flex-col items-end">
            {userRole === 'student' && (!hasApprovedGroup || hasExistingThesis) ? (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 w-full max-w-md">
                <p className="text-amber-700 text-sm flex items-start">
                  <AlertCircle className="w-4 h-4 inline mr-2 mt-0.5 flex-shrink-0" />
                  <span>You cannot create a thesis proposal at this time. 
                  {hasExistingThesis 
                    ? "Students can only have one thesis." 
                    : "You need to be part of an approved group before you can create a thesis proposal."}</span>
                </p>

              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 rounded-md px-4 py-2 disabled:opacity-50 whitespace-nowrap"
                    disabled={userRole === 'student' && (!hasApprovedGroup || hasExistingThesis)}
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Create Topic Proposal
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create a new topic proposal</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Create New Topic Proposal</DialogTitle>
                  <DialogDescription>
                    Submit a new research topic proposal for your group. This proposal will need to be approved by your adviser.
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
                          defaultValue={keywords.join(", ")}
                          onBlur={(e) => {
                            // Process keywords only when user leaves the field
                            const inputValue = e.target.value;
                            const keywordArray = inputValue
                              .split(',')
                              .map(k => k.trim())
                              .filter(k => k.length > 0);
                            setKeywords(keywordArray);
                          }}
                          onKeyDown={(e) => {
                            // Process on Enter key
                            if (e.key === 'Enter') {
                              e.preventDefault(); // Prevent form submission
                              const inputValue = e.currentTarget.value;
                              const keywordArray = inputValue
                                .split(',')
                                .map(k => k.trim())
                                .filter(k => k.length > 0);
                              setKeywords(keywordArray);
                            }
                          }}
                          placeholder="Enter keywords separated by commas (e.g., machine learning, algorithms, data science)"
                        />                        <p className="text-sm text-slate-500 mt-1">
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
                    {isCheckingGoogle ? 'Checking Google Connection...' : 'Create Topic Proposal'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Show filters only for advisers and panel members, not for students */}
      {(userRole === 'adviser' || userRole === 'panel') && (
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by thesis title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
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
      )}

      {/* Display only assigned theses without tabs for non-admin users */}
      {userRole === 'admin' ? (
        <Tabs defaultValue="my">
          <TabsList>
            <TabsTrigger value="my">All Theses</TabsTrigger>
          </TabsList>
          <TabsContent value="my">{renderThesisTable(groupedTheses.my, 'my')}</TabsContent>
        </Tabs>
      ) : (
        /* For students, advisers, and panel members, show only their assigned theses without tabs */
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {userRole === 'student' ? 'My Thesis' : 'Assigned Theses'}
          </h2>
          {renderThesisTable(groupedTheses.my, 'my')}
          
          {/* Statistic Cards for Advisers and Panel Members - placed below thesis table */}
          {(userRole === 'adviser' || userRole === 'panel') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
              {/* Total Theses Card */}
              <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Total Theses</p>
                    <p className="text-2xl font-bold text-blue-900">{groupedTheses.my.length}</p>
                  </div>
                  <div className="p-3 bg-blue-200 rounded-full">
                    <FileText className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
              </Card>

              {/* Pending Reviews Card */}
              <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700">Pending Reviews</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {groupedTheses.my.filter(thesis => 
                        thesis.status.includes('SUBMITTED') || 
                        thesis.status.includes('SCHEDULED')
                      ).length}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-200 rounded-full">
                    <Clock className="w-6 h-6 text-amber-700" />
                  </div>
                </div>
              </Card>

              {/* Completed Evaluations Card */}
              <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Completed</p>
                    <p className="text-2xl font-bold text-green-900">
                      {groupedTheses.my.filter(thesis => 
                        thesis.status.includes('APPROVED') || 
                        thesis.status === 'FINAL_DEFENDED' ||
                        thesis.status === 'REJECTED' ||
                        thesis.status === 'ARCHIVED'
                      ).length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-200 rounded-full">
                    <Check className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </Card>

              {/* In Progress Card */}
              <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700">In Progress</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {groupedTheses.my.filter(thesis => 
                        thesis.status === 'RESEARCH_IN_PROGRESS' || 
                        thesis.status === 'DRAFT' ||
                        thesis.status.includes('CONCEPT') ||
                        thesis.status.includes('PROPOSAL')
                      ).length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-200 rounded-full">
                    <RotateCcw className="w-6 h-6 text-purple-700" />
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Simple Progress Bar - Only show for students with a thesis */}
      {userRole === 'student' && theses.length > 0 && (
        <Card className="p-6 border-0 shadow-sm mb-6">
          <h3 className="text-lg font-semibold mb-4">Thesis Progress</h3>
          <SimpleProgressBar thesis={theses[0]} />
        </Card>
      )}

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
                className="w-full sm:w-auto flex-1 bg-green-700 hover:bg-green-800 text-white"
                disabled={isCheckingGoogle}
              >
                {isCheckingGoogle ? 'Connecting...' : 'Connect with Google'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Panel Action Dialog */}
      <Dialog open={isPanelActionDialogOpen} onOpenChange={(open) => {
        setIsPanelActionDialogOpen(open);
        if (!open) {
          setPanelActionType(null);
          setSelectedThesisForPanelAction(null);
          setPanelComments('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {panelActionType === 'approve' && 'Approve Thesis'}
              {panelActionType === 'request_revision' && 'Request Revisions'}
              {panelActionType === 'reject' && 'Reject Thesis'}
            </DialogTitle>
            <DialogDescription>
              {selectedThesisForPanelAction?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="panel-comments">
                {panelActionType === 'approve' && 'Comments (Optional)'}
                {panelActionType === 'request_revision' && 'Revision Details'}
                {panelActionType === 'reject' && 'Reason for Rejection'}
              </Label>
              <Textarea
                id="panel-comments"
                value={panelComments}
                onChange={(e) => setPanelComments(e.target.value)}
                placeholder={
                  panelActionType === 'approve' 
                    ? 'Provide feedback for the student (optional)' 
                    : panelActionType === 'request_revision'
                    ? 'Describe the revisions needed for this thesis'
                    : 'Provide reason for rejecting this thesis'
                }
                className="mt-1"
                disabled={isPanelActionSubmitting}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={handlePanelActionCancel}
                disabled={isPanelActionSubmitting}
              >
                Cancel
              </Button>
              <Button 
                className={
                  panelActionType === 'approve' 
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : panelActionType === 'request_revision'
                    ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                    : "bg-red-700 hover:bg-red-800 text-white"
                }
                onClick={handlePanelActionSubmit}
                disabled={isPanelActionSubmitting}
              >
                {isPanelActionSubmitting ? (
                  <>
                    {panelActionType === 'approve' && 'Approving...'}
                    {panelActionType === 'request_revision' && 'Requesting Revisions...'}
                    {panelActionType === 'reject' && 'Rejecting...'}
                  </>
                ) : (
                  <>
                    {panelActionType === 'approve' && 'Approve'}
                    {panelActionType === 'request_revision' && 'Request Revisions'}
                    {panelActionType === 'reject' && 'Reject'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
