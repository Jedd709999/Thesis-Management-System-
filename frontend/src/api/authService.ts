import api from './api'
import axios from 'axios'
import { User, UserRole } from '../types'

export type Tokens = { 
  access: string
  refresh: string
}


// Login function
export interface LoginResponse extends Tokens {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    is_email_verified: boolean;
  };
}

export interface ApiError extends Error {
  response?: {
    data?: {
      detail?: string;
      resend_verification?: boolean;
      [key: string]: any;
    };
    status?: number;
  };
}

// Login function
export async function login(email: string, password: string): Promise<LoginResponse> {
  console.log('AuthService: Logging in with email:', email);
  try {
    const res = await api.post('auth/login/', { email, password });
    console.log('AuthService: Login response:', res.data);
    
    // If we have tokens and user data, save tokens and return the response
    console.log('AuthService: Full login response data:', res.data);
    if (res.data.access && res.data.refresh && res.data.user) {
      const tokens: Tokens = {
        access: res.data.access,
        refresh: res.data.refresh
      };
      saveTokens(tokens);
      
      // Check if user has Google Drive credentials
      if (res.data.drive_connected !== undefined) {
        console.log('AuthService: Google Drive connection status - connected:', res.data.drive_connected, 'reconnected:', res.data.drive_reconnected);
        // Store Google Drive connection status in localStorage
        localStorage.setItem('drive_connected', res.data.drive_connected.toString());
        localStorage.setItem('drive_reconnected', res.data.drive_reconnected?.toString() || 'false');
      } else {
        console.log('AuthService: No Google Drive connection information in response');
      }
      
      return res.data as LoginResponse;
    }
    
    throw new Error('Invalid response format from server');
  } catch (error: any) {
    console.error('AuthService: Login error:', error);
    
    // Handle unverified email case
    if (error.response?.status === 403 && error.response?.data?.resend_verification) {
      const customError = new Error(error.response.data.detail || 'Please verify your email before logging in.') as ApiError;
      customError.response = {
        data: {
          ...error.response.data,
          requiresVerification: true
        },
        status: error.response.status
      };
      throw customError;
    }
    
    // Handle other error cases
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    
    // Re-throw the original error if we don't have a specific handler for it
    throw error;
  }
}

// Save tokens to localStorage
export function saveTokens(t: Tokens): void {
  console.log('AuthService: Saving tokens', t);
  try {
    console.log('AuthService: About to set access_token');
    localStorage.setItem('access_token', t.access);
    console.log('AuthService: About to set refresh_token');
    localStorage.setItem('refresh_token', t.refresh);
    console.log('AuthService: Tokens saved to localStorage');
    console.log('AuthService: Access token in localStorage:', localStorage.getItem('access_token'));
    console.log('AuthService: Refresh token in localStorage:', localStorage.getItem('refresh_token'));
    
    // Store debug info in localStorage to survive refresh
    const debugInfo = {
      timestamp: new Date().toISOString(),
      access_token: t.access,
      refresh_token: t.refresh,
      message: 'Tokens saved successfully'
    };
    localStorage.setItem('auth_debug_info', JSON.stringify(debugInfo));
  } catch (error) {
    console.error('AuthService: Error saving tokens to localStorage', error);
    
    // Store error info in localStorage to survive refresh
    const debugInfo = {
      timestamp: new Date().toISOString(),
      error: error.message,
      message: 'Error saving tokens'
    };
    localStorage.setItem('auth_debug_info', JSON.stringify(debugInfo));
  }
}

// Clear tokens from localStorage
export function clearTokens(): void {
  console.log('AuthService: Clearing tokens');
  try {
    console.log('AuthService: Removing access_token');
    localStorage.removeItem('access_token')
    console.log('AuthService: Removing refresh_token');
    localStorage.removeItem('refresh_token')
  } catch (error) {
    console.error('AuthService: Error clearing tokens from localStorage', error);
  }
}

// Get current access token
export function getAccessToken(): string | null {
  try {
    const token = localStorage.getItem('access_token');
    console.log('AuthService: Getting access token from localStorage:', token);
    console.log('AuthService: Token type:', typeof token);
    console.log('AuthService: Token length:', token ? token.length : 0);
    
    // Store debug info in localStorage to survive refresh
    const debugInfo = {
      timestamp: new Date().toISOString(),
      token: token,
      message: 'Token retrieved from localStorage'
    };
    localStorage.setItem('auth_debug_info', JSON.stringify(debugInfo));
    
    return token;
  } catch (error) {
    console.error('AuthService: Error getting access token from localStorage', error);
    
    // Store error info in localStorage to survive refresh
    const debugInfo = {
      timestamp: new Date().toISOString(),
      error: error.message,
      message: 'Error retrieving token'
    };
    localStorage.setItem('auth_debug_info', JSON.stringify(debugInfo));
    
    return null;
  }
}

// Get current refresh token
export function getRefreshToken(): string | null {
  try {
    const token = localStorage.getItem('refresh_token')
    console.log('AuthService: Getting refresh token from localStorage:', token);
    console.log('AuthService: Refresh token type:', typeof token);
    console.log('AuthService: Refresh token length:', token ? token.length : 0);
    console.log('AuthService: Getting refresh token from localStorage:', token);
    return token
  } catch (error) {
    console.error('AuthService: Error getting refresh token from localStorage', error);
    return null
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const token = getAccessToken()
  console.log('AuthService: isAuthenticated check', !!token);
  console.log('AuthService: Token value in isAuthenticated:', token);
  return !!token
}

// Track if we're already refreshing the token
let isRefreshing = false;

// Refresh access token using refresh token
export async function refreshAccessToken(): Promise<string> {
  // If already refreshing, wait for the current refresh to complete
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      const checkRefresh = setInterval(() => {
        if (!isRefreshing) {
          clearInterval(checkRefresh);
          const token = localStorage.getItem('access_token');
          if (token) {
            resolve(token);
          } else {
            reject(new Error('Token refresh failed'));
          }
        }
      }, 100);
    });
  }

  const refreshToken = getRefreshToken();
  console.log('AuthService: Refreshing access token');
  
  if (!refreshToken) {
    console.log('AuthService: No refresh token available');
    throw new Error('No refresh token available');
  }

  isRefreshing = true;
  
  try {
    console.log('AuthService: Making refresh request to:', `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/'}auth/refresh/`);
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/'}auth/refresh/`,
      { refresh: refreshToken }
    );
    
    const { access } = response.data;
    console.log('AuthService: Token refresh successful');
    
    localStorage.setItem('access_token', access);
    return access;
  } catch (error) {
    console.error('AuthService: Error refreshing access token', error);
    // Clear tokens on refresh failure
    clearTokens();
    throw error;
  } finally {
    isRefreshing = false;
  }
}

// Logout function (optional - if backend has logout endpoint)
export async function logout(): Promise<void> {
  console.log('AuthService: Logging out');
  try {
    // Optional: Call backend logout endpoint if available
    await api.post('auth/logout/')
  } catch (error) {
    // Even if logout fails, clear local tokens
    console.warn('Logout endpoint failed, clearing local tokens:', error)
  } finally {
    clearTokens()
  }
}

// Register a new user
export async function register(userData: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<{user: User, detail?: string, email_verification_needed?: boolean}> {
  console.log('AuthService: Registering new user with email:', userData.email);
  try {
    // Use the public registration endpoint
    const res = await api.post('auth/register-public/', userData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('AuthService: Registration successful', res.data);
    return res.data;
  } catch (error: any) {
    console.error('AuthService: Registration error:', error);
    throw error;
  }
}

// Fetch user profile
export async function fetchProfile(): Promise<User> {
  console.log('AuthService: Fetching user profile');
  const res = await api.get('/auth/me/')
  console.log('AuthService: User profile response:', res.data);
  console.log('AuthService: User role:', res.data?.role);
  return res.data as User
}

// Check if token is expired (basic check - you might want to add JWT parsing)
export function isTokenExpired(token: string): boolean {
  try {
    console.log('AuthService: Checking if token is expired:', token);
    // Basic JWT parsing - you might want to use a proper JWT library
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    console.log('AuthService: Token expiration time:', payload.exp);
    console.log('AuthService: Current time:', currentTime);
    console.log('AuthService: Token expired:', payload.exp < currentTime);
    return payload.exp < currentTime
  } catch {
    console.log('AuthService: Error parsing token, assuming it is expired');
    // If we can't parse the token, assume it's expired
    return true
  }
}

// Get token expiration time
export function getTokenExpiration(token: string): Date | null {
  try {
    console.log('AuthService: Getting token expiration time');
    const payload = JSON.parse(atob(token.split('.')[1]))
    console.log('AuthService: Token payload:', payload);
    const expiration = new Date(payload.exp * 1000)
    console.log('AuthService: Token expiration date:', expiration);
    return expiration
  } catch {
    console.log('AuthService: Error getting token expiration time');
    return null
  }
}

// Check if token will expire within the next X minutes
export function willTokenExpireSoon(token: string, minutesThreshold: number = 5): boolean {
  // Add defensive check for token
  if (!token || typeof token !== 'string') {
    console.log('AuthService: Invalid token provided to willTokenExpireSoon');
    return true;
  }
  
  const expiration = getTokenExpiration(token)
  console.log('AuthService: Checking if token will expire soon');
  console.log('AuthService: Token expiration:', expiration);
  console.log('AuthService: Minutes threshold:', minutesThreshold);
  if (!expiration) {
    console.log('AuthService: No expiration time, returning true');
    return true
  }
  
  const thresholdTime = new Date(Date.now() + minutesThreshold * 60 * 1000)
  console.log('AuthService: Threshold time:', thresholdTime);
  console.log('AuthService: Token will expire soon:', expiration <= thresholdTime);
  return expiration <= thresholdTime
}

// Proactive token refresh (call this before making important API calls)
export async function ensureValidToken(): Promise<string> {
  const token = getAccessToken()
  console.log('AuthService: Ensuring valid token');
  console.log('AuthService: Current token:', token);
  
  if (!token) {
    console.log('AuthService: No access token available');
    throw new Error('No access token available')
  }
  
  // If token is expired or will expire soon, refresh it
  console.log('AuthService: Checking if token is expired');
  console.log('AuthService: Token expired:', isTokenExpired(token));
  console.log('AuthService: Checking if token will expire soon');
  console.log('AuthService: Token will expire soon:', willTokenExpireSoon(token));
  if (isTokenExpired(token) || willTokenExpireSoon(token)) {
    console.log('AuthService: Token is expired or will expire soon, refreshing');
    return await refreshAccessToken()
  }
  
  console.log('AuthService: Token is valid');
  return token;
}