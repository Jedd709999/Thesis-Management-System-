# JWT Refresh Token Implementation

This document describes the comprehensive JWT refresh token implementation for the Thesis Management System frontend.

## Overview

The JWT refresh interceptor automatically handles token expiration by refreshing access tokens when they expire, preventing authentication failures during normal user interactions. This implementation includes:

- Automatic token refresh on 401 responses
- Request queuing during token refresh
- Proactive token refresh before expiration
- Comprehensive error handling
- User-friendly authentication state management

## Architecture

### Core Components

1. **API Interceptor (`src/api/api.ts`)**
   - Request interceptor: Adds access token to all API requests
   - Response interceptor: Handles 401 errors and triggers token refresh
   - Request queuing: Prevents multiple simultaneous refresh attempts

2. **Auth Service (`src/api/authService.ts`)**
   - Token management utilities
   - JWT parsing and expiration checking
   - Manual refresh functions
   - User authentication helpers

3. **Auth Context (`src/context/AuthContext.tsx`)**
   - Global authentication state management
   - Proactive token refresh scheduling
   - User session persistence
   - Authentication event handling

4. **Auth Hook (`src/hooks/useAuth.ts`)**
   - Easy access to authentication state
   - Role-based access control helpers
   - Protected route utilities

## Features

### 1. Automatic Token Refresh

The interceptor automatically refreshes tokens when:
- API response returns 401 (Unauthorized)
- Token is expired or will expire soon
- User returns to the application after inactivity

### 2. Request Queuing

During token refresh:
- New API requests are queued
- Requests are automatically retried with new token
- Prevents multiple simultaneous refresh attempts
- Ensures no requests are lost during refresh

### 3. Proactive Refresh

The system proactively refreshes tokens:
- Every minute (checks if token expires within 3 minutes)
- When user returns to browser tab
- Before critical API operations

### 4. Error Handling

Comprehensive error handling for:
- Network failures during refresh
- Invalid refresh tokens
- Server errors
- Malformed tokens

## Implementation Details

### API Interceptor Logic

```typescript
// Response interceptor handles 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Queue concurrent requests during refresh
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
      }
      
      // Perform token refresh
      originalRequest._retry = true
      isRefreshing = true
      
      try {
        const response = await axios.post(`${API_BASE}auth/refresh/`, {
          refresh: refreshToken
        })
        
        // Update token and retry original request
        localStorage.setItem('access_token', response.data.access)
        return api(originalRequest)
      } catch (refreshError) {
        // Clear tokens and redirect to login
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    
    return Promise.reject(error)
  }
)
```

### Token Expiration Checking

```typescript
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    return payload.exp < currentTime
  } catch {
    return true
  }
}

export function willTokenExpireSoon(token: string, minutesThreshold: number = 5): boolean {
  const expiration = getTokenExpiration(token)
  if (!expiration) return true
  
  const thresholdTime = new Date(Date.now() + minutesThreshold * 60 * 1000)
  return expiration <= thresholdTime
}
```

### Proactive Refresh Schedule

```typescript
// Check every minute for tokens expiring within 3 minutes
const refreshInterval = setInterval(() => {
  const currentToken = getAccessToken()
  if (currentToken && willTokenExpireSoon(currentToken, 3)) {
    // Trigger refresh via dummy API call
    api.get('auth/me/').catch(() => {
      // Interceptor handles the refresh
    })
  }
}, 60000)
```

## Usage Examples

### Basic Authentication

```typescript
import { useAuth } from '../hooks/useAuth'

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth()
  
  if (!isAuthenticated) {
    return <div>Please log in</div>
  }
  
  return (
    <div>
      Welcome, {user?.email}!
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Protected Routes

```typescript
import { useRequireAuth } from '../hooks/useAuth'

function ProtectedComponent() {
  const auth = useRequireAuth() // Redirects to login if not authenticated
  
  return <div>Protected content</div>
}
```

### Role-Based Access

```typescript
import { useRequireRole } from '../hooks/useAuth'

function AdminOnlyComponent() {
  const auth = useRequireRole('ADMIN') // Redirects if not admin
  
  return <div>Admin content</div>
}
```

### Manual Token Refresh

```typescript
import { ensureValidToken } from '../api/authService'

async function criticalOperation() {
  try {
    // Ensure token is valid before operation
    await ensureValidToken()
    
    // Perform critical API calls
    const response = await api.post('/critical-endpoint', data)
    return response.data
  } catch (error) {
    console.error('Operation failed:', error)
  }
}
```

## Testing

### Test Components

1. **AuthDebug Component** (`src/components/AuthDebug.tsx`)
   - Displays current authentication state
   - Shows token information and expiration
   - Provides manual refresh controls
   - Tests API calls with automatic refresh

2. **HTML Test Suite** (`test-jwt-refresh.html`)
   - Comprehensive testing interface
   - Simulates expired token scenarios
   - Tests concurrent request handling
   - Logs all API interactions

### Running Tests

1. **Development Testing**
   ```bash
   cd frontend
   npm run dev
   # Navigate to http://localhost:5173
   # Include AuthDebug component in any page
   ```

2. **HTML Test Suite**
   ```bash
   # Open test-jwt-refresh.html in browser
   # Ensure backend is running on http://127.0.0.1:8000
   ```

### Test Scenarios

1. **Normal Login Flow**
   - Login with valid credentials
   - Verify token is stored
   - Check automatic token attachment to requests

2. **Token Expiration**
   - Wait for token to expire
   - Make API call
   - Verify automatic refresh occurs

3. **Concurrent Requests**
   - Make multiple simultaneous API calls with expired token
   - Verify only one refresh occurs
   - Ensure all requests succeed with new token

4. **Refresh Token Failure**
   - Use invalid refresh token
   - Verify redirect to login
   - Check tokens are cleared

## Security Considerations

### Token Storage
- Tokens stored in localStorage (consider httpOnly cookies for production)
- Automatic cleanup on refresh failure
- Secure token transmission via HTTPS

### Refresh Token Rotation
- Consider implementing refresh token rotation
- Invalidate old refresh tokens on use
- Add refresh token expiration

### Session Management
- Automatic logout on refresh failure
- Session timeout handling
- Multiple tab synchronization

## Configuration

### Environment Variables

```bash
# .env file
VITE_API_URL=http://127.0.0.1:8000/api/
```

### Backend Requirements

The frontend expects these JWT endpoints:
- `POST /api/auth/login/` - Login and receive tokens
- `POST /api/auth/refresh/` - Refresh access token
- `GET /api/auth/me/` - Get current user profile
- `POST /api/auth/logout/` - Logout (optional)

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend allows frontend origin
   - Check CORS headers include credentials

2. **Token Not Refreshing**
   - Verify refresh token exists
   - Check refresh endpoint is accessible
   - Review network tab for failed requests

3. **Infinite Refresh Loop**
   - Check refresh token validity
   - Verify refresh endpoint returns new token
   - Review interceptor logic for _retry flag

4. **Multiple Refresh Attempts**
   - Verify isRefreshing flag logic
   - Check request queuing implementation

### Debug Tools

1. **Browser DevTools**
   - Network tab: Monitor API requests and refresh attempts
   - Console: Check for authentication errors
   - Application tab: Verify token storage

2. **AuthDebug Component**
   - Add to any page for real-time auth status
   - Monitor token expiration and refresh events
   - Test manual refresh operations

## Future Enhancements

1. **Refresh Token Rotation**
   - Implement refresh token rotation on each use
   - Add refresh token blacklist

2. **Silent Refresh**
   - Implement silent refresh in background
   - Add refresh token renewal before expiration

3. **Enhanced Error Handling**
   - Add retry logic for network failures
   - Implement exponential backoff

4. **Performance Optimization**
   - Cache user profile data
   - Optimize token refresh timing

## Support

For issues or questions about the JWT refresh implementation:
1. Check the troubleshooting section
2. Review browser console for errors
3. Test with the provided test components
4. Verify backend JWT endpoints are working correctly
