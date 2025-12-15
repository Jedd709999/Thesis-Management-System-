import api from './api'
import { Document } from '../types'

/**
 * Fetch all documents
 */
export async function fetchDocuments(thesisId?: string): Promise<Document[]> {
  try {
    console.log('fetchDocuments called with thesisId:', thesisId);
    const params = thesisId ? { thesis: thesisId } : {}
    console.log('Making API request to /documents/ with params:', params);
    const res = await api.get('/documents/', { params })
    console.log('API response for fetchDocuments:', res);
    console.log('API response data structure:', typeof res.data, res.data);
    // Handle paginated responses
    let result: Document[] = [];
    if (Array.isArray(res.data)) {
      // Direct array response
      result = res.data;
    } else if (res.data && typeof res.data === 'object' && 'results' in res.data) {
      // Paginated response
      result = Array.isArray(res.data.results) ? res.data.results : [];
    } else {
      console.log('Unexpected response structure, trying to parse as direct array:', res.data);
      // Try to handle unexpected response structures
      if (res.data && typeof res.data === 'object') {
        if ('results' in res.data) {
          result = Array.isArray(res.data.results) ? res.data.results : [];
        } else {
          // If it's an object but not paginated, try to convert to array
          result = [res.data];
        }
      }
    }
    console.log('fetchDocuments returning:', result);
    return result
  } catch (error) {
    console.error('Error fetching documents:', error)
    return [] // Return empty array on error
  }
}/**
 * Fetch a single document by ID
 */
export async function fetchDocument(id: string): Promise<Document> {
  try {
    const res = await api.get(`documents/${id}/`)
    return res.data
  } catch (error) {
    console.error('Error fetching document:', error)
    throw error
  }
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
  try {
    const res = await api.get(`documents/${id}/versions/`)
    // Ensure we always return an array
    return Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('Error fetching document versions:', error)
    return [] // Return empty array on error
  }
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
 * Search documents
 */
export async function searchDocuments(query: string): Promise<{
  query: string;
  results: Array<{
    id: string;
    title: string;
    document_type: string;
    status: string;
    provider: string;
    file_size: number;
    mime_type: string;
    created_at: string;
    thesis_title: string | null;
    thesis_id: string | null;
    uploaded_by: {
      id: string;
      name: string;
      email: string;
    };
    viewer_url: string;
    doc_embed_url: string;
  }>;
  message: string;
  total_results: number;
}> {
  const res = await api.get('/documents/search_documents/', { params: { q: query } });
  return res.data;
}

/**
 * Check if user has a thesis
 */
export async function checkUserHasThesis() {
  try {
    const groupsRes = await api.get('/groups/get_current_user_groups/')
    const groups = Array.isArray(groupsRes.data) ? groupsRes.data : []
    
    const groupTheses = Array.isArray(groups) ? groups.filter((g: any) => g.thesis) : [];
    return {
      hasThesis: Array.isArray(groupTheses) && groupTheses.length > 0,
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