import React, { useState, useEffect } from 'react'
import { Container, Typography, Box, TextField, Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, Paper, Grid, Card, CardContent, Avatar, Badge, Tooltip } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Upload, Grid3x3, ViewList, Filter, Download, Visibility, Share, Description, Tablet, Slideshow, PictureAsPdf } from '@mui/icons-material'
import FileUpload from '../../components/FileUpload'
import { listDocuments, uploadDocument, uploadToDrive, linkGoogleDoc, deleteDocument, deleteFromDrive } from '../../api/documentService'
import { listThesis } from '../../api/thesisService'
import DeleteIcon from '@mui/icons-material/Delete'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DriveIcon from '@mui/icons-material/DriveFileMove'

interface Document {
  id: number
  thesis: number
  uploaded_by: any
  file: string | null
  google_doc_url: string | null
  google_drive_file_id: string | null
  google_drive_embed_url: string | null
  provider: string
  file_size: number | null
  mime_type: string | null
  created_at: string
  embed_url: string | null
  file_url: string | null
  file_size_display: string
}

export default function DocumentManagerPage() {
  const [items, setItems] = useState<Document[]>([])
  const [thesisId, setThesisId] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [uploadType, setUploadType] = useState<'local' | 'drive'>('local')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; doc: Document | null }>({ open: false, doc: null })
  const [uploadDialog, setUploadDialog] = useState(false)
  const [linkDialog, setLinkDialog] = useState(false)
  const [theses, setTheses] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [fileTypeFilter, setFileTypeFilter] = useState('all')
  const [permissionFilter, setPermissionFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function load() {
    setLoading(true)
    try {
      const [docsRes, thesesRes] = await Promise.all([
        listDocuments(),
        listThesis()
      ])
      setItems(docsRes.data.results || docsRes.data)
      setTheses(thesesRes.data.results || thesesRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <Description sx={{ color: '#64748b' }} />
    
    if (mimeType.includes('pdf')) return <PictureAsPdf sx={{ color: '#dc2626' }} />
    if (mimeType.includes('word') || mimeType.includes('document')) return <Description sx={{ color: '#2563eb' }} />
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return <Tablet sx={{ color: '#16a34a' }} />
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <Slideshow sx={{ color: '#ea580c' }} />
    return <Description sx={{ color: '#64748b' }} />
  }

  const getStatusColor = (provider: string) => {
    switch (provider) {
      case 'drive':
        return '#2563eb'
      case 'google':
        return '#7c3aed'
      default:
        return '#64748b'
    }
  }

  const getFileType = (mimeType: string | null) => {
    if (!mimeType) return 'Unknown'
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'DOCX'
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'XLSX'
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PPTX'
    return 'File'
  }

  const filteredDocuments = items.filter((doc) => {
    const fileType = getFileType(doc.mime_type)
    const matchesFileType = fileTypeFilter === 'all' || fileType === fileTypeFilter
    const matchesPermission = permissionFilter === 'all' || doc.provider === permissionFilter
    return matchesFileType && matchesPermission
  })

  const handleDocumentClick = (doc: Document) => {
    navigate(`/documents/edit/${doc.id}`)
  }

  async function handleUpload(f: File) {
    if (!thesisId) {
      alert('Please select a thesis first')
      return
    }
    
    try {
      if (uploadType === 'drive') {
        const fd = new FormData()
        fd.append('file', f)
        fd.append('thesis', thesisId)
        await uploadToDrive(fd)
      } else {
        const fd = new FormData()
        fd.append('file', f)
        fd.append('thesis', thesisId)
        await uploadDocument(fd)
      }
      setUploadDialog(false)
      load()
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    }
  }

  async function handleLink() {
    if (!thesisId || !linkUrl) {
      alert('Please select a thesis and enter a Google Doc URL')
      return
    }
    
    try {
      await linkGoogleDoc({ thesis: thesisId, google_doc_url: linkUrl, provider: 'google' })
      setLinkUrl('')
      setThesisId('')
      setLinkDialog(false)
      load()
    } catch (error) {
      console.error('Link failed:', error)
      alert('Failed to link Google Doc. Please check the URL and try again.')
    }
  }

  async function handleDelete(doc: Document) {
    if (doc.provider === 'drive') {
      await deleteFromDrive(doc.id)
    } else {
      await deleteDocument(doc.id)
    }
    setDeleteDialog({ open: false, doc: null })
    load()
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'drive':
        return <DriveIcon color="primary" />
      case 'google':
        return <DriveIcon color="secondary" />
      default:
        return <CloudUploadIcon />
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'drive':
        return 'primary'
      case 'google':
        return 'secondary'
      default:
        return 'default'
    }
  }

  return (
    <Box sx={{ p: 4, backgroundColor: '#F8FAFC' }}>
      {/* Welcome Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 6 }}>
        <Box>
          <Typography variant="h3" sx={{ color: '#1E293B', fontWeight: 600, mb: 1 }}>
            Document Manager
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Description style={{ width: '16px', height: '16px', color: '#10B981' }} />
            <Typography variant="body1" sx={{ color: '#64748B' }}>
              Manage research documents and files with Google Drive integration
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
            <Typography variant="body2" sx={{ color: '#10B981' }}>
              {filteredDocuments.length} documents
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => setUploadDialog(true)}
            sx={{
              backgroundColor: '#10B981',
              '&:hover': { backgroundColor: '#059669' },
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              fontWeight: 500
            }}
          >
            Upload Document
          </Button>
          <Button
            variant="outlined"
            startIcon={<Share />}
            onClick={() => setLinkDialog(true)}
            sx={{
              borderColor: '#E2E8F0',
              color: '#64748B',
              '&:hover': {
                borderColor: '#CBD5E1',
                backgroundColor: '#F8FAFC'
              },
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              fontWeight: 500
            }}
          >
            Link Google Doc
          </Button>
        </Box>
      </Box>

      {/* Controls */}
      <Paper sx={{ p: 3, mb: 4, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>File Type</InputLabel>
              <Select
                value={fileTypeFilter}
                label="File Type"
                onChange={(e) => setFileTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="PDF">PDF</MenuItem>
                <MenuItem value="DOCX">Word Docs</MenuItem>
                <MenuItem value="XLSX">Spreadsheets</MenuItem>
                <MenuItem value="PPTX">Presentations</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Provider</InputLabel>
              <Select
                value={permissionFilter}
                label="Provider"
                onChange={(e) => setPermissionFilter(e.target.value)}
              >
                <MenuItem value="all">All Providers</MenuItem>
                <MenuItem value="drive">Google Drive</MenuItem>
                <MenuItem value="google">Google Docs</MenuItem>
                <MenuItem value="local">Local Storage</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            border: '1px solid #e2e8f0', 
            borderRadius: 2, 
            p: 0.5 
          }}>
            <IconButton
              size="small"
              onClick={() => setViewMode('grid')}
              sx={{ 
                backgroundColor: viewMode === 'grid' ? '#ffffff' : 'transparent',
                boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Grid3x3 />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setViewMode('list')}
              sx={{ 
                backgroundColor: viewMode === 'list' ? '#ffffff' : 'transparent',
                boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <ViewList />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Loading documents...
          </Typography>
        </Box>
      )}

      {/* Empty State */}
      {!loading && filteredDocuments.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center', border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Box sx={{ mb: 3 }}>
            <Description sx={{ fontSize: 48, color: '#cbd5e1' }} />
          </Box>
          <Typography variant="h6" sx={{ color: '#475569', mb: 2 }}>
            No documents found
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            {fileTypeFilter !== 'all' || permissionFilter !== 'all'
              ? 'Try adjusting your filters to see more documents.'
              : 'Upload your first document to get started.'}
          </Typography>
        </Paper>
      )}

      {/* Grid View */}
      {!loading && viewMode === 'grid' && filteredDocuments.length > 0 && (
        <Grid container spacing={3}>
          {filteredDocuments.map((doc) => (
            <Grid item xs={12} sm={6} md={4} key={doc.id}>
              <Card 
                key={doc.id}
                sx={{ 
                  p: 3, 
                  border: '1px solid #e2e8f0', 
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)',
                    borderColor: '#10B981'
                  }
                }}
                onClick={() => handleDocumentClick(doc)}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ 
                    width: 48, 
                    height: 48, 
                    backgroundColor: '#f8fafc', 
                    borderRadius: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    {getFileIcon(doc.mime_type)}
                  </Box>
                  <Chip 
                    label={doc.provider.toUpperCase()} 
                    size="small"
                    sx={{ 
                      backgroundColor: getStatusColor(doc.provider),
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ color: '#0f172a', mb: 2, lineHeight: 1.4 }}>
                    {doc.file ? doc.file.split('/').pop() : `Document ${doc.id}`}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      {getFileType(doc.mime_type)} • {doc.file_size_display}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      {doc.uploaded_by ? `Uploaded by: ${doc.uploaded_by.email}` : 'Unknown uploader'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Chip 
                    label={doc.provider === 'drive' ? 'Google Drive' : doc.provider === 'google' ? 'Google Docs' : 'Local Storage'}
                    variant="outlined"
                    size="small"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  pt: 2, 
                  borderTop: '1px solid #e2e8f0' 
                }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    {new Date(doc.created_at).toLocaleDateString()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {doc.embed_url && (
                      <Tooltip title="View Embed">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(doc.embed_url, '_blank')
                          }}
                        >
                          <Visibility sx={{ fontSize: 16, color: '#64748b' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {doc.file_url && (
                      <Tooltip title="View File">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(doc.file_url!, '_blank')
                          }}
                        >
                          <Download sx={{ fontSize: 16, color: '#64748b' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Share">
                      <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                        <Share sx={{ fontSize: 16, color: '#64748b' }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {doc.google_doc_url && (
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2, textTransform: 'none', fontSize: '0.75rem' }}
                    startIcon={<Description />}
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(doc.google_doc_url!, '_blank')
                    }}
                  >
                    Open in Google Docs
                  </Button>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* List View */}
      {!loading && viewMode === 'list' && filteredDocuments.length > 0 && (
        <Paper sx={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Document
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Type
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Provider
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Uploaded By
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Size
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Modified
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr 
                    key={doc.id} 
                    style={{ 
                      borderBottom: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease-in-out'
                    }}
                    onClick={() => handleDocumentClick(doc)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        {getFileIcon(doc.mime_type)}
                        <Box>
                          <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 500 }}>
                            {doc.file ? doc.file.split('/').pop() : `Document ${doc.id}`}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {doc.file_size_display}
                          </Typography>
                        </Box>
                      </Box>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <Chip label={getFileType(doc.mime_type)} variant="outlined" size="small" />
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <Chip 
                        label={doc.provider === 'drive' ? 'Google Drive' : doc.provider === 'google' ? 'Google Docs' : 'Local Storage'}
                        sx={{ 
                          backgroundColor: getStatusColor(doc.provider),
                          color: 'white',
                          fontSize: '0.75rem'
                        }}
                        size="small"
                      />
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        {doc.uploaded_by ? doc.uploaded_by.email : 'Unknown'}
                      </Typography>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        {doc.file_size_display}
                      </Typography>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </Typography>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {doc.embed_url && (
                          <Tooltip title="View Embed">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(doc.embed_url, '_blank')
                              }}
                            >
                              <Visibility sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {doc.file_url && (
                          <Tooltip title="View File">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(doc.file_url!, '_blank')
                              }}
                            >
                              <Download sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Share">
                          <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                            <Share sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteDialog({ open: true, doc: doc })
                            }}
                            sx={{ color: '#ef4444' }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, doc: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this document?
            {deleteDialog.doc?.provider === 'drive' && 
              ' This will also remove it from Google Drive.'
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, doc: null })}>Cancel</Button>
          <Button 
            onClick={() => deleteDialog.doc && handleDelete(deleteDialog.doc)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Thesis</InputLabel>
              <Select
                value={thesisId}
                label="Select Thesis"
                onChange={(e) => setThesisId(e.target.value)}
              >
                {theses.map((thesis) => (
                  <MenuItem key={thesis.id} value={thesis.id}>
                    {thesis.title || `Thesis #${thesis.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>Upload Type</InputLabel>
              <Select
                value={uploadType}
                label="Upload Type"
                onChange={(e) => setUploadType(e.target.value as 'local' | 'drive')}
              >
                <MenuItem value="local">Local Storage</MenuItem>
                <MenuItem value="drive">Google Drive</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <FileUpload onChange={handleUpload} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Link Google Doc Dialog */}
      <Dialog open={linkDialog} onClose={() => setLinkDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Link Google Doc</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Thesis</InputLabel>
              <Select
                value={thesisId}
                label="Select Thesis"
                onChange={(e) => setThesisId(e.target.value)}
              >
                {theses.map((thesis) => (
                  <MenuItem key={thesis.id} value={thesis.id}>
                    {thesis.title || `Thesis #${thesis.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Google Doc URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://docs.google.com/document/d/..."
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialog(false)}>Cancel</Button>
          <Button onClick={handleLink} variant="contained">Link Document</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
