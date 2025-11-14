import axios from 'axios'
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/'
const api = axios.create({ baseURL: API_BASE })
api.interceptors.request.use((config:any) => {
  const token = localStorage.getItem('access_token')
  if (token) { if (!config.headers) config.headers = {}; config.headers['Authorization'] = `Bearer ${token}` }
  return config
}, (err)=>Promise.reject(err))
export default api
