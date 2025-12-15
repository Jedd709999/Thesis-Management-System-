import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { CheckCircle, Clock, Users, TrendingUp, Calendar, Upload, Leaf, Droplets, Loader2, Megaphone, BookOpen, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';

import { fetchCurrentUserGroups } from '../../api/groupService';
import { fetchRecentActivities, Activity } from '../../api/activityService';
import { fetchCurrentUserTheses, fetchThesisStatistics } from '../../api/thesisService';
import { getGroupStatistics } from '../../api/groupService';
import { Group, Thesis, Notification } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface DashboardProps {
  userRole: 'student' | 'adviser' | 'panel' | 'admin';
  onNavigate: (page: string) => void;
}

// WebSocket test component
const WebSocketTester: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);

  const connectWebSocket = useCallback(() => {
    try {
      // Get the current protocol (http or https)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Get the current host
      const host = window.location.host;
      // Construct WebSocket URL
      const wsUrl = `${protocol}//${host}/ws/notifications/`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        toast.success('WebSocket connected successfully');
        
        // Send a test message
        socket.send(JSON.stringify({
          type: 'test',
          message: 'Hello from client',
          timestamp: new Date().toISOString()
        }));
      };

      socket.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data.toString());
          console.log('WebSocket message received:', data);
          setLastMessage(JSON.stringify(data, null, 2));
          
          // Handle different message types
          if (data.type === 'test') {
            toast.success(`Test message received: ${data.message}`);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          setLastMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };

      socket.onerror = (event: Event) => {
        console.error('WebSocket error:', event);
        toast.error('WebSocket connection error');
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        toast.warning('WebSocket disconnected');
      };

      wsRef.current = socket;
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      toast.error(`Failed to connect to WebSocket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      console.log('Closing WebSocket connection');
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendTestMessage = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'test',
        message: 'Test message from client',
        timestamp: new Date().toISOString()
      };
      wsRef.current.send(JSON.stringify(message));
      toast.info('Test message sent');
    } else {
      toast.error('WebSocket is not connected');
    }
  }, []);

  // Clean up WebSocket connection on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
          WebSocket Connection Test
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Status:</span>
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          
          <div className="space-x-2">
            <Button 
              onClick={connectWebSocket} 
              disabled={isConnected}
              variant="outline"
            >
              Connect
            </Button>
            <Button 
              onClick={disconnectWebSocket} 
              disabled={!isConnected}
              variant="outline"
            >
              Disconnect
            </Button>
            <Button 
              onClick={sendTestMessage} 
              disabled={!isConnected}
              variant="secondary"
            >
              Send Test Message
            </Button>
          </div>
          
          {lastMessage && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
              <div className="text-sm font-medium mb-1">Last Message:</div>
              <pre className="text-xs overflow-auto max-h-40 p-2 bg-white dark:bg-gray-900 rounded">
                {lastMessage}
              </pre>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground mt-2">
            Connection URL: {window.location.protocol === 'https:' ? 'wss://' : 'ws://'}
            {window.location.host}/ws/notifications/
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard({ userRole, onNavigate }: DashboardProps) {
  const { user } = useAuth(); // Get user data from AuthContext
  const [groups, setGroups] = useState<Group[]>([])
  const [theses, setTheses] = useState<Thesis[]>([])
  // Use the new notification system with loading and error states
  const notificationResult = useNotifications(0); // Disable polling in dashboard
  
  // Add defensive checks for the notification result
  const { 
    notifications: allNotifications = [], 
    markRead, 
    loading: notificationsLoading, 
    error: notificationsError 
  } = notificationResult || {};
  
  console.log('useNotifications result:', notificationResult);
  console.log('Destructured values:', { allNotifications, markRead, notificationsLoading, notificationsError });
  
  // Validate that allNotifications is not a Promise
  if (allNotifications instanceof Promise) {
    console.error('allNotifications is a Promise - this should not happen');
  }
  
  // Update loading and error states when notifications state changes
  useEffect(() => {
    // Add a check to ensure notificationsLoading is not a Promise
    if (typeof notificationsLoading === 'object' && notificationsLoading !== null && typeof (notificationsLoading as any).then === 'function') {
      console.error('notificationsLoading appears to be a Promise - this should not happen');
      return;
    }
    
    // Add a check to ensure notificationsError is not a Promise
    if (typeof notificationsError === 'object' && notificationsError !== null && typeof (notificationsError as any).then === 'function') {
      console.error('notificationsError appears to be a Promise - this should not happen');
      return;
    }
    
    setLoading(prev => ({ ...prev, notifications: notificationsLoading }));
    setError(prev => ({
      ...prev, 
      notifications: notificationsError ? 'Failed to load notifications' : null
    }));
  }, [notificationsLoading, notificationsError]);
  const [groupStats, setGroupStats] = useState<{
    total_registered_groups: number;
    active_groups: number;
    pending_groups: number;
    rejected_groups: number;
  } | null>(null);
  const [thesisStats, setThesisStats] = useState<{
    total_theses: number;
    topic_submitted: number;
    topic_approved: number;
    topic_rejected: number;
    concept_submitted: number;
    concept_approved: number;
    proposal_submitted: number;
    proposal_approved: number;
    final_submitted: number;
    final_approved: number;
    archived: number;
  } | null>(null);
  // Add loading and error states for notifications
  const [loading, setLoading] = useState({
    groups: true,
    theses: true,
    stats: true,
    notifications: true
  });
  
  const [error, setError] = useState<{
    groups: string | null;
    theses: string | null;
    stats: string | null;
    notifications: string | null;
  }>({
    groups: null,
    theses: null,
    stats: null,
    notifications: null
  });

  const loadGroups = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, groups: true }));
      setError(prev => ({ ...prev, groups: null }));
      
      console.log('Dashboard: Loading user groups...');
      const userGroups = await fetchCurrentUserGroups();
      console.log('Dashboard: Loaded groups:', userGroups);
      
      // Ensure userGroups is an array
      const groupsArray = Array.isArray(userGroups) ? userGroups : [];
      
      // Deduplicate groups by ID to prevent duplicates
      const uniqueGroups = groupsArray.filter((group, index, self) => 
        group && index === self.findIndex(g => g && g.id === group.id)
      );
      
      console.log('Dashboard: Unique groups after deduplication:', uniqueGroups);
      setGroups(uniqueGroups);
    } catch (err) {
      console.error('Dashboard: Error loading groups:', err);
      setError(prev => ({ ...prev, groups: 'Failed to load groups' }));
    } finally {
      setLoading(prev => ({ ...prev, groups: false }));
    }
  }, []);

  const loadTheses = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, theses: true }));
      setError(prev => ({ ...prev, theses: null }));
      
      console.log('Dashboard: Loading user theses...');
      let userTheses: Thesis[] = [];
      
      // For students, fetch all theses and filter by access
      if (userRole === 'student') {
        const allTheses = await fetchCurrentUserTheses();
        // Ensure allTheses is an array
        const thesesArray = Array.isArray(allTheses) ? allTheses : [];
        // Filter to only show theses the student has access to
        userTheses = thesesArray.filter(thesis => {
          // Student has access if they are the proposer or a member of the group
          const isProposer = thesis.proposer && user?.id && String(thesis.proposer.id) === String(user.id);
          
          // Check if student is a member of the group
          let isMember = false;
          if (typeof thesis.group === 'object' && thesis.group !== null && 'members' in thesis.group) {
            isMember = thesis.group.members.some((member: any) => 
              user?.id && String(member.id) === String(user.id)
            );
          }
          
          return isProposer || isMember;
        });
      } else {
        // For other roles, fetch their assigned theses
        const allTheses = await fetchCurrentUserTheses();
        // Ensure allTheses is an array
        userTheses = Array.isArray(allTheses) ? allTheses : [];
      }
      
      console.log('Dashboard: Loaded theses:', userTheses);
      setTheses(userTheses);
    } catch (err) {
      console.error('Dashboard: Error loading theses:', err);
      setError(prev => ({ ...prev, theses: 'Failed to load theses' }));
    } finally {
      setLoading(prev => ({ ...prev, theses: false }));
    }
  }, [userRole, user?.id]);
  const loadStats = useCallback(async () => {
    if (userRole !== 'admin') return;
    
    try {
      setLoading(prev => ({ ...prev, stats: true }));
      setError(prev => ({ ...prev, stats: null }));
      
      console.log('Dashboard: Loading admin statistics...');
      
      // Load group statistics
      const groupStatistics = await getGroupStatistics();
      console.log('Dashboard: Loaded group statistics:', groupStatistics);
      setGroupStats(groupStatistics);
      
      // Load thesis statistics
      const thesisStatistics = await fetchThesisStatistics();
      console.log('Dashboard: Loaded thesis statistics:', thesisStatistics);
      setThesisStats(thesisStatistics);
    } catch (err) {
      console.error('Dashboard: Error loading statistics:', err);
      setError(prev => ({ ...prev, stats: 'Failed to load statistics' }));
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, [userRole]);

  // Type guard to check if an object is a valid Notification
  const isValidNotification = (item: unknown): item is Notification => {
    try {
      console.log('Validating notification item:', item);
      // Ensure item is not null or undefined
      if (item == null) {
        console.warn('Notification item is null or undefined');
        return false;
      }
      
      // Ensure item is an object
      if (typeof item !== 'object') {
        console.warn('Notification item is not an object:', typeof item);
        return false;
      }
      
      const obj = item as Record<string, unknown>;
      
      // Check that all required properties exist
      const hasRequiredProperties = (
        'id' in obj &&
        'is_read' in obj &&
        'title' in obj &&
        'body' in obj &&
        'created_at' in obj
      );
      
      if (!hasRequiredProperties) {
        console.warn('Notification item missing required properties:', obj);
        return false;
      }
      
      // Additional validation for specific properties
      if (obj.id == null || obj.id === '') {
        console.warn('Notification item has invalid id:', obj.id);
        return false;
      }
      
      // Validate created_at is a valid date string
      if (typeof obj.created_at === 'string') {
        const date = new Date(obj.created_at);
        if (isNaN(date.getTime())) {
          console.warn('Notification item has invalid created_at:', obj.created_at);
          return false;
        }
      } else {
        console.warn('Notification item created_at is not a string:', typeof obj.created_at);
        return false;
      }
      
      console.log('Notification validation result: true');
      return true;
    } catch (err) {
      console.error('Error in isValidNotification:', { 
        error: err, 
        item,
        itemType: typeof item
      });
      return false;
    }
  };

  // Helper function to safely determine if a notification is unread
  const isUnreadNotification = useCallback((notification: unknown): boolean => {
    console.log('Checking if notification is unread:', notification);
    
    // Ensure notification is valid
    if (!isValidNotification(notification)) {
      console.warn('Invalid notification format:', notification);
      return false;
    }

    const readStatus = (notification as Notification).is_read;
    console.log('Notification read status:', { 
      readStatus, 
      type: typeof readStatus,
      notificationId: (notification as Notification).id 
    });
    
    // Handle boolean
    if (typeof readStatus === 'boolean') {
      return !readStatus;
    }
    
    // Handle number (0/1)
    if (typeof readStatus === 'number') {
      return readStatus === 0;
    }
    
    // Handle string
    if (typeof readStatus === 'string') {
      const lowerStatus = String(readStatus).toLowerCase();
      return !['true', '1', 'yes'].includes(lowerStatus);
    }
    
    // Default to unread if type is unexpected
    console.warn('Unexpected is_read type:', typeof readStatus, 'in notification:', (notification as Notification).id);
    return true;
  }, []);

  // Filter to show only unread notifications, limit to 5
  const unreadNotifications = useMemo(() => {
    console.log('Calculating unreadNotifications...', {
      loading: loading.notifications,
      error: error.notifications,
      allNotifications: allNotifications ? 'Array' : 'null/undefined',
      allNotificationsType: typeof allNotifications,
      allNotificationsValue: allNotifications
    });

    // If there's an error, return empty array
    if (error.notifications) {
      console.log('Returning empty array due to error state');
      return [];
    }
    
    // If we don't have notifications yet and we're still loading, return empty array
    if ((!allNotifications || allNotifications.length === 0) && loading.notifications) {
      console.log('Returning empty array due to loading state with no notifications');
      return [];
    }
    
    // At this point, we either have notifications or we're done loading
    // Ensure we have notifications and it's an array
    if (!allNotifications) {
      console.warn('allNotifications is null or undefined');
      return [];
    }
    
    // Check if allNotifications is a Promise
    if (allNotifications instanceof Promise) {
      console.error('allNotifications is a Promise - this should not happen');
      return [];
    }
    
    if (!Array.isArray(allNotifications)) {
      console.error('Invalid notifications data:', {
        allNotifications,
        type: typeof allNotifications,
        isArray: Array.isArray(allNotifications)
      });
      return [];
    }

    console.log('Processing notifications array of length:', allNotifications.length);

    // Safely filter and limit notifications
    try {
      const filtered = [];
      
      for (let i = 0; i < allNotifications.length; i++) {
        const notification = allNotifications[i];
      
        try {
          // Ensure notification is a valid object
          if (!notification || typeof notification !== 'object') {
            console.warn('Invalid notification at index', i, ':', notification);
            continue;
          }
        
          // Cast to Record<string, unknown> for property access
          const obj = notification as unknown as Record<string, unknown>;
        
          // Check if is_read property exists
          if (!('is_read' in obj)) {
            console.warn('Notification at index', i, 'missing is_read property:', notification);
            // Default to unread if is_read property is missing
            filtered.push(notification);
            continue;
          }
        
          const readStatus = obj.is_read;
          console.log(`Notification ${i} is_read status:`, { 
            readStatus, 
            type: typeof readStatus,
            notificationId: 'id' in obj ? obj.id : 'unknown'
          });
        
          // Handle boolean
          if (typeof readStatus === 'boolean') {
            if (!readStatus) {
              filtered.push(notification);
            }
            continue;
          }
        
          // Handle number (0/1)
          if (typeof readStatus === 'number') {
            if (readStatus === 0) {
              filtered.push(notification);
            }
            continue;
          }
        
          // Handle string
          if (typeof readStatus === 'string') {
            const lowerStatus = String(readStatus).toLowerCase();
            if (!['true', '1', 'yes'].includes(lowerStatus)) {
              filtered.push(notification);
            }
            continue;
          }
        
          // Default to unread if type is unexpected
          console.warn('Unexpected is_read type:', typeof readStatus, 'in notification at index', i, ':', notification);
          filtered.push(notification);
        } catch (err) {
          console.error('Error checking notification status at index', i, ':', {
            error: err,
            notification
          });
          // Continue with next notification
        }
      }
    
      // Limit to 5 notifications
      const result = filtered.slice(0, 5);
      console.log('Filtered notifications result:', result);
      return result;
    } catch (error) {
      console.error('Unexpected error processing notifications:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        allNotificationsType: typeof allNotifications,
        allNotificationsLength: Array.isArray(allNotifications) ? allNotifications.length : 'not an array'
      });
      return [];
    }
  }, [allNotifications, loading.notifications, error.notifications]); // Simplified dependencies

  // Format notifications for display with proper error handling
  const formattedNotifications = useMemo(() => {
    try {
      console.log('Computing formattedNotifications with unreadNotifications:', unreadNotifications);
      
      // Ensure unreadNotifications is valid
      if (!unreadNotifications) {
        console.warn('unreadNotifications is null or undefined');
        return [];
      }
      
      // Extra check to ensure it's not a Promise
      if (typeof unreadNotifications === 'object' && unreadNotifications !== null && typeof (unreadNotifications as any).then === 'function') {
        console.error('unreadNotifications appears to be a Promise - this should not happen');
        return [];
      }
      
      if (!Array.isArray(unreadNotifications)) {
        console.warn('unreadNotifications is not an array:', typeof unreadNotifications, unreadNotifications);
        return [];
      }
      
      // Early return if empty array
      if (unreadNotifications.length === 0) {
        console.log('unreadNotifications is empty array, returning empty array');
        return [];
      }
      
      console.log('Processing unreadNotifications array of length:', unreadNotifications.length);
      
      // Process notifications synchronously - no async operations here
      const processedNotifications = [];
      
      for (let i = 0; i < unreadNotifications.length; i++) {
        const notification = unreadNotifications[i];
        
        try {
          // Ensure notification is not null or undefined
          if (notification == null) {
            console.warn('Skipping null/undefined notification at index', i);
            continue;
          }
          
          // Ensure notification is an object with an id property
          if (typeof notification !== 'object') {
            console.warn('Skipping non-object notification at index', i, ':', typeof notification);
            continue;
          }
          
          // Cast to Record<string, unknown> for property access
          const obj = notification as unknown as Record<string, unknown>;
          const isValid = 'id' in obj && obj.id != null;
          
          if (!isValid) {
            console.warn('Skipping invalid notification at index', i, ':', notification);
            continue;
          }
          
          // Create a safe notification object with defaults
          const safeNotification = {
            id: String('id' in obj && obj.id != null ? obj.id : 'unknown-id'),
            type: String('type' in obj && obj.type != null ? obj.type : 'info').toLowerCase(),
            created_at: 'created_at' in obj && obj.created_at && typeof obj.created_at === 'string' ? 
              new Date(obj.created_at).toISOString() : 
              new Date().toISOString(),
            is_read: Boolean('is_read' in obj ? obj.is_read : false),
            title: String('title' in obj && obj.title != null ? obj.title : 'Notification'),
            body: String('body' in obj && obj.body != null ? obj.body : ''),
            link: 'link' in obj && obj.link != null ? String(obj.link) : ''
          };
          
          // Ensure type is one of the allowed values
          const allowedTypes = ['info', 'success', 'error', 'warning'];
          if (!allowedTypes.includes(safeNotification.type)) {
            console.warn('Invalid notification type, defaulting to info:', safeNotification.type);
            safeNotification.type = 'info';
          }
          
          // Format the time
          let timeStr = '';
          try {
            const date = new Date(safeNotification.created_at);
            if (!isNaN(date.getTime())) {
              timeStr = formatDistanceToNow(date, { addSuffix: true });
            } else {
              console.warn('Invalid date in notification:', safeNotification.created_at);
              timeStr = 'recently';
            }
          } catch (e) {
            console.warn('Error formatting date in notification:', safeNotification.created_at, e);
            timeStr = 'recently';
          }
          
          processedNotifications.push({
            ...safeNotification,
            time: timeStr,
            category: safeNotification.type.charAt(0).toUpperCase() + safeNotification.type.slice(1),
            unread: !safeNotification.is_read,
            message: safeNotification.body,
            read: safeNotification.is_read,
            action: safeNotification.link && typeof safeNotification.link === 'string' ? { url: safeNotification.link } : undefined
          });
        } catch (mapError) {
          console.error('Error processing notification at index', i, ':', notification, mapError);
          // Continue with next notification
        }
      }
      
      console.log('Processed notifications result:', processedNotifications);
      return processedNotifications;
    } catch (error) {
      console.error('Error formatting notifications:', error);
      return [];
    }
  }, [unreadNotifications]); // Simplified dependencies

  // Helper function to mark notification as read
  const handleMarkAsRead = useCallback((notificationId: string) => {
    // Call markRead directly without async/await to avoid Promise issues
    if (typeof markRead === 'function') {
      markRead(notificationId).catch(err => {
        console.error('Failed to mark notification as read:', err);
      });
    } else {
      console.error('markRead is not a function:', typeof markRead);
    }
  }, [markRead]);

  // Initial data load
  useEffect(() => {
    const loadAllData = async () => {
      try {
        if (userRole === 'admin') {
          // For admins, load stats separately
          await Promise.all([
            loadGroups(),
            loadTheses(),
            loadStats()
          ]);
        } else {
          await Promise.all([
            loadGroups(),
            loadTheses()
          ]);
        }
      } catch (err) {
        console.error('Dashboard: Error loading data:', err);
      }
    };

    loadAllData();
  }, [loadGroups, loadTheses, loadStats, userRole]);
  
  // Function to retry loading data
  const handleRetry = async (type: 'groups' | 'theses' | 'stats') => {
    try {
      switch (type) {
        case 'groups':
          await loadGroups();
          break;
        case 'theses':
          await loadTheses();
          break;

        case 'stats':
          if (userRole === 'admin') {
            await loadStats();
          }
          break;
      }
    } catch (err) {
      console.error(`Dashboard: Retry failed for ${type}:`, err);
    }
  };

  const getStatCards = () => {
    try {
      // For admin users, use dedicated statistics endpoints
      if (userRole === 'admin' && groupStats && thesisStats) {
        return [
          { 
            label: 'Total Groups', 
            value: (groupStats.total_registered_groups ?? 0).toString(), 
            icon: Users, 
            color: 'text-green-600 bg-green-100' 
          },
          { 
            label: 'Active Groups', 
            value: (groupStats.active_groups ?? 0).toString(), 
            icon: CheckCircle, 
            color: 'text-blue-600 bg-blue-100' 
          },
          { 
            label: 'Pending Groups', 
            value: (groupStats.pending_groups ?? 0).toString(), 
            icon: Clock, 
            color: 'text-amber-600 bg-amber-100' 
          },
          { 
            label: 'Total Theses', 
            value: (thesisStats.total_theses ?? 0).toString(), 
            icon: BookOpen, 
            color: 'text-purple-600 bg-purple-100' 
          },
        ];
      }
      
      // For non-admin users, calculate stats from fetched data
      const groupsArray = Array.isArray(groups) ? groups : [];
      const uniqueGroups = groupsArray.filter((group, index, self) => 
        group && index === self.findIndex(g => g && g.id === group.id)
      );
      
      const activeGroups = uniqueGroups.filter(g => g?.status === 'APPROVED').length;
      const pendingGroups = uniqueGroups.filter(g => g?.status === 'PENDING').length;
      const groupMembers = uniqueGroups.reduce((sum, g) => 
        sum + (g?.members?.length || 0), 0
      );
      
      const thesesArray = Array.isArray(theses) ? theses : [];
      
      switch (userRole) {
        case 'student': {
          const studentGroup = uniqueGroups[0] || null;
          const studentThesis = thesesArray[0] || null;
          
          return [
            { 
              label: 'My Group', 
              value: studentGroup?.name || 'None', 
              icon: Users, 
              color: 'text-green-600 bg-green-100'
            },
            { 
              label: 'Group Status', 
              value: studentGroup?.status || 'N/A', 
              icon: CheckCircle, 
              color: studentGroup?.status === 'APPROVED' ? 'text-blue-600 bg-blue-100' : 
                     studentGroup?.status === 'PENDING' ? 'text-amber-600 bg-amber-100' : 
                     'text-gray-600 bg-gray-100',
              detail: studentGroup?.status === 'APPROVED' ? 'Approved' : 
                      studentGroup?.status === 'PENDING' ? 'Pending Approval' : 
                      'Not Available'
            },
            { 
              label: 'My Thesis', 
              value: studentThesis?.title || 'None', 
              icon: BookOpen, 
              color: 'text-purple-600 bg-purple-100' 
            },
            { 
              label: 'Thesis Status', 
              value: studentThesis?.status || 'N/A', 
              icon: TrendingUp, 
              color: studentThesis?.status?.includes?.('APPROVED') ? 'text-green-600 bg-green-100' : 
                     studentThesis?.status?.includes?.('SUBMITTED') ? 'text-blue-600 bg-blue-100' : 
                     studentThesis?.status?.includes?.('REJECTED') ? 'text-red-600 bg-red-100' : 
                     'text-amber-600 bg-amber-100',
              detail: studentThesis?.status?.replace(/_/g, ' ') || ''
            },
          ];
        }
        case 'adviser':
          return [
            { 
              label: 'Advised Groups', 
              value: uniqueGroups.length.toString(), 
              icon: Users, 
              color: 'text-green-600 bg-green-100' 
            },
            { 
              label: 'Active Groups', 
              value: activeGroups.toString(), 
              icon: CheckCircle, 
              color: 'text-blue-600 bg-blue-100' 
            },
            { 
              label: 'Pending Groups', 
              value: pendingGroups.toString(), 
              icon: Clock, 
              color: 'text-amber-600 bg-amber-100' 
            },
            { 
              label: 'Assigned Theses', 
              value: thesesArray.length.toString(), 
              icon: BookOpen, 
              color: 'text-purple-600 bg-purple-100' 
            },
          ];
        case 'panel':
          return [
            { 
              label: 'Assigned Groups', 
              value: uniqueGroups.length.toString(), 
              icon: Users, 
              color: 'text-green-600 bg-green-100' 
            },
            { 
              label: 'Active Groups', 
              value: activeGroups.toString(), 
              icon: CheckCircle, 
              color: 'text-blue-600 bg-blue-100' 
            },
            { 
              label: 'Pending Groups', 
              value: pendingGroups.toString(), 
              icon: Clock, 
              color: 'text-amber-600 bg-amber-100' 
            },
            { 
              label: 'Assigned Theses', 
              value: thesesArray.length.toString(), 
              icon: BookOpen, 
              color: 'text-purple-600 bg-purple-100' 
            },
          ];
        default:
          return [
            { 
              label: 'Total Groups', 
              value: uniqueGroups.length.toString(), 
              icon: Users, 
              color: 'text-green-600 bg-green-100' 
            },
            { 
              label: 'Active Groups', 
              value: activeGroups.toString(), 
              icon: CheckCircle, 
              color: 'text-blue-600 bg-blue-100' 
            },
            { 
              label: 'Pending Groups', 
              value: pendingGroups.toString(), 
              icon: Clock, 
              color: 'text-amber-600 bg-amber-100' 
            },
            { 
              label: 'Total Theses', 
              value: thesesArray.length.toString(), 
              icon: BookOpen, 
              color: 'text-purple-600 bg-purple-100' 
            },
          ];
      }
    } catch (error) {
      console.error('Error generating stat cards:', error);
      // Return empty stats in case of error
      return [
        { 
          label: 'Error', 
          value: 'N/A', 
          icon: Clock, 
          color: 'text-gray-600 bg-gray-100' 
        },
        { 
          label: 'Error', 
          value: 'N/A', 
          icon: CheckCircle, 
          color: 'text-gray-600 bg-gray-100' 
        }
      ];
    }
  };

  const getNotificationTypeColor = (type: string) => {
    // Handle undefined/null types
    if (!type) {
      return 'bg-blue-100 text-blue-800';
    }
    
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-amber-100 text-amber-800';
      default: // info
        return 'bg-blue-100 text-blue-800';
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TOPIC_APPROVED':
      case 'CONCEPT_APPROVED':
      case 'PROPOSAL_APPROVED':
      case 'FINAL_APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'TOPIC_SUBMITTED':
      case 'CONCEPT_SUBMITTED':
      case 'PROPOSAL_SUBMITTED':
      case 'FINAL_SUBMITTED':
      case 'CONCEPT_SCHEDULED':
      case 'PROPOSAL_SCHEDULED':
      case 'FINAL_SCHEDULED':
      case 'CONCEPT_DEFENDED':
      case 'PROPOSAL_DEFENDED':
      case 'FINAL_DEFENDED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESEARCH_IN_PROGRESS':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DRAFT':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'TOPIC_REJECTED':
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'REVISIONS_REQUIRED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };



  const quickActions = [
    { 
      label: userRole === 'student' ? 'My Group' : 'View Groups', 
      icon: Users, 
      action: 'groups', 
      color: 'bg-green-700 hover:bg-green-800' 
    },
    { 
      label: userRole === 'student' ? 'My Thesis' : 'View Theses', 
      icon: BookOpen, 
      action: 'thesis', 
      color: 'bg-purple-700 hover:bg-purple-800' 
    },
    { 
      label: 'Upload Document', 
      icon: Upload, 
      action: 'documents', 
      color: 'bg-blue-700 hover:bg-blue-800' 
    },
    { 
      label: 'View Calendar', 
      icon: Calendar, 
      action: 'schedule', 
      color: 'bg-amber-700 hover:bg-amber-800' 
    },
    // Add pending proposals action for admins
    ...(userRole === 'admin' ? [{
      label: 'Review Proposals',
      icon: Clock,
      action: 'groups/pending',
      color: 'bg-red-700 hover:bg-red-800'
    }] : [])
  ].filter(action => action); // Filter out any undefined/null actions

  const statCards = getStatCards();
  const isLoading = loading.groups || loading.theses || (userRole === 'admin' && loading.stats);
  const hasError = error.groups || error.theses || (userRole === 'admin' && error.stats);

  // Show loading state only when initially loading
  // Add defensive checks for array lengths
  const isInitialLoad = isLoading && 
    (Array.isArray(groups) ? groups.length === 0 : true) && 
    (Array.isArray(theses) ? theses.length === 0 : true) && 
    (userRole !== 'admin' || (!groupStats && !thesisStats));

  // Also show loading state if notifications are loading and we don't have any notifications yet
  const showLoadingState = isInitialLoad || 
    (notificationsLoading && (!Array.isArray(allNotifications) || allNotifications.length === 0));

  if (showLoadingState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg font-medium text-slate-700">Loading your dashboard...</p>
          <p className="text-sm text-slate-500">This may take a moment</p>
        </div>
      </div>
    );
  }

  // Add WebSocket tester component at the top of the dashboard in development
  const showWebSocketTester = process.env.NODE_ENV === 'development';

  // Calculate unread notification count with useMemo
  const unreadNotificationCount = useMemo(() => {
    try {
      // Ensure unreadNotifications is an array before accessing length
      if (!Array.isArray(unreadNotifications)) {
        console.warn('unreadNotifications is not an array for count calculation:', typeof unreadNotifications);
        return 0;
      }
      
      const count = unreadNotifications.filter(n => {
        try {
          if (!n || typeof n !== 'object' || !('is_read' in n)) {
            return false;
          }
          return !n.is_read;
        } catch (e) {
          console.error('Error checking notification read status for count:', e);
          return false;
        }
      }).length || 0;
      
      console.log('Calculated unread notification count:', count);
      return count;
    } catch (e) {
      console.error('Error calculating unread notification count:', e);
      return 0;
    }
  }, [unreadNotifications]);

  // Render notification content with useMemo
  const notificationContent = useMemo(() => {
    try {
      // Ensure formattedNotifications is an array before mapping
      if (!Array.isArray(formattedNotifications)) {
        console.warn('formattedNotifications is not an array:', typeof formattedNotifications);
        return (
          <div className="text-center py-8 text-slate-500">
            <p>Error loading notifications</p>
          </div>
        );
      }
      
      console.log('Rendering formattedNotifications:', formattedNotifications);
      
      // Check if any item is a Promise
      const hasPromise = formattedNotifications.some(item => 
        item && typeof item === 'object' && typeof (item as any).then === 'function'
      );
      
      if (hasPromise) {
        console.error('Found Promise in formattedNotifications - this should not happen');
        return (
          <div className="text-center py-8 text-slate-500">
            <p>Loading notifications...</p>
          </div>
        );
      }
      
      if (formattedNotifications.length > 0) {
        // Create mapped notifications and ensure no Promises are included
        const mappedNotifications = formattedNotifications.map((notification) => {
          // Extra safety check
          if (!notification || typeof notification !== 'object') {
            console.warn('Skipping invalid notification in render:', notification);
            return null;
          }
          
          // Ensure all required properties exist
          const safeNotification = {
            id: 'id' in notification ? String(notification.id) : 'unknown-id',
            type: 'type' in notification ? String(notification.type) : 'info',
            time: 'time' in notification ? String(notification.time) : '',
            category: 'category' in notification ? String(notification.category) : 'Info',
            unread: 'unread' in notification ? Boolean(notification.unread) : false,
            title: 'title' in notification ? String(notification.title) : 'Notification',
            message: 'message' in notification ? String(notification.message) : '',
            read: 'read' in notification ? Boolean(notification.read) : false,
            action: 'action' in notification && notification.action && typeof notification.action === 'object' && 'url' in notification.action && typeof notification.action.url === 'string' ? { url: notification.action.url } : undefined
          };
          
          return (
            <div
              key={safeNotification.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                safeNotification.unread
                  ? 'bg-green-50 border-green-200 hover:bg-green-100'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
              onClick={() => {
                try {
                  if (!safeNotification.read) {
                    // Call markRead directly without going through handleMarkAsRead
                    if (typeof markRead === 'function') {
                      // Call markRead directly without wrapping in Promise.resolve
                      markRead(safeNotification.id).catch(err => {
                        console.error('Failed to mark notification as read:', err);
                      });
                    } else {
                      console.error('markRead is not a function:', typeof markRead);
                    }
                  }
                  // Check if action exists and has a url property before navigating
                  if (safeNotification.action && typeof safeNotification.action === 'object' && 'url' in safeNotification.action && typeof safeNotification.action.url === 'string') {
                    onNavigate(safeNotification.action.url);
                  }
                } catch (e) {
                  console.error('Error handling notification click:', e);
                }
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <Badge
                  variant="secondary"
                  className={`text-xs ${getNotificationTypeColor(safeNotification.type)}`}
                >
                  {safeNotification.category}
                </Badge>
                {safeNotification.unread && (
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </div>
              <p className="text-sm text-slate-900 mb-1 truncate whitespace-nowrap overflow-hidden" title={safeNotification.title}>{safeNotification.title}</p>
              <p className="text-sm text-slate-600 mb-1 truncate whitespace-nowrap overflow-hidden" title={safeNotification.message}>{safeNotification.message}</p>
              <p className="text-xs text-slate-500">{safeNotification.time}</p>
            </div>
          );
        });
        
        // Ensure mappedNotifications doesn't contain any Promises
        const validNotifications = mappedNotifications.filter(item => 
          item !== null && 
          item !== undefined && 
          !(typeof item === 'object' && item !== null && typeof (item as any).then === 'function')
        );
        
        return validNotifications;
      } else {
        return (
          <div className="text-center py-8 text-slate-500">
            <p>No new notifications</p>
          </div>
        );
      }
    } catch (e) {
      console.error('Error rendering notifications:', e);
      return (
        <div className="text-center py-8 text-slate-500">
          <p>Error displaying notifications</p>
        </div>
      );
    }
  }, [formattedNotifications, markRead, onNavigate]);

  return (
    <div className="p-8 space-y-6">
      {showWebSocketTester && (
        <Card className="mb-6 border-0 shadow-sm">
          <WebSocketTester />
        </Card>
      )}
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-slate-900 mb-2">Welcome back</h1>
          <p className="text-slate-600 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-600" />
            Here's what's happening with your research groups
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-900">Sustainable Research</span>
          </div>
        </div>
      </div>





      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.isArray(statCards) && statCards.length > 0 ? (
          statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-base text-slate-900 font-semibold truncate whitespace-nowrap overflow-hidden" title={stat.value}>{stat.value}</p>
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="col-span-4 text-center py-8 text-slate-500">
            <p>No stats available</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Notifications Panel */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-slate-900">Notifications</h2>
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              {unreadNotificationCount} new
            </Badge>          
          </div>
          <div className="space-y-3">
            {notificationContent}
          </div>
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => onNavigate('notifications')}
          >
            View All Notifications
          </Button>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 border-0 shadow-sm">
        <h2 className="text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.isArray(quickActions) && quickActions.length > 0 ? (
            quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  onClick={() => onNavigate(action.action)}
                  className={`${action.color} text-white py-6 rounded-xl flex items-center justify-center gap-3`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{action.label}</span>
                </Button>
              );
            })
          ) : (
            <div className="col-span-5 text-center py-4 text-slate-500">
              <p>No quick actions available</p>
            </div>
          )}
        </div>
      </Card>





    </div>
  );
}