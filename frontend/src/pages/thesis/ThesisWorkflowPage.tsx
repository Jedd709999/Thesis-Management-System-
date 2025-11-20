import React, { useEffect, useState } from 'react'
import { 
  Container, 
  Typography, 
  Grid, 
  Button, 
  Box, 
  Chip, 
  Avatar, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress
} from '@mui/material'
import { 
  Edit, 
  Add, 
  Send, 
  CheckCircle, 
  Schedule, 
  People, 
  Description,
  ChevronRight,
  Search,
  Filter,
  InsertDriveFile
} from '@mui/icons-material'
import { listThesis, submitThesis, adviserReview } from '../../api/thesisService'

interface Thesis {
  id: number
  title: string
  abstract: string
  group: string
  group_id?: number
  proposer: number
  status: "CONCEPT_SUBMITTED" | "CONCEPT_SCHEDULED" | "CONCEPT_DEFENDED" | "CONCEPT_APPROVED" | "PROPOSAL_SUBMITTED" | "PROPOSAL_SCHEDULED" | "PROPOSAL_DEFENDED" | "PROPOSAL_APPROVED" | "RESEARCH_IN_PROGRESS" | "FINAL_SUBMITTED" | "FINAL_SCHEDULED" | "FINAL_DEFENDED" | "FINAL_APPROVED" | "REVISIONS_REQUIRED" | "REJECTED" | "ARCHIVED"
  adviser_feedback?: string
  created_at: string
  updated_at: string
  // Additional fields for UI (not from API)
  progress?: number
  members?: { name: string; role: string }[]
  panel?: { name: string; role: string }[]
  documents?: { name: string; type: string; date: string }[]
  timeline?: { stage: string; date: string; status: "completed" | "pending" }[]
  adviser?: string // Added for UI display
}

export default function ThesisWorkflowPage() {
  const [theses, setTheses] = useState<Thesis[]>([])
  const [selectedThesis, setSelectedThesis] = useState<Thesis | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterAdviser, setFilterAdviser] = useState<string>("all")

  console.log('ThesisWorkflowPage rendering, theses count:', theses.length)
  console.log('Selected thesis:', selectedThesis)

  useEffect(() => {
    loadTheses()
  }, [])

  async function loadTheses() {
    try {
      console.log('Loading theses...')
      const response = await listThesis()
      console.log('Raw API response:', response)
      console.log('Response data:', response.data)
      console.log('Response data type:', typeof response.data)
      console.log('Response data length:', Array.isArray(response.data) ? response.data.length : 'Not array')
      
      // Check if response.data exists and is an array
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response data format:', response.data)
        setTheses([])
        return
      }
      
      // Transform API data to include UI fields
      const transformedTheses = response.data.map((thesis: any) => {
        console.log('Processing thesis:', thesis)
        return {
          ...thesis,
          // Add mock data for UI fields not provided by API
          progress: thesis.status === 'FINAL_APPROVED' ? 100 : 
                    thesis.status === 'PROPOSAL_APPROVED' ? 75 :
                    thesis.status === 'CONCEPT_APPROVED' ? 50 : 25,
          adviser: 'Dr. Smith', // Mock adviser - you may want to get this from API
          members: [
            { name: 'Student 1', role: 'Leader' },
            { name: 'Student 2', role: 'Member' },
            { name: 'Student 3', role: 'Member' }
          ],
          panel: [
            { name: 'Dr. Smith', role: 'Adviser' },
            { name: 'Dr. Johnson', role: 'Panel Member' },
            { name: 'Dr. Williams', role: 'Panel Member' }
          ],
          documents: [
            { name: 'Thesis Proposal.pdf', type: 'PDF', date: thesis.created_at },
            { name: 'Research Methodology.docx', type: 'DOCX', date: thesis.created_at }
          ],
          timeline: [
            { stage: 'Proposal Submitted', date: thesis.created_at, status: 'completed' as const },
            { stage: 'Initial Review', date: thesis.updated_at, status: thesis.status === 'CONCEPT_SUBMITTED' ? 'pending' as const : 'completed' as const },
            { stage: 'Final Review', date: thesis.updated_at, status: thesis.status === 'FINAL_APPROVED' ? 'completed' as const : 'pending' as const }
          ]
        }
      })
      
      console.log('Transformed theses:', transformedTheses)
      console.log('Setting theses in state...')
      setTheses(transformedTheses)
      
      if (transformedTheses.length > 0) {
        console.log('Setting selected thesis:', transformedTheses[0])
        setSelectedThesis(transformedTheses[0])
      } else {
        console.log('No theses found')
        setSelectedThesis(null)
      }
    } catch (error) {
      console.error('Error loading theses:', error)
      setTheses([])
      setSelectedThesis(null)
    }
  }

  async function handleSubmit(id: number) {
    try {
      await submitThesis(id)
      loadTheses()
    } catch (error) {
      console.error('Error submitting thesis:', error)
    }
  }

  async function handleAdviserAction(id: number, action: string) {
    try {
      await adviserReview(id, action, 'Reviewed')
      loadTheses()
    } catch (error) {
      console.error('Error in adviser action:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONCEPT_SUBMITTED':
        return 'default'
      case 'CONCEPT_APPROVED':
        return 'warning'
      case 'PROPOSAL_APPROVED':
        return 'info'
      case 'FINAL_APPROVED':
        return 'success'
      case 'REJECTED':
        return 'error'
      case 'REVISIONS_REQUIRED':
        return 'warning'
      case 'ARCHIVED':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'CONCEPT_SUBMITTED':
        return 'border-grey-200'
      case 'CONCEPT_APPROVED':
        return 'border-blue-200'
      case 'PROPOSAL_APPROVED':
        return 'border-yellow-200'
      case 'FINAL_APPROVED':
        return 'border-green-200'
      case 'REJECTED':
        return 'border-red-200'
      case 'REVISIONS_REQUIRED':
        return 'border-orange-200'
      case 'ARCHIVED':
        return 'border-purple-200'
      default:
        return 'border-grey-200'
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'success'
    if (progress >= 50) return 'warning'
    if (progress >= 25) return 'info'
    return 'error'
  }

  const filteredTheses = theses.filter((thesis) => {
    const matchesSearch = 
      thesis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thesis.group.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || thesis.status === filterStatus
    const matchesAdviser = filterAdviser === "all" || thesis.adviser === filterAdviser
    return matchesSearch && matchesStatus && matchesAdviser
  })

  const uniqueAdvisers = Array.from(new Set(theses.map(t => t.adviser)))

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Thesis Management
      </Typography>
      
      {theses.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Loading theses...
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Left Column - Thesis List */}
          <Grid item xs={12} md={5}>
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
                      <MenuItem value="CONCEPT_SUBMITTED">Concept Submitted</MenuItem>
                      <MenuItem value="CONCEPT_APPROVED">Concept Approved</MenuItem>
                      <MenuItem value="PROPOSAL_SUBMITTED">Proposal Submitted</MenuItem>
                      <MenuItem value="PROPOSAL_APPROVED">Proposal Approved</MenuItem>
                      <MenuItem value="RESEARCH_IN_PROGRESS">Research In Progress</MenuItem>
                      <MenuItem value="FINAL_SUBMITTED">Final Submitted</MenuItem>
                      <MenuItem value="FINAL_APPROVED">Final Approved</MenuItem>
                      <MenuItem value="REVISIONS_REQUIRED">Revisions Required</MenuItem>
                      <MenuItem value="REJECTED">Rejected</MenuItem>
                      <MenuItem value="ARCHIVED">Archived</MenuItem>
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

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Thesis List
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>
                        Title
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>
                        Status
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>
                        Progress
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>
                        Updated
                      </TableCell>
                      <TableCell></TableCell>
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
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {thesis.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {thesis.group}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
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
                                width: 40, 
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
                            <Typography variant="caption" color="text.secondary">
                              {thesis.progress || 0}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                          {thesis.updated_at || 'Never'}
                        </TableCell>
                        <TableCell align="right">
                          <ChevronRight sx={{ color: '#94a3b8' }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Right Column - Thesis Detail */}
          <Grid item xs={12} md={7}>
            {selectedThesis ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Abstract Card */}
                <Paper sx={{ p: 3, border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                      {selectedThesis.title}
                    </Typography>
                    <Chip
                      label={selectedThesis.status}
                      size="small"
                      color={getStatusColor(selectedThesis.status) as any}
                      variant="outlined"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Group:</strong> {selectedThesis.group}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Adviser:</strong> {selectedThesis.adviser || 'Not assigned'}
                    </Typography>
                  </Box>

                  {/* Progress Bar */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        Progress
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedThesis.progress || 0}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={selectedThesis.progress || 0}
                      sx={{ 
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
                  </Box>
                  
                  {selectedThesis.abstract && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                        Abstract
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {selectedThesis.abstract}
                      </Typography>
                    </Box>
                  )}
                </Paper>

                {/* Documents Section */}
                {selectedThesis.documents && selectedThesis.documents.length > 0 && (
                  <Paper sx={{ p: 3, border: '1px solid #e2e8f0' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                      <InsertDriveFile fontSize="small" />
                      Documents
                    </Typography>
                    <List dense>
                      {selectedThesis.documents.map((doc, index) => (
                        <ListItem key={index} sx={{ py: 1, px: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#f1f5f9' }}>
                              <InsertDriveFile fontSize="small" sx={{ color: '#64748b' }} />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={500}>
                                {doc.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {doc.type} • {doc.date}
                              </Typography>
                            </Box>
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}

                {/* Group Members */}
                {selectedThesis.members && selectedThesis.members.length > 0 && (
                  <Paper sx={{ p: 3, border: '1px solid #e2e8f0' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                      <People fontSize="small" />
                      Group Members
                    </Typography>
                    <List dense>
                      {selectedThesis.members.map((member, index) => (
                        <ListItem key={index} sx={{ py: 1 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#f1f5f9', color: '#0f172a' }}>
                              {member.name.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={member.name}
                            secondary={member.role}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                            secondaryTypographyProps={{ variant: 'caption', color: '#64748b' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}

                {/* Panel Members */}
                {selectedThesis.panel && selectedThesis.panel.length > 0 && (
                  <Paper sx={{ p: 3, border: '1px solid #e2e8f0' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                      <People fontSize="small" />
                      Adviser & Panel
                    </Typography>
                    <List dense>
                      {selectedThesis.panel.map((member, index) => (
                        <ListItem key={index} sx={{ py: 1 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#dbeafe', color: '#1e40af' }}>
                              {member.name.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={member.name}
                            secondary={member.role}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                            secondaryTypographyProps={{ variant: 'caption', color: '#64748b' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    fullWidth
                    sx={{ py: 2, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}
                  >
                    Edit Thesis
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    fullWidth
                    sx={{ py: 2, bgcolor: '#1e40af', '&:hover': { bgcolor: '#1d4ed8' } }}
                  >
                    Add Document
                  </Button>
                  {selectedThesis.status === 'CONCEPT_SUBMITTED' && (
                    <Button
                      variant="contained"
                      startIcon={<Send />}
                      fullWidth
                      sx={{ py: 2, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                      onClick={() => handleSubmit(selectedThesis.id)}
                    >
                      Submit for Review
                    </Button>
                  )}
                  {selectedThesis.status === 'CONCEPT_APPROVED' && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        sx={{ flex: 1, py: 2, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                        onClick={() => handleAdviserAction(selectedThesis.id, 'approve')}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        sx={{ flex: 1, py: 2, bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
                        onClick={() => handleAdviserAction(selectedThesis.id, 'reject')}
                      >
                        Reject
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Timeline Section */}
                {selectedThesis.timeline && selectedThesis.timeline.length > 0 && (
                  <Paper sx={{ p: 3, border: '1px solid #e2e8f0' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Activity Timeline
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {selectedThesis.timeline.map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 3 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: item.status === 'completed' ? '#f0fdf4' : '#f8fafc',
                                color: item.status === 'completed' ? '#166534' : '#64748b'
                              }}
                            >
                              {item.status === 'completed' ? (
                                <CheckCircle fontSize="small" />
                              ) : (
                                <Schedule fontSize="small" />
                              )}
                            </Avatar>
                            {index < selectedThesis.timeline.length - 1 && (
                              <Box sx={{ width: 2, height: 48, bgcolor: '#e2e8f0' }} />
                            )}
                          </Box>
                          <Box sx={{ pt: 1 }}>
                            <Typography variant="body1" fontWeight="medium" sx={{ mb: 0.5 }}>
                              {item.stage}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.date}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                )}
              </Box>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  Select a thesis to view details
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}
    </Container>
  )
}
