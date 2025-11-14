import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Container, Typography } from '@mui/material'
import api from '../../api/api'
import GoogleDocEmbed from '../../components/GoogleDocEmbed'

export default function DocumentEditorPage(){
  const { id } = useParams()
  const [doc, setDoc] = useState<any>(null)
  useEffect(()=>{ if (!id) return; (async ()=>{ const r = await api.get(`documents/${id}/`); setDoc(r.data) })() },[id])
  const url = doc?.embed_url || doc?.google_doc_url
  return (
    <Container sx={{ mt:4 }}>
      <Typography variant="h5">Document Editor</Typography>
      <GoogleDocEmbed url={url} height={800} />
    </Container>
  )
}
