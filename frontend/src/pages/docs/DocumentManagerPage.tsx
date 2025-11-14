import React, { useEffect, useState } from 'react'
import { Container, Typography, List, ListItem, ListItemText, Button, Box, TextField } from '@mui/material'
import { listDocuments, uploadDocument, linkGoogleDoc } from '../../api/documentService'
import FileUpload from '../../components/FileUpload'
import { useNavigate } from 'react-router-dom'

export default function DocumentManagerPage(){
  const [items,setItems]=useState<any[]>([])
  const [linkUrl,setLinkUrl]=useState('')
  const [thesisId,setThesisId]=useState('')
  const navigate = useNavigate()

  async function load(){ try{ const r = await listDocuments(); setItems(r.data) }catch{} }
  useEffect(()=>{ load() },[])
  async function handleUpload(f:File){ const fd = new FormData(); fd.append('file', f); fd.append('thesis', thesisId); await uploadDocument(fd); load() }
  async function handleLink(){ await linkGoogleDoc({ thesis: thesisId, google_doc_url: linkUrl, provider:'google' }); setLinkUrl(''); setThesisId(''); load() }

  return (
    <Container sx={{ mt:4 }}>
      <Typography variant="h4">Documents</Typography>
      <Box sx={{ mt:2, display:'flex', gap:2 }}>
        <TextField label="Thesis ID" value={thesisId} onChange={e=>setThesisId(e.target.value)} />
        <FileUpload onChange={handleUpload} />
      </Box>
      <Box sx={{ mt:2, display:'flex', gap:2 }}>
        <TextField label="Google Doc URL" value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} sx={{ flex:1 }} />
        <Button variant="contained" onClick={handleLink}>Link</Button>
      </Box>
      <List sx={{ mt:2 }}>
        {items.map(d=> <ListItem key={d.id} button onClick={()=>navigate(`/documents/edit/${d.id}`)}><ListItemText primary={d.id} secondary={d.google_doc_url || d.file} /></ListItem>)}
      </List>
    </Container>
  )
}
