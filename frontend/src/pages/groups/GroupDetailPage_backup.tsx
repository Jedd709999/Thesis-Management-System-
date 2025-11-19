import React, { useEffect, useState, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Button,
  Box,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { Users, Leaf } from 'lucide-react';
import { getGroup, addMember, removeMember, assignAdviser, assignPanels } from '../../api/groupService';
import api from '../../api/api';
import { AuthContext } from '../../context/AuthContext';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role?: string;
}

interface Group {
  id: number;
  name: string;
  possible_topics?: string;
  keywords?: string;
  members: User[] | number[];
  adviser: User | number | null;
  panels: User[] | number[];
  [key: string]: any;
}

type Severity = 'success' | 'error' | 'warning' | 'info';

interface SnackState {
  open: boolean;
  msg: string;
  severity: Severity;
}

export default function GroupDetailPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const gid = Number(id);
  // Temporary fallback for testing
  // const user = { role: 'ADMIN' };
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [advisers, setAdvisers] = useState<User[]>([]);
  const [panels, setPanels] = useState<User[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [addingUserId, setAddingUserId] = useState<number | null>(null);
  const [selectedAdviser, setSelectedAdviser] = useState<number | null>(null);
  const [selectedPanels, setSelectedPanels] = useState<number[]>([]);
  const [editTopics, setEditTopics] = useState(false);
  const [editKeywords, setEditKeywords] = useState(false);
  const [topicsForm, setTopicsForm] = useState('');
  const [keywordsForm, setKeywordsForm] = useState('');
  const [snack, setSnack] = useState<SnackState>({ 
    open: false, 
    msg: '', 
    severity: 'success' 
  });

  useEffect(() => { 
    if (!id) return; 
    load(); 
  }, [id]);

  const load = useCallback(async () => {
    if (!gid) return;
    try {
      const res = await getGroup(gid);
      const data = res.data as Group;
      setGroup(data);

      // Normalize members
      if (Array.isArray(data.members) && data.members.length > 0) {
        if (typeof data.members[0] === 'object') {
          setMembers(data.members as User[]);
        } else {
          const users = await Promise.all(
            (data.members as number[]).map(uid => 
              api.get<User>(`users/${uid}/`).then(r => r.data)
            )
          );
          setMembers(users);
        }
      } else {
        setMembers([]);
      }

      // Handle adviser
      const adviserId = data.adviser ? (typeof data.adviser === 'object' ? data.adviser.id : data.adviser) : null;
      setSelectedAdviser(adviserId);

      // Handle panels
      if (Array.isArray(data.panels) && data.panels.length > 0) {
        if (typeof data.panels[0] === 'object') {
          const panelUsers = data.panels as User[];
          setPanels(panelUsers);
          setSelectedPanels(panelUsers.map(p => p.id));
        } else {
          const panelUsers = await Promise.all(
            (data.panels as number[]).map(uid =>
              api.get<User>(`users/${uid}/`).then(r => r.data)
            )
          );
          setPanels(panelUsers);
          setSelectedPanels(panelUsers.map(u => u.id));
        }
      } else {
        setPanels([]);
        setSelectedPanels([]);
      }

      // Initialize topics and keywords form values
      setTopicsForm(data.possible_topics || '');
      setKeywordsForm(data.keywords || '');

      // Load advisers and panels
      try {
        const [advRes, pnlRes] = await Promise.all([
          api.get<User[]>('users/?role=ADVISER'),
          api.get<User[]>('users/?role=PANEL')
        ]);

        if (advRes.data) {
          setAdvisers(advRes.data);
        }

        if (pnlRes.data) {
          setPanels(pnlRes.data);
        }
      } catch (err) {
        console.error('Error loading advisers/panels:', err);
      }
    } catch (e) {
      console.error('Load failed with error:', e);
      setSnack({ open: true, msg: 'Failed to load', severity: 'error' });
    }
  }, [id]);

  const handleRemoveMember = async (userId: number) => {
    try {
      await removeMember(gid, userId);
      await load();
      setSnack({ open: true, msg: 'Removed', severity: 'success' });
    } catch (e) {
      setSnack({ open: true, msg: 'Remove failed', severity: 'error' });
    }
  };
  const handleAddMember = async () => {
    if (!addingUserId) {
      setSnack({ open: true, msg: 'Select user', severity: 'error' });
      return;
    }
    try {
      await addMember(gid, addingUserId!);
      setAddOpen(false);
      setAddingUserId(null);
      await load();
      setSnack({ open: true, msg: 'Added', severity: 'success' });
    } catch (e) {
      setSnack({ open: true, msg: 'Add failed', severity: 'error' });
    }
  };
  const handleSaveAdviser = async () => {
    if (selectedAdviser == null) {
      setSnack({ open: true, msg: 'Select adviser', severity: 'error' });
      return;
    }
    try {
      await assignAdviser(gid, selectedAdviser);
      await load();
      setSnack({ open: true, msg: 'Adviser saved', severity: 'success' });
    } catch (e) {
      setSnack({ open: true, msg: 'Save failed', severity: 'error' });
    }
  };
  const handleSavePanels = async () => {
    try {
      await assignPanels(gid, selectedPanels);
      await load();
      setSnack({ open: true, msg: 'Panels saved', severity: 'success' });
    } catch (e) {
      setSnack({ open: true, msg: 'Panels save failed', severity: 'error' });
    }
  };
  const handleSaveTopics = async () => {
    try {
      await api.patch(`groups/${gid}/`, { possible_topics: topicsForm });
      await load();
      setEditTopics(false);
      setSnack({ open: true, msg: 'Topics saved', severity: 'success' });
    } catch (e) {
      setSnack({ open: true, msg: 'Topics save failed', severity: 'error' });
    }
  };
  const handleSaveKeywords = async () => {
    try {
      await api.patch(`groups/${gid}/`, { keywords: keywordsForm });
      await load();
      setEditKeywords(false);
      setSnack({ open: true, msg: 'Keywords saved', severity: 'success' });
    } catch (e) {
      setSnack({ open: true, msg: 'Keywords save failed', severity: 'error' });
    }
  };

  const search = async (q: string): Promise<User[]> => {
    try {
      const res = await api.get<User[]>(`users/?search=${encodeURIComponent(q)}`);
      return res.data || [];
    } catch (e) {
      return [];
    }
  };

  const handlePanelChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value;
    // Convert all values to numbers to ensure type safety
    const numericValues = Array.isArray(value) 
      ? value.map(v => Number(v))
      : [Number(value)];
    setSelectedPanels(numericValues);
  };

  if (!group) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ p: 4, backgroundColor: '#F8FAFC' }}>
      {/* Welcome Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 6 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<span>←</span>}
              onClick={() => navigate('/groups')}
              sx={{ minWidth: 'auto' }}
            >
              Back
            </Button>
            <Typography variant="h3" sx={{ color: '#1E293B', fontWeight: 600 }}>
              Environmental Science Research Group: {group?.name || 'Loading...'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Users style={{ width: '16px', height: '16px', color: '#10B981' }} />
            <Typography variant="body1" sx={{ color: '#64748B' }}>
              Manage your research team and collaboration settings
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
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
              {group.name}
            </Typography>
          </Box>
        </Box>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Possible Research Topics</Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setEditTopics(!editTopics);
                  if (!editTopics) setTopicsForm(group?.possible_topics || '');
                }}
              >
                {editTopics ? 'Cancel' : 'Edit'}
              </Button>
            </Box>
            <Divider sx={{ my: 1 }} />
            {editTopics ? (
              <Box>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={topicsForm}
                  onChange={(e) => setTopicsForm(e.target.value)}
                  placeholder="Enter one environmental science topic per line"
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" onClick={handleSaveTopics}>
                    Save
                  </Button>
                  <Button variant="outlined" onClick={() => setEditTopics(false)}>
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                {group?.possible_topics ? (
                  group.possible_topics.split('\n').map((topic, index) => (
                    <Chip
                      key={index}
                      label={topic.trim()}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No environmental science topics specified yet
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
          
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Keywords</Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setEditKeywords(!editKeywords);
                  if (!editKeywords) setKeywordsForm(group?.keywords || '');
                }}
              >
                {editKeywords ? 'Cancel' : 'Edit'}
              </Button>
            </Box>
            <Divider sx={{ my: 1 }} />
            {editKeywords ? (
              <Box>
                <TextField
                  fullWidth
                  value={keywordsForm}
                  onChange={(e) => setKeywordsForm(e.target.value)}
                  placeholder="Comma-separated environmental science keywords"
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" onClick={handleSaveKeywords}>
                    Save
                  </Button>
                  <Button variant="outlined" onClick={() => setEditKeywords(false)}>
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                {group?.keywords ? (
                  group.keywords.split(',').map((keyword, index) => (
                    <Chip
                      key={index}
                      label={keyword.trim()}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No environmental science keywords specified yet
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Members</Typography>
              <Button 
                startIcon={<PersonAddIcon />} 
                variant="contained" 
                onClick={() => setAddOpen(true)}
              >
                Add
              </Button>
            </Box>
            <Divider sx={{ my: 1 }} />
            <List>
              {members.map(member => (
                <ListItem 
                  key={member.id} 
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText 
                    primary={member.first_name 
                      ? `${member.first_name} ${member.last_name || ''}` 
                      : member.email} 
                    secondary={member.email} 
                  />
                </ListItem>
              ))}
              {members.length === 0 && (
                <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
                  <Typography variant="body2" color="info.dark" sx={{ fontWeight: 600, mb: 1 }}>
                    No members in this group
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    This group currently has no members. Here's what you can do:
                  </Typography>
                  <Typography variant="body2" color="text.secondary" component="div">
                    <ul style={{ margin: 0, paddingLeft: '1.5em' }}>
                      <li>Add members using the dropdown above</li>
                      <li>Invite students by sharing the group details</li>
                      <li>Contact your adviser for member recommendations</li>
                    </ul>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Adding members will enable collaboration on thesis projects and progress tracking.
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">Adviser</Typography>
            <FormControl fullWidth>
              <InputLabel>Adviser</InputLabel>
              <Select
                value={selectedAdviser || ''}
                label="Adviser"
                onChange={e => setSelectedAdviser(Number(e.target.value) || null)}
                disabled={user?.role !== 'ADMIN'}
              >
                <MenuItem value="">None</MenuItem>
                {advisers.map(u => (
                  <MenuItem key={u.id} value={u.id}>{u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : u.email}</MenuItem>
                ))}
              </Select>
              {user?.role === 'ADMIN' && (
                <Box mt={1}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSaveAdviser}
                    disabled={selectedAdviser === (typeof group?.adviser === 'object' ? group?.adviser?.id : group?.adviser)}
                  >
                    Save Adviser
                  </Button>
                </Box>
              )}
            </FormControl>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Panels</Typography>
            <FormControl fullWidth>
              <InputLabel>Panel Members</InputLabel>
              <Select
                multiple
                value={selectedPanels}
                label="Panel Members"
                onChange={handlePanelChange}
                disabled={user?.role !== 'ADMIN' && user?.role !== 'ADVISER'}
              >
                {panels.map(u => (
                  <MenuItem key={u.id} value={u.id}>{u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : u.email}</MenuItem>
                ))}
              </Select>
              {(user?.role === 'ADMIN' || user?.role === 'ADVISER') && (
                <Box mt={1}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSavePanels}
                    disabled={JSON.stringify(selectedPanels.sort()) === JSON.stringify(group?.panels?.map(p => typeof p === 'object' ? p.id : p).sort())}
                  >
                    Save Panels
                  </Button>
                </Box>
              )}
            </FormControl>
          </Paper>
        </Grid>
      </Grid>

      <Dialog 
        open={addOpen} 
        onClose={() => setAddOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Member</DialogTitle>
        <DialogContent>
          <Typography variant="h4" sx={{ mb: 2 }}>
            {group?.name || 'Environmental Science Research Group'}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Search by email or name and press Enter
          </Typography>
          <TextField 
            fullWidth 
            value={searchUser} 
            onChange={(e) => setSearchUser(e.target.value)} 
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                const results = await search(searchUser);
                if (results && results.length > 0) {
                  setAddingUserId(results[0].id);
                }
              }
            }} 
            placeholder="Search users..."
            variant="outlined"
            margin="normal"
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption">
              Selected user ID: {addingUserId || 'None selected'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => {
              setAddOpen(false);
              setSearchUser('');
              setAddingUserId(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddMember}
            disabled={!addingUserId}
          >
            Add Member
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snack.open} 
        autoHideDuration={6000} 
        onClose={() => setSnack(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack(prev => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};
