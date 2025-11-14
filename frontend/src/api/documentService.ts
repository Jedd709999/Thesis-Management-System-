import api from './api'
export const listDocuments = (params='') => api.get(`documents/${params}`)
export const uploadDocument = (formData:FormData) => api.post('documents/', formData, { headers:{ 'Content-Type':'multipart/form-data' } })
export const linkGoogleDoc = (payload:any) => api.post('documents/', payload) // payload: { thesis: id, google_doc_url, provider: 'google' }
