import api from './api'
export const listThesis = () => api.get('theses/')
export const getAllTheses = () => api.get('theses/')
export const createThesis = (payload:any) => api.post('theses/', payload)
export const submitThesis = (id:number) => api.post(`theses/${id}/submit/`)
export const adviserReview = (id:number, action:string, feedback?:string) => api.post(`theses/${id}/adviser_review/`, { action, feedback })
