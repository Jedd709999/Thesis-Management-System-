import { useEffect, useState, useCallback } from 'react';
import { Plus, Users, Eye, X, UserPlus, BookOpen, Loader2, RefreshCw, Clock } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { fetchGroups, createGroup } from '../../api/groupService';
import { getStudents, getAdvisers } from '../../api/userService';
import { GroupFormData, FormErrors } from '../../types/group';
import { Group, User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { PendingProposals } from './PendingProposalsPage';

// Constants
const GROUP_NAME_MAX_LENGTH = 100;
const TOPICS_MAX_LENGTH = 500;
const MAX_GROUP_MEMBERS = 4; // Including the leader

interface GroupManagementProps {
  userRole: 'student' | 'adviser' | 'panel' | 'admin';
  onViewDetail: (groupId: string) => void;
}

interface SelectedMember {
  id: string;
  name: string;
  email?: string;
}

export function GroupManagement({ userRole, onViewDetail }: GroupManagementProps) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<GroupFormData, 'member_ids' | 'leader_id'>>({
    name: '',
    possible_topics: '',
    adviser_id: ''
  });
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [availableAdvisers, setAvailableAdvisers] = useState<User[]>([]);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [activeTab, setActiveTab] = useState('my-group');

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedGroups = await fetchGroups();
      
      if (Array.isArray(fetchedGroups)) {
        setGroups(fetchedGroups);
      } else {
        console.warn('fetchGroups did not return an array:', fetchedGroups);
        setGroups([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to load groups. Please try again later.');
      setGroups([]);
      
      toast.error('Failed to load groups. Please refresh the page to try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, []);

  // Load available students and advisers
  const fetchUsers = useCallback(async () => {
    if (!user) return;
    
    try {
      const shouldFetchStudents = !groups?.some(group => 
        group.members?.some(member => String(member.id) === String(user?.id))
      );

      const [students, advisers] = await Promise.all([
        shouldFetchStudents ? getStudents() : Promise.resolve([]),
        getAdvisers()
      ]);

      const filteredStudents = students.filter(student => {
        if (String(student.id) === String(user?.id)) return false;
        return !groups?.some(group => 
          group.members?.some(member => String(member.id) === String(student.id))
        );
      });

      setAvailableStudents(filteredStudents);
      setAvailableAdvisers(advisers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users. Some features may be limited.');
      setAvailableStudents([]);
      setAvailableAdvisers([]);
    }
  }, [user, groups]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for the field being edited
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Validate group name
    if (!formData.name.trim()) {
      errors.name = 'Group name is required';
    } else if (formData.name.length > GROUP_NAME_MAX_LENGTH) {
      errors.name = `Group name must be less than ${GROUP_NAME_MAX_LENGTH} characters`;
    }

    // Validate topics
    if (!formData.possible_topics.trim()) {
      errors.possible_topics = 'Please provide at least one research topic';
    } else if (formData.possible_topics.length > TOPICS_MAX_LENGTH) {
      errors.possible_topics = `Topics must be less than ${TOPICS_MAX_LENGTH} characters`;
    }

    // Validate members
    if (selectedMembers.length === 0) {
      errors.members = 'Please select at least one group member';
    } else if (selectedMembers.length > MAX_GROUP_MEMBERS - 1) {
      errors.members = `Maximum ${MAX_GROUP_MEMBERS - 1} members allowed (including yourself)`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddMember = (student: User) => {
    if (selectedMembers.length >= MAX_GROUP_MEMBERS - 1) {
      toast.error(`You can only add up to ${MAX_GROUP_MEMBERS - 1} members to your group.`);
      return;
    }

    if (!selectedMembers.some(m => m.id === String(student.id))) {
      setSelectedMembers(prev => [...prev, {
        id: String(student.id),
        name: `${student.first_name} ${student.last_name}`,
        email: student.email
      }]);
    }
  };

  const handleRemoveMember = (memberId: string | number) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (!validateForm()) {
      return;
    }

    // Check if user is already in a group
    if (groups?.some(group => 
      group.members?.some(member => String(member.id) === String(user?.id))
    )) {
      setFormErrors({
        general: 'You are already a member of a group. You can only be in one group at a time.'
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const memberIds = [String(user?.id), ...selectedMembers.map(m => m.id)].filter(Boolean) as string[];

      await createGroup({
        ...formData,
        member_ids: memberIds,
        adviser_id: formData.adviser_id || '',
        leader_id: String(user?.id)
      });

      toast.success('Group proposal submitted successfully!');

      // Reset form
      setFormData({
        name: '',
        possible_topics: '',
        adviser_id: ''
      });
      setSelectedMembers([]);

      // Close modal and refresh data
      setTimeout(() => {
        setIsProposalOpen(false);
        loadGroups();
      }, 1500);

    } catch (err: any) {
      console.error('Error submitting group proposal:', err);
      
      // Handle different types of error responses
      let errorMessage = 'Failed to submit group proposal. Please try again.';
      let fieldErrors: any = {};
      
      if (err.response?.data) {
        // Handle validation errors
        if (err.response.data.member_ids) {
          fieldErrors.members = err.response.data.member_ids;
          errorMessage = err.response.data.member_ids;
        } else if (err.response.data.non_field_errors) {
          errorMessage = err.response.data.non_field_errors;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (Array.isArray(err.response.data)) {
          errorMessage = err.response.data.join(', ');
        }
      }
      
      setFormErrors({
        general: errorMessage,
        ...fieldErrors
      });
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Group Management</h1>
            <p className="text-slate-600">Loading your groups...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 border-0 shadow-sm">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="flex space-x-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-8 w-8 rounded-full bg-slate-200"></div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Group Management</h1>
            <p className="text-red-600">Error: {error}</p>
            <Button 
              onClick={loadGroups} 
              variant="outline" 
              className="mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Group Management</h1>
          <p className="text-slate-600">Manage research group and collaborate</p>
        </div>
        <div className="flex gap-2">
          {(userRole === 'student' || userRole === 'admin' || userRole === 'adviser') && (
            <Button
              onClick={() => setIsProposalOpen(true)}
              className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {userRole === 'student' ? 'Propose Group' : 'Create Group'}
            </Button>
          )}
        </div>
      </div>

      {/* Groups Grid with Tabs */}
      <div className="space-y-6">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="my-group" className="flex-1">
              <Users className="w-4 h-4 mr-2" />
              My Group
            </TabsTrigger>
            <TabsTrigger value="other-groups" className="flex-1">
              <Users className="w-4 h-4 mr-2" />
              Other Groups
            </TabsTrigger>
            {userRole === 'admin' && (
              <TabsTrigger value="pending-proposals" className="flex-1">
                <Clock className="w-4 h-4 mr-2" />
                Pending Proposals
              </TabsTrigger>
            )}
          </TabsList>

          {(userRole === 'student' || userRole === 'admin' || userRole === 'adviser') && (
            <>
              {/* My Group Tab */}
              <TabsContent value="my-group" className="space-y-4">
                {!groups || groups.length === 0 || !groups.some(group => 
                  group.members?.some(member => String(member.id) === String(user?.id))
                ) ? (
                  <Card className="p-8 text-center border-0 shadow-sm">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <Users className="w-12 h-12 text-slate-400" />
                      <h3 className="text-xl font-medium text-slate-900">You don't have a group yet</h3>
                      <p className="text-slate-600 max-w-md">
                        {userRole === 'student' 
                          ? 'Create a new research group or join an existing one to get started.'
                          : 'You are not currently assigned to any groups.'}
                      </p>
                      {userRole === 'student' && (
                        <Button
                          onClick={() => setIsProposalOpen(true)}
                          className="mt-4 bg-green-700 hover:bg-green-800 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Propose New Group
                        </Button>
                      )}
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {groups
                      .filter(group => group.members?.some(member => String(member.id) === String(user?.id)))
                      .map((group) => (
                        <Card key={group.id} className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex flex-col space-y-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h2 className="text-xl font-semibold text-slate-900">{group.name}</h2>
                                  <Badge className={group.status === 'APPROVED' 
                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                    : group.status === 'PENDING' 
                                      ? 'bg-amber-100 text-amber-800 border-amber-200' 
                                      : 'bg-red-100 text-red-800 border-red-200'
                                  }>
                                    {group.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-600">
                                  {group.members?.length || 0} members • Created on {new Date(group.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => onViewDetail(group.id)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </Button>
                            </div>

                            {group.abstract && (
                              <div>
                                <h3 className="text-sm font-medium text-slate-900 mb-1">Research Topics</h3>
                                <div className="text-sm text-slate-700 whitespace-pre-line">
                                  {group.abstract}
                                </div>
                              </div>
                            )}

                            <div>
                              <h3 className="text-sm font-medium text-slate-900 mb-2">Members</h3>
                              <div className="flex flex-wrap gap-2">
                                {group.members?.map((member, idx) => (
                                  <div key={member.id || idx} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback>
                                        {member.first_name?.[0]}{member.last_name?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">
                                      {member.first_name} {member.last_name}
                                      {String(group.leader?.id) === String(member.id) && (
                                        <span className="ml-1 text-xs text-amber-600">(Leader)</span>
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                )}
              </TabsContent>

              {/* Other Groups Tab */}
              <TabsContent value="other-groups">
                <div className="space-y-4 mt-8">
                  <div className="grid grid-cols-1 gap-6">
                    {!groups || groups.length === 0 || groups.every(group => group.members?.some(member => String(member.id) === String(user?.id))) ? (
                      <Card className="p-8 text-center border-0 shadow-sm">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <Users className="w-12 h-12 text-slate-400" />
                          <h3 className="text-xl font-medium text-slate-900">No other groups found</h3>
                          <p className="text-slate-600 max-w-md">
                            {userRole === 'student' 
                              ? 'There are no other groups available to join at the moment.'
                              : 'There are no other groups in the system.'}
                          </p>
                        </div>
                      </Card>
                    ) : (
                      groups
                        .filter(group => !group.members?.some(member => String(member.id) === String(user?.id)))
                        .map((group) => (
                          <Card key={group.id} className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col space-y-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold text-slate-900">{group.name}</h3>
                                  <p className="text-sm text-slate-600">
                                    {group.members?.length || 0} members • {group.status}
                                  </p>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => onViewDetail(group.id)}
                                  className="flex items-center gap-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Details
                                </Button>
                              </div>

                              {group.abstract && (
                                <div>
                                  <h4 className="text-sm font-medium text-slate-900 mb-1">Research Topics</h4>
                                  <p className="text-sm text-slate-700 line-clamp-2">
                                    {group.abstract}
                                  </p>
                                </div>
                              )}

                              <div>
                                <h4 className="text-sm font-medium text-slate-900 mb-2">Members</h4>
                                <div className="flex -space-x-2">
                                  {group.members?.slice(0, 5).map((member, idx) => (
                                    <Avatar key={member.id || idx} className="h-8 w-8 border-2 border-white">
                                      <AvatarFallback className="text-xs">
                                        {member.first_name?.[0]}{member.last_name?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                  {group.members && group.members.length > 5 && (
                                    <div className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-600">
                                      +{group.members.length - 5}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {userRole === 'student' && (
                                <div className="pt-2">
                                  <Button 
                                    variant="outline" 
                                    className="w-full"
                                    onClick={() => onViewDetail(group.id)}
                                  >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Request to Join
                                  </Button>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Pending Proposals Tab - Only for Admins */}
              {userRole === 'admin' && (
                <TabsContent value="pending-proposals">
                  <PendingProposals onViewDetail={onViewDetail} />
                </TabsContent>
              )}
            </>
          )}
        </Tabs>
      </div>

      {/* Group Proposal Modal */}
      <Dialog open={isProposalOpen} onOpenChange={setIsProposalOpen}>
        <DialogContent className="w-[95%] max-w-[500px] mx-auto max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 border-b">
            <DialogTitle className="text-lg">
              {userRole === 'student' ? 'Propose Research Group' : 'Create Group'}
            </DialogTitle>
            <DialogDescription>
              Fill in the details below to {userRole === 'student' ? 'propose a new research group' : 'create a new group'}
            </DialogDescription>
          </DialogHeader>

          <form id="group-proposal-form" onSubmit={handleSubmitProposal} className="space-y-3 p-4 overflow-y-auto flex-1">
            {formErrors.general && (
              <div className="p-2 bg-red-50 text-red-700 rounded-md text-sm">
                {formErrors.general}
              </div>
            )}

            {/* Group Name */}
            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm font-medium">
                Group Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="E.g., Climate Change Research Team"
                className={`h-8 text-sm ${formErrors.name ? 'border-red-300' : ''}`}
                maxLength={GROUP_NAME_MAX_LENGTH}
                disabled={isSubmitting}
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span className="text-red-500">{formErrors.name}</span>
                <span>{formData.name.length}/{GROUP_NAME_MAX_LENGTH}</span>
              </div>
            </div>

            {/* Research Topics */}
            <div className="space-y-1">
              <Label htmlFor="possible_topics" className="text-sm font-medium">
                Possible Research Topics <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="possible_topics"
                name="possible_topics"
                value={formData.possible_topics}
                onChange={handleInputChange}
                placeholder="Enter one topic per line. E.g.:\n- Climate change impact on coastal ecosystems\n- Renewable energy solutions for urban areas"
                className={`min-h-[80px] text-sm ${formErrors.possible_topics ? 'border-red-300' : ''}`}
                disabled={isSubmitting}
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span className="text-red-500">{formErrors.possible_topics}</span>
                <span>{formData.possible_topics.length}/{TOPICS_MAX_LENGTH}</span>
              </div>
            </div>

            {/* Member Selection */}
            <div className="space-y-1">
              <Label className="text-sm font-medium">
                Add Group Members <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-wrap gap-1">
                {selectedMembers.map(member => (
                  <Badge key={member.id} variant="secondary" className="px-2 py-0.5 text-xs">
                    {member.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      className="ml-1 text-slate-400 hover:text-slate-700"
                      disabled={isSubmitting}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
              {formErrors.members && (
                <p className="text-xs text-red-500">{formErrors.members}</p>
              )}
              
              {/* Student Selection Dropdown */}
              {availableStudents.length > 0 && (
                <Select
                  onValueChange={(value) => {
                    const student = availableStudents.find(s => String(s.id) === value);
                    if (student) handleAddMember(student);
                  }}
                  disabled={isSubmitting || availableStudents.length === 0}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select students..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStudents.map(student => (
                      <SelectItem 
                        key={student.id} 
                        value={String(student.id)}
                        disabled={selectedMembers.some(m => m.id === String(student.id))}
                        className="text-sm"
                      >
                        {student.first_name} {student.last_name} ({student.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-slate-500">
                {MAX_GROUP_MEMBERS - 1 - selectedMembers.length} slots remaining
              </p>
            </div>

            {/* Adviser Selection */}
            <div className="space-y-1">
              <Label className="text-sm font-medium">
                Select an Adviser (Optional)
              </Label>
              <Select
                value={formData.adviser_id}
                onValueChange={(value) => {
                  // Handle "no preference" selection
                  if (value === "no-preference") {
                    setFormData(prev => ({ ...prev, adviser_id: "" }));
                  } else {
                    setFormData(prev => ({ ...prev, adviser_id: value }));
                  }
                }}
                disabled={isSubmitting || availableAdvisers.length === 0}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select adviser..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-preference" className="text-sm">No preference</SelectItem>
                  {availableAdvisers.map(adviser => (
                    <SelectItem key={adviser.id} value={String(adviser.id)} className="text-sm">
                      {`${adviser.first_name} ${adviser.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a preferred adviser or leave blank
              </p>
            </div>
          </form>

          <DialogFooter className="px-6 py-4 border-t bg-slate-50 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsProposalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="group-proposal-form"
              disabled={isSubmitting}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                userRole === 'student' ? 'Propose Group' : 'Create Group'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}