import React, { useEffect, useState } from 'react'
import { Container, Typography, Box, TextField, Button, List, ListItem, ListItemText, Alert, Paper, Select, MenuItem, FormControl, InputLabel, Chip, Avatar, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { Schedule, Delete, Add, EventNote, LocationOn, People, AccessTime } from '@mui/icons-material'
import { listSchedules, createSchedule, deleteSchedule } from '../../api/scheduleService'
import { useAuth } from '../../hooks/useAuth'

export default function SchedulePage(){
  const { user, isAdmin, isAdviser, isStudent, isPanel } = useAuth()
  const [schedules,setSchedules]=useState<any[]>([])
  const [start,setStart]=useState<Date | null>(new Date())
  const [end,setEnd]=useState<Date | null>(new Date(Date.now() + 3600*1000))
  const [group,setGroup]=useState('')
  const [error,setError]=useState('')
  const [defenseType, setDefenseType] = useState('proposal')
  const [location, setLocation] = useState('TBD')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState('Dec 18-22, 2024')

  async function load(){ 
  try{ 
    const r = await listSchedules(); 
    let allSchedules = r.data
    
    // Filter schedules based on user role
    if (isStudent && user) {
      // Students can only see schedules for their groups
      allSchedules = allSchedules.filter((schedule: any) => 
        schedule.group?.members?.some((member: any) => member.id === user.id)
      )
    }
    
    setSchedules(allSchedules)
  }catch{} 
}
  useEffect(()=>{ load() },[user, isStudent])
  async function handleCreate(){
    setError('')
    if (!group || !start || !end) return setError('Fill fields')
    try{
      await createSchedule({ 
        group: Number(group), 
        start_at: start.toISOString(), 
        end_at: end.toISOString(), 
        location: location 
      })
      load()
      setDialogOpen(false)
      setGroup('')
      setLocation('TBD')
      setDefenseType('proposal')
    }catch(e:any){
      setError(e?.response?.data?.conflicts ? 'Conflict detected' : 'Create failed')
    }
  }
  async function handleDelete(id:number){ await deleteSchedule(id); load() }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return '#10B981'
      case 'Pending':
        return '#F59E0B'
      default:
        return '#64748B'
    }
  }

  const getDefenseTypeColor = (type: string) => {
    switch (type) {
      case 'proposal':
        return '#2563EB'
      case 'progress':
        return '#7C3AED'
      case 'final':
        return '#DC2626'
      default:
        return '#64748B'
    }
  }

  return (
    <Box sx={{ p: 4, backgroundColor: '#F8FAFC' }}>
      {/* Welcome Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 6 }}>
        <Box>
          <Typography variant="h3" sx={{ color: '#1E293B', fontWeight: 600, mb: 1 }}>
            Schedule Management
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EventNote sx={{ width: 16, height: 16, color: '#10B981' }} />
            <Typography variant="body1" sx={{ color: '#64748B' }}>
              Manage thesis defenses and review sessions with conflict detection
            </Typography>
          </Box>
        </Box>
        {(isAdmin || isAdviser || isPanel) && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            sx={{
              backgroundColor: '#10B981',
              '&:hover': { backgroundColor: '#059669' },
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              fontWeight: 500
            }}
          >
            Schedule Defense
          </Button>
        )}
      </Box>

      {/* Calendar Navigation */}
      <Paper sx={{ p: 3, mb: 4, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button variant="outlined" size="small">
            Previous Week
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EventNote sx={{ color: '#10B981' }} />
            <Typography variant="body1" sx={{ color: '#1E293B', fontWeight: 500 }}>
              {selectedWeek}
            </Typography>
          </Box>
          <Button variant="outlined" size="small">
            Next Week
          </Button>
        </Box>
      </Paper>

      {/* Schedule List */}
      <Paper sx={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600, mb: 3 }}>
            Upcoming Defenses
          </Typography>
          {schedules.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <EventNote sx={{ fontSize: 48, color: '#E2E8F0', mb: 2 }} />
              <Typography variant="body1" sx={{ color: '#64748B' }}>
                No schedules found
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {schedules.map((schedule) => (
                <Box
                  key={schedule.id}
                  sx={{
                    p: 3,
                    border: '1px solid #E2E8F0',
                    borderRadius: 2,
                    backgroundColor: '#FFFFFF',
                    '&:hover': { backgroundColor: '#F8FAFC' },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Chip
                          label="Confirmed"
                          size="small"
                          sx={{
                            backgroundColor: '#F0FDF4',
                            color: '#10B981',
                            border: '1px solid #BBF7D0',
                            fontWeight: 500
                          }}
                        />
                        <Chip
                          label="Proposal Defense"
                          size="small"
                          sx={{
                            backgroundColor: '#EFF6FF',
                            color: '#2563EB',
                            border: '1px solid #BFDBFE',
                            fontWeight: 500
                          }}
                        />
                      </Box>
                      
                      <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600, mb: 1 }}>
                        {schedule.group?.name || `Group ${schedule.group}`}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTime sx={{ fontSize: 16, color: '#64748B' }} />
                          <Typography variant="body2" sx={{ color: '#64748B' }}>
                            {new Date(schedule.start_at).toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOn sx={{ fontSize: 16, color: '#64748B' }} />
                          <Typography variant="body2" sx={{ color: '#64748B' }}>
                            {schedule.location}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 24, height: 24, backgroundColor: '#10B981' }}>
                          <People sx={{ fontSize: 14 }} />
                        </Avatar>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>
                          Panel Members: Dr. James Wilson, Dr. Elena Rodriguez
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <EventNote sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(schedule.id)}
                          sx={{ color: '#EF4444' }}
                        >
                          <Delete sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Schedule Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Schedule New Defense</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <FormControl size="small" fullWidth>
              <InputLabel>Defense Type</InputLabel>
              <Select
                value={defenseType}
                label="Defense Type"
                onChange={(e) => setDefenseType(e.target.value)}
              >
                <MenuItem value="proposal">Proposal Defense</MenuItem>
                <MenuItem value="progress">Progress Review</MenuItem>
                <MenuItem value="final">Final Defense</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Group ID"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              fullWidth
              size="small"
            />

            <TextField
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              fullWidth
              size="small"
            />

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <DateTimePicker
                  label="Start Time"
                  value={start}
                  onChange={setStart}
                  slotProps={{ textField: { variant: 'outlined', size: 'small', fullWidth: true } }}
                />
                <DateTimePicker
                  label="End Time"
                  value={end}
                  onChange={setEnd}
                  slotProps={{ textField: { variant: 'outlined', size: 'small', fullWidth: true } }}
                />
              </Box>
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreate}
            variant="contained"
            sx={{
              backgroundColor: '#10B981',
              '&:hover': { backgroundColor: '#059669' },
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            Schedule Defense
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
