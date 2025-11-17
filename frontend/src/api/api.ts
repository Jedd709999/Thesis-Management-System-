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

// Request interceptor to add access token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      if (!config.headers) config.headers = new AxiosHeaders()
      config.headers.set('Authorization', `Bearer ${token}`)
      console.log('Adding auth header to:', config.url)
    } else {
      console.log('No token found for:', config.url)
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('API response:', response.config.url, 'Status:', response.status)
    return response
  }, // Return successful responses as-is
  async (error: AxiosError) => {
    console.error('API error:', error.config?.url, 'Status:', error.response?.status, 'Data:', error.response?.data)
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    
    // Check if this is a 401 error and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          if (originalRequest.headers) {
            if (!originalRequest.headers) originalRequest.headers = new AxiosHeaders()
            originalRequest.headers.set('Authorization', `Bearer ${token}`)
          }
          return api(originalRequest)
        }).catch((err) => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        // Attempt to refresh the token
        const response = await axios.post(`${API_BASE}auth/refresh/`, {
          refresh: refreshToken
        })

        const { access } = response.data
        localStorage.setItem('access_token', access)
        
        // Update the authorization header for the original request
        if (originalRequest.headers) {
          if (!originalRequest.headers) originalRequest.headers = new AxiosHeaders()
          originalRequest.headers.set('Authorization', `Bearer ${access}`)
        }

        // Process any queued requests with the new token
        processQueue(null, access)
        
        // Retry the original request
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        
        // Process queued requests with the error
        processQueue(refreshError as AxiosError, null)
        
        // Redirect to login page
        window.location.href = '/login'
        
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // For other errors, just reject
    return Promise.reject(error)
  }
)

export default api
