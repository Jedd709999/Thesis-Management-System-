import React, { useEffect, useState } from 'react'
import { Container, Typography, Button, Dialog, TextField, Box, List, ListItem, ListItemText, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Chip } from '@mui/material'
import { Users, Leaf } from 'lucide-react'
import { Add } from '@mui/icons-material'
import { listGroups, createGroup } from '../../api/groupService'
import { useNavigate } from 'react-router-dom'
import api from '../../api/api'

interface GroupData {
  name: string
  adviser?: number
  members?: number[]
}

interface User {
  id: number
  first_name?: string
  last_name?: string
  email: string
  role: string
}

export default function GroupListPage(){
  const [groups, setGroups] = useState<Group[]>([])
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', adviser: '', members: [] as number[] })
  const [advisers, setAdvisers] = useState<User[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const navigate = useNavigate()

  async function load(){ 
    try{ 
      const r = await listGroups(); 
      setGroups(r.data) 
    }catch{} 
  }

  async function loadUsers() {
    try {
      console.log('Loading users...');
      
      // Try different approaches to get user data
      let adviserData = [];
      let studentData = [];
      
      // Approach 1: Try to get current user info first
      try {
        const currentUserRes = await api.get('users/me/');
        console.log('Current user response:', currentUserRes.data);
        
        // Store current user
        const user = currentUserRes.data;
        setCurrentUser(user);
        console.log('Current user set:', user);
        
        // If we can get current user, try other endpoints
        const currentUser = currentUserRes.data;
        console.log('Current user role:', currentUser.role);
        
        // Approach 2: Try different endpoint patterns
        const endpoints = [
          'users/',
          'auth/users/',
          'accounts/users/',
          'api/users/',
          'user/',
          'profile/'
        ];
        
        for (const endpoint of endpoints) {
          try {
            console.log(`Trying endpoint: ${endpoint}`);
            const res = await api.get(endpoint);
            console.log(`Success with ${endpoint}:`, res.data);
            
            let userData = [];
            if (res.data.results) {
              userData = res.data.results;
            } else if (Array.isArray(res.data)) {
              userData = res.data;
            } else if (res.data) {
              userData = [res.data];
            }
            
            // Filter by role
            adviserData = userData.filter(u => u.role === 'ADVISER');
            studentData = userData.filter(u => u.role === 'STUDENT');
            
            // Filter out current user from students dropdown
            if (user && user.role === 'STUDENT') {
              studentData = studentData.filter(s => s.id !== user.id);
              console.log('Filtered out current user from students dropdown');
            }
            
            if (adviserData.length > 0 || studentData.length > 0) {
              console.log(`Found ${adviserData.length} advisers and ${studentData.length} students`);
              break;
            }
          } catch (endpointError) {
            console.log(`Endpoint ${endpoint} failed:`, endpointError.response?.status);
          }
        }
        
      } catch (currentUserError) {
        console.error('Could not get current user:', currentUserError);
        
        // Approach 3: Create mock data for testing if no endpoints work
        console.log('Creating mock data for testing...');
        adviserData = [
          { id: 1, first_name: 'Dr. John', last_name: 'Smith', email: 'john.smith@university.edu', role: 'ADVISER' },
          { id: 2, first_name: 'Dr. Jane', last_name: 'Doe', email: 'jane.doe@university.edu', role: 'ADVISER' }
        ];
        studentData = [
          { id: 3, first_name: 'Alice', last_name: 'Johnson', email: 'alice.j@university.edu', role: 'STUDENT' },
          { id: 4, first_name: 'Bob', last_name: 'Wilson', email: 'bob.w@university.edu', role: 'STUDENT' }
        ];
        console.log('Using mock data - advisers:', adviserData.length, 'students:', studentData.length);
      }
      
      setAdvisers(adviserData);
      setStudents(studentData);
      console.log('Final advisers set:', adviserData.length);
      console.log('Final students set:', studentData.length);
      
      // Debug: Log sample data
      if (adviserData.length > 0) {
        console.log('Sample adviser:', adviserData[0]);
      }
      if (studentData.length > 0) {
        console.log('Sample student:', studentData[0]);
      }
      
    } catch (error) {
      console.error('Failed to load users:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Fallback to mock data
      setAdvisers([
        { id: 1, first_name: 'Dr. John', last_name: 'Smith', email: 'john.smith@university.edu', role: 'ADVISER' }
      ]);
      setStudents([
        { id: 2, first_name: 'Alice', last_name: 'Johnson', email: 'alice.j@university.edu', role: 'STUDENT' }
      ]);
    }
  }

  useEffect(()=>{ 
    load(); 
    loadUsers();
  },[])
  
  async function handleCreate(){ 
    if (!formData.name) return; 
    
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
      adviser: formData.adviser || undefined,
      members: members
    };
    
    console.log('Creating group with data:', groupData);
    await createGroup(groupData); 
    setFormData({ name: '', adviser: '', members: [] }); 
    setOpen(false); 
    load() 
  }

  return (
    <Box sx={{ p: 4, backgroundColor: '#F8FAFC' }}>
      {/* Welcome Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 6 }}>
        <Box>
          <Typography variant="h3" sx={{ color: '#1E293B', fontWeight: 600, mb: 1 }}>
            Research Groups
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
              backgroundColor: '#10B981',
              '&:hover': { backgroundColor: '#059669' },
              borderRadius: 2,
              textTransform: 'none',
              px: 3
            }}
          >
            Propose Group
          </Button>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ px: 0 }}>
        <Typography variant="h4">Groups</Typography>
      <List sx={{ mt:2 }}>
        {groups.map(g=> <ListItem key={g.id} button onClick={()=>navigate(`/groups/${g.id}`)}><ListItemText primary={g.name} secondary={`Members: ${g.members?.length || 0}`} /></ListItem>)}
      </List>
      {groups.length === 0 && (
        <Box sx={{ mt: 2, p: 3, bgcolor: 'info.light', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
          <Typography variant="body2" color="info.dark" sx={{ fontWeight: 600, mb: 1 }}>
            No groups available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Groups are essential for thesis collaboration and progress tracking. Here's what you can do:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            <ul style={{ margin: 0, paddingLeft: '1.5em' }}>
              <li>Create a new group using the "Propose Group" button above</li>
              <li>Contact your adviser to be assigned to an existing group</li>
              <li>Ask fellow students if you can join their group</li>
              <li>Check with your department about group formation guidelines</li>
            </ul>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Once you're in a group, you'll be able to create and collaborate on thesis projects together.
          </Typography>
        </Box>
      )}
      <Dialog open={open} onClose={()=>setOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 4, minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: '#1e293b' }}>
            Create Research Group
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Set up a new research group for thesis collaboration and progress tracking.
          </Typography>
          
          <TextField 
            fullWidth 
            label="Group Name" 
            placeholder="e.g., Environmental Research Team"
            sx={{ mb: 3 }} 
            value={formData.name} 
            onChange={e=>setFormData({...formData, name: e.target.value})} 
            helperText="Give your group a descriptive name"
            variant="outlined"
            InputLabelProps={{
              sx: {
                backgroundColor: 'white',
                px: 1
              }
            }}
          />
          
          <FormControl fullWidth sx={{ mb: 3 }} variant="outlined">
            <InputLabel 
              id="adviser-label" 
              sx={{ 
                backgroundColor: 'white', 
                px: 1,
                '&.Mui-focused': {
                  backgroundColor: 'white'
                }
              }}
            >
              Preferred Adviser
            </InputLabel>
            <Select
              labelId="adviser-label"
              value={formData.adviser || ''}
              label="Preferred Adviser"
              onChange={e => setFormData({...formData, adviser: Number(e.target.value)})}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 200,
                    '& .MuiMenuItem-root': {
                      whiteSpace: 'normal',
                      overflow: 'visible',
                      textOverflow: 'clip',
                      py: 1.5
                    }
                  }
                }
              }}
            >
              {advisers.length === 0 ? (
                <MenuItem disabled sx={{ py: 1.5 }}>
                  <em>No advisers available ({advisers.length} loaded)</em>
                </MenuItem>
              ) : (
                advisers.map(adviser => (
                  <MenuItem key={adviser.id} value={adviser.id} sx={{ py: 1.5 }}>
                    <Box sx={{ width: '100%', lineHeight: 1.4 }}>
                      {adviser.first_name ? `${adviser.first_name} ${adviser.last_name || ''}` : adviser.email}
                    </Box>
                  </MenuItem>
                ))
              )}
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1 }}>
              Optional: Select your preferred adviser. Final adviser assignment will be confirmed by the department. (Debug: {advisers.length} advisers loaded)
            </Typography>
          </FormControl>
          
          <FormControl fullWidth sx={{ mb: 4 }} variant="outlined">
            <InputLabel 
              id="members-label" 
              sx={{ 
                backgroundColor: 'white', 
                px: 1,
                '&.Mui-focused': {
                  backgroundColor: 'white'
                }
              }}
            >
              Members
            </InputLabel>
            <Select
              labelId="members-label"
              multiple
              value={formData.members || []}
              onChange={e => {
                const value = e.target.value;
                const memberIds = Array.isArray(value) ? value.map(Number) : [Number(value)];
                setFormData({...formData, members: memberIds});
              }}
              input={<OutlinedInput label="Members" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as number[]).map(id => {
                    const student = students.find(s => s.id === id);
                    return (
                      <Chip 
                        key={id} 
                        label={student ? (student.first_name ? `${student.first_name} ${student.last_name || ''}` : student.email) : id} 
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
                      whiteSpace: 'normal',
                      overflow: 'visible',
                      textOverflow: 'clip',
                      py: 1.5
                    }
                  }
                }
              }}
            >
              {students.length === 0 ? (
                <MenuItem disabled sx={{ py: 1.5 }}>
                  <em>No students available</em>
                </MenuItem>
              ) : (
                students.map(student => (
                  <MenuItem key={student.id} value={student.id} sx={{ py: 1.5 }}>
                    <Box sx={{ width: '100%', lineHeight: 1.4 }}>
                      {student.first_name ? `${student.first_name} ${student.last_name || ''}` : student.email}
                    </Box>
                  </MenuItem>
                ))
              )}
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1 }}>
              {currentUser?.role === 'STUDENT' 
                ? "Optional: Select additional students to add as group members (You're automatically included)"
                : "Optional: Select students to add as group members"
              }
            </Typography>
          </FormControl>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 'auto' }}>
            <Button onClick={() => setOpen(false)} sx={{ minWidth: 100 }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCreate}
              disabled={!formData.name.trim()}
              sx={{ 
                minWidth: 120,
                backgroundColor: '#10B981',
                '&:hover': { backgroundColor: '#059669' },
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              Create Group
            </Button>
          </Box>
        </Box>
      </Dialog>
      </Container>
    </Box>
  )
}
