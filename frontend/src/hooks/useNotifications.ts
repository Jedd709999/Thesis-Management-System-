import { useState, useEffect, useCallback } from 'react'
import { Notification } from '../types'
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  pollNotifications
} from '../api/notificationService'
import { getErrorMessage } from '../utils/errorHandling'

export function useNotifications(pollInterval: number = 30000) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const [notifs, count] = await Promise.all([
        fetchNotifications({ limit: 50 }),
        fetchUnreadCount()
      ])
      setNotifications(notifs)
      setUnreadCount(count)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  // Mark notification as read
  const markRead = useCallback(async (id: string) => {
    try {
      await markAsRead(id)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }, [])

  // Mark all as read
  const markAllRead = useCallback(async () => {
    try {
      await markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }, [])

  // Delete notification
  const deleteNotif = useCallback(async (id: string) => {
    try {
      await deleteNotification(id)
      // Ensure notifications is an array before filtering
      setNotifications(prev => {
        const notificationsArray = Array.isArray(prev) ? prev : [];
        return notificationsArray.filter(n => n.id !== id);
      });
      const notificationsArray = Array.isArray(notifications) ? notifications : [];
      const deletedNotif = notificationsArray.find(n => n.id === id);
      if (deletedNotif && !deletedNotif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [notifications])

  // Poll for new notifications
  const poll = useCallback(async () => {
    try {
      const newNotifs = await pollNotifications();
      // Ensure newNotifs is an array before checking length
      if (Array.isArray(newNotifs) && newNotifs.length > 0) {
        setNotifications(prev => {
          // Ensure prev is an array before using map
          const prevArray = Array.isArray(prev) ? prev : [];
          const existingIds = new Set(prevArray.map(n => n.id));
          // Ensure newNotifs is an array before filtering
          const newNotifsArray = Array.isArray(newNotifs) ? newNotifs : [];
          const unique = newNotifsArray.filter(n => !existingIds.has(n.id));
          return [...unique, ...prevArray];
        });
        // Ensure newNotifs is an array before checking length
        const newNotifsArray = Array.isArray(newNotifs) ? newNotifs : [];
        setUnreadCount(prev => prev + newNotifsArray.length);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Setup polling
  useEffect(() => {
    if (pollInterval > 0) {
      const interval = setInterval(poll, pollInterval)
      return () => clearInterval(interval)
    }
  }, [poll, pollInterval])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    reload: loadNotifications,
    markRead,
    markAllRead,
    deleteNotif
  }
}
