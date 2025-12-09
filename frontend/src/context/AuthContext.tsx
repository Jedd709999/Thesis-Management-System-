import React, { createContext, useEffect, useState, useCallback, useRef } from 'react'
import { fetchProfile, isAuthenticated, clearTokens, getAccessToken, willTokenExpireSoon } from '../api/authService'
import api from '../api/api'
import { User, UserRole } from '../types'
import { driveCredentialsService } from '../services/driveCredentialsService'

type UserOrNull = User | null

interface AuthContextType {
  user: UserOrNull
  setUser: (u: UserOrNull) => void
  loading: boolean
  logout: () => void
  refreshToken: () => Promise<void>
  isTokenValid: () => boolean
  checkAuthStatus: () => Promise<void>
  checkDriveCredentials: () => Promise<void>
}

console.log('AuthContext: Defining AuthContext');
export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  logout: () => {},
  refreshToken: async () => {},
  isTokenValid: () => false,
  checkAuthStatus: async () => {},
  checkDriveCredentials: async () => {}
})
console.log('AuthContext: AuthContext defined');

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  console.log('AuthProvider: Component rendered');
  const [user, setUser] = useState<UserOrNull>(null)
  const [loading, setLoading] = useState(true)
  const [tokenRefreshInterval, setTokenRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const prevUserRef = useRef<UserOrNull>(null)

  // Logout function
  const logout = useCallback(() => {
    console.log('AuthProvider: Logging out');
    clearTokens()
    setUser(null)
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval)
      setTokenRefreshInterval(null)
    }
    // Redirect to login page
    window.location.href = '/login'
  }, [tokenRefreshInterval])

  // Check for tokens and update user if needed
  const checkAuthStatus = useCallback(async () => {
    console.log('AuthContext: Checking auth status');
    const token = getAccessToken();
    console.log('AuthContext: Token found in checkAuthStatus:', !!token);
    console.log('AuthContext: isAuthenticated result:', isAuthenticated());
    
    // Only proceed if we have a token and it's authenticated
    if (token && isAuthenticated()) {
      console.log('AuthContext: Token is valid, checking if we need to fetch profile');
      try {
        // Only fetch profile if we don't have a user or the user data is stale
        if (!user || (user && !user.id)) {
          console.log('AuthContext: Fetching user profile');
          const userProfile = await fetchProfile();
          
          // Only update if the user data has changed
          if (JSON.stringify(user) !== JSON.stringify(userProfile)) {
            console.log('AuthContext: Updating user profile');
            setUser(userProfile);
          } else {
            console.log('AuthContext: User data is up to date');
          }
        } else {
          console.log('AuthContext: Using cached user data');
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Only clear tokens if we get a 401 or similar
        if (error.response?.status === 401) {
          clearTokens();
          setUser(null);
        }
      }
    } else if (user) {
      // If there was a user but no valid token, clear the user
      console.log('AuthContext: No valid token but had user, clearing user');
      setUser(null);
    }
    
    console.log('AuthContext: Finished checking auth status');
  }, [user]);

  // Refresh token and user data
  const refreshToken = useCallback(async () => {
    console.log('AuthContext: Refreshing token and user data');
    try {
      // The api interceptor will handle the actual token refresh
      // We just need to fetch the updated user profile
      console.log('AuthContext: Fetching updated user profile');
      const userProfile = await fetchProfile();
      
      // Only update if the user data has changed
      if (JSON.stringify(user) !== JSON.stringify(userProfile)) {
        console.log('AuthContext: Updating user profile with new data');
        setUser(userProfile);
      } else {
        console.log('AuthContext: User data is already up to date');
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Only logout on authentication errors
      if (error.response?.status === 401) {
        console.log('AuthContext: Authentication error, logging out');
        logout();
      }
    }
  }, [user, logout])

  // Check if current token is valid
  const isTokenValid = useCallback((): boolean => {
    const token = getAccessToken()
    console.log('AuthContext: Checking if current token is valid');
    console.log('AuthContext: Current token:', token);
    if (!token) {
      console.log('AuthContext: No token, returning false');
      return false
    }
    
    // Check if token will expire within the next 2 minutes
    console.log('AuthContext: Checking if token will expire soon');
    console.log('AuthContext: Token will expire soon:', willTokenExpireSoon(token, 2));
    return !willTokenExpireSoon(token, 2)
  }, [])
  
  // Check for Google Drive credentials
  const checkDriveCredentials = useCallback(async () => {
    try {
      console.log('AuthContext: Checking Google Drive credentials');
      const credentials = await driveCredentialsService.getMyCredentials();
      console.log('AuthContext: Drive credentials response:', credentials);
      if (credentials) {
        console.log('AuthContext: User has Google Drive credentials');
        localStorage.setItem('drive_connected', 'true');
      } else {
        console.log('AuthContext: User does not have Google Drive credentials');
        localStorage.setItem('drive_connected', 'false');
      }
    } catch (error) {
      console.log('AuthContext: Error checking Google Drive credentials:', error);
      // If there's an error, assume no credentials
      localStorage.setItem('drive_connected', 'false');
    }
  }, [])

  // Initialize authentication state - runs once on mount
  useEffect(() => {
    let isMounted = true;
    let refreshInterval: NodeJS.Timeout | null = null;

    const initializeAuth = async () => {
      if (!isMounted) return;
      
      console.log('AuthContext: Initializing authentication state');
      const token = getAccessToken();
      console.log('AuthContext: Token found:', !!token);
      console.log('AuthContext: isAuthenticated result:', isAuthenticated());
      
      if (token && isAuthenticated()) {
        try {
          console.log('AuthContext: Token is valid, checking for existing user data');
          
          // Only fetch profile if we don't have a user or the user data is stale
          if (!user || (user && !user.id)) {
            console.log('AuthContext: Fetching user profile');
            try {
              const userProfile = await fetchProfile();
              console.log('AuthContext: User profile fetched:', userProfile);
              console.log('AuthContext: User profile type:', typeof userProfile);
              console.log('AuthContext: User profile is null:', userProfile === null);
              console.log('AuthContext: User profile is undefined:', userProfile === undefined);
              
              if (isMounted) {
                // Only update if the user data has changed
                console.log('AuthContext: Comparing user objects');
                console.log('AuthContext: Current user:', user);
                console.log('AuthContext: Current user stringified:', JSON.stringify(user));
                console.log('AuthContext: Fetched user stringified:', JSON.stringify(userProfile));
                console.log('AuthContext: Objects are different:', JSON.stringify(user) !== JSON.stringify(userProfile));
                
                if (JSON.stringify(user) !== JSON.stringify(userProfile)) {
                  console.log('AuthContext: Setting initial user profile');
                  setUser(userProfile);
                } else {
                  console.log('AuthContext: User profile unchanged, not setting');
                }
                
                // Check for Google Drive credentials
                console.log('AuthContext: Checking Google Drive credentials after login');
                checkDriveCredentials();
                console.log('AuthContext: Google Drive connection status - connected:', localStorage.getItem('drive_connected'), 'reconnected:', localStorage.getItem('drive_reconnected'));
                
                // Set up proactive token refresh
                refreshInterval = setInterval(() => {
                  const currentToken = getAccessToken();
                  if (currentToken && willTokenExpireSoon(currentToken, 3)) {
                    console.log('AuthContext: Token will expire soon, refreshing...');
                    // Make a dummy API call to trigger the refresh interceptor
                    api.get('auth/me/').catch(() => {
                      // The interceptor will handle the refresh, we ignore errors here
                    });
                  }
                }, 60000); // Check every minute
                
                setTokenRefreshInterval(refreshInterval);
              }
            } catch (error) {
              console.error('AuthContext: Error fetching user profile:', error);
              throw error;
            }
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          if (error.response?.status === 401) {
            clearTokens();
            if (isMounted) setUser(null);
          }
        }
      } else {
        console.log('AuthContext: No valid token found');
        if (isMounted) setUser(null);
      }
      
      if (isMounted) {
        console.log('AuthContext: Finished initialization');
        setLoading(false);
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      isMounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Handle visibility change to refresh token when user returns to tab
  useEffect(() => {
    console.log('AuthContext: Setting up visibility change handler');
    const handleVisibilityChange = () => {
      console.log('AuthContext: Visibility change detected');
      console.log('AuthContext: Document hidden:', document.hidden);
      if (!document.hidden && isTokenValid()) {
        console.log('AuthContext: Document is visible and token is valid, refreshing token');
        refreshToken()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      console.log('AuthContext: Cleaning up visibility change handler');
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isTokenValid, refreshToken])

  // Setup global error handler for authentication failures
  useEffect(() => {
    console.log('AuthContext: Setting up global error handler for authentication failures');
    const handleAuthError = (event: CustomEvent) => {
      console.log('AuthContext: Authentication error detected');
      console.log('AuthContext: Error event:', event);
      if (event.detail?.type === 'AUTH_ERROR') {
        console.log('AuthContext: Auth error type detected, logging out');
        logout()
      }
    }

    window.addEventListener('authError', handleAuthError as EventListener)
    
    return () => {
      console.log('AuthContext: Cleaning up global error handler');
      window.removeEventListener('authError', handleAuthError as EventListener)
    }
  }, [])

  // Check auth status when user changes - only run when user changes from null to non-null or vice versa
  useEffect(() => {
    console.log('AuthContext: User changed, checking auth status');
    console.log('AuthContext: New user value:', user);
    console.log('AuthContext: User type:', typeof user);
    
    // Only run this effect when user changes between null and non-null
    const currentUser = user !== null;
    if (currentUser !== (prevUserRef.current !== null)) {
      checkAuthStatus();
    }
    prevUserRef.current = user;
  }, [user]);

  // Log user changes
  useEffect(() => {
    console.log('AuthContext: User state changed:', user);
    console.log('AuthContext: User type:', typeof user);
    console.log('AuthContext: User value:', user);
  }, [user]);

  console.log('AuthProvider: Providing context value', { 
    user, 
    loading, 
    hasUser: !!user,
    hasToken: !!getAccessToken()
  });
  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      loading, 
      logout, 
      refreshToken, 
      isTokenValid,
      checkAuthStatus,
      checkDriveCredentials
    }}>
      {children}
    </AuthContext.Provider>
  )
}