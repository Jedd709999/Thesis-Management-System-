import api from './api'
export const listThesis = () => api.get('thesis/')
export const createThesis = (payload:any) => api.post('thesis/', payload)
export const submitThesis = (id:number) => api.post(`thesis/${id}/submit/`)
export const adviserReview = (id:number, action:string, feedback?:string) => api.post(`thesis/${id}/adviser_review/`, { action, feedback })
