import React, { useEffect, useState } from 'react'
import { 
  Typography, 
  Button, 
  Dialog, 
  Box, 
  TextField, 
  List, 
  ListItem, 
  ListItemText, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  InputAdornment,
  Tabs,
  Tab
} from '@mui/material'
import { 
  Add, 
  Edit, 
  Delete, 
  Visibility,
  People,
  Description,
  Schedule,
  Search,
  FilterList,
  Timeline
} from '@mui/icons-material'
import { listThesis, getAllTheses, createThesis } from '../../api/thesisService'
import { getCurrentUserGroups } from '../../api/groupService'
import api from '../../api/api'

interface Thesis {
  id: number
  title: string
  status: string
  abstract?: string
  keywords?: string
  adviser_feedback?: string
  lastUpdated?: string
  progress?: number
  adviser?: string
  proposer?: {
    id: number
    username: string
    first_name?: string
    last_name?: string
  }
  group?: {
    id: number
    name: string
  } | string
}

interface UserGroup {
  id: number
  name: string
}

interface User {
  id: number
  email: string
  first_name?: string
  last_name?: string
  role: string
}

export default function ThesisCrudPage() {
  const [theses, setTheses] = useState<Thesis[]>([])
  const [allTheses, setAllTheses] = useState<Thesis[]>([])
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [abstract, setAbstract] = useState('')
  const [keywords, setKeywords] = useState('')
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedThesis, setSelectedThesis] = useState<Thesis | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterAdviser, setFilterAdviser] = useState<string>('all')
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewFeedback, setReviewFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState(0)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const [thesisRes, allThesisRes, groupsRes] = await Promise.all([
        listThesis(),
        getAllTheses(),
        getCurrentUserGroups()
      ])
      const thesesData = thesisRes.data || []
      const allThesesData = allThesisRes.data || []
      console.log('Loaded my theses:', thesesData)
      console.log('Loaded all theses:', allThesesData)
      thesesData.forEach(thesis => {
        console.log(`My Thesis "${thesis.title}":`, {
          group: thesis.group,
          adviser: thesis.adviser
        })
      })
      setTheses(thesesData)
      setAllTheses(allThesesData)
      setUserGroups(groupsRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // Load current user
    const loadCurrentUser = async () => {
      try {
        const currentUserRes = await api.get('users/me/');
        const user = currentUserRes.data;
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to get current user:', error);
      }
    };
    loadCurrentUser();
  }, [])

  async function handleCreate() {
    try {
      // Use the single group (students can only be in 1 group)
      const selectedGroupId = userGroups[0].id.toString();
      
      await createThesis({ 
        title, 
        abstract, 
        keywords: keywords || undefined,
        group_id: parseInt(selectedGroupId) 
      })
      setOpen(false)
      setTitle('')
      setAbstract('')
      setKeywords('')
      load()
    } catch (error) {
      console.error('Error creating thesis:', error)
    }
  }

  async function handleReview(action: string) {
    try {
      if (!selectedThesis) return
      
      await api.post(`thesis/${selectedThesis.id}/adviser_review/`, {
        action,
        feedback: reviewFeedback
      })
      
      setReviewOpen(false)
      setReviewFeedback('')
      load()
    } catch (error) {
      console.error('Error reviewing thesis:', error)
    }
  }

  const openReviewDialog = (thesis: Thesis) => {
    setSelectedThesis(thesis)
    setReviewFeedback('')
    setReviewOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return <Edit fontSize="small" />
      case 'submitted':
        return <Schedule fontSize="small" />
      case 'approved':
        return <Visibility fontSize="small" />
      default:
        return <Description fontSize="small" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'default'
      case 'submitted':
        return 'warning'
      case 'topic_approved':
        return 'info'
      case 'under_review':
        return 'warning'
      case 'approved':
        return 'success'
      case 'rejected':
        return 'error'
      case 'revision_requested':
        return 'warning'
      default:
        return 'default'
    }
  }

  const filteredTheses = theses.filter((thesis) => {
    const matchesSearch = searchQuery === '' || 
      thesis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (thesis.group && 
        ((typeof thesis.group === 'string' && thesis.group.toLowerCase().includes(searchQuery.toLowerCase())) ||
         (typeof thesis.group === 'object' && thesis.group.name.toLowerCase().includes(searchQuery.toLowerCase())))
      )

    const matchesStatus = filterStatus === 'all' || thesis.status === filterStatus

    const matchesAdviser = filterAdviser === 'all' // Would need adviser field in real implementation

    return matchesSearch && matchesStatus && matchesAdviser
  })

  const uniqueAdvisers = ['Dr. Sarah Johnson', 'Dr. Michael Brown', 'Dr. Emily Davis'] // Mock data

  return (
    <Box sx={{ p: 4, backgroundColor: '#F8FAFC' }}>
      {/* Welcome Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 6 }}>
        <Box>
          <Typography variant="h3" sx={{ color: '#1E293B', fontWeight: 600, mb: 1 }}>
            Thesis Management
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Description style={{ width: '16px', height: '16px', color: '#10B981' }} />
            <Typography variant="body1" sx={{ color: '#64748B' }}>
              Manage and track your thesis submissions
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
            <Description style={{ width: '16px', height: '16px', color: '#10B981' }} />
            <Typography variant="body2" sx={{ color: '#065F46', fontWeight: 500 }}>
              {theses.length} Total Theses
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            sx={{
              backgroundColor: '#10B981',
              '&:hover': { backgroundColor: '#059669' },
              borderRadius: 2,
              textTransform: 'none',
              px: 3
            }}
          >
            {currentUser?.role === 'STUDENT' ? 'Create Topic Proposal' : 'Create Thesis'}
          </Button>
        </Box>
      </Box>
      
      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="My Thesis" />
          <Tab label="Other Students' Theses" />
        </Tabs>
      </Box>
      
      {/* My Thesis Tab */}
      {currentTab === 0 && (
        <>
          {loading ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
            <Typography variant="h6" color="text.secondary">
              Loading theses...
            </Typography>
          </Box>
        </Paper>
      ) : theses.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', border: '2px dashed #CBD5E1' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <Description sx={{ fontSize: 64, color: '#CBD5E1' }} />
            <Box>
              <Typography variant="h5" sx={{ color: '#475569', fontWeight: 600, mb: 1 }}>
                No Thesis Available
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                You haven't created any thesis yet. Get started by creating your first thesis project.
              </Typography>
              {userGroups.length === 0 ? (
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: '#FEF2F2', 
                  border: '1px solid #FECACA',
                  borderRadius: 1,
                  maxWidth: 400,
                  mx: 'auto'
                }}>
                  <Typography variant="body2" color="#DC2626" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
                    You need to be in a group first
                  </Typography>
                  <Typography variant="body2" color="#7F1D1D" sx={{ mb: 1, textAlign: 'center' }}>
                    To create a thesis, you must be part of a research group. Contact your adviser or join an existing group.
                  </Typography>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setOpen(true)}
                  sx={{
                    backgroundColor: '#10B981',
                    '&:hover': { backgroundColor: '#059669' },
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 4
                  }}
                >
                  Create Your First Thesis
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Thesis List - Full Width */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, border: '1px solid #e2e8f0' }}>
              {/* Filter Bar */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  placeholder="Search thesis title or group..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                  size="small"
                />

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Status"
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="submitted">Submitted</MenuItem>
                      <MenuItem value="under_review">Under Review</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Adviser</InputLabel>
                    <Select
                      value={filterAdviser}
                      label="Adviser"
                      onChange={(e) => setFilterAdviser(e.target.value)}
                    >
                      <MenuItem value="all">All Advisers</MenuItem>
                      {uniqueAdvisers.map((adviser) => (
                        <MenuItem key={adviser} value={adviser}>
                          {adviser}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Thesis List
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>Group</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>Adviser</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>Progress</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>Last Updated</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTheses.map((thesis) => (
                      <TableRow
                        key={thesis.id}
                        hover
                        selected={selectedThesis?.id === thesis.id}
                        onClick={() => setSelectedThesis(thesis)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell sx={{ fontWeight: 500 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {thesis.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {thesis.group ? (
                            <Typography variant="body2" color="text.secondary">
                              {typeof thesis.group === 'string' ? thesis.group : thesis.group.name}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              No Group
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {thesis.adviser ? (
                            <Typography variant="body2" color="text.secondary">
                              {thesis.adviser}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              No adviser
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(thesis.status)}
                            label={thesis.status}
                            size="small"
                            variant="outlined"
                            color={getStatusColor(thesis.status) as any}
                            sx={{ fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={thesis.progress || 0}
                              sx={{ 
                                width: 60, 
                                height: 6, 
                                borderRadius: 3,
                                bgcolor: '#e2e8f0',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  bgcolor: theme => 
                                    (thesis.progress || 0) >= 75 ? '#059669' :
                                    (thesis.progress || 0) >= 50 ? '#d97706' :
                                    (thesis.progress || 0) >= 25 ? '#0ea5e9' : '#dc2626'
                                }
                              }}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {thesis.progress || 0}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                          {thesis.lastUpdated || 'Never'}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedThesis(thesis)
                                setViewDetailsOpen(true)
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                            {currentUser?.role === 'STUDENT' && (
                              <>
                                <IconButton 
                                  size="small" 
                                  color="info"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Handle edit for students
                                    setOpen(true)
                                    setTitle(thesis.title)
                                    setAbstract(thesis.abstract || '')
                                    setKeywords(thesis.keywords || '')
                                    setSelectedThesis(thesis)
                                  }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  color="success"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Handle view documents for students
                                    alert('Document management functionality coming soon')
                                  }}
                                >
                                  <Description fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  color="warning"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Handle view progress for students
                                    alert('Progress tracking functionality coming soon')
                                  }}
                                >
                                  <Timeline fontSize="small" />
                                </IconButton>
                              </>
                            )}
                            {currentUser?.role !== 'STUDENT' && (
                              <>
                                <IconButton 
                                  size="small" 
                                  color="info"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Handle edit
                                  }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Handle delete
                                  }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
        </>
      )}
      
      {/* Other Theses Tab */}
      {currentTab === 1 && (
        <>
          {loading ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
                <Typography variant="h6" color="text.secondary">
                  Loading other theses...
                </Typography>
              </Box>
            </Paper>
          ) : allTheses.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', border: '2px dashed #CBD5E1' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <People sx={{ fontSize: 64, color: '#CBD5E1' }} />
                <Box>
                  <Typography variant="h5" sx={{ color: '#475569', fontWeight: 600, mb: 1 }}>
                    No Other Theses Available
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    There are no other student theses available to view at this time.
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3, border: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Other Students' Theses
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Browse and learn from other students' thesis projects
                  </Typography>
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Title</TableCell>
                          <TableCell>Author</TableCell>
                          <TableCell>Group</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allTheses
                          .filter(thesis => !theses.some(myThesis => myThesis.id === thesis.id))
                          .map((thesis) => (
                          <TableRow key={thesis.id}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {thesis.title}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {thesis.proposer ? 
                                  (thesis.proposer.first_name && thesis.proposer.last_name ? 
                                    `${thesis.proposer.first_name} ${thesis.proposer.last_name}` : 
                                    thesis.proposer.username) : 
                                  'Unknown'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {thesis.group && typeof thesis.group === 'object' ? 
                                  thesis.group.name : 'Unknown'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={thesis.status} 
                                color={getStatusColor(thesis.status) as any}
                                size="small"
                                icon={getStatusIcon(thesis.status)}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton 
                                  size="small" 
                                  onClick={() => {
                                    setSelectedThesis(thesis)
                                    setViewDetailsOpen(true)
                                  }}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                                {currentUser?.role === 'STUDENT' && (
                                  <>
                                    <IconButton 
                                      size="small" 
                                      color="success"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        // Handle view documents for students
                                        alert('Document management functionality coming soon')
                                      }}
                                    >
                                      <Description fontSize="small" />
                                    </IconButton>
                                    <IconButton 
                                      size="small" 
                                      color="warning"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        // Handle view progress for students
                                        alert('Progress tracking functionality coming soon')
                                      }}
                                    >
                                      <Timeline fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          )}
        </>
      )}

      {/* Create Thesis Dialog */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>{currentUser?.role === 'STUDENT' ? 'Create New Topic Proposal' : 'Create New Thesis'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Thesis Title"
            fullWidth
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Abstract"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Keywords"
            fullWidth
            variant="outlined"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g., machine learning, artificial intelligence, data science"
            helperText="Enter comma-separated keywords for your topic proposal"
            sx={{ mb: 2 }}
          />
          
          {/* Show info when user has exactly one group */}
          {userGroups.length === 1 && (
            <Box sx={{ 
              mb: 2, 
              p: 2, 
              backgroundColor: '#F0FDF4', 
              border: '1px solid #BBF7D0',
              borderRadius: 1
            }}>
              <Typography variant="body2" sx={{ color: '#166534', fontWeight: 500 }}>
                Group: {userGroups[0].name}
              </Typography>
              <Typography variant="caption" color="#166534" sx={{ mt: 0.5, display: 'block' }}>
                Your thesis will be created for this group
              </Typography>
            </Box>
          )}
          
          {userGroups.length === 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}>
                <Typography variant="body2" color="warning.dark" sx={{ fontWeight: 600, mb: 1 }}>
                  You are not a member of any group
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  To create a thesis, you need to be part of a group first. Here's what you can do:
                </Typography>
                <Typography variant="body2" color="text.secondary" component="div">
                  <ul style={{ margin: 0, paddingLeft: '1.5em' }}>
                    <li>Contact your adviser to be assigned to a group</li>
                    <li>Check with your department about group formation</li>
                    <li>Ask fellow students if you can join their existing group</li>
                  </ul>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Once you're in a group, you'll be able to create and submit your thesis here.
                </Typography>
              </Box>
            )}
          </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={userGroups.length === 0 || !title.trim()}
          >
            {currentUser?.role === 'STUDENT' ? 'Create Topic Proposal' : 'Create Thesis'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Thesis Details Dialog */}
      <Dialog 
        open={viewDetailsOpen} 
        onClose={() => setViewDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              Thesis Details
            </Typography>
            <IconButton onClick={() => setViewDetailsOpen(false)} size="small">
              ×
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedThesis && (
            <Box>
              {/* Title and Status */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, flex: 1 }}>
                  {selectedThesis.title}
                </Typography>
                <Chip
                  label={selectedThesis.status}
                  size="small"
                  color={getStatusColor(selectedThesis.status) as any}
                  variant="outlined"
                />
              </Box>
              
              {/* Basic Info */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Group:</strong> {selectedThesis.group ? (typeof selectedThesis.group === 'string' ? selectedThesis.group : selectedThesis.group.name) : 'No Group'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Status:</strong> {selectedThesis.status}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Last Updated:</strong> {selectedThesis.lastUpdated || 'Never'}
                </Typography>
              </Box>

              {/* Abstract Section */}
              {selectedThesis.abstract && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Abstract
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {selectedThesis.abstract}
                  </Typography>
                </Box>
              )}

              {/* Keywords Section */}
              {selectedThesis.keywords && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Keywords
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedThesis.keywords.split(',').map((keyword, index) => (
                      <Chip
                        key={index}
                        label={keyword.trim()}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Adviser Feedback Section */}
              {selectedThesis.adviser_feedback && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Adviser Feedback
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: '#F5F5F5', 
                    border: '1px solid #E0E0E0',
                    borderRadius: 1
                  }}>
                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                      {selectedThesis.adviser_feedback}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Progress Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Progress
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={selectedThesis.progress || 0}
                    sx={{ 
                      flex: 1, 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: '#e2e8f0',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        bgcolor: theme => 
                          (selectedThesis.progress || 0) >= 75 ? '#059669' :
                          (selectedThesis.progress || 0) >= 50 ? '#d97706' :
                          (selectedThesis.progress || 0) >= 25 ? '#0ea5e9' : '#dc2626'
                      }
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: '40px' }}>
                    {selectedThesis.progress || 0}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setViewDetailsOpen(false)}>
            Close
          </Button>
          
          {/* Adviser Review Actions */}
          {currentUser?.role === 'ADVISER' && selectedThesis && (
            <>
              {selectedThesis.status === 'CONCEPT_SUBMITTED' && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => openReviewDialog(selectedThesis)}
                  startIcon={<Visibility />}
                >
                  Review Proposal
                </Button>
              )}
              {selectedThesis.status === 'CONCEPT_APPROVED' && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => openReviewDialog(selectedThesis)}
                  startIcon={<Visibility />}
                >
                  Review Full Thesis
                </Button>
              )}
            </>
          )}
          
          {/* Student can resubmit if revision requested */}
          {currentUser?.role === 'STUDENT' && selectedThesis?.status === 'REVISIONS_REQUIRED' && (
            <Button
              variant="contained"
              onClick={() => {
                setViewDetailsOpen(false)
                setOpen(true)
                setTitle(selectedThesis.title)
                setAbstract(selectedThesis.abstract || '')
                setKeywords(selectedThesis.keywords || '')
              }}
              startIcon={<Edit />}
            >
              Resubmit Proposal
            </Button>
          )}
          
          {/* Student action buttons */}
          {currentUser?.role === 'STUDENT' && selectedThesis && (
            <>
              <Button
                variant="outlined"
                startIcon={<Description />}
                onClick={() => {
                  alert('Document management functionality coming soon')
                }}
              >
                View Documents
              </Button>
              <Button
                variant="outlined"
                startIcon={<Timeline />}
                onClick={() => {
                  alert('Progress tracking functionality coming soon')
                }}
              >
                View Progress
              </Button>
            </>
          )}
          
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => {
              setViewDetailsOpen(false)
              // Handle edit
            }}
          >
            Edit Thesis
          </Button>
        </DialogActions>
      </Dialog>

      {/* Adviser Review Dialog */}
      <Dialog 
        open={reviewOpen} 
        onClose={() => setReviewOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Review Topic Proposal
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            "{selectedThesis?.title}"
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Feedback"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={reviewFeedback}
            onChange={(e) => setReviewFeedback(e.target.value)}
            placeholder="Provide your feedback and comments..."
            sx={{ mb: 3 }}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose an action:
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setReviewOpen(false)}>
            Cancel
          </Button>
          
          {selectedThesis?.status === 'CONCEPT_SUBMITTED' && (
            <>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleReview('reject')}
                disabled={!reviewFeedback.trim()}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="warning"
                onClick={() => handleReview('request_revision')}
                disabled={!reviewFeedback.trim()}
              >
                Request Revision
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => handleReview('approve_topic')}
                disabled={!reviewFeedback.trim()}
              >
                Approve Topic
              </Button>
            </>
          )}
          
          {selectedThesis?.status === 'CONCEPT_APPROVED' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleReview('approve_thesis')}
              disabled={!reviewFeedback.trim()}
            >
              Send to Panel
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}
