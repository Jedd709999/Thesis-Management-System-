import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material';
import {
  Edit,
  Share,
  CloudDownload,
  Visibility,
  Group,
  Person,
  Close,
  Check,
  Warning
} from '@mui/icons-material';
import PresencePanel from './PresencePanel';
import { ConflictResolutionProvider, useConflictResolution, DocumentOperation } from '../context/ConflictResolutionContext';
import ConflictResolutionUI from './ConflictResolutionUI';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

interface DocumentState {
  id: number;
  title: string;
  google_doc_url: string;
  provider: string;
}

interface LiveEditorProps {
  documentId: number;
  url?: string | null;
  height?: number;
  editable?: boolean;
  onDocumentChange?: (content: any) => void;
}

interface PresenceIndicator {
  user: User;
  position?: number;
  selection?: { start: number; end: number };
  color: string;
  status: 'editing' | 'viewing' | 'idle';
  lastSeen: Date;
}

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#FFD93D', '#6BCB77', '#FF6B9D'
];

const LiveEditorContent: React.FC<LiveEditorProps> = ({
  documentId,
  url,
  height = 600,
  editable = false,
  onDocumentChange
}) => {
  const { addOperation, addPendingOperation, resolveOperation, state } = useConflictResolution();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentState, setDocumentState] = useState<DocumentState | null>(null);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [presenceIndicators, setPresenceIndicators] = useState<PresenceIndicator[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'viewer' | 'commenter' | 'writer'>('writer');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showPresencePanel, setShowPresencePanel] = useState(true);
  
  const websocketRef = useRef<WebSocket | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getUserColor = useCallback((userId: number) => {
    return USER_COLORS[userId % USER_COLORS.length];
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!documentId) return;

    const wsUrl = `ws://localhost:8000/ws/document/${documentId}/`;
    const ws = new WebSocket(wsUrl);
    websocketRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'document_state':
            setDocumentState(data.document);
            break;
            
          case 'user_joined':
            setActiveUsers(prev => [...prev.filter(u => u.id !== data.user.id), data.user]);
            break;
            
          case 'user_left':
            setActiveUsers(prev => prev.filter(u => u.id !== data.user.id));
            setPresenceIndicators(prev => prev.filter(p => p.user.id !== data.user.id));
            break;
            
          case 'text_change':
            // Handle real-time text changes
            handleTextChange(data);
            break;
            
          case 'cursor_position':
            setPresenceIndicators(prev => {
              const filtered = prev.filter(p => p.user.id !== data.user.id);
              return [...filtered, {
                user: data.user,
                position: data.position,
                color: getUserColor(data.user.id),
                status: 'editing',
                lastSeen: new Date()
              }];
            });
            break;
            
          case 'selection_change':
            setPresenceIndicators(prev => {
              const filtered = prev.filter(p => p.user.id !== data.user.id);
              return [...filtered, {
                user: data.user,
                selection: { start: data.start, end: data.end },
                color: getUserColor(data.user.id),
                status: 'editing',
                lastSeen: new Date()
              }];
            });
            break;
            
          case 'format_change':
            // Handle formatting changes
            handleFormatChange(data);
            break;
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      // Don't attempt to reconnect if we've never successfully connected
      // This prevents endless retry loops when the backend isn't running
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Live collaboration requires ASGI server (Daphne) - Django dev server doesn\'t support WebSockets');
      setIsConnected(false);
      
      // Don't retry on error to prevent endless connection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [documentId, getUserColor]);

  const handleTextChange = useCallback((data: any) => {
    // Add operation for conflict resolution
    if (currentUser && data.position !== undefined) {
      addOperation({
        type: 'insert',
        userId: currentUser.id,
        position: data.position,
        content: data.content || '',
        clientId: `client-${currentUser.id}`
      });
    }

    // This would integrate with the Google Docs API
    // For now, we'll just notify the parent component
    if (onDocumentChange) {
      onDocumentChange(data);
    }
  }, [currentUser, addOperation, onDocumentChange]);

  const handleFormatChange = useCallback((data: any) => {
    // Add operation for conflict resolution
    if (currentUser && data.position !== undefined) {
      addOperation({
        type: 'format',
        userId: currentUser.id,
        position: data.position,
        length: data.length,
        attributes: data.attributes,
        clientId: `client-${currentUser.id}`
      });
    }

    // Handle formatting changes
    if (onDocumentChange) {
      onDocumentChange(data);
    }
  }, [currentUser, addOperation, onDocumentChange]);

  const sendWebSocketMessage = useCallback((message: any) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    }
  }, []);

  const handleOAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/google-docs/oauth-url/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOauthUrl(data.authorization_url);
        // Open OAuth in popup
        window.open(data.authorization_url, 'google-oauth', 'width=500,height=600');
      } else {
        throw new Error('Failed to get OAuth URL');
      }
    } catch (err) {
      setError('Failed to authenticate with Google');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!shareEmail || !documentState?.google_doc_url) return;

    try {
      setIsLoading(true);
      const docId = extractDocIdFromUrl(documentState.google_doc_url);
      
      const response = await fetch(`/api/google-docs/${docId}/share/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          email: shareEmail,
          role: shareRole
        })
      });

      if (response.ok) {
        setShowShareDialog(false);
        setShareEmail('');
      } else {
        throw new Error('Failed to share document');
      }
    } catch (err) {
      setError('Failed to share document');
    } finally {
      setIsLoading(false);
    }
  }, [shareEmail, shareRole, documentState]);

  const extractDocIdFromUrl = (url: string) => {
    const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : '';
  };

  const toggleLiveMode = useCallback(() => {
    if (!isLiveMode) {
      connectWebSocket();
    } else {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    }
    setIsLiveMode(!isLiveMode);
  }, [isLiveMode, connectWebSocket]);

  // Load current user info
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const response = await fetch('/api/users/me/', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
          }
        }
      } catch (err) {
        console.error('Failed to load current user:', err);
      }
    };

    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (isLiveMode && documentId) {
      connectWebSocket();
    }

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isLiveMode, documentId, connectWebSocket]);

  useEffect(() => {
    // Handle OAuth callback from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'google-oauth-success') {
        // Handle successful OAuth
        setOauthUrl(null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!url && !documentState?.google_doc_url) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No document to display
        </Typography>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={handleOAuth}
          sx={{ mt: 2 }}
        >
          Create Google Doc
        </Button>
      </Box>
    );
  }

  const documentUrl = documentState?.google_doc_url || url;

  return (
    <Grid container spacing={2}>
      {/* Warning message when backend isn't running */}
      {error && (
        <Grid item xs={12}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {error}. To enable live collaboration, stop the Django dev server and run: <code>daphne backend.asgi:application</code>
            </Typography>
          </Alert>
        </Grid>
      )}
      {/* Main Editor */}
      <Grid item xs={showPresencePanel ? 9 : 12}>
        <Box sx={{ position: 'relative' }}>
          {/* Header with controls */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 2,
            borderBottom: '1px solid #ddd',
            backgroundColor: '#f5f5f5'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6">
                {documentState?.title || 'Document'}
              </Typography>
              
              {/* Live mode toggle */}
              <Chip
                icon={isLiveMode ? <Check /> : <Edit />}
                label={isLiveMode ? 'Live Mode' : 'View Only'}
                color={isLiveMode ? 'success' : 'default'}
                onClick={toggleLiveMode}
                clickable
              />
              
              {/* Connection status */}
              <Chip
                icon={isConnected ? <Check /> : <Warning />}
                label={isConnected ? 'Connected' : error ? 'Offline Mode' : 'Disconnected'}
                color={isConnected ? 'success' : error ? 'warning' : 'error'}
                size="small"
                title={error || undefined}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Active users count */}
              <Chip
                icon={<Group />}
                label={`${activeUsers.length} active`}
                size="small"
                onClick={() => setShowPresencePanel(!showPresencePanel)}
                clickable
              />

              {/* Action buttons */}
              <Tooltip title="Share document">
                <IconButton onClick={() => setShowShareDialog(true)}>
                  <Share />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Download">
                <IconButton>
                  <CloudDownload />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Open in new tab">
                <IconButton onClick={() => window.open(documentUrl, '_blank')}>
                  <Visibility />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Error display */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Conflict Resolution UI */}
          <ConflictResolutionUI documentId={documentId} currentUser={currentUser?.id} />

          {/* Loading indicator */}
          {isLoading && <LinearProgress />}

          {/* Document iframe */}
          <Box sx={{ border: '1px solid #ddd', borderRadius: 1 }}>
            <iframe
              ref={iframeRef}
              title="Google Docs Live Editor"
              src={documentUrl}
              style={{
                width: '100%',
                height: height - 64, // Account for header
                border: 'none'
              }}
              onLoad={() => setIsLoading(false)}
            />
          </Box>
        </Box>
      </Grid>

      {/* Presence Panel */}
      {showPresencePanel && (
        <Grid item xs={3}>
          <PresencePanel
            activeUsers={activeUsers}
            presenceIndicators={presenceIndicators}
            currentUser={currentUser}
          />
        </Grid>
      )}

      {/* Share dialog */}
      <Dialog open={showShareDialog} onClose={() => setShowShareDialog(false)}>
        <DialogTitle>Share Document</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Share this document with others to collaborate in real-time.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <input
              type="email"
              placeholder="Enter email address"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            
            <select
              value={shareRole}
              onChange={(e) => setShareRole(e.target.value as any)}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="viewer">Can view</option>
              <option value="commenter">Can comment</option>
              <option value="writer">Can edit</option>
            </select>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowShareDialog(false)}>Cancel</Button>
          <Button onClick={handleShare} variant="contained">
            Share
          </Button>
        </DialogActions>
      </Dialog>

      {/* OAuth popup */}
      {oauthUrl && (
        <Dialog open={true} onClose={() => setOauthUrl(null)}>
          <DialogTitle>Authenticate with Google</DialogTitle>
          <DialogContent>
            <Typography>
              Please complete the authentication in the popup window.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOauthUrl(null)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      )}
    </Grid>
  );
};

const LiveEditor: React.FC<LiveEditorProps> = (props) => {
  return (
    <ConflictResolutionProvider documentId={props.documentId}>
      <LiveEditorContent {...props} />
    </ConflictResolutionProvider>
  );
};

export default LiveEditor;
