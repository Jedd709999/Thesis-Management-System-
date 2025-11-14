import React, { createContext, useEffect, useState } from 'react'
import { fetchProfile } from '../api/authService'
type User = { id:number, email:string, role:string, first_name?:string, last_name?:string } | null
export const AuthContext = createContext<{ user:User, setUser:(u:User)=>void, loading:boolean }>({ user:null, setUser:()=>{}, loading:true })
export const AuthProvider = ({ children }:{children:React.ReactNode}) => {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)
  useEffect(()=>{
    const token = localStorage.getItem('access_token')
    if (token) { fetchProfile().then(u=>setUser(u)).catch(()=>setUser(null)).finally(()=>setLoading(false)) }
    else setLoading(false)
  },[])
  return <AuthContext.Provider value={{ user, setUser, loading }}>{children}</AuthContext.Provider>
}
