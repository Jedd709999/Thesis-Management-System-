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
import { useWebSocket } from './useWebSocket'

// Singleton pattern for WebSocket connection
let wsInstance: ReturnType<typeof useWebSocket> | null = null
let wsRefCount = 0

export function useNotifications(pollInterval: number = 30000) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // DISABLE WEBSOCKET FOR TESTING - Set to false to disable WebSocket functionality
  const ENABLE_WEBSOCKET = false;
  
  // WebSocket for real-time updates
  // Construct WebSocket URL based on the API base URL from environment variables
  // Default to the correct external port (8002) that matches the docker-compose mapping
  let wsUrl = 'ws://localhost:8002/ws/notifications/';
  try {
    // Try to get the base URL from environment variables
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      console.log('API Base URL from environment:', apiBaseUrl);
      
      // Convert API URL to WebSocket URL
      // Handle both HTTP and HTTPS protocols
      const wsProtocol = apiBaseUrl.startsWith('https') ? 'wss' : 'ws';
      
      // Parse the API base URL to extract host and port
      try {
        const url = new URL(apiBaseUrl);
        // For WebSocket, we need to use the same host and port as the API
        // Since the docker-compose maps 8002:8000, we need to use 8002 for WebSocket as well
        wsUrl = `${wsProtocol}://${url.host}/ws/notifications/`;
        console.log('WebSocket URL constructed from environment:', wsUrl);
      } catch (urlError) {
        console.warn('Could not parse API base URL, using default WebSocket URL:', urlError);
      }
    } else {
      console.log('Using default WebSocket URL:', wsUrl);
    }
  } catch (e) {
    console.warn('Could not access environment variables, using default WebSocket URL:', e);
  }
  
  console.log('Final WebSocket URL (without token):', wsUrl);
  
  // Use singleton pattern for WebSocket connection - ONLY IF ENABLED
  if (ENABLE_WEBSOCKET && !wsInstance) {
    wsInstance = useWebSocket(wsUrl, {
      onMessage: (data) => {
        console.log('Received WebSocket message:', data);
        try {
          // Handle real-time notification updates
          if (data.type === 'notification_created') {
            console.log('Processing notification_created event:', data.notification);
            // Add new notification to the list
            setNotifications(prev => {
              try {
                // Ensure data.notification is a valid object
                if (!data.notification || typeof data.notification !== 'object') {
                  console.warn('Invalid notification data in WebSocket message:', data.notification);
                  return prev;
                }
                
                // Check if notification already exists to prevent duplicates
                const exists = prev.some(n => n.id === data.notification.id);
                if (exists) {
                  console.log('Notification already exists, skipping:', data.notification.id);
                  return prev;
                }
                
                // Validate required fields
                if (!data.notification.id) {
                  console.warn('Notification missing id field:', data.notification);
                  return prev;
                }
                
                // Create a new notification object with proper typing
                const newNotification: Notification = {
                  id: data.notification.id,
                  recipient: data.notification.recipient || {} as any,
                  type: data.notification.type || 'info',
                  title: data.notification.title || 'Notification',
                  body: data.notification.body || '',
                  link: data.notification.link || '',
                  is_read: data.notification.is_read || false,
                  created_at: data.notification.created_at || new Date().toISOString(),
                  read_at: data.notification.read_at || undefined
                };
                
                console.log('Adding new notification:', newNotification);
                return [newNotification, ...prev];
              } catch (processError) {
                console.error('Error processing notification_created event:', processError);
                return prev;
              }
            });
            
            // Update unread count
            setUnreadCount(prev => prev + 1);
          } else if (data.type === 'notification_updated') {
            console.log('Processing notification_updated event:', data.notification);
            // Update existing notification
            setNotifications(prev => {
              try {
                return prev.map(n => 
                  n.id === data.notification.id ? {...n, ...data.notification} : n
                );
              } catch (processError) {
                console.error('Error processing notification_updated event:', processError);
                return prev;
              }
            });
          } else if (data.type === 'notification_deleted') {
            console.log('Processing notification_deleted event:', data.notification_id);
            // Remove notification
            setNotifications(prev => {
              try {
                return prev.filter(n => n.id !== data.notification_id);
              } catch (processError) {
                console.error('Error processing notification_deleted event:', processError);
                return prev;
              }
            });
            
            // Update unread count
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      },
      onConnect: () => {
        console.log('WebSocket connected');
        // Request initial notifications when connected
        loadNotifications();
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
      },
      onError: (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error');
      }
    });
  }
  
  // Increment reference count when hook is used
  useEffect(() => {
    // ONLY increment reference count if WebSocket is enabled
    if (ENABLE_WEBSOCKET) {
      wsRefCount++;
      console.log('useNotifications hook mounted, reference count:', wsRefCount);
    }
    return () => {
      // ONLY decrement reference count if WebSocket is enabled
      if (ENABLE_WEBSOCKET) {
        wsRefCount--;
        console.log('useNotifications hook unmounted, reference count:', wsRefCount);
        // Only disconnect if this was the last reference
        if (wsRefCount <= 0 && wsInstance) {
          console.log('Last reference unmounted, disconnecting WebSocket');
          wsInstance.disconnect();
          wsInstance = null;
        }
      }
    };
  }, []);
  
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('useNotifications: Loading notifications');
      const [notifs, count] = await Promise.all([
        fetchNotifications(),
        fetchUnreadCount()
      ]);
      
      console.log('useNotifications: Received notifications:', notifs);
      console.log('useNotifications: Received unread count:', count);
      
      // Ensure notifications is an array
      const validNotifications = Array.isArray(notifs) ? notifs : [];
      
      setNotifications(validNotifications);
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);
  
  const poll = useCallback(async () => {
    try {
      console.log('useNotifications: Polling for notifications');
      const newNotifications = await pollNotifications();
      console.log('useNotifications: Polled notifications:', newNotifications);
      
      // Update notifications if we got new data
      if (Array.isArray(newNotifications)) {
        setNotifications(prev => {
          // Merge new notifications with existing ones, avoiding duplicates
          const merged = [...prev];
          let changed = false;
          
          newNotifications.forEach(newNotif => {
            const existingIndex = merged.findIndex(n => n.id === newNotif.id);
            if (existingIndex >= 0) {
              // Update existing notification
              if (JSON.stringify(merged[existingIndex]) !== JSON.stringify(newNotif)) {
                merged[existingIndex] = newNotif;
                changed = true;
              }
            } else {
              // Add new notification
              merged.unshift(newNotif);
              changed = true;
            }
          });
          
          return changed ? merged : prev;
        });
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, []);
  
  const markRead = useCallback(async (id: string) => {
    try {
      console.log('useNotifications: Marking notification as read:', id);
      await markAsRead(id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? {...n, is_read: true} : n)
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);
  
  const markAllRead = useCallback(async () => {
    try {
      console.log('useNotifications: Marking all notifications as read');
      await markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({...n, is_read: true}))
      );
      
      setUnreadCount(0);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);
  
  const deleteNotif = useCallback(async (id: string) => {
    try {
      console.log('useNotifications: Deleting notification:', id);
      await deleteNotification(id);
      
      // Update local state
      setNotifications(prev => {
        const filtered = prev.filter(n => n.id !== id);
        // Update unread count if the deleted notification was unread
        const deletedNotification = prev.find(n => n.id === id);
        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
        return filtered;
      });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);
  
  // Get WebSocket connection status - ONLY if WebSocket is enabled
  const wsConnected = ENABLE_WEBSOCKET && wsInstance ? wsInstance.connected : false;
  
  // Reload notifications when WebSocket connects
  useEffect(() => {
    if (wsConnected) {
      console.log('WebSocket connected, reloading notifications');
      loadNotifications();
    }
  }, [wsConnected]);
  
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
  
  // Cleanup function to decrement reference count
  useEffect(() => {
    return () => {
      // ONLY decrement reference count if WebSocket is enabled
      if (ENABLE_WEBSOCKET) {
        wsRefCount--;
        console.log('useNotifications hook unmounted, reference count:', wsRefCount);
        // Only disconnect if this was the last reference
        if (wsRefCount <= 0 && wsInstance) {
          console.log('Last reference unmounted, disconnecting WebSocket');
          wsInstance.disconnect();
          wsInstance = null;
        }
      }
    };
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    reload: loadNotifications,
    markRead: markRead,
    markAllRead: markAllRead,
    deleteNotif: deleteNotif
  }
}