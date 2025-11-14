import React, { useEffect, useState } from 'react'
import { Container, Typography, List, ListItem, ListItemText, Button, Box } from '@mui/material'
import { listThesis, submitThesis, adviserReview } from '../../api/thesisService'

export default function ThesisWorkflowPage(){
  const [items,setItems]=useState<any[]>([])
  useEffect(()=>{ load() },[])
  async function load(){ try{ const r = await listThesis(); setItems(r.data) }catch{} }
  async function handleSubmit(id:number){ await submitThesis(id); load() }
  async function handleAdviserAction(id:number, action:string){ await adviserReview(id, action, 'Reviewed'); load() }
  return (
    <Container sx={{ mt:4 }}>
      <Typography variant="h4">Thesis Workflow</Typography>
      <List>
        {items.map(t=> (
          <ListItem key={t.id}>
            <ListItemText primary={t.title} secondary={`Status: ${t.status}`} />
            {t.status==='DRAFT' && <Button onClick={()=>handleSubmit(t.id)}>Submit</Button>}
            {t.status==='SUBMITTED' && <Box><Button onClick={()=>handleAdviserAction(t.id,'approve')}>Approve</Button><Button onClick={()=>handleAdviserAction(t.id,'reject')}>Reject</Button></Box>}
          </ListItem>
        ))}
      </List>
    </Container>
  )
}
