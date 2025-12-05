import React, { createContext, useEffect, useState } from 'react'
import { listNotifications } from '../api/notificationService'
export const NotificationContext = createContext({ items:[], refresh: ()=>{} })
export const NotificationProvider = ({ children }:{children:React.ReactNode})=>{
  const [items,setItems]=useState<any[]>([])
  const refresh = async ()=>{ try{ const r = await listNotifications(); setItems(r) }catch{} }
  useEffect(()=>{ refresh() },[])
  return <NotificationContext.Provider value={{ items, refresh }}>{children}</NotificationContext.Provider>
}
