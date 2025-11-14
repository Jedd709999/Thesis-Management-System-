import React, { useContext, useEffect, useState } from 'react'
import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'
import NotificationsIcon from '@mui/icons-material/Notifications'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { listNotifications, markRead } from '../api/notificationService'

export default function NotificationBell(){
  const [anchor, setAnchor] = useState<null|HTMLElement>(null)
  const [items,setItems] = useState<any[]>([])
  useEffect(()=>{ load() },[])
  async function load(){ try{ const r = await listNotifications(); setItems(r.data) }catch{} }
  const unread = items.filter(i=>!i.is_read).length
  return (
    <>
      <IconButton color="inherit" onClick={(e)=>setAnchor(e.currentTarget)}><Badge badgeContent={unread} color="error"><NotificationsIcon/></Badge></IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={()=>setAnchor(null)}>
        {items.length===0 && <MenuItem>No notifications</MenuItem>}
        {items.map(n=> <MenuItem key={n.id}><div><strong>{n.title}</strong><div style={{fontSize:12}}>{new Date(n.created_at).toLocaleString()}</div></div></MenuItem>)}
      </Menu>
    </>
  )
}
