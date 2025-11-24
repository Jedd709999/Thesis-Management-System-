import axios, { AxiosError, InternalAxiosRequestConfig, AxiosHeaders } from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/'

// Create axios instance
const api = axios.create({ 
  baseURL: API_BASE,
  timeout: 10000, // 10 second timeout
})

// Track ongoing refresh requests to prevent multiple refresh attempts
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: AxiosError) => void
}> = []

// Process queued requests after refresh
const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token!)
    }
  })
  
  failedQueue = []
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    
    // Add the auth token to requests
    if (token) {
      if (!config.headers) config.headers = new AxiosHeaders();
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('API Interceptor: Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('API response:', response.config.url, 'Status:', response.status);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Don't retry if it's not a 401 or if it's a login/refresh request
    if (
      error.response?.status !== 401 || 
      originalRequest.url?.includes('auth/login') || 
      originalRequest.url?.includes('auth/refresh')
    ) {
      return Promise.reject(error);
    }

    // If we've already retried, reject
    if (originalRequest._retry) {
      console.log('Already retried with new token, logging out...');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Mark that we're retrying
    originalRequest._retry = true;
    
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Get new access token
      const response = await axios.post(`${API_BASE}auth/refresh/`, {
        refresh: refreshToken
      });

      const { access } = response.data;
      localStorage.setItem('access_token', access);
      
      // Update the authorization header
      if (originalRequest.headers) {
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
      }

      // Retry the original request
      return api(originalRequest);
    } catch (refreshError) {
      console.error('Failed to refresh token:', refreshError);
      // Clear tokens and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
)

export default api