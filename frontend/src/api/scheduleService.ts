import api from './api'
export const listSchedules = () => api.get('schedules/')
export const createSchedule = (payload:any) => api.post('schedules/', payload)
export const updateSchedule = (id:number, payload:any) => api.patch(`schedules/${id}/`, payload)
export const deleteSchedule = (id:number) => api.delete(`schedules/${id}/`)
