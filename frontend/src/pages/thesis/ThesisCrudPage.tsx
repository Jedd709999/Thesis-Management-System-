import React, { useEffect, useState } from 'react'
import { Container, Typography, Button, Dialog, Box, TextField, List, ListItem, ListItemText } from '@mui/material'
import { listThesis, createThesis } from '../../api/thesisService'

export default function ThesisCrudPage(){
  const [items,setItems]=useState<any[]>([])
  const [open,setOpen]=useState(false)
  const [title,setTitle]=useState('')
  const [abstract,setAbstract]=useState('')
  const [group,setGroup]=useState('')

  async function load(){ try{ const r = await listThesis(); setItems(r.data) }catch{} }
  useEffect(()=>{ load() },[])
  async function handleCreate(){ await createThesis({ title, abstract, group }); setOpen(false); load() }

  return (
    <Container sx={{ mt:4 }}>
      <Typography variant="h4">Thesis</Typography>
      <Button variant="contained" sx={{ mt:2 }} onClick={()=>setOpen(true)}>New Thesis</Button>
      <List sx={{ mt:2 }}>
        {items.map(t=> <ListItem key={t.id}><ListItemText primary={t.title} secondary={`Status: ${t.status}`} /></ListItem>)}
      </List>
      <Dialog open={open} onClose={()=>setOpen(false)}>
        <Box sx={{ p:3, minWidth:350 }}>
          <Typography variant="h6">Create Thesis</Typography>
          <TextField fullWidth label="Title" sx={{ mt:2 }} value={title} onChange={e=>setTitle(e.target.value)} />
          <TextField fullWidth label="Abstract" sx={{ mt:2 }} multiline rows={4} value={abstract} onChange={e=>setAbstract(e.target.value)} />
          <TextField fullWidth label="Group ID" sx={{ mt:2 }} value={group} onChange={e=>setGroup(e.target.value)} />
          <Button fullWidth variant="contained" sx={{ mt:2 }} onClick={handleCreate}>Save</Button>
        </Box>
      </Dialog>
    </Container>
  )
}
