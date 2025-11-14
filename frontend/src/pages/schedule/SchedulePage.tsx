import React, { useEffect, useState } from 'react'
import { Container, Typography, Box, TextField, Button, List, ListItem, ListItemText, Alert } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { listSchedules, createSchedule, deleteSchedule } from '../../api/scheduleService'

export default function SchedulePage(){
  const [schedules,setSchedules]=useState<any[]>([])
  const [start,setStart]=useState<Date | null>(new Date())
  const [end,setEnd]=useState<Date | null>(new Date(Date.now() + 3600*1000))
  const [group,setGroup]=useState('')
  const [error,setError]=useState('')

  async function load(){ try{ const r = await listSchedules(); setSchedules(r.data) }catch{} }
  useEffect(()=>{ load() },[])
  async function handleCreate(){
    setError('')
    if (!group || !start || !end) return setError('Fill fields')
    try{
      await createSchedule({ group: Number(group), start_at: start.toISOString(), end_at: end.toISOString(), location: 'TBD' })
      load()
    }catch(e:any){
      setError(e?.response?.data?.conflicts ? 'Conflict detected' : 'Create failed')
    }
  }
  async function handleDelete(id:number){ await deleteSchedule(id); load() }

  return (
    <Container sx={{ mt:4 }}>
      <Typography variant="h4">Defense Scheduling</Typography>
      <Box sx={{ mt:2, display:'flex', gap:2 }}>
        <TextField label="Group ID" value={group} onChange={e=>setGroup(e.target.value)} />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateTimePicker
            label="Start"
            value={start}
            onChange={v => setStart(v)}
            slotProps={{ textField: { variant: 'outlined' } }}
          />
          <DateTimePicker
            label="End"
            value={end}
            onChange={v => setEnd(v)}
            slotProps={{ textField: { variant: 'outlined' } }}
          />
        </LocalizationProvider>
        <Button variant="contained" onClick={handleCreate}>Create</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mt:2 }}>{error}</Alert>}
      <List sx={{ mt:2 }}>
        {schedules.map(s=> <ListItem key={s.id}><ListItemText primary={`${s.group.name} @ ${new Date(s.start_at).toLocaleString()}`} secondary={`${s.location}`} /><Button onClick={()=>handleDelete(s.id)}>Delete</Button></ListItem>)}
      </List>
    </Container>
  )
}
