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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar
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
  role?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_staff?: boolean;
}

interface Group {
  id: number;
  name: string;
  status: string;
  proposed_topic_title: string;
  abstract: string;
  keywords: string;
  rejection_reason?: string;
  leader?: User | null;
  members: User[];
  adviser: User | null;
  panels: User[];
  [key: string]: any;
}

interface GroupDetailPageProps {
  editMode?: boolean;
}

export default function GroupDetailPage({ editMode = false }: GroupDetailPageProps) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const gid = Number(id);

  // Helper function to check if user is group leader
  const isGroupLeader = (group: Group, user: User | null) => {
    if (!user || !group.leader) return false;
    return group.leader.id === user.id;
  };

  // Helper function to check if user is group member
  const isGroupMember = (group: Group, user: User | null) => {
    if (!user || !group.members) return false;
    return group.members.some((member: User) => member.id === user.id);
  };

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupNameForm, setGroupNameForm] = useState('');
  const [advisers, setAdvisers] = useState<User[]>([]);
  const [panels, setPanels] = useState<User[]>([]);
  const [selectedAdviser, setSelectedAdviser] = useState<number | null>(null);
  const [selectedPanels, setSelectedPanels] = useState<number[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' });
  const [editTopic, setEditTopic] = useState(false);
  const [editAbstract, setEditAbstract] = useState(false);
  const [editKeywords, setEditKeywords] = useState(false);
  const [topicForm, setTopicForm] = useState('');
  const [abstractForm, setAbstractForm] = useState('');
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
      setGroupNameForm(data.name || '');

      // Handle adviser
      const adviserId = data.adviser ? (typeof data.adviser === 'object' ? data.adviser.id : data.adviser) : null;
      setSelectedAdviser(adviserId);

      // Handle panels
      const panelIds = data.panels?.map((p: any) => typeof p === 'object' ? p.id : p) || [];
      setSelectedPanels(panelIds);

      // Set form values
      setTopicForm(data.proposed_topic_title || '');
      setAbstractForm(data.abstract || '');
      setKeywordsForm(data.keywords || '');

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

  const handleSaveTopic = async () => {
    if (!group) return;
    try {
      await api.patch(`/groups/${gid}/`, { proposed_topic_title: topicForm });
      showSnack('Topic updated');
      setEditTopic(false);
      load();
    } catch (e: any) {
      showSnack('Failed to update topic', 'error');
    }
  };

  const handleSaveAbstract = async () => {
    if (!group) return;
    try {
      await api.patch(`/groups/${gid}/`, { abstract: abstractForm });
      showSnack('Abstract updated');
      setEditAbstract(false);
      load();
    } catch (e: any) {
      showSnack('Failed to update abstract', 'error');
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
    <Box sx={{ p: 3, backgroundColor: '#f8fafc' }}>
      {/* Header Section */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            {editMode ? (
              <TextField
                fullWidth
                variant="outlined"
                value={groupNameForm}
                onChange={(e) => setGroupNameForm(e.target.value)}
                sx={{ mb: 1 }}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" sx={{ color: '#1e293b', fontWeight: 600 }}>
                  {group.name}
                </Typography>
                {group.status === 'PENDING' && (
                  <Chip 
                    label="Pending" 
                    size="small" 
                    color="warning" 
                    sx={{ fontSize: '0.75rem' }}
                  />
                )}
                {group.status === 'APPROVED' && (
                  <Chip 
                    label="Approved" 
                    size="small" 
                    color="success" 
                    sx={{ fontSize: '0.75rem' }}
                  />
                )}
                {group.status === 'REJECTED' && (
                  <Chip 
                    label="Rejected" 
                    size="small" 
                    color="error" 
                    sx={{ fontSize: '0.75rem' }}
                  />
                )}
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Users style={{ width: '16px', height: '16px', color: '#10B981' }} />
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  {group.members?.length || 0} members
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Leaf style={{ width: '16px', height: '16px', color: '#10B981' }} />
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  {group.status}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {editMode ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={async () => {
                    try {
                      await api.patch(`groups/${group.id}/`, { name: groupNameForm });
                      showSnack('Group name updated successfully');
                      navigate(`/groups/${group.id}`);
                      load();
                    } catch (error) {
                      showSnack('Failed to update group name', 'error');
                    }
                  }}
                  sx={{ 
                    backgroundColor: '#10B981', 
                    '&:hover': { backgroundColor: '#059669' },
                    py: 1,
                    px: 2
                  }}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/groups/${group.id}`)}
                  sx={{ 
                    borderColor: '#cbd5e1',
                    color: '#64748b',
                    '&:hover': { 
                      borderColor: '#94a3b8',
                      backgroundColor: '#f1f5f9' 
                    },
                    py: 1,
                    px: 2
                  }}
                >
                  Cancel
                </Button>
              </Box>
            ) : (
              <>
                <Button
                  variant="outlined"
                  startIcon={<span>←</span>}
                  onClick={() => navigate('/groups')}
                  sx={{ 
                    borderColor: '#cbd5e1',
                    color: '#64748b',
                    '&:hover': { 
                      borderColor: '#94a3b8',
                      backgroundColor: '#f1f5f9' 
                    },
                    py: 1,
                    px: 2
                  }}
                >
                  Back to Groups
                </Button>
                
                {/* Action Buttons */}
                {user && group && (
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {user.role === 'ADMIN' && group.status === 'APPROVED' && (
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={async () => {
                          if (!group) return;
                          if (window.confirm('Are you sure you want to delete this approved group? This action cannot be undone.')) {
                            try {
                              await api.delete(`groups/${group.id}/`);
                              showSnack('Group deleted successfully');
                              navigate('/groups');
                            } catch (error) {
                              showSnack('Failed to delete group', 'error');
                            }
                          }
                        }}
                        sx={{ 
                          py: 1,
                          px: 2,
                          minWidth: 'auto'
                        }}
                      >
                        Delete
                      </Button>
                    )}
                    
                    {user.role === 'STUDENT' && isGroupLeader(group, user) && group.status === 'PENDING' && (
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={async () => {
                          if (!group) return;
                          if (window.confirm('Are you sure you want to delete your group proposal? This action cannot be undone.')) {
                            try {
                              await api.delete(`groups/${group.id}/`);
                              showSnack('Group proposal deleted successfully');
                              navigate('/groups');
                            } catch (error) {
                              showSnack('Failed to delete group proposal', 'error');
                            }
                          }
                        }}
                        sx={{ 
                          py: 1,
                          px: 2,
                          minWidth: 'auto'
                        }}
                      >
                        Delete
                      </Button>
                    )}
                    
                    {user.role === 'STUDENT' && isGroupLeader(group, user) && group.status === 'APPROVED' && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={async () => {
                          if (!group) return;
                          if (window.confirm('Are you sure you want to delete this approved group? Only administrators can delete approved groups.')) {
                            showSnack('Only administrators can delete approved groups', 'error');
                          }
                        }}
                        sx={{ 
                          py: 1,
                          px: 2,
                          minWidth: 'auto',
                          borderColor: '#ef4444',
                          color: '#ef4444',
                          '&:hover': {
                            borderColor: '#dc2626',
                            backgroundColor: '#fee2e2'
                          }
                        }}
                        disabled
                      >
                        Delete
                      </Button>
                    )}
                    
                    {user.role === 'STUDENT' && isGroupMember(group, user) && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          // Create a formatted proposal text
                          const proposalText = `
Research Group Proposal: ${group.name}

Proposed Topic Title:
${group.proposed_topic_title || 'Not specified'}

Abstract:
${group.abstract || 'Not provided'}

Keywords:
${group.keywords || 'None specified'}

Group Members:
${group.members?.map(m => `- ${m.first_name || m.last_name ? `${m.first_name} ${m.last_name}` : 'No name'} (${m.email})`).join('\n') || 'None'}

Status: ${group.status}
                          `.trim();
                          
                          // Copy to clipboard
                          navigator.clipboard.writeText(proposalText)
                            .then(() => showSnack('Proposal copied to clipboard'))
                            .catch(() => showSnack('Failed to copy proposal', 'error'));
                        }}
                        sx={{ 
                          py: 1,
                          px: 2,
                          minWidth: 'auto',
                          borderColor: '#94a3b8',
                          color: '#64748b',
                          '&:hover': {
                            borderColor: '#64748b',
                            backgroundColor: '#f1f5f9'
                          }
                        }}
                      >
                        Copy Proposal
                      </Button>
                    )}
                    
                    {user.role === 'STUDENT' && isGroupMember(group, user) && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          // Create a formatted proposal text
                          const proposalText = `
Research Group Proposal: ${group.name}

Proposed Topic Title:
${group.proposed_topic_title || 'Not specified'}

Abstract:
${group.abstract || 'Not provided'}

Keywords:
${group.keywords || 'None specified'}

Group Members:
${group.members?.map(m => `- ${m.first_name || m.last_name ? `${m.first_name} ${m.last_name}` : 'No name'} (${m.email})`).join('\n') || 'None'}

Status: ${group.status}
                          `.trim();
                          
                          // Create a data URI for download
                          const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(proposalText);
                          const exportFileDefaultName = `research_proposal_${group.name.replace(/\s+/g, '_')}.txt`;
                          
                          const link = document.createElement('a');
                          link.setAttribute('href', dataUri);
                          link.setAttribute('download', exportFileDefaultName);
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        }}
                        sx={{ 
                          py: 1,
                          px: 2,
                          minWidth: 'auto',
                          borderColor: '#94a3b8',
                          color: '#64748b',
                          '&:hover': {
                            borderColor: '#64748b',
                            backgroundColor: '#f1f5f9'
                          }
                        }}
                      >
                        Download
                      </Button>
                    )}
                    
                    {user.role === 'STUDENT' && group.status === 'APPROVED' && isGroupMember(group, user) && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          // Navigate to thesis page for this group
                          // This would need to be implemented based on how the thesis system works
                          showSnack('Thesis functionality coming soon');
                        }}
                        sx={{ 
                          py: 1,
                          px: 2,
                          minWidth: 'auto',
                          backgroundColor: '#10B981',
                          '&:hover': {
                            backgroundColor: '#059669'
                          }
                        }}
                      >
                        View Thesis
                      </Button>
                    )}
                    
                    {user.role === 'STUDENT' && isGroupMember(group, user) && 
                      isGroupLeader(group, user) === false && group.status !== 'APPROVED' && (
                      <Button
                        variant="outlined"
                        color="warning"
                        size="small"
                        onClick={async () => {
                          if (!group) return;
                          if (window.confirm('Are you sure you want to leave this group?')) {
                            try {
                              await api.post(`groups/${group.id}/leave/`);
                              showSnack('You have left the group');
                              navigate('/groups');
                            } catch (error: any) {
                              showSnack(error.response?.data?.error || 'Failed to leave group', 'error');
                            }
                          }
                        }}
                        sx={{ 
                          py: 1,
                          px: 2,
                          minWidth: 'auto',
                          borderColor: '#f59e0b',
                          color: '#f59e0b',
                          '&:hover': {
                            borderColor: '#d97706',
                            backgroundColor: '#fffbeb'
                          }
                        }}
                      >
                        Leave
                      </Button>
                    )}
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
        
        {/* Rejection Reason Alert */}
        {group.status === 'REJECTED' && group.rejection_reason && (
          <Alert 
            severity="error" 
            sx={{ mb: 2, borderRadius: 1 }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Proposal Rejected
            </Typography>
            <Typography variant="body2">
              {group.rejection_reason}
            </Typography>
          </Alert>
        )}
        
        {/* Resubmit Button for Rejected Proposals */}
        {group.status === 'REJECTED' && !editMode && (
          <Box sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={async () => {
                if (!group) return;
                try {
                  // Change status back to PENDING
                  await api.patch(`groups/${group.id}/`, { status: 'PENDING' });
                  showSnack('Proposal resubmitted successfully');
                  // Reload the group to update the status
                  load();
                } catch (error) {
                  showSnack('Failed to resubmit proposal', 'error');
                }
              }}
              sx={{ 
                backgroundColor: '#10B981', 
                '&:hover': { backgroundColor: '#059669' },
                py: 1,
                px: 3
              }}
            >
              Resubmit Proposal
            </Button>
          </Box>
        )}
      </Paper>
      
      {/* Group Leader Information */}
      {group.leader && (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 48, height: 48, fontSize: '1.2rem', bgcolor: '#10b981' }}>
              {group.leader.first_name?.charAt(0) || group.leader.last_name?.charAt(0) || group.leader.email.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                {group.leader.first_name || group.leader.last_name 
                  ? `${group.leader.first_name} ${group.leader.last_name}`.trim() 
                  : group.leader.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Group Leader - Proposed this group
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
      
      <Grid container spacing={3}>
        {/* Left Column - Research Proposal */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3, backgroundColor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600 }}>
                Research Proposal
              </Typography>
              {!editMode && user?.role === 'STUDENT' && isGroupLeader(group, user) && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate(`/groups/${group.id}/edit`)}
                  sx={{ 
                    borderColor: '#cbd5e1',
                    color: '#64748b',
                    '&:hover': {
                      borderColor: '#94a3b8',
                      backgroundColor: '#f1f5f9'
                    },
                    mr: 1
                  }}
                >
                  Edit All
                </Button>
              )}
              {editMode && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={async () => {
                    try {
                      const payload: any = {};
                      if (topicForm !== group.proposed_topic_title) payload.proposed_topic_title = topicForm;
                      if (abstractForm !== group.abstract) payload.abstract = abstractForm;
                      if (keywordsForm !== group.keywords) payload.keywords = keywordsForm;
                      
                      if (Object.keys(payload).length > 0) {
                        await api.patch(`groups/${group.id}/`, payload);
                        showSnack('Research proposal updated successfully');
                        load();
                      }
                    } catch (error) {
                      showSnack('Failed to update research proposal', 'error');
                    }
                  }}
                  sx={{ 
                    backgroundColor: '#10B981', 
                    '&:hover': { backgroundColor: '#059669' }
                  }}
                >
                  Save All
                </Button>
              )}
            </Box>
            
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#334155' }}>
                  Proposed Topic Title
                </Typography>
                {!editMode && (
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => {
                      setEditTopic(!editTopic);
                      if (!editTopic) setTopicForm(group.proposed_topic_title || '');
                    }}
                    sx={{ 
                      borderColor: '#cbd5e1',
                      color: '#64748b',
                      '&:hover': {
                        borderColor: '#94a3b8',
                        backgroundColor: '#f1f5f9'
                      }
                    }}
                  >
                    {editTopic ? 'Cancel' : 'Edit'}
                  </Button>
                )}
              </Box>
              {editMode || editTopic ? (
                <Box>
                  <TextField
                    multiline
                    rows={2}
                    fullWidth
                    value={topicForm}
                    onChange={(e) => setTopicForm(e.target.value)}
                    placeholder="e.g., Analysis of Climate Change Impact on Coastal Ecosystems"
                    sx={{ mt: 1 }}
                  />
                  {!editMode && (
                    <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                      <Button 
                        onClick={handleSaveTopic} 
                        variant="contained" 
                        size="small" 
                        sx={{ 
                          backgroundColor: '#10B981', 
                          '&:hover': { backgroundColor: '#059669' },
                          minWidth: 80
                        }}
                      >
                        Save
                      </Button>
                      <Button 
                        onClick={() => setEditTopic(false)} 
                        variant="outlined" 
                        size="small"
                        sx={{ 
                          borderColor: '#cbd5e1',
                          color: '#64748b',
                          '&:hover': {
                            borderColor: '#94a3b8',
                            backgroundColor: '#f1f5f9'
                          },
                          minWidth: 80
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ mt: 1 }}>
                  {group.proposed_topic_title ? (
                    <Typography variant="body1" sx={{ color: '#1e293b' }}>
                      {group.proposed_topic_title}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No topic title specified.
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
            
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#334155' }}>
                  Abstract
                </Typography>
                {!editMode && (
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => {
                      setEditAbstract(!editAbstract);
                      if (!editAbstract) setAbstractForm(group.abstract || '');
                    }}
                    sx={{ 
                      borderColor: '#cbd5e1',
                      color: '#64748b',
                      '&:hover': {
                        borderColor: '#94a3b8',
                        backgroundColor: '#f1f5f9'
                      }
                    }}
                  >
                    {editAbstract ? 'Cancel' : 'Edit'}
                  </Button>
                )}
              </Box>
              {editMode || editAbstract ? (
                <Box>
                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    value={abstractForm}
                    onChange={(e) => setAbstractForm(e.target.value)}
                    placeholder="Provide a brief description of your research proposal, including objectives, methodology, and expected outcomes..."
                    sx={{ mt: 1 }}
                  />
                  {!editMode && (
                    <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                      <Button 
                        onClick={handleSaveAbstract} 
                        variant="contained" 
                        size="small" 
                        sx={{ 
                          backgroundColor: '#10B981', 
                          '&:hover': { backgroundColor: '#059669' },
                          minWidth: 80
                        }}
                      >
                        Save
                      </Button>
                      <Button 
                        onClick={() => setEditAbstract(false)} 
                        variant="outlined" 
                        size="small"
                        sx={{ 
                          borderColor: '#cbd5e1',
                          color: '#64748b',
                          '&:hover': {
                            borderColor: '#94a3b8',
                            backgroundColor: '#f1f5f9'
                          },
                          minWidth: 80
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ mt: 1 }}>
                  {group.abstract ? (
                    <Typography variant="body1" sx={{ color: '#1e293b' }}>
                      {group.abstract}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No abstract provided.
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
            
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#334155' }}>
                  Keywords
                </Typography>
                {!editMode && (
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => {
                      setEditKeywords(!editKeywords);
                      if (!editKeywords) setKeywordsForm(group.keywords || '');
                    }}
                    sx={{ 
                      borderColor: '#cbd5e1',
                      color: '#64748b',
                      '&:hover': {
                        borderColor: '#94a3b8',
                        backgroundColor: '#f1f5f9'
                      }
                    }}
                  >
                    {editKeywords ? 'Cancel' : 'Edit'}
                  </Button>
                )}
              </Box>
              {editMode || editKeywords ? (
                <Box>
                  <TextField
                    fullWidth
                    value={keywordsForm}
                    onChange={(e) => setKeywordsForm(e.target.value)}
                    placeholder="Enter keywords separated by commas (e.g., climate change, renewable energy, biodiversity)"
                    sx={{ mt: 1 }}
                  />
                  {!editMode && (
                    <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                      <Button 
                        onClick={handleSaveKeywords} 
                        variant="contained" 
                        size="small" 
                        sx={{ 
                          backgroundColor: '#10B981', 
                          '&:hover': { backgroundColor: '#059669' },
                          minWidth: 80
                        }}
                      >
                        Save
                      </Button>
                      <Button 
                        onClick={() => setEditKeywords(false)} 
                        variant="outlined" 
                        size="small"
                        sx={{ 
                          borderColor: '#cbd5e1',
                          color: '#64748b',
                          '&:hover': {
                            borderColor: '#94a3b8',
                            backgroundColor: '#f1f5f9'
                          },
                          minWidth: 80
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ mt: 1 }}>
                  {group.keywords ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {group.keywords.split(',').filter((k: string) => k.trim()).map((keyword: string, i: number) => (
                        <Chip 
                          key={i} 
                          label={keyword.trim()} 
                          size="small" 
                          sx={{ 
                            backgroundColor: '#f1f5f9',
                            color: '#334155'
                          }} 
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No keywords specified. Add keywords like climate change, renewable energy, biodiversity, etc.
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Right Column - People Management */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3, backgroundColor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600 }}>
                Adviser
              </Typography>
              {user?.role === 'ADMIN' && (
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={handleSaveAdviser}
                  sx={{ 
                    borderColor: '#cbd5e1',
                    color: '#64748b',
                    '&:hover': {
                      borderColor: '#94a3b8',
                      backgroundColor: '#f1f5f9'
                    }
                  }}
                >
                  Save
                </Button>
              )}
            </Box>
            <FormControl fullWidth size="small">
              <Select
                value={selectedAdviser || ''}
                onChange={e => setSelectedAdviser(Number(e.target.value) || null)}
                disabled={user?.role !== 'ADMIN'}
                sx={{ 
                  backgroundColor: user?.role === 'ADMIN' ? 'white' : '#f8fafc'
                }}
              >
                <MenuItem value="">
                  <em>None assigned</em>
                </MenuItem>
                {advisers.map(u => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
          
          <Paper sx={{ p: 3, mb: 3, backgroundColor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600 }}>
                Panel Members
              </Typography>
              {(user?.role === 'ADMIN' || user?.role === 'ADVISER') && (
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={handleSavePanels}
                  sx={{ 
                    borderColor: '#cbd5e1',
                    color: '#64748b',
                    '&:hover': {
                      borderColor: '#94a3b8',
                      backgroundColor: '#f1f5f9'
                    }
                  }}
                >
                  Save
                </Button>
              )}
            </Box>
            <FormControl fullWidth size="small">
              <Select
                multiple
                value={selectedPanels}
                onChange={handlePanelChange}
                disabled={user?.role !== 'ADMIN' && user?.role !== 'ADVISER'}
                sx={{ 
                  backgroundColor: (user?.role === 'ADMIN' || user?.role === 'ADVISER') ? 'white' : '#f8fafc'
                }}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as number[]).map((value) => {
                      const panel = panels.find(p => p.id === value);
                      return (
                        <Chip 
                          key={value} 
                          label={panel ? (panel.first_name || panel.last_name ? `${panel.first_name} ${panel.last_name}`.trim() : panel.email) : value} 
                          size="small" 
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {panels.map(u => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
          
          <Paper sx={{ p: 3, backgroundColor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600 }}>
                Group Members
              </Typography>
              {(user?.role === 'ADMIN' || user?.role === 'ADVISER') && (
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setAddOpen(true)}
                  size="small"
                  sx={{ 
                    borderColor: '#cbd5e1',
                    color: '#64748b',
                    '&:hover': {
                      borderColor: '#94a3b8',
                      backgroundColor: '#f1f5f9'
                    }
                  }}
                >
                  Add
                </Button>
              )}
            </Box>
            
            {/* Table view for Members */}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500, color: '#334155', px: 1, py: 1 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 500, color: '#334155', px: 1, py: 1 }}>Role</TableCell>
                    {(user?.role === 'ADMIN' || user?.role === 'ADVISER') && (
                      <TableCell sx={{ fontWeight: 500, color: '#334155', px: 1, py: 1, width: 40 }}>Action</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.members?.map(m => (
                    <TableRow 
                      key={m.id} 
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell sx={{ px: 1, py: 1 }}>
                        <Typography variant="body2">
                          {m.first_name || m.last_name ? `${m.first_name} ${m.last_name}` : 'No name'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {m.email}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ px: 1, py: 1 }}>
                        <Chip 
                          label={m.role || 'STUDENT'} 
                          size="small" 
                          color={m.role === 'ADVISER' ? 'primary' : m.role === 'PANEL' ? 'secondary' : 'default'} 
                          sx={{ 
                            height: 20,
                            fontSize: '0.7rem'
                          }}
                        />
                      </TableCell>
                      {(user?.role === 'ADMIN' || user?.role === 'ADVISER') && (
                        <TableCell sx={{ px: 1, py: 1 }}>
                          <IconButton 
                            edge="end" 
                            onClick={() => handleRemoveMember(m.id)}
                            size="small"
                            sx={{ 
                              p: 0.5,
                              color: '#ef4444',
                              '&:hover': {
                                backgroundColor: '#fee2e2'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Add Member Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)}>
        <DialogTitle>Add Member</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Member Email"
            type="email"
            fullWidth
            value={newMemberEmail}
            onChange={e => setNewMemberEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button onClick={handleAddMember} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={snack.open} 
        autoHideDuration={6000} 
        onClose={() => setSnack({...snack, open: false})}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnack({...snack, open: false})} 
          severity={snack.severity as any}
          sx={{ width: '100%' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
