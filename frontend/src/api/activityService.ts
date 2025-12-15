import api from './api';
import { Notification } from '../types';

export interface Activity {
  id: string;
  type: 'group' | 'document' | 'schedule' | 'announcement' | 'other';
  title: string;
  description?: string;
  group?: {
    id: string;
    name: string;
  };
  document?: {
    id: string;
    title: string;
  };
  timestamp: string;
  read: boolean;
}

// Use the Notification interface from types
export type ActivityNotification = Notification;

export const fetchRecentActivities = async (limit: number = 10): Promise<Activity[]> => {
  try {
    // Since there's no dedicated activity endpoint, we'll use recent notifications as activities
    const response = await api.get(`/notifications/mine/?limit=${limit}`);
    // Convert notifications to activities format
    // Ensure we always return an array
    const data = response.data.results || response.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch recent activities:', error);
    return [];
  }
};

export const fetchUnreadNotifications = async (): Promise<ActivityNotification[]> => {
  try {
    // Use the correct endpoint for unread notifications
    const response = await api.get('/notifications/mine/?read=false');
    // Ensure we always return an array
    const data = response.data.results || response.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch unread notifications:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await api.post(`/notifications/${notificationId}/mark-read/`);
  } catch (error) {
    console.error(`Failed to mark notification ${notificationId} as read:`, error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    await api.post('/notifications/mark-all-read/');
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw error;
  }
};