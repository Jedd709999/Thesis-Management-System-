import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getAccessToken, getTokenExpiration, isTokenExpired, willTokenExpireSoon } from '../api/authService'

/**
 * Debug component to display authentication state and token information
 * Useful for testing JWT refresh functionality
 */
export const AuthDebug: React.FC = () => {
  const auth = useAuth()
  const [tokenInfo, setTokenInfo] = useState<{
    hasToken: boolean
    isExpired: boolean
    expiresSoon: boolean
    expiration: string | null
    tokenPreview: string | null
  }>({
    hasToken: false,
    isExpired: false,
    expiresSoon: false,
    expiration: null,
    tokenPreview: null
  })

  const updateTokenInfo = () => {
    const token = getAccessToken()
    
    if (token) {
      setTokenInfo({
        hasToken: true,
        isExpired: isTokenExpired(token),
        expiresSoon: willTokenExpireSoon(token, 5),
        expiration: getTokenExpiration(token)?.toLocaleString() || null,
        tokenPreview: `${token.substring(0, 20)}...${token.substring(token.length - 20)}`
      })
    } else {
      setTokenInfo({
        hasToken: false,
        isExpired: false,
        expiresSoon: false,
        expiration: null,
        tokenPreview: null
      })
    }
  }

  useEffect(() => {
    updateTokenInfo()
    
    // Update token info every 30 seconds
    const interval = setInterval(updateTokenInfo, 30000)
    
    return () => clearInterval(interval)
  }, [auth.user])

  const handleRefreshToken = async () => {
    try {
      await auth.refreshToken()
      updateTokenInfo()
      alert('Token refreshed successfully!')
    } catch (error) {
      alert('Failed to refresh token: ' + (error as Error).message)
    }
  }

  const handleTestApi = async () => {
    try {
      // This will trigger the refresh interceptor if token is expired
      const response = await fetch('/api/auth/me/', {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      })
      
      if (response.ok) {
        alert('API call successful!')
      } else {
        alert('API call failed: ' + response.statusText)
      }
    } catch (error) {
      alert('API call error: ' + (error as Error).message)
    }
  }

  if (auth.loading) {
    return <div>Loading authentication data...</div>
  }

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      backgroundColor: '#f5f5f5',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <h3>🔐 Authentication Debug Panel</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>User Info:</strong><br/>
        {auth.user ? (
          <>
            ID: {auth.user.id}<br/>
            Email: {auth.user.email}<br/>
            Name: {auth.displayName}<br/>
            Role: {auth.user.role}<br/>
            Active: {auth.user.is_active ? '✅' : '❌'}<br/>
            Staff: {auth.user.is_staff ? '✅' : '❌'}
          </>
        ) : (
          'Not authenticated'
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Token Status:</strong><br/>
        Has Token: {tokenInfo.hasToken ? '✅' : '❌'}<br/>
        Is Expired: {tokenInfo.isExpired ? '❌' : '✅'}<br/>
        Expires Soon: {tokenInfo.expiresSoon ? '⚠️' : '✅'}<br/>
        {tokenInfo.expiration && (
          <>Expires: {tokenInfo.expiration}</>
        )}
      </div>

      {tokenInfo.tokenPreview && (
        <div style={{ marginBottom: '15px', wordBreak: 'break-all' }}>
          <strong>Token Preview:</strong><br/>
          <code>{tokenInfo.tokenPreview}</code>
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <strong>Auth Context Status:</strong><br/>
        Authenticated: {auth.isAuthenticated ? '✅' : '❌'}<br/>
        Valid Token: {auth.hasValidToken ? '✅' : '❌'}<br/>
        Admin: {auth.isAdmin ? '✅' : '❌'}<br/>
        Adviser: {auth.isAdviser ? '✅' : '❌'}<br/>
        Student: {auth.isStudent ? '✅' : '❌'}<br/>
        Panel: {auth.isPanel ? '✅' : '❌'}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={updateTokenInfo}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Update Info
        </button>
        
        <button 
          onClick={handleRefreshToken}
          disabled={!auth.isAuthenticated}
          style={{
            padding: '8px 16px',
            backgroundColor: auth.isAuthenticated ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: auth.isAuthenticated ? 'pointer' : 'not-allowed'
          }}
        >
          🔄 Refresh Token
        </button>
        
        <button 
          onClick={handleTestApi}
          disabled={!auth.isAuthenticated}
          style={{
            padding: '8px 16px',
            backgroundColor: auth.isAuthenticated ? '#ffc107' : '#6c757d',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: auth.isAuthenticated ? 'pointer' : 'not-allowed'
          }}
        >
          🧪 Test API Call
        </button>
        
        <button 
          onClick={auth.logout}
          disabled={!auth.isAuthenticated}
          style={{
            padding: '8px 16px',
            backgroundColor: auth.isAuthenticated ? '#dc3545' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: auth.isAuthenticated ? 'pointer' : 'not-allowed'
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  )
}
