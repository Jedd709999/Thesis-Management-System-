import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to check Google Drive connection status
 */
export function useDriveConnection() {
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(false);
  const [isDriveReconnected, setIsDriveReconnected] = useState<boolean>(false);
  
  // Check Google Drive connection status
  const checkDriveConnection = useCallback(() => {
    const driveConnected = localStorage.getItem('drive_connected') === 'true';
    const driveReconnected = localStorage.getItem('drive_reconnected') === 'true';
    
    console.log('useDriveConnection: Checking drive connection - connected:', driveConnected, 'reconnected:', driveReconnected);
    
    setIsDriveConnected(driveConnected);
    setIsDriveReconnected(driveReconnected);
    
    return { isDriveConnected: driveConnected, isDriveReconnected: driveReconnected };
  }, []);
  
  // Update Google Drive connection status
  const updateDriveConnection = useCallback((connected: boolean, reconnected: boolean = false) => {
    console.log('useDriveConnection: Updating drive connection - connected:', connected, 'reconnected:', reconnected);
    localStorage.setItem('drive_connected', connected.toString());
    localStorage.setItem('drive_reconnected', reconnected.toString());
    setIsDriveConnected(connected);
    setIsDriveReconnected(reconnected);
  }, []);
  
  useEffect(() => {
    // Check initial connection status
    console.log('useDriveConnection: Initializing drive connection check');
    checkDriveConnection();
  }, [checkDriveConnection]);
  
  return {
    isDriveConnected,
    isDriveReconnected,
    checkDriveConnection,
    updateDriveConnection
  };
}