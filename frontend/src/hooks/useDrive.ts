import { useState, useCallback } from 'react'
import { googleDocsApi } from '../api/googleDocsService'
import { getErrorMessage } from '../utils/errorHandling'

export function useDrive() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Initiate Google OAuth flow
  const authorizeGoogle = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await googleDocsApi.getOAuthUrl()
      const { authorization_url, state } = response.data
      
      // Open OAuth popup
      const width = 600
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2
      
      const popup = window.open(
        authorization_url,
        'Google Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      )
      
      // Listen for OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'oauth-callback') {
          const { code } = event.data
          try {
            await googleDocsApi.handleOAuthCallback({ code, state })
            setIsAuthorized(true)
            popup?.close()
          } catch (err) {
            setError(getErrorMessage(err))
          }
        }
      }
      
      window.addEventListener('message', handleMessage)
      
      // Check if popup was closed
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', handleMessage)
          setLoading(false)
        }
      }, 500)
      
    } catch (err) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }, [])

  // Check authorization status
  const checkAuthorization = useCallback(async () => {
    try {
      // You would call an endpoint to verify OAuth status
      // For now, we'll use localStorage as a simple check
      const hasToken = localStorage.getItem('google_drive_token')
      setIsAuthorized(!!hasToken)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }, [])

  return {
    loading,
    error,
    isAuthorized,
    authorizeGoogle,
    checkAuthorization
  }
}