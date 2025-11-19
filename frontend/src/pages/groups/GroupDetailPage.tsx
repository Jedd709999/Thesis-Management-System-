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
import { getGroup, addMember as addMemberToGroup, removeMember as removeMemberFromGroup, assignAdviser, assignPanels } from '../../api/groupService';
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
  status: string;
  possible_topics: string;
  keywords: string;
  members: User[];
  adviser: User | null;
  panels: User[];
}

export default function GroupDetailPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const gid = Number(id);

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [advisers, setAdvisers] = useState<User[]>([]);
  const [panels, setPanels] = useState<User[]>([]);
  const [selectedAdviser, setSelectedAdviser] = useState<number | null>(null);
  const [selectedPanels, setSelectedPanels] = useState<number[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' });
  const [editTopics, setEditTopics] = useState(false);
  const [editKeywords, setEditKeywords] = useState(false);
  const [topicsForm, setTopicsForm] = useState('');
  const [keywordsForm, setKeywordsForm] = useState('');

  const showSnack = (msg: string, severity: 'success' | 'error' = 'success') => {
    setSnack({ open: true, msg, severity });
  };

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const grpRes = await getGroup(gid);
      const data = grpRes.data;
      setGroup(data);

      // Handle adviser
      const adviserId = data.adviser ? (typeof data.adviser === 'object' ? data.adviser.id : data.adviser) : null;
      setSelectedAdviser(adviserId);

      // Handle panels
      const panelIds = data.panels?.map((p: any) => typeof p === 'object' ? p.id : p) || [];
      setSelectedPanels(panelIds);

      // Load advisers and panels
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
    } catch (e: any) {
      console.error('Load error:', e);
      showSnack('Failed to load group', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, gid]);

  useEffect(() => {
    if (!id) return;
    load();
  }, [id, load]);

  const handleSaveAdviser = async () => {
    if (!group || selectedAdviser === null) return;
    try {
      await assignAdviser(gid, selectedAdviser);
      showSnack('Adviser updated');
      load();
    } catch (e: any) {
      showSnack('Failed to update adviser', 'error');
    }
  };

  const handleSavePanels = async () => {
    if (!group) return;
    try {
      await assignPanels(gid, selectedPanels);
      showSnack('Panels updated');
      load();
    } catch (e: any) {
      showSnack('Failed to update panels', 'error');
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return;
    try {
      // First, we need to find the user by email to get their ID
      const userRes = await api.get(`users/?email=${newMemberEmail}`);
      if (!userRes.data || userRes.data.length === 0) {
        showSnack('User not found with this email', 'error');
        return;
      }
      const userId = userRes.data[0].id;
      await addMemberToGroup(gid, userId);
      showSnack('Member added');
      setAddOpen(false);
      setNewMemberEmail('');
      load();
    } catch (e: any) {
      showSnack(e.response?.data?.message || 'Failed to add member', 'error');
    }
  };

  const handleRemoveMember = async (uid: number) => {
    if (!confirm('Remove this member?')) return;
    try {
      await removeMemberFromGroup(gid, uid);
      showSnack('Member removed');
      load();
    } catch (e: any) {
      showSnack('Failed to remove member', 'error');
    }
  };

  const handlePanelChange = (e: any) => {
    const values = Array.isArray(e.target.value) ? e.target.value : [e.target.value];
    setSelectedPanels(values.map((v: any) => Number(v)));
  };

  const handleSaveTopics = async () => {
    if (!group) return;
    try {
      await api.patch(`/groups/${gid}/`, { possible_topics: topicsForm });
      showSnack('Topics updated');
      setEditTopics(false);
      load();
    } catch (e: any) {
      showSnack('Failed to update topics', 'error');
    }
  };

  const handleSaveKeywords = async () => {
    if (!group) return;
    try {
      await api.patch(`/groups/${gid}/`, { keywords: keywordsForm });
      showSnack('Keywords updated');
      setEditKeywords(false);
      load();
    } catch (e: any) {
      showSnack('Failed to update keywords', 'error');
    }
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
            <Typography variant="h3" sx={{ color: '#1E293B', fontWeight: 600 }}>
              Environmental Science Research Group: {group?.name || 'Loading...'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Users style={{ width: '16px', height: '16px', color: '#10B981' }} />
            <Typography variant="body1" sx={{ color: '#64748B' }}>
              {group?.members?.length || 0} members
            </Typography>
            <Leaf style={{ width: '16px', height: '16px', color: '#10B981' }} />
            <Typography variant="body1" sx={{ color: '#64748B' }}>
              {group?.status || 'Loading...'}
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
            <Users style={{ width: '16px', height: '16px', color: '#10B981' }} />
            <Typography variant="body2" sx={{ color: '#065F46', fontWeight: 500 }}>
              Group Details
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<span>←</span>}
            onClick={() => navigate('/groups')}
            sx={{ 
              minWidth: 'auto', 
              backgroundColor: '#10B981', 
              '&:hover': { backgroundColor: '#059669' },
              py: 0.75,
              px: 3
            }}
          >
            Back
          </Button>
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
            {editTopics ? (
              <Box>
                <TextField
                  multiline
                  rows={4}
                  fullWidth
                  value={topicsForm}
                  onChange={(e) => setTopicsForm(e.target.value)}
                  placeholder="Enter topics (one per line):&#10;Climate Change Impact Assessment&#10;Renewable Energy Systems&#10;Biodiversity Conservation"
                  sx={{ mt: 2 }}
                />
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  <Button onClick={handleSaveTopics} variant="contained" size="small" sx={{ backgroundColor: '#10B981', '&:hover': { backgroundColor: '#059669' } }}>Save</Button>
                  <Button onClick={() => setEditTopics(false)} variant="outlined" size="small">Cancel</Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                {group.possible_topics ? (
                  group.possible_topics.split('\n').filter((t: string) => t.trim()).map((topic: string, i: number) => (
                    <Chip key={i} label={topic.trim()} sx={{ mr: 1, mb: 1 }} />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No topics specified. Add topics like Climate Change Impact Assessment, Renewable Energy Systems, etc.
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
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
            {editKeywords ? (
              <Box>
                <TextField
                  fullWidth
                  value={keywordsForm}
                  onChange={(e) => setKeywordsForm(e.target.value)}
                  placeholder="Enter keywords separated by commas: climate change, renewable energy, biodiversity, water quality"
                  sx={{ mt: 2 }}
                />
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  <Button onClick={handleSaveKeywords} variant="contained" size="small" sx={{ backgroundColor: '#10B981', '&:hover': { backgroundColor: '#059669' } }}>Save</Button>
                  <Button onClick={() => setEditKeywords(false)} variant="outlined" size="small">Cancel</Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                {group.keywords ? (
                  group.keywords.split(',').filter((k: string) => k.trim()).map((keyword: string, i: number) => (
                    <Chip key={i} label={keyword.trim()} sx={{ mr: 1, mb: 1 }} />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No keywords specified. Add keywords like climate change, renewable energy, biodiversity, etc.
                  </Typography>
                )}
              </Box>
            )}
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
                {advisers.map(u => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {user?.role === 'ADMIN' && (
              <Box mt={1}>
                <Button onClick={handleSaveAdviser} variant="contained" size="small" sx={{ backgroundColor: '#10B981', '&:hover': { backgroundColor: '#059669' } }}>
                  Save Adviser
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">Panel Members</Typography>
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
                  <MenuItem key={u.id} value={u.id}>
                    {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {(user?.role === 'ADMIN' || user?.role === 'ADVISER') && (
              <Box mt={1}>
                <Button onClick={handleSavePanels} variant="contained" size="small" sx={{ backgroundColor: '#10B981', '&:hover': { backgroundColor: '#059669' } }}>
                  Save Panels
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Members</Typography>
              {(user?.role === 'ADMIN' || user?.role === 'ADVISER') && (
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setAddOpen(true)}
                  size="small"
                  sx={{ backgroundColor: '#10B981', '&:hover': { backgroundColor: '#059669' } }}
                >
                  Add Member
                </Button>
              )}
            </Box>
            <List>
              {group.members?.map(m => (
                <ListItem key={m.id}>
                  <ListItemText
                    primary={m.first_name || m.last_name ? `${m.first_name} ${m.last_name}` : m.email}
                    secondary={m.email}
                  />
                  {(user?.role === 'ADMIN' || user?.role === 'ADVISER') && (
                    <IconButton edge="end" onClick={() => handleRemoveMember(m.id)}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </ListItem>
              ))}
              {(!group.members || group.members.length === 0) && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  No members yet
                </Typography>
              )}
            </List>
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
          <TextField
            autoFocus
            fullWidth
            label="Email address"
            value={newMemberEmail}
            onChange={e => setNewMemberEmail(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button onClick={handleAddMember} variant="contained" sx={{ backgroundColor: '#10B981', '&:hover': { backgroundColor: '#059669' } }}>Add</Button>
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
}
