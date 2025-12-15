import React, { createContext, useEffect, useState } from 'react'
import { listNotifications } from '../api/notificationService'

export const NotificationContext = createContext({ items: [], refresh: () => { } })

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<any[]>([])

  const refresh = async () => {
    try {
      const r = await listNotifications()
      // Ensure we always set an array, even if the API returns something unexpected
      setItems(Array.isArray(r) ? r : [])
    } catch (error) {
      // On error, set empty array to prevent forEach errors
      setItems([])
      console.error('Error fetching notifications:', error)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <NotificationContext.Provider value={{ items: Array.isArray(items) ? items : [], refresh }}>
      {children}
    </NotificationContext.Provider>
  )
}