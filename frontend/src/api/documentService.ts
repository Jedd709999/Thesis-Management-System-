import api from './api'

export const listDocuments = (params='') => api.get(`documents/${params}`)

export const uploadDocument = (formData:FormData) => api.post('documents/', formData, { headers:{ 'Content-Type':'multipart/form-data' } })

export const uploadToDrive = (formData:FormData) => {
  formData.append('upload_type', 'drive')
  return api.post('documents/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const linkGoogleDoc = (payload:any) => api.post('documents/link-google-doc/', payload) // payload: { thesis: id, google_doc_url, provider: 'google' }

export const deleteDocument = (id:number) => api.delete(`documents/${id}/`)

export const deleteFromDrive = (id:number) => api.delete(`documents/${id}/delete-from-drive/`)
