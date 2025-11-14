import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container, Typography, Box, Paper, Divider, List, ListItem, ListItemText,
  IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, InputLabel, FormControl, Chip, OutlinedInput,
  Snackbar, Alert, Grid, SelectChangeEvent
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { getGroup, addMember, removeMember, assignAdviser, assignPanels } from '../../api/groupService';
import api from '../../api/api';

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

const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const gid = Number(id);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [advisers, setAdvisers] = useState<User[]>([]);
  const [panels, setPanels] = useState<User[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [addingUserId, setAddingUserId] = useState<number | null>(null);
  const [selectedAdviser, setSelectedAdviser] = useState<number | null>(null);
  const [selectedPanels, setSelectedPanels] = useState<number[]>([]);
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
      const adviserId = typeof data.adviser === 'object' ? data.adviser.id : data.adviser;
      setSelectedAdviser(adviserId || null);

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

      // Load advisers and panels
      const [advRes, pnlRes] = await Promise.all([
        api.get<{ results?: User[] }>('users/?role=ADVISER'),
        api.get<{ results?: User[] }>('users/?role=PANEL')
      ]);

      if (advRes.data.results) {
        setAdvisers(advRes.data.results);
      }

      if (pnlRes.data.results) {
        setPanels(prev => {
          const panelMap = new Map(prev.map(p => [p.id, p]));
          pnlRes.data.results?.forEach(panel => {
            panelMap.set(panel.id, panel);
          });
          return Array.from(panelMap.values());
        });
      }
    } catch (e) {
      setSnack({ open: true, msg: 'Failed to load', severity: 'error' });
    }
  }, [gid]);

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
      await addMember(gid, addingUserId);
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

  const search = async (q: string): Promise<User[]> => {
    try {
      const res = await api.get<{ results?: User[] }>(`users/?search=${encodeURIComponent(q)}`);
      return res.data.results || [];
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
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4">Group: {group.name}</Typography>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
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
                <Typography sx={{ p: 2 }}>No members</Typography>
              )}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">Adviser</Typography>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel id="adviser-label">Adviser</InputLabel>
              <Select 
                labelId="adviser-label" 
                value={selectedAdviser ?? ''} 
                label="Adviser" 
                onChange={(e) => setSelectedAdviser(e.target.value as number)}
              >
                <MenuItem value="">-- none --</MenuItem>
                {advisers.map(adviser => (
                  <MenuItem key={adviser.id} value={adviser.id}>
                    {adviser.first_name 
                      ? `${adviser.first_name} ${adviser.last_name || ''}` 
                      : adviser.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button 
              sx={{ mt: 2 }} 
              variant="outlined" 
              onClick={handleSaveAdviser}
            >
              Save Adviser
            </Button>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Panels</Typography>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel id="panels-label">Panels</InputLabel>
              <Select 
                labelId="panels-label" 
                multiple 
                value={selectedPanels} 
                onChange={handlePanelChange}
                input={<OutlinedInput label="Panels" />} 
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as number[]).map(id => {
                      const u = panels.find(p => p.id === id);
                      return (
                        <Chip 
                          key={id} 
                          label={u ? (u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.email) : id} 
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {panels.map(panel => (
                  <MenuItem key={panel.id} value={panel.id}>
                    {panel.first_name 
                      ? `${panel.first_name} ${panel.last_name || ''}` 
                      : panel.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button 
              sx={{ mt: 2 }} 
              variant="outlined" 
              onClick={handleSavePanels}
            >
              Save Panels
            </Button>
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
    </Container>
  );
};

export default GroupDetailPage;
