import api from './api'
export type Tokens = { access:string, refresh:string }
export async function login(email:string, password:string){ const res = await api.post('auth/login/', { email, password }); return res.data as Tokens }
export function saveTokens(t:Tokens){ localStorage.setItem('access_token', t.access); localStorage.setItem('refresh_token', t.refresh) }
export function clearTokens(){ localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token') }
export async function fetchProfile(){ const res = await api.get('auth/me/'); return res.data }
