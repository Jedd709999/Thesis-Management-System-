import React, { useEffect, useState } from 'react';
import { 
  Typography, 
  Button, 
  TextField, 
  Box, 
  Paper, 
  Chip, 
  LinearProgress, 
  InputAdornment, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Alert
} from '@mui/material';
import { 
  Search, 
  Add, 
  Edit, 
  Delete, 
  Visibility, 
  Check, 
  Clear, 
  PersonAdd,
  Assignment,
  Close,
  Groups
} from '@mui/icons-material';
import { listGroups, createGroup, getCurrentUserGroups, assignAdviser } from '../../api/groupService'
import { useNavigate } from 'react-router-dom'
import api from '../../api/api'

interface GroupData {
  name: string
  proposed_topic_title?: string
  abstract?: string
  keywords?: string
  adviser?: number
  members?: number[]
}

interface Group {
  id: number
  name: string
  proposed_topic_title?: string
  abstract?: string
  keywords?: string
  leader?: number | User | null
  members?: number[] | User[]
  adviser?: number | User | null
  panels?: number[] | User[]
  status?: string
  [key: string]: any
}

interface User {
  id: number
  first_name?: string
  last_name?: string
  email: string
  role: string
}

export default function GroupListPage(){
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [otherGroups, setOtherGroups] = useState<Group[]>([])
  const [allGroups, setAllGroups] = useState<Group[]>([])
  const [pendingProposals, setPendingProposals] = useState<Group[]>([])
  const [pendingProposalsForStudents, setPendingProposalsForStudents] = useState<Group[]>([])
  const [open, setOpen] = useState(false)
  const [assignAdviserOpen, setAssignAdviserOpen] = useState(false)
  const [rejectProposalOpen, setRejectProposalOpen] = useState(false)
  const [selectedGroupForRejection, setSelectedGroupForRejection] = useState<Group | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [selectedGroupForAdviser, setSelectedGroupForAdviser] = useState<Group | null>(null)
  const [selectedAdviserId, setSelectedAdviserId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: '', proposed_topic_title: '', abstract: '', keywords: '', adviser: '', members: [] as number[] })
  const [advisers, setAdvisers] = useState<User[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'all' | 'keywords' | 'topics'>('all')
  const [currentTab, setCurrentTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function loadPendingProposals() {
    if (currentUser?.role !== 'ADMIN') {
      setPendingProposals([]);
      return;
    }
    
    try {
      console.log('Loading pending proposals...');
      const response = await api.get('groups/pending_proposals/');
      console.log('Admin pending proposals response:', response.data);
      setPendingProposals(response.data || []);
    } catch (error) {
      console.error('Failed to load pending proposals:', error);
      console.error('Error response:', error.response?.data);
      setPendingProposals([]);
    }
  }

  async function load(){ 
    try{ 
      console.log('Loading groups...');
      setLoading(true)
      
      // Load current user groups (including pending ones)
      console.log('Calling getCurrentUserGroups...');
      const myGroupsResponse = await getCurrentUserGroups();
      console.log('getCurrentUserGroups response:', myGroupsResponse);
      const myGroupsData = myGroupsResponse.data || []
      console.log('My groups data:', myGroupsData);
      setMyGroups(myGroupsData)
      
      // Load all other approved groups for the "Other Groups" tab
      let url = 'groups/';
      const params = new URLSearchParams();
      
      if (searchQuery.trim() && currentTab === 1) { // Only apply search for Other Groups tab
        if (searchType === 'keywords') {
          params.append('keywords', searchQuery);
        } else if (searchType === 'topics') {
          params.append('topics', searchQuery);
        } else {
          params.append('search', searchQuery);
        }
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const otherGroupsResponse = await api.get(url); 
      const otherGroupsData = otherGroupsResponse.data || []
      setAllGroups(otherGroupsData)
      
      // Filter out user's own groups from other groups
      if (currentUser) {
        const filteredOtherGroups = otherGroupsData.filter((group: Group) => {
          // Check if current user is a member or adviser
          const isMember = Array.isArray(group.members) 
            ? group.members.some((member: any) => 
                typeof member === 'number' ? member === currentUser.id : member.id === currentUser.id
              )
            : ((group.members || []) as number[]).includes(currentUser.id)
          const isAdviser = typeof group.adviser === 'number' 
            ? group.adviser === currentUser.id 
            : (group.adviser as any)?.id === currentUser.id
          return !isMember && !isAdviser
        })
        setOtherGroups(filteredOtherGroups)
      } else {
        setOtherGroups(otherGroupsData)
      }
    }catch(error) {
      console.error('Failed to load groups:', error);
      setMyGroups([])
      setOtherGroups([])
    } finally {
      setLoading(false)
      // Also load pending proposals if user is admin
      if (currentUser?.role === 'ADMIN') {
        loadPendingProposals();
      }
    }
  }

  async function loadUsers() {
    try {
      console.log('Loading users...');
      
      // Get current user info
      try {
        console.log('Attempting to get current user from users/me...');
        const currentUserRes = await api.get('users/me/');
        console.log('Current user response:', currentUserRes.data);
        
        // Store current user
        const user = currentUserRes.data;
        setCurrentUser(user);
        console.log('Current user set:', user);
        
      } catch (userError) {
        console.error('Failed to get current user from users/me:', userError);
        console.error('Error response:', userError.response?.data);
        
        // If we can't get the current user, we can't proceed
        console.log('Cannot proceed without current user authentication');
        return;
      }
      
      // Load actual users from API
      try {
        console.log('Loading advisers...');
        const advisersRes = await api.get('users/?role=ADVISER');
        console.log('Advisers response:', advisersRes.data);
        setAdvisers(advisersRes.data);
        
        console.log('Loading students...');
        const studentsRes = await api.get('users/?role=STUDENT');
        console.log('Students response:', studentsRes.data);
        setStudents(studentsRes.data);
        
      } catch (usersError) {
        console.error('Failed to load users:', usersError);
        // Set empty arrays if API fails
        setAdvisers([]);
        setStudents([]);
      }
      
    } catch (error) {
      console.error('Failed to load users:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  }

  useEffect(()=>{
    loadUsers();
  },[])

  // Load groups only when currentUser is available
  useEffect(()=>{
    console.log('currentUser changed:', currentUser);
    if (currentUser) {
      load();
    }
  },[currentUser, currentTab, searchQuery, searchType])
  
  async function handleCreate(){ 
    if (!formData.name) {
      alert('Group name is required');
      return; 
    }
    
    // Check if current user is a student and already has an active group
    if (currentUser && currentUser.role === 'STUDENT') {
      if (myGroups.length > 0) {
        const hasPendingGroup = myGroups.some(group => group.status === 'PENDING');
        const hasRejectedGroup = myGroups.some(group => group.status === 'REJECTED');
        
        if (hasPendingGroup) {
          alert('You already have a pending group proposal. Please wait for admin approval before creating a new one.');
        } else if (hasRejectedGroup) {
          alert('You have a rejected group proposal. Please review the rejection reason in your group details before creating a new one.');
        } else {
          alert('You can only be a member of one active research group. Please leave your current group before creating a new one.');
        }
        return;
      }
    }
    
    const groupData = {
      name: formData.name,
      proposed_topic_title: formData.proposed_topic_title || undefined,
      abstract: formData.abstract || undefined,
      keywords: formData.keywords || undefined,
      adviser: formData.adviser ? Number(formData.adviser) : undefined,
      members: formData.members && formData.members.length > 0 ? formData.members : undefined
    };
    
    console.log('Creating group with data:', groupData);
    try {
      await createGroup(groupData); 
      setFormData({ name: '', proposed_topic_title: '', abstract: '', keywords: '', adviser: '', members: [] }); 
      setOpen(false); 
      load();
      alert('Group proposal submitted successfully! It is now pending admin approval.');
    } catch (error: any) {
      console.error('Failed to create group:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.message || 'Failed to create group proposal';
      alert(`Error: ${errorMessage}`);
    }
  }

  // Helper function to check if user is group leader
  const isGroupLeader = (group: Group, user: User | null) => {
    if (!user || !group.leader) return false;
    return typeof group.leader === 'object' ? group.leader.id === user.id : group.leader === user.id;
  };

  // Helper function to check if user is group member
  const isGroupMember = (group: Group, user: User | null) => {
    if (!user || !group.members) return false;
    return group.members.some((member: any) => 
      typeof member === 'object' ? member.id === user.id : member === user.id
    );
  };

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

  return (
    <Box sx={{ p: 4, backgroundColor: '#F8FAFC' }}>
      {/* Welcome Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 6 }}>
        <Box>
          <Typography variant="h3" sx={{ color: '#1E293B', fontWeight: 600, mb: 1 }}>
            Environmental Science Research Groups
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Groups style={{ width: '16px', height: '16px', color: '#10B981' }} />
            <Typography variant="body1" sx={{ color: '#64748B' }}>
              Manage and collaborate with your research teams
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{
            px: 3,
            py: 1.5,
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Groups style={{ width: '16px', height: '16px', color: '#10B981' }} />
            <Typography variant="body2" sx={{ color: '#065F46', fontWeight: 500 }}>
              Team Collaboration
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={()=>setOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              fontWeight: 600,
              borderRadius: 2,
              py: 1.5,
              textTransform: 'none',
              boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                boxShadow: '0 6px 20px 0 rgba(16, 185, 129, 0.4)',
              },
              px: 3
            }}
            data-testid="propose-group-button-top"
          >
            Propose New Group
          </Button>
        </Box>
      </Box>

      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="My Group" />
          <Tab label="Other Groups" />
          {currentUser?.role === 'ADMIN' && <Tab label="Group Proposals" />}
        </Tabs>
      </Box>
      
      {/* My Group Tab */}
      {currentTab === 0 && (
        <>
          {loading ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
                <Typography variant="h6" color="text.secondary">
                  Loading groups...
                </Typography>
              </Box>
            </Paper>
          ) : myGroups.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', border: '2px dashed #CBD5E1' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <Groups style={{ fontSize: 64, color: '#CBD5E1' }} />
                <Box>
                  <Typography variant="h5" sx={{ color: '#475569', fontWeight: 600, mb: 1 }}>
                    No Group Yet
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    You haven't joined or created any research groups yet. As a student, you can only be a member of one active research group.
                  </Typography>
                  <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            disabled={currentUser && currentUser.role === 'STUDENT' && myGroups.length > 0}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
              '&:disabled': { 
                background: '#94a3b8',
                color: '#64748b'
              },
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              boxShadow: '0 6px 20px 0 rgba(16, 185, 129, 0.4)',
            }}
            data-testid="propose-group-button"
          >
            Propose Your First Group
          </Button>
                </Box>
              </Box>
            </Paper>
          ) : (
            <>
              {currentUser && currentUser.role === 'STUDENT' && myGroups.length > 0 && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  {myGroups.some(group => group.status === 'PENDING') 
                    ? "You have a pending group proposal awaiting admin approval. You'll be notified once it's approved."
                    : myGroups.some(group => group.status === 'REJECTED')
                    ? "You have a rejected group proposal. Check the group details to see the rejection reason and resubmit an updated proposal."
                    : "You are currently a member of one research group. As a student, you can only be a member of one active group at a time."
                  }
                </Alert>
              )}
              
              {/* Table view for My Groups */}
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table sx={{ minWidth: 650 }} aria-label="groups table">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f1f5f9' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1e293b' }}>Group</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1e293b' }}>Topic Title</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1e293b' }}>Adviser</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1e293b' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myGroups.map((group) => (
                      <TableRow 
                        key={group.id} 
                        sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#f8fafc' } }}
                      >
                        <TableCell component="th" scope="row">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Groups style={{ marginRight: 8, color: '#10B981' }} />
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{group.name}</Typography>
                            {group.status === 'PENDING' && (
                              <Chip 
                                label="Pending" 
                                size="small" 
                                color="warning" 
                                sx={{ ml: 2, fontSize: '0.7rem' }}
                              />
                            )}
                            {group.status === 'REJECTED' && (
                              <Chip 
                                label="Rejected" 
                                size="small" 
                                color="error" 
                                sx={{ ml: 2, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {group.proposed_topic_title ? (
                            <Typography variant="body2">{group.proposed_topic_title}</Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">No topic specified</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {group.adviser ? (
                            <Typography variant="body2">
                              {typeof group.adviser === 'object' 
                                ? (group.adviser.first_name || group.adviser.last_name 
                                    ? `${group.adviser.first_name} ${group.adviser.last_name}`.trim() 
                                    : group.adviser.email)
                                : typeof group.adviser === 'number'
                                  ? (() => {
                                      const adviser = advisers.find(a => a.id === group.adviser);
                                      return adviser 
                                        ? (adviser.first_name || adviser.last_name 
                                            ? `${adviser.first_name} ${adviser.last_name}`.trim() 
                                            : adviser.email)
                                        : 'Adviser assigned';
                                    })()
                                  : 'Adviser assigned'}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">No adviser</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => {
                                setSelectedGroup(group);
                                setViewDetailsOpen(true);
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                            {currentUser?.role === 'STUDENT' && isGroupLeader(group, currentUser) && group.status === 'PENDING' && (
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to delete your group proposal? This action cannot be undone.')) {
                                    try {
                                      await api.delete(`groups/${group.id}/`);
                                      load();
                                    } catch (error) {
                                      console.error('Failed to delete group:', error);
                                      alert('Failed to delete group proposal');
                                    }
                                  }
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            )}
                            {currentUser?.role === 'STUDENT' && isGroupMember(group, currentUser) && !isGroupLeader(group, currentUser) && (
                              <IconButton 
                                size="small" 
                                color="warning"
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to leave this group?')) {
                                    try {
                                      await api.post(`groups/${group.id}/leave/`);
                                      load();
                                    } catch (error: any) {
                                      alert(error.response?.data?.error || 'Failed to leave group');
                                    }
                                  }
                                }}
                              >
                                <Clear fontSize="small" />
                              </IconButton>
                            )}
                            {group.status === 'REJECTED' && (
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={async () => {
                                  try {
                                    await api.patch(`groups/${group.id}/`, { status: 'PENDING' });
                                    load();
                                  } catch (error) {
                                    console.error('Failed to resubmit proposal:', error);
                                    alert('Failed to resubmit proposal');
                                  }
                                }}
                              >
                                <Check fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </>
      )}
      
      {/* Other Groups Tab */}
      {currentTab === 1 && (
        <>
          {loading ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
                <Typography variant="h6" color="text.secondary">
                  Loading other groups...
                </Typography>
              </Box>
            </Paper>
          ) : otherGroups.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', border: '2px dashed #CBD5E1' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <Groups style={{ fontSize: 64, color: '#CBD5E1' }} />
                <Box>
                  <Typography variant="h5" sx={{ color: '#475569', fontWeight: 600, mb: 1 }}>
                    No Other Groups Available
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    There are no other research groups available to view at this time.
                  </Typography>
                  {currentUser?.role === 'STUDENT' && (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => {
                        setCurrentTab(0); // Switch to "My Group" tab
                        setTimeout(() => {
                          const proposeButton = document.querySelector('[data-testid="propose-group-button"]') as HTMLButtonElement;
                          if (proposeButton) {
                            proposeButton.click();
                          } else {
                            // Fallback: open the dialog directly
                            setOpen(true);
                          }
                        }, 100);
                      }}
                      sx={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3,
                        boxShadow: '0 6px 20px 0 rgba(16, 185, 129, 0.4)',
                      }}
                    >
                      Propose Your Own Group
                    </Button>
                  )}
                </Box>
              </Box>
            </Paper>
          ) : (
            <>
              {/* Search Bar for Other Groups */}
              <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0' }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#1e293b' }}>
                  Search Groups
                </Typography>
                
                <TextField
                  fullWidth
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search style={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                  size="small"
                />
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Search Type</InputLabel>
                    <Select
                      value={searchType}
                      label="Search Type"
                      onChange={(e) => setSearchType(e.target.value as 'all' | 'keywords' | 'topics')}
                    >
                      <MenuItem value="all">All Fields</MenuItem>
                      <MenuItem value="keywords">Keywords Only</MenuItem>
                      <MenuItem value="topics">Topics Only</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Paper>
              
              {/* Table view for Other Groups */}
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="other groups table">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f1f5f9' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1e293b' }}>Group</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1e293b' }}>Topic Title</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1e293b' }}>Adviser</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1e293b' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {otherGroups.map((group) => (
                      <TableRow 
                        key={group.id} 
                        sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#f8fafc' } }}
                      >
                        <TableCell component="th" scope="row">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Groups style={{ marginRight: 8, color: '#10B981' }} />
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{group.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {group.proposed_topic_title ? (
                            <Typography variant="body2">{group.proposed_topic_title}</Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">No topic specified</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {group.adviser ? (
                            <Typography variant="body2">
                              {typeof group.adviser === 'object' 
                                ? (group.adviser.first_name || group.adviser.last_name 
                                    ? `${group.adviser.first_name} ${group.adviser.last_name}`.trim() 
                                    : group.adviser.email)
                                : typeof group.adviser === 'number'
                                  ? (() => {
                                      const adviser = advisers.find(a => a.id === group.adviser);
                                      return adviser 
                                        ? (adviser.first_name || adviser.last_name 
                                            ? `${adviser.first_name} ${adviser.last_name}`.trim() 
                                            : adviser.email)
                                        : 'Adviser assigned';
                                    })()
                                  : 'Adviser assigned'}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">No adviser</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => {
                                setSelectedGroup(group);
                                setViewDetailsOpen(true);
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                            {currentUser?.role === 'STUDENT' && (
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={async () => {
                                  // Request to join group functionality
                                  alert('Request to join group functionality coming soon');
                                }}
                              >
                                <PersonAdd fontSize="small" />
                              </IconButton>
                            )}
                            {currentUser?.role === 'ADMIN' && (
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
                                    try {
                                      await api.delete(`groups/${group.id}/`);
                                      load();
                                    } catch (error) {
                                      console.error('Failed to delete group:', error);
                                      alert('Failed to delete group');
                                    }
                                  }
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </>
      )}
      
      {/* Group Proposals Tab - Admin Only */}
      {currentUser?.role === 'ADMIN' && currentTab === 2 && (
        <>
          {loading ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
                <Typography variant="h6" color="text.secondary">
                  Loading group proposals...
                </Typography>
              </Box>
            </Paper>
          ) : pendingProposals.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', border: '2px dashed #CBD5E1' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <Groups style={{ fontSize: 64, color: '#CBD5E1' }} />
                <Box>
                  <Typography variant="h5" sx={{ color: '#475569', fontWeight: 600, mb: 1 }}>
                    No Pending Group Proposals
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    There are no group proposals waiting for approval at this time.
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ) : (
            <>
              <Typography variant="h6" sx={{ mb: 3, color: '#1e293b' }}>
                Pending Group Proposals ({pendingProposals.length})
              </Typography>
              
              {/* Table view for Pending Proposals */}
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="pending proposals table">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#fffbeb' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1e293b' }}>Group</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1e293b' }}>Topic Title</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1e293b' }}>Adviser</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1e293b' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingProposals.map((group) => (
                      <TableRow 
                        key={group.id} 
                        sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#fffbeb' } }}
                      >
                        <TableCell component="th" scope="row">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Groups style={{ marginRight: 8, color: '#f59e0b' }} />
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{group.name}</Typography>
                            <Chip 
                              label="Pending" 
                              size="small" 
                              color="warning" 
                              sx={{ ml: 2, fontSize: '0.7rem' }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          {group.proposed_topic_title ? (
                            <Typography variant="body2">{group.proposed_topic_title}</Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">No topic specified</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {group.adviser ? (
                            <Typography variant="body2">
                              {typeof group.adviser === 'object' 
                                ? (group.adviser.first_name || group.adviser.last_name 
                                    ? `${group.adviser.first_name} ${group.adviser.last_name}`.trim() 
                                    : group.adviser.email)
                                : typeof group.adviser === 'number'
                                  ? (() => {
                                      const adviser = advisers.find(a => a.id === group.adviser);
                                      return adviser 
                                        ? (adviser.first_name || adviser.last_name 
                                            ? `${adviser.first_name} ${adviser.last_name}`.trim() 
                                            : adviser.email)
                                        : 'Adviser assigned';
                                    })()
                                  : 'Adviser assigned'}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">No adviser</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => {
                                setSelectedGroup(group);
                                setViewDetailsOpen(true);
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={async () => {
                                try {
                                  await api.post(`groups/${group.id}/approve/`);
                                  // Refresh the proposals list
                                  loadPendingProposals();
                                  // Also refresh main groups list
                                  load();
                                } catch (error) {
                                  console.error('Failed to approve group:', error);
                                  alert('Failed to approve group proposal');
                                }
                              }}
                            >
                              <Check fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => {
                                setSelectedGroupForRejection(group);
                                setRejectionReason('');
                                setRejectProposalOpen(true);
                              }}
                            >
                              <Clear fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="info"
                              onClick={() => {
                                // Open adviser assignment dialog
                                setSelectedGroupForAdviser(group);
                                setSelectedAdviserId(group.adviser ? (typeof group.adviser === 'object' ? group.adviser.id : group.adviser) : null);
                                setAssignAdviserOpen(true);
                              }}
                            >
                              <Assignment fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </>
      )}
      
      <Dialog open={assignAdviserOpen} onClose={() => setAssignAdviserOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: '#1e293b' }}>
            Assign Adviser
          </Typography>
          
          {selectedGroupForAdviser && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#1e293b', mb: 1 }}>
                {selectedGroupForAdviser.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedGroupForAdviser.proposed_topic_title || 'No topic specified'}
              </Typography>
            </Box>
          )}
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Adviser</InputLabel>
            <Select
              value={selectedAdviserId || ''}
              label="Select Adviser"
              onChange={(e) => setSelectedAdviserId(e.target.value === '' ? null : Number(e.target.value))}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {advisers.map(adviser => (
                <MenuItem key={adviser.id} value={adviser.id}>
                  <Box sx={{ width: '100%', lineHeight: 1.4 }}>
                    {adviser.first_name ? `${adviser.first_name} ${adviser.last_name || ''}` : adviser.email}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={() => setAssignAdviserOpen(false)} sx={{ minWidth: 100 }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={async () => {
                if (selectedGroupForAdviser && selectedAdviserId) {
                  try {
                    await assignAdviser(selectedGroupForAdviser.id, selectedAdviserId);
                    setAssignAdviserOpen(false);
                    loadPendingProposals();
                    load();
                  } catch (error) {
                    console.error('Failed to assign adviser:', error);
                    alert('Failed to assign adviser');
                  }
                }
              }}
              disabled={!selectedGroupForAdviser || !selectedAdviserId}
              sx={{ 
                minWidth: 120,
                backgroundColor: '#3b82f6',
                '&:hover': { backgroundColor: '#2563eb' },
                '&:disabled': {
                  backgroundColor: '#94a3b8',
                  color: '#64748b'
                }
              }}
            >
              Assign
            </Button>
          </Box>
        </Box>
      </Dialog>
      
      <Dialog open={rejectProposalOpen} onClose={() => setRejectProposalOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: '#1e293b' }}>
            Reject Group Proposal
          </Typography>
          
          {selectedGroupForRejection && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#1e293b', mb: 1 }}>
                {selectedGroupForRejection.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedGroupForRejection.proposed_topic_title || 'No topic specified'}
              </Typography>
            </Box>
          )}
          
          <TextField
            fullWidth
            label="Rejection Reason (Optional)"
            placeholder="Enter the reason for rejecting this group proposal..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            multiline
            rows={4}
            sx={{ mb: 3 }}
            helperText="Optionally provide a detailed reason for rejecting the group proposal"
          />
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={() => setRejectProposalOpen(false)} sx={{ minWidth: 100 }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={async () => {
                if (selectedGroupForRejection) {
                  try {
                    const payload: any = {};
                    if (rejectionReason) {
                      payload.rejection_reason = rejectionReason;
                    }
                    await api.patch(`groups/${selectedGroupForRejection.id}/reject/`, payload);
                    setRejectProposalOpen(false);
                    setRejectionReason('');
                    loadPendingProposals();
                    load();
                  } catch (error) {
                    console.error('Failed to reject group proposal:', error);
                    alert('Failed to reject group proposal');
                  }
                }
              }}
              sx={{ 
                minWidth: 120,
                backgroundColor: '#ef4444',
                '&:hover': { backgroundColor: '#dc2626' }
              }}
            >
              Reject
            </Button>
          </Box>
        </Box>
      </Dialog>

      <Dialog open={viewDetailsOpen} onClose={() => setViewDetailsOpen(false)} maxWidth="md" fullWidth>
        <Box sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b' }}>
              Group Details
            </Typography>
            <IconButton onClick={() => setViewDetailsOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          
          {selectedGroup && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: '#1e293b', mb: 2 }}>Group Information</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Group Name</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedGroup.name}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip 
                      label={selectedGroup.status} 
                      size="small" 
                      color={selectedGroup.status === 'APPROVED' ? 'success' : selectedGroup.status === 'PENDING' ? 'warning' : selectedGroup.status === 'REJECTED' ? 'error' : 'default'}
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Topic Title</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedGroup.proposed_topic_title || 'No topic specified'}
                    </Typography>
                  </Box>
                  {selectedGroup.abstract && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Abstract</Typography>
                      <Typography variant="body2">{selectedGroup.abstract}</Typography>
                    </Box>
                  )}
                  {selectedGroup.keywords && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Keywords</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {selectedGroup.keywords.split(',').map((keyword, index) => (
                          <Chip 
                            key={index} 
                            label={keyword.trim()} 
                            size="small" 
                            variant="outlined" 
                            sx={{ fontSize: '0.75rem' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                  {selectedGroup.rejection_reason && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Rejection Reason</Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{selectedGroup.rejection_reason}</Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: '#1e293b', mb: 2 }}>Group Leader</Typography>
                  {selectedGroup.leader ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, backgroundColor: '#f8fafc', borderRadius: 2 }}>
                      <Avatar sx={{ width: 48, height: 48, fontSize: '1.2rem', bgcolor: '#10b981' }}>
                        {typeof selectedGroup.leader === 'object' 
                          ? (selectedGroup.leader.first_name?.charAt(0) || selectedGroup.leader.email.charAt(0))
                          : 'L'}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {typeof selectedGroup.leader === 'object' && selectedGroup.leader !== null
                            ? (selectedGroup.leader.first_name || selectedGroup.leader.last_name 
                                ? `${selectedGroup.leader.first_name} ${selectedGroup.leader.last_name}`.trim() 
                                : selectedGroup.leader.email)
                            : 'Leader'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Proposed this group
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, p: 2, backgroundColor: '#f8fafc', borderRadius: 2 }}>No leader assigned</Typography>
                  )}
                  
                  <Typography variant="h6" sx={{ color: '#1e293b', mb: 2 }}>Members</Typography>
                  {selectedGroup.members && selectedGroup.members.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {selectedGroup.members
                        .filter((member: any) => {
                          // Exclude the leader from the members list
                          if (typeof selectedGroup.leader === 'object' && selectedGroup.leader !== null) {
                            // Leader is an object, compare IDs
                            return member.id !== (selectedGroup.leader as User).id;
                          } else if (typeof selectedGroup.leader === 'number') {
                            // Leader is an ID, compare directly
                            return member.id !== selectedGroup.leader;
                          }
                          // If leader is null or undefined, include all members
                          return true;
                        })
                        .map((member: any) => (
                          <Box key={member.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                              {member.first_name?.charAt(0) || member.email.charAt(0)}
                            </Avatar>
                            <Typography variant="body2">
                              {member.first_name || member.last_name 
                                ? `${member.first_name} ${member.last_name}`.trim() 
                                : member.email}
                            </Typography>
                          </Box>
                        ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No other members</Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: '#1e293b', mb: 2 }}>Adviser</Typography>
                  {selectedGroup.adviser ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                        {typeof selectedGroup.adviser === 'object' 
                          ? (selectedGroup.adviser.first_name?.charAt(0) || selectedGroup.adviser.email.charAt(0))
                          : 'A'}
                      </Avatar>
                      <Typography variant="body2">
                        {typeof selectedGroup.adviser === 'object' 
                          ? (selectedGroup.adviser.first_name || selectedGroup.adviser.last_name 
                              ? `${selectedGroup.adviser.first_name} ${selectedGroup.adviser.last_name}`.trim() 
                              : selectedGroup.adviser.email)
                          : 'Adviser'}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No adviser assigned</Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: '#1e293b', mb: 2 }}>Panel Members</Typography>
                  {selectedGroup.panels && selectedGroup.panels.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {selectedGroup.panels.map((panel) => (
                        <Box key={panel.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                            {panel.first_name?.charAt(0) || panel.email.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">
                            {panel.first_name || panel.last_name 
                              ? `${panel.first_name} ${panel.last_name}`.trim() 
                              : panel.email}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No panel members assigned</Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Dialog>
      
      {/* Group Creation Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
            Propose New Research Group
          </Typography>
          
          <TextField
            fullWidth
            label="Group Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          
          <TextField
            fullWidth
            label="Proposed Topic Title"
            value={formData.proposed_topic_title || ''}
            onChange={(e) => setFormData({ ...formData, proposed_topic_title: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Abstract"
            value={formData.abstract || ''}
            onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Keywords (comma separated)"
            value={formData.keywords || ''}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            helperText="Enter keywords related to your research topic, separated by commas"
            sx={{ mb: 3 }}
          />
          
          {advisers.length > 0 && (
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Preferred Adviser (Optional)</InputLabel>
              <Select
                value={formData.adviser || ''}
                label="Preferred Adviser (Optional)"
                onChange={(e) => setFormData({ ...formData, adviser: e.target.value })}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {advisers
                  .filter(adviser => adviser.role === 'ADVISER')
                  .map((adviser) => (
                    <MenuItem key={adviser.id} value={adviser.id}>
                      {adviser.first_name && adviser.last_name 
                        ? `${adviser.first_name} ${adviser.last_name}`
                        : adviser.first_name || adviser.last_name || adviser.email}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={() => setOpen(false)} sx={{ minWidth: 100 }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCreate}
              disabled={!formData.name.trim()}
              sx={{ 
                minWidth: 120,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
                '&:disabled': {
                  background: '#94a3b8',
                  color: '#64748b'
                }
              }}
            >
              Propose Group
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  )
}
