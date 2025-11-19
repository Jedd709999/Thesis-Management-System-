import React, { useEffect, useState } from 'react'
import { Container, Typography, Button, Dialog, TextField, Box, List, ListItem, ListItemText, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Chip, InputAdornment, Tabs, Tab, Grid, Paper, LinearProgress, Alert } from '@mui/material'
import { Users, Leaf, Search, Plus as Add, Users as Group } from 'lucide-react'
import { listGroups, createGroup, getCurrentUserGroups } from '../../api/groupService'
import { useNavigate } from 'react-router-dom'
import api from '../../api/api'

interface GroupData {
  name: string
  possible_topics?: string
  keywords?: string
  adviser?: number
  members?: number[]
}

interface Group {
  id: number
  name: string
  possible_topics?: string
  keywords?: string
  members?: number[] | User[]
  adviser?: number | User | null
  panels?: number[] | User[]
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
  const [formData, setFormData] = useState({ name: '', possible_topics: '', keywords: '', adviser: '', members: [] as number[] })
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
      
      // Set some basic mock data for advisers and students for now
      setAdvisers([
        { id: 1, first_name: 'Dr. John', last_name: 'Smith', email: 'john.smith@university.edu', role: 'ADVISER' }
      ]);
      setStudents([
        { id: 2, first_name: 'Alice', last_name: 'Johnson', email: 'alice.j@university.edu', role: 'STUDENT' }
      ]);
      
    } catch (error) {
      console.error('Failed to load users:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  }

  useEffect(()=>{
    loadUsers();
  },[searchQuery, searchType, currentTab])

  // Load groups only when currentUser is available
  useEffect(()=>{
    console.log('currentUser changed:', currentUser);
    if (currentUser) {
      load();
    }
  },[currentUser])
  
  async function handleCreate(){ 
    if (!formData.name) return; 
    
    // Check if current user is a student and already has an active group
    if (currentUser && currentUser.role === 'STUDENT') {
      if (myGroups.length > 0) {
        const hasPendingGroup = myGroups.some(group => group.status === 'PENDING');
        if (hasPendingGroup) {
          alert('You already have a pending group proposal. Please wait for admin approval before creating a new one.');
        } else {
          alert('You can only be a member of one active research group. Please leave your current group before creating a new one.');
        }
        return;
      }
    }
    
    // Automatically include current user as member if they're a student
    let members = [...formData.members];
    if (currentUser && currentUser.role === 'STUDENT') {
      if (!members.includes(currentUser.id)) {
        members.push(currentUser.id);
        console.log('Added current user as member:', currentUser.id);
      }
    }
    
    const groupData = {
      name: formData.name,
      possible_topics: formData.possible_topics || undefined,
      keywords: formData.keywords || undefined,
      adviser: formData.adviser ? Number(formData.adviser) : undefined,
      members: members
    };
    
    console.log('Creating group with data:', groupData);
    await createGroup(groupData); 
    setFormData({ name: '', possible_topics: '', keywords: '', adviser: '', members: [] }); 
    setOpen(false); 
    load() 
  }

  return (
    <Box sx={{ p: 4, backgroundColor: '#F8FAFC' }}>
      {/* Welcome Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 6 }}>
        <Box>
          <Typography variant="h3" sx={{ color: '#1E293B', fontWeight: 600, mb: 1 }}>
            Environmental Science Research Groups
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Users style={{ width: '16px', height: '16px', color: '#10B981' }} />
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
            <Leaf style={{ width: '16px', height: '16px', color: '#10B981' }} />
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
          >
            Propose Group
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
                <Users style={{ fontSize: 64, color: '#CBD5E1' }} />
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
          >
            Propose Group
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
                    : "You are currently a member of one research group. As a student, you can only be a member of one active group at a time."
                  }
                </Alert>
              )}
              <Grid container spacing={3}>
              {myGroups.map(group => (
                <Grid item xs={12} md={6} lg={4} key={group.id}>
                  <Paper sx={{ p: 3, border: '1px solid #e2e8f0', '&:hover': { boxShadow: 3, cursor: 'pointer' } }} onClick={() => navigate(`/groups/${group.id}`)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Users style={{ marginRight: 8, color: '#10B981' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {group.name}
                      </Typography>
                      {group.status === 'PENDING' && (
                        <Chip 
                          label="Pending" 
                          size="small" 
                          color="warning" 
                          sx={{ ml: 2, fontSize: '0.75rem' }}
                        />
                      )}
                    </Box>
                    
                    {group.status === 'PENDING' && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Your group proposal is pending admin approval. You'll be notified once it's approved.
                      </Alert>
                    )}
                    
                    {group.possible_topics && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b' }}>Topics:</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {group.possible_topics.split('\n').filter(t => t.trim()).map((topic, idx) => (
                            <Chip key={idx} label={topic.trim()} size="small" variant="outlined" color="primary" />
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    {group.keywords && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b' }}>Keywords:</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {group.keywords.split(',').map(k => k.trim()).filter(k => k).map((keyword, idx) => (
                            <Chip key={idx} label={keyword} size="small" color="secondary" />
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {Array.isArray(group.members) ? group.members.length : 0} members
                      </Typography>
                      <Button size="small" variant="outlined">View Details</Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
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
                <Users style={{ fontSize: 64, color: '#CBD5E1' }} />
                <Box>
                  <Typography variant="h5" sx={{ color: '#475569', fontWeight: 600, mb: 1 }}>
                    No Other Groups Available
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    There are no other research groups available to view at this time.
                  </Typography>
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
              
              <Grid container spacing={3}>
                {otherGroups.map(group => (
                  <Grid item xs={12} md={6} lg={4} key={group.id}>
                    <Paper sx={{ p: 3, border: '1px solid #e2e8f0', '&:hover': { boxShadow: 3, cursor: 'pointer' } }} onClick={() => navigate(`/groups/${group.id}`)}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Users style={{ marginRight: 8, color: '#10B981' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {group.name}
                        </Typography>
                      </Box>
                      
                      {group.possible_topics && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b' }}>Topics:</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {group.possible_topics.split('\n').filter(t => t.trim()).map((topic, idx) => (
                              <Chip key={idx} label={topic.trim()} size="small" variant="outlined" color="primary" />
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      {group.keywords && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b' }}>Keywords:</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {group.keywords.split(',').map(k => k.trim()).filter(k => k).map((keyword, idx) => (
                              <Chip key={idx} label={keyword} size="small" color="secondary" />
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {Array.isArray(group.members) ? group.members.length : 0} members
                        </Typography>
                        <Button size="small" variant="outlined">View Details</Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
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
                <Users style={{ fontSize: 64, color: '#CBD5E1' }} />
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
              <Grid container spacing={3}>
                {pendingProposals.map(group => (
                  <Grid item xs={12} md={6} lg={4} key={group.id}>
                    <Paper sx={{ p: 3, border: '1px solid #fbbf24', bgcolor: '#fffbeb', '&:hover': { boxShadow: 3 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Users style={{ marginRight: 8, color: '#f59e0b' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {group.name}
                        </Typography>
                        <Chip 
                          label="Pending" 
                          size="small" 
                          color="warning" 
                          sx={{ ml: 2, fontSize: '0.75rem' }}
                        />
                      </Box>
                      
                      {group.possible_topics && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b' }}>Topics:</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {group.possible_topics.split('\n').filter(t => t.trim()).map((topic, idx) => (
                              <Chip key={idx} label={topic.trim()} size="small" variant="outlined" color="primary" />
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      {group.keywords && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b' }}>Keywords:</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {group.keywords.split(',').map(k => k.trim()).filter(k => k).map((keyword, idx) => (
                              <Chip key={idx} label={keyword} size="small" color="secondary" />
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {Array.isArray(group.members) ? group.members.length : 0} members
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            onClick={() => navigate(`/groups/${group.id}`)}
                          >
                            View Details
                          </Button>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1, mt: 2, pt: 2, borderTop: '1px solid #fbbf24' }}>
                        <Button 
                          size="small" 
                          variant="contained" 
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
                          sx={{ flex: 1 }}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="error"
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to reject this group proposal?')) {
                              try {
                                await api.post(`groups/${group.id}/reject/`);
                                // Refresh the proposals list
                                loadPendingProposals();
                                // Also refresh main groups list
                                load();
                              } catch (error) {
                                console.error('Failed to reject group:', error);
                                alert('Failed to reject group proposal');
                              }
                            }
                          }}
                          sx={{ flex: 1 }}
                        >
                          Reject
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </>
      )}
      
      <Dialog open={open} onClose={()=>setOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 4, minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: '#1e293b' }}>
            Propose Research Group
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Set up a new research group proposal for thesis collaboration and progress tracking.
          </Typography>
          
          {currentUser?.role === 'STUDENT' && myGroups.length > 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {myGroups.some(group => group.status === 'PENDING')
                ? "You already have a pending group proposal. Please wait for admin approval before creating a new one."
                : "You can only be a member of one active research group. Please leave your current group before creating a new one."}
            </Alert>
          )}
          
          <TextField 
            fullWidth 
            label="Group Name"
            placeholder="e.g., Climate Change Research Team"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            sx={{ mb: 3 }}
            helperText="Give your research group a descriptive name"
          />
          
          <TextField
            fullWidth
            label="Possible Research Topics"
            placeholder="Climate Change Impact Assessment&#10;Renewable Energy Systems&#10;Biodiversity Conservation&#10;Water Quality Management&#10;Sustainable Agriculture"
            value={formData.possible_topics}
            onChange={(e) => setFormData({...formData, possible_topics: e.target.value})}
            multiline
            rows={4}
            sx={{ mb: 3 }}
            helperText="List potential research topics for your group proposal (one per line)"
          />
          
          <TextField
            fullWidth
            label="Keywords"
            placeholder="climate change, renewable energy, biodiversity, water quality, sustainability, environmental impact"
            value={formData.keywords}
            onChange={(e) => setFormData({...formData, keywords: e.target.value})}
            sx={{ mb: 3 }}
            helperText="Comma-separated keywords for search and tagging"
          />
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Adviser</InputLabel>
            <Select
              value={formData.adviser}
              label="Adviser"
              onChange={(e) => setFormData({...formData, adviser: e.target.value === '' ? '' : String(e.target.value)})}
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
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1 }}>
              Optional: Select your preferred adviser. Final adviser assignment will be confirmed by the department. (Debug: {advisers.length} advisers loaded)
            </Typography>
          </FormControl>
          
          <FormControl fullWidth sx={{ mb: 4 }}>
            <InputLabel>Members</InputLabel>
            <Select
              multiple
              value={formData.members}
              label="Members"
              onChange={(e) => {
                const value = e.target.value;
                setFormData({...formData, members: typeof value === 'string' ? [Number(value)] : value.map(Number)});
              }}
              input={<OutlinedInput label="Members" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const student = students.find(s => s.id === value);
                    return (
                      <Chip
                        key={value}
                        label={student ? (
                          student.first_name ? `${student.first_name} ${student.last_name || ''}` : student.email
                        ) : value}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 200,
                    '& .MuiMenuItem-root': {
                      height: 'auto',
                      py: 1
                    }
                  }
                }
              }}
            >
              {students.map(student => (
                <MenuItem key={student.id} value={student.id}>
                  <Box sx={{ width: '100%', lineHeight: 1.4 }}>
                    {student.first_name ? `${student.first_name} ${student.last_name || ''}` : student.email}
                  </Box>
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1 }}>
              {currentUser?.role === 'STUDENT' 
                ? "Optional: Select additional students to add as group members (You're automatically included)"
                : "Optional: Select students to add as group members"
              }
            </Typography>
          </FormControl>
          
          <Box sx={{ mt: 'auto', display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={() => setOpen(false)} sx={{ minWidth: 100 }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCreate}
              disabled={!formData.name.trim() || (currentUser?.role === 'STUDENT' && myGroups.length > 0)}
              sx={{ 
                minWidth: 120,
                backgroundColor: '#10B981',
                '&:hover': { backgroundColor: '#059669' },
                borderRadius: 2,
                textTransform: 'none',
                '&:disabled': {
                  backgroundColor: '#94a3b8',
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
