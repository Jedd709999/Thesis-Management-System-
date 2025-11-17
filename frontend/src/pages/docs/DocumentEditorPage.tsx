import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Typography, Box, Button, CircularProgress, Alert, Breadcrumbs, Link, IconButton, Tooltip } from '@mui/material'
import { ArrowBack, Share, Download, Edit, Visibility, CloudSync } from '@mui/icons-material'
import api from '../../api/api'
import LiveEditor from '../../components/LiveEditor'
import { useAuth } from '../../hooks/useAuth'

export default function DocumentEditorPage(){
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [doc, setDoc] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiveMode, setIsLiveMode] = useState(false)
  
  useEffect(()=>{ 
    if (!id) return
    loadDocument()
  },[id])
  
  const loadDocument = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await api.get(`documents/${id}/`)
      setDoc(r.data)
    } catch (err) {
      setError('Failed to load document')
      console.error('Error loading document:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleBack = () => {
    navigate('/documents')
  }
  
  const handleShare = () => {
    // Implement share functionality
    console.log('Share document')
  }
  
  const handleDownload = () => {
    if (doc?.file_url) {
      window.open(doc.file_url, '_blank')
    }
  }
  
  const toggleLiveMode = () => {
    setIsLiveMode(!isLiveMode)
  }
  
  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Loading document...
          </Typography>
        </Box>
      </Container>
    )
  }
  
  if (error || !doc) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Document not found'}
        </Alert>
        <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
          Back to Documents
        </Button>
      </Container>
    )
  }
  
  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton onClick={handleBack} sx={{ color: '#64748B' }}>
            <ArrowBack />
          </IconButton>
          <Breadcrumbs>
            <Link component="button" onClick={handleBack} sx={{ color: '#64748B' }}>
              Documents
            </Link>
            <Typography color="#1E293B" fontWeight={500}>
              {doc.title || `Document #${doc.id}`}
            </Typography>
          </Breadcrumbs>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#1E293B', fontWeight: 600, mb: 1 }}>
              {doc.title || `Document #${doc.id}`}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Provider: <strong>{doc.provider}</strong>
              </Typography>
              {doc.file_size && (
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  Size: <strong>{doc.file_size_display}</strong>
                </Typography>
              )}
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Last modified: <strong>{new Date(doc.created_at).toLocaleDateString()}</strong>
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={isLiveMode ? "Switch to View Mode" : "Enable Live Editing"}>
              <Button
                variant={isLiveMode ? "contained" : "outlined"}
                startIcon={isLiveMode ? <Edit /> : <Visibility />}
                onClick={toggleLiveMode}
                sx={{
                  backgroundColor: isLiveMode ? '#10B981' : 'transparent',
                  borderColor: '#E2E8F0',
                  color: isLiveMode ? 'white' : '#64748B',
                  '&:hover': {
                    backgroundColor: isLiveMode ? '#059669' : '#F8FAFC',
                    borderColor: '#CBD5E1'
                  }
                }}
              >
                {isLiveMode ? "Live Edit" : "View"}
              </Button>
            </Tooltip>
            
            <Tooltip title="Share Document">
              <IconButton onClick={handleShare} sx={{ color: '#64748B' }}>
                <Share />
              </IconButton>
            </Tooltip>
            
            {doc.file_url && (
              <Tooltip title="Download Document">
                <IconButton onClick={handleDownload} sx={{ color: '#64748B' }}>
                  <Download />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>
      
      {/* Live Editor */}
      <Box sx={{ 
        border: '1px solid #E2E8F0', 
        borderRadius: 2, 
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <LiveEditor
          documentId={parseInt(id!)}
          url={doc.embed_url || doc.google_doc_url}
          height={800}
          editable={isLiveMode}
          onDocumentChange={(content) => {
            console.log('Document changed:', content)
            // Handle document changes here
          }}
        />
      </Box>
      
      {/* Status Bar */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mt: 2,
        px: 2,
        py: 1,
        backgroundColor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudSync sx={{ fontSize: 16, color: '#10B981' }} />
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            {isLiveMode ? 'Live editing enabled' : 'View mode'}
          </Typography>
        </Box>
        
        <Typography variant="caption" sx={{ color: '#64748B' }}>
          {doc.provider === 'google' ? 'Google Docs' : doc.provider === 'drive' ? 'Google Drive' : 'Local Storage'}
        </Typography>
      </Box>
    </Container>
  )
}
