import { useState, useEffect, useCallback, useRef } from 'react'

interface WebSocketOptions {
  onMessage?: (data: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

/**
 * WebSocket hook for real-time updates
 * Usage:
 * const { connected, send } = useWebSocket('ws://localhost:8000/ws/notifications/', {
 *   onMessage: (data) => console.log('Received:', data)
 * })
 */
export function useWebSocket(url: string, options: WebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5
  } = options

  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    try {
      const token = localStorage.getItem('access_token')
      const wsUrl = token ? `${url}?token=${token}` : url
      
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log('WebSocket connected')
        setConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
        onConnect?.()
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
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
      
      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setConnected(false)
        onDisconnect?.()
        
        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnecting... (Attempt ${reconnectAttemptsRef.current})`)
            connect()
          }, reconnectInterval)
        } else {
          setError('Max reconnection attempts reached')
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
    }
    wsRef.current?.close()
    wsRef.current = null
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
      disconnect()
    }
  }, [connect, disconnect])

  return {
    connected,
    error,
    send,
    disconnect,
    reconnect: connect
  }
}
