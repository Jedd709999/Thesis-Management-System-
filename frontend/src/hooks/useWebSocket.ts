import { useState, useEffect, useCallback, useRef } from 'react';

interface UseWebSocketOptions {
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    try {
      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Log the URL we're trying to connect to
      console.log('Attempting WebSocket connection to:', url);
      
      const token = localStorage.getItem('access_token')
      const wsUrl = token ? `${url}?token=${token}` : url
      
      console.log('Final WebSocket URL with token:', wsUrl);
      
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log('WebSocket connected successfully')
        setConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
        onConnect?.()
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('WebSocket message received:', data)
          onMessage?.(data)
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }
      
      ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        setError('WebSocket connection error')
        onError?.(event)
      }
      
      ws.onclose = (event) => {
        console.log('WebSocket disconnected', event)
        setConnected(false)
        onDisconnect?.()
        
        // Log the close code and reason
        console.log('WebSocket close code:', event.code)
        console.log('WebSocket close reason:', event.reason)
        console.log('WebSocket wasClean:', event.wasClean)
        
        // Don't attempt reconnection if the close was clean (code 1000) or if it's an authentication failure (code 4001)
        // For code 1006 (abnormal closure), we should still attempt reconnection as it might be a temporary network issue
        if (event.code === 1000 || event.code === 4001) {
          console.log('WebSocket closed cleanly or due to authentication failure, not reconnecting')
          return
        }
        
        // Attempt reconnection for all other cases including 1006 (abnormal closure)
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          console.log(`Scheduling reconnection attempt ${reconnectAttemptsRef.current} in ${reconnectInterval}ms`)
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnecting... (Attempt ${reconnectAttemptsRef.current})`)
            connect()
          }, reconnectInterval)
        } else {
          setError('Max reconnection attempts reached')
          console.log('Max reconnection attempts reached, stopping reconnection attempts')
        }
      }
      
      wsRef.current = ws
    } catch (err) {
      console.error('Failed to create WebSocket:', err)
      setError('Failed to create WebSocket connection')
    }
  }, [url, onMessage, onConnect, onDisconnect, onError, reconnectInterval, maxReconnectAttempts])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnected(false)
  }, [])

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      // Don't automatically disconnect when component unmounts
      // The disconnect function should be called manually when needed
      console.log('WebSocket hook unmounted, but not disconnecting automatically')
    }
  }, [connect])

  return {
    connected,
    error,
    send,
    disconnect,
    reconnect: connect
  }
}