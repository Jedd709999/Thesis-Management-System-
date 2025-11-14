import React, { useEffect, useState } from 'react'
import { Container, Typography, Button, Dialog, TextField, Box, List, ListItem, ListItemText } from '@mui/material'
import { listGroups, createGroup } from '../../api/groupService'
import { useNavigate } from 'react-router-dom'

export default function GroupListPage(){
  const [groups,setGroups]=useState<any[]>([])
  const [open,setOpen]=useState(false)
  const [name,setName]=useState('')
  const navigate = useNavigate()

  async function load(){ try{ const r = await listGroups(); setGroups(r.data) }catch{} }
  useEffect(()=>{ load() },[])
  async function handleCreate(){ if (!name) return; await createGroup({ name }); setName(''); setOpen(false); load() }

  return (
    <Container sx={{ mt:4 }}>
      <Typography variant="h4">Groups</Typography>
      <Button variant="contained" sx={{ mt:2 }} onClick={()=>setOpen(true)}>New Group</Button>
      <List sx={{ mt:2 }}>
        {groups.map(g=> <ListItem key={g.id} button onClick={()=>navigate(`/groups/${g.id}`)}><ListItemText primary={g.name} secondary={`Members: ${g.members?.length || 0}`} /></ListItem>)}
      </List>
      <Dialog open={open} onClose={()=>setOpen(false)}>
        <Box sx={{ p:3, minWidth:300 }}>
          <Typography variant="h6">Create Group</Typography>
          <TextField fullWidth label="Name" sx={{ mt:2 }} value={name} onChange={e=>setName(e.target.value)} />
          <Button fullWidth variant="contained" sx={{ mt:2 }} onClick={handleCreate}>Save</Button>
        </Box>
      </Dialog>
    </Container>
  )
}
