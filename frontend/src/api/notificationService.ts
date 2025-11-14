import api from './api'
export const listNotifications = () => api.get('notifications/')
export const markRead = (id:number) => api.post(`notifications/${id}/mark_read/`)
