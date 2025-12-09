import api from './api'
import { Notification } from '../types'

/**
 * Fetch all notifications for current user
 */
export async function fetchNotifications(params?: {
  is_read?: boolean
  type?: string
  limit?: number
}): Promise<Notification[]> {
  console.log('NotificationService: Fetching notifications with params:', params);
  console.log('NotificationService: localStorage access_token:', localStorage.getItem('access_token'));
  try {
    const res = await api.get('/notifications/', { params })
    console.log('NotificationService: Notifications response received', res);
    // Ensure we always return an array
    return Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return [] // Return empty array on error
  }
}

/**
 * Fetch unread notifications count
 */
export async function fetchUnreadCount(): Promise<number> {
  console.log('NotificationService: Fetching unread count');
  console.log('NotificationService: localStorage access_token:', localStorage.getItem('access_token'));
  try {
    const res = await api.get('/notifications/unread-count/')
    console.log('NotificationService: Unread count response received', res);
    // Ensure we always return a number
    return typeof res.data.unread_count === 'number' ? res.data.unread_count : 0
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return 0 // Return 0 on error
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(id: string): Promise<Notification> {
  console.log('NotificationService: Marking notification as read:', id);
  console.log('NotificationService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.post(`notifications/${id}/mark-read/`)
  console.log('NotificationService: Mark read response received', res);
  return res.data
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<void> {
  console.log('NotificationService: Marking all notifications as read');
  console.log('NotificationService: localStorage access_token:', localStorage.getItem('access_token'));
  await api.post('notifications/mark-all-read/')
  console.log('NotificationService: Mark all read response received');
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: string): Promise<void> {
  console.log('NotificationService: Deleting notification:', id);
  console.log('NotificationService: localStorage access_token:', localStorage.getItem('access_token'));
  await api.delete(`notifications/${id}/`)
  console.log('NotificationService: Delete notification response received');
}

/**
 * Poll for new notifications
 */
export async function pollNotifications(): Promise<Notification[]> {
  console.log('NotificationService: Polling for new notifications');
  console.log('NotificationService: localStorage access_token:', localStorage.getItem('access_token'));
  try {
    const res = await api.get('/notifications/', {
      params: {
        is_read: false,
        limit: 10
      }
    })
    console.log('NotificationService: Poll notifications response received', res);
    // Ensure we always return an array
    return Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('Error polling notifications:', error)
    return [] // Return empty array on error
  }
}

// Legacy exports
export const listNotifications = fetchNotifications
export const getUnreadCount = fetchUnreadCount
export const markRead = markAsRead
