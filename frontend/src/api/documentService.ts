import api from './api'
import { Document } from '../types'

/**
 * Fetch all documents
 */
export async function fetchDocuments(thesisId?: string): Promise<Document[]> {
  const params = thesisId ? { thesis: thesisId } : {}
  const res = await api.get('/documents/', { params })
  return res.data
}

/**
 * Fetch a single document by ID
 */
export async function fetchDocument(id: string): Promise<Document> {
  const res = await api.get(`documents/${id}/`)
  return res.data
}

/**
 * Upload a document
 */
export async function uploadDocument(formData: FormData): Promise<Document> {
  // Ensure document_type is included in formData
  if (!formData.get('document_type')) {
    throw new Error('Document type is required');
  }
  
  const res = await api.post('documents/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = progressEvent.total
        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
        : 0
      console.log(`Upload progress: ${percentCompleted}%`)
    }
  })
  return res.data
}

/**
 * Update document metadata
 */
export async function updateDocument(
  id: string,
  data: Partial<{ title: string }>
): Promise<Document> {
  const res = await api.patch(`documents/${id}/`, data)
  return res.data
}

/**
 * Delete a document
 */
export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`documents/${id}/`)
}

/**
 * Download a document
 */
export async function downloadDocument(id: string): Promise<Blob> {
  const res = await api.get(`documents/${id}/download/`, {
    responseType: 'blob'
  })
  return res.data
}

/**
 * Get document versions
 */
export async function getDocumentVersions(id: string): Promise<Document[]> {
  const res = await api.get(`documents/${id}/versions/`)
  return res.data
}

/**
 * Sync document with Google Drive
 */
export async function syncDocument(id: string): Promise<Document> {
  const res = await api.post(`documents/${id}/sync-metadata/`)
  return res.data
}

/**
 * Link a local document to Google Drive
 */
export async function linkDocumentToDrive(id: string): Promise<Document> {
  const res = await api.post(`documents/${id}/link-to-drive/`)
  return res.data
}

/**
 * Link existing Google Doc
 */
export async function linkGoogleDoc(payload: any): Promise<Document> {
  const res = await api.post('documents/link-google-doc/', payload)
  return res.data
}

/**
 * Upload to Drive
 * @deprecated Use uploadDocument instead - all uploads now automatically go to Google Drive
 */
export async function uploadToDrive(formData: FormData): Promise<Document> {
  return uploadDocument(formData);
}

/**
 * Delete from Drive
 */
export async function deleteFromDrive(id: string): Promise<void> {
  await api.delete(`documents/${id}/delete-from-drive/`)
}

/**
 * Update document status
 */
export async function updateDocumentStatus(
  id: string,
  status: 'draft' | 'submitted' | 'revision' | 'approved' | 'rejected'
): Promise<Document> {
  const res = await api.patch(`documents/${id}/update-status/`, { status })
  return res.data
}

/**
 * Check if user has a thesis
 */
export async function checkUserHasThesis() {
  try {
    const groupsRes = await api.get('/groups/get_current_user_groups/')
    const groups = groupsRes.data || []
    
    const groupTheses = groups.filter((g: any) => g.thesis)
    return {
      hasThesis: groupTheses.length > 0,
      theses: groupTheses
    }
  } catch (error) {
    console.error('Error checking user thesis:', error)
    return {
      hasThesis: false,
      theses: []
    }
  }
}

// Legacy exports  
export const listDocuments = fetchDocuments