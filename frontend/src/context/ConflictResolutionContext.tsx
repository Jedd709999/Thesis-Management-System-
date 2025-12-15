import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types for conflict resolution
interface DocumentOperation {
  id: string;
  type: 'insert' | 'delete' | 'replace' | 'format';
  userId: number;
  timestamp: number;
  position: number;
  length?: number;
  content?: string;
  attributes?: Record<string, any>;
  clientId: string;
}

interface ConflictResolutionState {
  operations: DocumentOperation[];
  pendingOperations: DocumentOperation[];
  resolvedOperations: DocumentOperation[];
  documentVersion: number;
  lastSyncTime: number;
  conflicts: Conflict[];
}

interface Conflict {
  operations: DocumentOperation[];
  resolution?: 'accept-first' | 'accept-last' | 'merge';
  resolvedAt?: number;
}

type ConflictResolutionAction =
  | { type: 'ADD_OPERATION'; payload: DocumentOperation }
  | { type: 'ADD_PENDING_OPERATION'; payload: DocumentOperation }
  | { type: 'RESOLVE_OPERATION'; payload: { operationId: string; success: boolean } }
  | { type: 'SYNC_OPERATIONS'; payload: DocumentOperation[] }
  | { type: 'DETECT_CONFLICTS'; payload: Conflict[] }
  | { type: 'RESOLVE_CONFLICT'; payload: { conflictIndex: number; resolution: Conflict['resolution'] } }
  | { type: 'UPDATE_VERSION'; payload: number }
  | { type: 'CLEAR_PENDING' };

// Operational Transform for conflict resolution
class OperationalTransform {
  /**
   * Transform two operations that were applied concurrently
   */
  static transform(op1: DocumentOperation, op2: DocumentOperation): [DocumentOperation, DocumentOperation] {
    if (op1.type === 'insert' && op2.type === 'insert') {
      return this.transformInsertInsert(op1, op2);
    } else if (op1.type === 'insert' && op2.type === 'delete') {
      return this.transformInsertDelete(op1, op2);
    } else if (op1.type === 'delete' && op2.type === 'insert') {
      const [op2Prime, op1Prime] = this.transformInsertDelete(op2, op1);
      return [op1Prime, op2Prime];
    } else if (op1.type === 'delete' && op2.type === 'delete') {
      return this.transformDeleteDelete(op1, op2);
    } else if (op1.type === 'replace' || op2.type === 'replace') {
      // Replace operations are treated as delete + insert
      return this.transformReplace(op1, op2);
    }
    
    // For format operations, they don't affect text positions
    return [op1, op2];
  }

  private static transformInsertInsert(op1: DocumentOperation, op2: DocumentOperation): [DocumentOperation, DocumentOperation] {
    if (op1.position <= op2.position) {
      // op1 comes before or at the same position as op2
      return [
        op1,
        { ...op2, position: op2.position + (op1.content?.length || 0) }
      ];
    } else {
      // op2 comes before op1
      return [
        { ...op1, position: op1.position + (op2.content?.length || 0) },
        op2
      ];
    }
  }

  private static transformInsertDelete(op1: DocumentOperation, op2: DocumentOperation): [DocumentOperation, DocumentOperation] {
    if (op1.position <= op2.position) {
      // Insert before delete
      return [
        op1,
        { ...op2, position: op2.position + (op1.content?.length || 0) }
      ];
    } else if (op1.position >= op2.position + (op2.length || 0)) {
      // Insert after delete
      return [
        { ...op1, position: op1.position - (op2.length || 0) },
        op2
      ];
    } else {
      // Insert inside delete range
      return [
        { ...op1, position: op2.position },
        op2
      ];
    }
  }

  private static transformDeleteDelete(op1: DocumentOperation, op2: DocumentOperation): [DocumentOperation, DocumentOperation] {
    const op1End = op1.position + (op1.length || 0);
    const op2End = op2.position + (op2.length || 0);

    if (op1End <= op2.position) {
      // op1 completely before op2
      return [
        op1,
        { ...op2, position: op2.position - (op1.length || 0) }
      ];
    } else if (op2End <= op1.position) {
      // op2 completely before op1
      return [
        { ...op1, position: op1.position - (op2.length || 0) },
        op2
      ];
    } else {
      // Overlapping deletes - normalize to non-overlapping
      const start = Math.min(op1.position, op2.position);
      const end = Math.max(op1End, op2End);
      
      return [
        { ...op1, position: start, length: end - start },
        { ...op2, position: start, length: 0 } // op2 is absorbed into op1
      ];
    }
  }

  private static transformReplace(op1: DocumentOperation, op2: DocumentOperation): [DocumentOperation, DocumentOperation] {
    // For replace operations, we use last-writer-wins strategy
    if (op1.timestamp > op2.timestamp) {
      return [op1, { ...op2, type: 'delete' as const }];
    } else {
      return [{ ...op1, type: 'delete' as const }, op2];
    }
  }

  /**
   * Compose multiple operations into a single operation
   */
  static compose(ops: DocumentOperation[]): DocumentOperation {
    if (!Array.isArray(ops) || ops.length === 0) {
      throw new Error('Cannot compose empty operation list');
    }
    
    if (Array.isArray(ops) && ops.length === 1) {
      return ops[0];
    }

    // Simple composition - in a real implementation, this would be more sophisticated
    const first = ops[0];
    const last = ops[ops.length - 1];
    
    return {
      ...first,
      position: last.position,
      timestamp: last.timestamp,
      clientId: last.clientId
    };
  }
}

// Conflict detection and resolution
class ConflictResolver {
  /**
   * Detect conflicts between concurrent operations
   */
  static detectConflicts(operations: DocumentOperation[]): Conflict[] {
    const conflicts: Conflict[] = [];
    const sortedOps = Array.isArray(operations) ? [...operations].sort((a, b) => a.timestamp - b.timestamp) : [];
    
    // Ensure sortedOps is an array before accessing its length
    if (Array.isArray(sortedOps)) {
      for (let i = 0; i < sortedOps.length; i++) {
        for (let j = i + 1; j < sortedOps.length; j++) {
          const op1 = sortedOps[i];
          const op2 = sortedOps[j];
          
          if (this.operationsConflict(op1, op2)) {
            conflicts.push({
              operations: [op1, op2]
            });
          }
        }
      }
    }
    
    return conflicts;
  }

  private static operationsConflict(op1: DocumentOperation, op2: DocumentOperation): boolean {
    // Same user operations don't conflict
    if (op1.userId === op2.userId) {
      return false;
    }
    
    // Check for overlapping operations
    if (op1.type === 'delete' && op2.type === 'delete') {
      const op1End = op1.position + (op1.length || 0);
      const op2End = op2.position + (op2.length || 0);
      return !(op1End <= op2.position || op2End <= op1.position);
    }
    
    if (op1.type === 'replace' || op2.type === 'replace') {
      return true; // Replace operations always conflict
    }
    
    return false;
  }

  /**
   * Resolve a conflict using the specified strategy
   */
  static resolveConflict(conflict: Conflict, resolution: Conflict['resolution']): DocumentOperation[] {
    const { operations } = conflict;
    
    switch (resolution) {
      case 'accept-first':
        return [operations[0]];
      case 'accept-last':
        return [operations[1]];
      case 'merge':
        // Attempt to merge operations
        try {
          const [op1, op2] = OperationalTransform.transform(operations[0], operations[1]);
          return [op1, op2];
        } catch (error) {
          // If merge fails, default to last-writer-wins
          return [operations[1]];
        }
      default:
        return operations;
    }
  }
}

// Reducer for conflict resolution state
const conflictResolutionReducer = (
  state: ConflictResolutionState,
  action: ConflictResolutionAction
): ConflictResolutionState => {
  switch (action.type) {
    case 'ADD_OPERATION':
      return {
        ...state,
        operations: [...state.operations, action.payload],
        documentVersion: state.documentVersion + 1
      };

    case 'ADD_PENDING_OPERATION':
      return {
        ...state,
        pendingOperations: [...state.pendingOperations, action.payload]
      };

    case 'RESOLVE_OPERATION':
      return {
        ...state,
        pendingOperations: state.pendingOperations.filter(
          op => op.id !== action.payload.operationId
        ),
        resolvedOperations: action.payload.success
          ? [...state.resolvedOperations, 
             state.pendingOperations.find(op => op.id === action.payload.operationId)!]
          : state.resolvedOperations
      };

    case 'SYNC_OPERATIONS':
      return {
        ...state,
        operations: action.payload,
        pendingOperations: [],
        lastSyncTime: Date.now()
      };

    case 'DETECT_CONFLICTS':
      return {
        ...state,
        conflicts: Array.isArray(action.payload) ? action.payload : []
      };

    case 'RESOLVE_CONFLICT':
      const { conflictIndex, resolution } = action.payload;
      const conflict = state.conflicts[conflictIndex];
      const resolvedOps = ConflictResolver.resolveConflict(conflict, resolution);
      
      return {
        ...state,
        conflicts: state.conflicts.filter((_, index) => index !== conflictIndex),
        operations: [
          ...state.operations.filter(op => 
            !conflict.operations.some(conflictOp => conflictOp.id === op.id)
          ),
          ...resolvedOps
        ]
      };

    case 'UPDATE_VERSION':
      return {
        ...state,
        documentVersion: action.payload
      };

    case 'CLEAR_PENDING':
      return {
        ...state,
        pendingOperations: []
      };

    default:
      return state;
  }
};

// Context
const ConflictResolutionContext = createContext<{
  state: ConflictResolutionState;
  addOperation: (operation: Omit<DocumentOperation, 'id' | 'timestamp'>) => void;
  addPendingOperation: (operation: Omit<DocumentOperation, 'id' | 'timestamp'>) => void;
  resolveOperation: (operationId: string, success: boolean) => void;
  syncOperations: (operations: DocumentOperation[]) => void;
  resolveConflict: (conflictIndex: number, resolution: Conflict['resolution']) => void;
  transformOperation: (operation: DocumentOperation, againstOperation: DocumentOperation) => DocumentOperation;
} | null>(null);

// Provider
interface ConflictResolutionProviderProps {
  children: ReactNode;
  documentId: number;
}

export const ConflictResolutionProvider: React.FC<ConflictResolutionProviderProps> = ({
  children,
  documentId
}) => {
  const [state, dispatch] = useReducer(conflictResolutionReducer, {
    operations: [],
    pendingOperations: [],
    resolvedOperations: [],
    conflicts: [],
    documentVersion: 0,
    lastSyncTime: 0
  });

  const addOperation = (operation: Omit<DocumentOperation, 'id' | 'timestamp'>) => {
    const newOperation: DocumentOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    };
    
    dispatch({ type: 'ADD_OPERATION', payload: newOperation });
    
    // Check for conflicts
    const conflicts = ConflictResolver.detectConflicts([...state.operations, newOperation]);
    if (Array.isArray(conflicts) && conflicts.length > 0) {
      dispatch({ type: 'DETECT_CONFLICTS', payload: conflicts });
    }
  };

  const addPendingOperation = (operation: Omit<DocumentOperation, 'id' | 'timestamp'>) => {
    const newOperation: DocumentOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    };
    
    dispatch({ type: 'ADD_PENDING_OPERATION', payload: newOperation });
  };

  const resolveOperation = (operationId: string, success: boolean) => {
    dispatch({ type: 'RESOLVE_OPERATION', payload: { operationId, success } });
  };

  const syncOperations = (operations: DocumentOperation[]) => {
    dispatch({ type: 'SYNC_OPERATIONS', payload: operations });
  };

  const resolveConflict = (conflictIndex: number, resolution: Conflict['resolution']) => {
    dispatch({ type: 'RESOLVE_CONFLICT', payload: { conflictIndex, resolution } });
  };

  const transformOperation = (operation: DocumentOperation, againstOperation: DocumentOperation) => {
    const [transformed] = OperationalTransform.transform(operation, againstOperation);
    return transformed;
  };

  return (
    <ConflictResolutionContext.Provider
      value={{
        state,
        addOperation,
        addPendingOperation,
        resolveOperation,
        syncOperations,
        resolveConflict,
        transformOperation
      }}
    >
      {children}
    </ConflictResolutionContext.Provider>
  );
};

// Hook
export const useConflictResolution = () => {
  const context = useContext(ConflictResolutionContext);
  if (!context) {
    throw new Error('useConflictResolution must be used within ConflictResolutionProvider');
  }
  return context;
};

export { OperationalTransform, ConflictResolver };
export type { DocumentOperation, Conflict };
