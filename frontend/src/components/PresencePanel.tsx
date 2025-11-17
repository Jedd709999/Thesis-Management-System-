import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Chip,
  Paper,
  Tooltip,
  Badge,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Person,
  Edit,
  Visibility,
  Comment,
  ExpandMore,
  ExpandLess,
  Group
} from '@mui/icons-material';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

interface PresenceIndicator {
  user: User;
  position?: number;
  selection?: { start: number; end: number };
  color: string;
  status: 'editing' | 'viewing' | 'idle';
  lastSeen: Date;
}

interface PresencePanelProps {
  activeUsers: User[];
  presenceIndicators: PresenceIndicator[];
  currentUser?: User;
  showDetails?: boolean;
}

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#FFD93D', '#6BCB77', '#FF6B9D'
];

const getUserColor = (userId: number) => {
  return USER_COLORS[userId % USER_COLORS.length];
};

const getUserInitials = (user: User) => {
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  }
  return user.username?.[0]?.toUpperCase() || '?';
};

const formatLastSeen = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 30) return 'Active now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'editing':
      return <Edit sx={{ fontSize: 16 }} />;
    case 'viewing':
      return <Visibility sx={{ fontSize: 16 }} />;
    case 'idle':
      return <Person sx={{ fontSize: 16 }} />;
    default:
      return <Person sx={{ fontSize: 16 }} />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'editing':
      return 'success';
    case 'viewing':
      return 'info';
    case 'idle':
      return 'default';
    default:
      return 'default';
  }
};

const PresencePanel: React.FC<PresencePanelProps> = ({
  activeUsers,
  presenceIndicators,
  currentUser,
  showDetails = true
}) => {
  const [expanded, setExpanded] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Merge active users with presence indicators
  const enrichedUsers = activeUsers.map(user => {
    const presence = presenceIndicators.find(p => p.user.id === user.id);
    return {
      user,
      presence,
      color: getUserColor(user.id)
    };
  });

  const getStatus = (presence?: PresenceIndicator) => {
    if (!presence) return 'viewing';
    
    const now = new Date();
    const diff = now.getTime() - presence.lastSeen.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 10 && presence.position !== undefined) return 'editing';
    if (seconds < 60) return 'viewing';
    return 'idle';
  };

  return (
    <Paper 
      elevation={2}
      sx={{ 
        width: 280,
        maxHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Group fontSize="small" />
          <Typography variant="subtitle2" fontWeight="bold">
            Active Users ({activeUsers.length})
          </Typography>
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      {/* User List */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List sx={{ flex: 1, overflow: 'auto', py: 0 }}>
          {enrichedUsers.map(({ user, presence, color }) => {
            const status = getStatus(presence);
            const isCurrentUser = currentUser?.id === user.id;
            
            return (
              <ListItem
                key={user.id}
                sx={{
                  px: 2,
                  py: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#f9f9f9'
                  },
                  backgroundColor: selectedUser?.id === user.id ? '#f0f0f0' : 'transparent'
                }}
                onClick={() => setSelectedUser(user)}
              >
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: color,
                        width: 8,
                        height: 8,
                        border: '2px solid white'
                      }
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: '0.875rem',
                        backgroundColor: color,
                        border: isCurrentUser ? '2px solid #1976d2' : 'none'
                      }}
                    >
                      {getUserInitials(user)}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: isCurrentUser ? 'bold' : 'normal' }}>
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user.username
                        }
                        {isCurrentUser && ' (You)'}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        icon={getStatusIcon(status)}
                        label={status}
                        size="small"
                        color={getStatusColor(status) as any}
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                      {presence?.lastSeen && (
                        <Typography variant="caption" color="text.secondary">
                          {formatLastSeen(presence.lastSeen)}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </Collapse>

      {/* Selected User Details */}
      {selectedUser && showDetails && (
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid #ddd',
            backgroundColor: '#fafafa'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar
              sx={{
                width: 24,
                height: 24,
                fontSize: '0.75rem',
                backgroundColor: getUserColor(selectedUser.id)
              }}
            >
              {getUserInitials(selectedUser)}
            </Avatar>
            <Typography variant="subtitle2" fontWeight="bold">
              {selectedUser.first_name && selectedUser.last_name 
                ? `${selectedUser.first_name} ${selectedUser.last_name}`
                : selectedUser.username
              }
            </Typography>
          </Box>
          
          {presenceIndicators.find(p => p.user.id === selectedUser.id) && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {presenceIndicators.find(p => p.user.id === selectedUser.id)?.position !== undefined && (
                  <span>Cursor at position {presenceIndicators.find(p => p.user.id === selectedUser.id)?.position}</span>
                )}
                {presenceIndicators.find(p => p.user.id === selectedUser.id)?.selection && (
                  <span> • Selected text</span>
                )}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Empty State */}
      {activeUsers.length === 0 && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Person sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No active users
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Users will appear here when they join the document
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default PresencePanel;
