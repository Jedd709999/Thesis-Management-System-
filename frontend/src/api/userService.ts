import api from './api'
export const listUsers = (params='') => api.get(`users/${params}`)
export const getUser = (id:number) => api.get(`users/${id}/`)
