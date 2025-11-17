import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Warning,
  Check,
  Close,
  MergeType,
  Person,
  AccessTime
} from '@mui/icons-material';
import { useConflictResolution, Conflict, DocumentOperation } from '../context/ConflictResolutionContext';

interface ConflictDialogProps {
  open: boolean;
  onClose: () => void;
  conflicts: Conflict[];
  onResolveConflict: (conflictIndex: number, resolution: Conflict['resolution']) => void;
}

const ConflictDialog: React.FC<ConflictDialogProps> = ({
  open,
  onClose,
  conflicts,
  onResolveConflict
}) => {
  const [selectedResolution, setSelectedResolution] = useState<{ [key: number]: Conflict['resolution'] }>({});

  const handleResolve = (conflictIndex: number) => {
    const resolution = selectedResolution[conflictIndex];
    if (resolution) {
      onResolveConflict(conflictIndex, resolution);
    }
  };

  const handleResolveAll = () => {
    Object.entries(selectedResolution).forEach(([index, resolution]) => {
      onResolveConflict(parseInt(index), resolution);
    });
  };

  const canResolveAll = conflicts.every((_, index) => selectedResolution[index]);

  const formatOperation = (op: DocumentOperation) => {
    const time = new Date(op.timestamp).toLocaleTimeString();
    return `${op.type} at position ${op.position} (${time})`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Warning color="warning" />
          <Typography variant="h6">
            Document Conflicts ({conflicts.length})
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Multiple users edited the same content simultaneously. Please choose how to resolve each conflict.
        </Alert>

        <List>
          {conflicts.map((conflict, index) => (
            <React.Fragment key={index}>
              <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <Box sx={{ width: '100%', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Conflict #{index + 1}
                  </Typography>
                  
                  {/* Show conflicting operations */}
                  {conflict.operations.map((op, opIndex) => (
                    <Box
                      key={op.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        mb: 1,
                        backgroundColor: opIndex === 0 ? '#fff3cd' : '#d1ecf1',
                        borderRadius: 1,
                        border: '1px solid #ddd'
                      }}
                    >
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                        {op.userId}
                      </Avatar>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">
                          User {op.userId} - {formatOperation(op)}
                        </Typography>
                        {op.content && (
                          <Typography variant="caption" color="text.secondary">
                            Content: "{op.content}"
                          </Typography>
                        )}
                      </Box>
                      
                      <Chip
                        icon={<AccessTime fontSize="small" />}
                        label={new Date(op.timestamp).toLocaleTimeString()}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  ))}

                  {/* Resolution options */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Resolution:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        variant={selectedResolution[index] === 'accept-first' ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setSelectedResolution({
                          ...selectedResolution,
                          [index]: 'accept-first'
                        })}
                        startIcon={<Check />}
                      >
                        Accept First
                      </Button>
                      
                      <Button
                        variant={selectedResolution[index] === 'accept-last' ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setSelectedResolution({
                          ...selectedResolution,
                          [index]: 'accept-last'
                        })}
                        startIcon={<Check />}
                      >
                        Accept Last
                      </Button>
                      
                      <Button
                        variant={selectedResolution[index] === 'merge' ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setSelectedResolution({
                          ...selectedResolution,
                          [index]: 'merge'
                        })}
                        startIcon={<MergeType />}
                      >
                        Merge
                      </Button>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleResolve(index)}
                    disabled={!selectedResolution[index]}
                  >
                    Resolve
                  </Button>
                </Box>
              </ListItem>
              
              {index < conflicts.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleResolveAll}
          disabled={!canResolveAll}
          startIcon={<Check />}
        >
          Resolve All
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface ConflictNotificationProps {
  conflicts: Conflict[];
  onResolveConflict: (conflictIndex: number, resolution: Conflict['resolution']) => void;
}

const ConflictNotification: React.FC<ConflictNotificationProps> = ({
  conflicts,
  onResolveConflict
}) => {
  const [showDialog, setShowDialog] = useState(false);

  if (conflicts.length === 0) return null;

  return (
    <>
      <Alert
        severity="warning"
        sx={{ mb: 2 }}
        action={
          <Button
            size="small"
            onClick={() => setShowDialog(true)}
            startIcon={<Warning />}
          >
            Resolve
          </Button>
        }
      >
        {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} detected. Click to resolve.
      </Alert>

      <ConflictDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        conflicts={conflicts}
        onResolveConflict={onResolveConflict}
      />
    </>
  );
};

interface OperationHistoryProps {
  operations: DocumentOperation[];
  currentUser?: number;
}

const OperationHistory: React.FC<OperationHistoryProps> = ({
  operations,
  currentUser
}) => {
  const [showHistory, setShowHistory] = useState(false);

  const sortedOperations = [...operations].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <Box>
      <Button
        size="small"
        onClick={() => setShowHistory(!showHistory)}
        startIcon={<AccessTime />}
      >
        History ({operations.length})
      </Button>

      {showHistory && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Recent Operations
          </Typography>
          
          <List dense>
            {sortedOperations.slice(0, 10).map((op) => (
              <ListItem key={op.id} sx={{ py: 0.5 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        User {op.userId} {op.type}
                      </Typography>
                      {currentUser === op.userId && (
                        <Chip label="You" size="small" color="primary" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      Position {op.position} • {new Date(op.timestamp).toLocaleTimeString()}
                      {op.content && ` • "${op.content}"`}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

// Main Conflict Resolution UI Component
interface ConflictResolutionUIProps {
  documentId: number;
  currentUser?: number;
}

const ConflictResolutionUI: React.FC<ConflictResolutionUIProps> = ({
  documentId,
  currentUser
}) => {
  const { state, resolveConflict } = useConflictResolution();

  const handleResolveConflict = (conflictIndex: number, resolution: Conflict['resolution']) => {
    resolveConflict(conflictIndex, resolution);
  };

  return (
    <Box>
      {/* Conflict Notifications */}
      <ConflictNotification
        conflicts={state.conflicts}
        onResolveConflict={handleResolveConflict}
      />

      {/* Operation History */}
      <OperationHistory
        operations={state.operations}
        currentUser={currentUser}
      />

      {/* Sync Status */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Document version: {state.documentVersion} • 
          Last sync: {new Date(state.lastSyncTime).toLocaleTimeString()}
        </Typography>
      </Box>
    </Box>
  );
};

export { ConflictResolutionUI, ConflictDialog, ConflictNotification, OperationHistory };
export default ConflictResolutionUI;
