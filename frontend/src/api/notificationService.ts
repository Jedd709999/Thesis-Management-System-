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
    const res = await api.get('/notifications/mine/', { params })
    console.log('NotificationService: Notifications response received', res);
    
    // Ensure response exists and has data
    if (!res || !res.data) {
      console.warn('NotificationService: Empty response data');
      return [];
    }
    
    // Handle paginated response - more defensive approach
    let data;
    try {
      if (res.data && typeof res.data === 'object' && 'results' in res.data) {
        console.log('NotificationService: Detected paginated response');
        data = res.data.results;
      } else {
        console.log('NotificationService: Detected non-paginated response');
        data = res.data;
      }
    } catch (parseError) {
      console.error('NotificationService: Error parsing response structure:', parseError);
      data = res.data; // Fallback to raw data
    }
    
    // Ensure data is an array - extra defensive check
    if (!Array.isArray(data)) {
      console.warn('NotificationService: Response data is not an array:', typeof data, data);
      // Try to convert to array if it's a single object
      if (data && typeof data === 'object') {
        console.log('NotificationService: Converting single object to array');
        return [data].filter(validateNotification);
      }
      return [];
    }
    
    // Validate each notification in the array
    const validNotifications = data.filter(validateNotification);
    
    console.log('NotificationService: Returning valid notifications:', validNotifications);
    return validNotifications;
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return [] // Return empty array on error
  }
}

// Helper function to validate a single notification
function validateNotification(notification: any): boolean {
  try {
    // Check if notification is a valid object
    if (!notification || typeof notification !== 'object') {
      console.warn('NotificationService: Skipping invalid notification (not an object):', notification);
      return false;
    }
    
    // Cast to Record<string, unknown> for property access
    const obj = notification as unknown as Record<string, unknown>;
    
    // Check required properties - only id is truly required
    if (!('id' in obj) || obj.id == null) {
      console.warn('NotificationService: Skipping notification without valid id:', notification);
      return false;
    }
    
    // Optional properties with defaults
    if (!('is_read' in obj)) {
      obj.is_read = false;
    }
    
    if (!('title' in obj)) {
      obj.title = 'Untitled Notification';
    }
    
    if (!('body' in obj)) {
      obj.body = ''; // Allow empty body
    }
    
    if (!('created_at' in obj)) {
      obj.created_at = new Date().toISOString();
    }
    
    // Validate created_at is a valid date string
    if (typeof obj.created_at === 'string') {
      const date = new Date(obj.created_at);
      if (isNaN(date.getTime())) {
        // If invalid date, use current date
        obj.created_at = new Date().toISOString();
      }
    } else {
      // If not a string, use current date
      obj.created_at = new Date().toISOString();
    }
    
    return true;
  } catch (validationError) {
    console.error('NotificationService: Error validating notification:', validationError, notification);
    return false;
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
    
    // Ensure response exists and has data
    if (!res || !res.data) {
      console.warn('NotificationService: Empty response data in unread count');
      return 0;
    }
    
    // Ensure data has unread_count property
    if (typeof res.data !== 'object' || !('unread_count' in res.data)) {
      console.warn('NotificationService: Response data missing unread_count property:', res.data);
      return 0;
    }
    
    // Ensure unread_count is a number
    const unreadCount = res.data.unread_count;
    if (typeof unreadCount !== 'number') {
      console.warn('NotificationService: unread_count is not a number:', typeof unreadCount, unreadCount);
      return 0;
    }
    
    // Ensure we always return a number
    return unreadCount;
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
    const res = await api.get('/notifications/mine/', {
      params: {
        is_read: false,
        limit: 10
      }
    })
    console.log('NotificationService: Poll notifications response received', res);
    
    // Ensure response exists and has data
    if (!res || !res.data) {
      console.warn('NotificationService: Empty response data in poll');
      return [];
    }
    
    // Handle paginated response - more defensive approach
    let data;
    try {
      if (res.data && typeof res.data === 'object' && 'results' in res.data) {
        console.log('NotificationService: Detected paginated response in poll');
        data = res.data.results;
      } else {
        console.log('NotificationService: Detected non-paginated response in poll');
        data = res.data;
      }
    } catch (parseError) {
      console.error('NotificationService: Error parsing response structure in poll:', parseError);
      data = res.data; // Fallback to raw data
    }
    
    // Ensure data is an array - extra defensive check
    if (!Array.isArray(data)) {
      console.warn('NotificationService: Response data is not an array in poll:', typeof data, data);
      // Try to convert to array if it's a single object
      if (data && typeof data === 'object') {
        console.log('NotificationService: Converting single object to array in poll');
        return [data].filter(validateNotification);
      }
      return [];
    }
    
    // Validate each notification in the array
    const validNotifications = data.filter(validateNotification);
    
    console.log('NotificationService: Returning valid notifications from poll:', validNotifications);
    return validNotifications;
  } catch (error) {
    console.error('Error polling notifications:', error)
    return [] // Return empty array on error
  }
}

// Legacy exports
export const listNotifications = fetchNotifications
export const getUnreadCount = fetchUnreadCount
export const markRead = markAsRead