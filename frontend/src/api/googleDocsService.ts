import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('accessToken', access);
          
          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Google Docs API endpoints
export const googleDocsApi = {
  // Get OAuth authorization URL
  getOAuthUrl: () => api.get('/google-docs/oauth-url/'),
  
  // Handle OAuth callback
  handleOAuthCallback: (data: { code: string; state: string }) => 
    api.post('/google-docs/oauth-callback/', data),
  
  // Create new Google Doc
  createDocument: (data: { title: string; content?: string }) => 
    api.post('/google-docs/create/', data),
  
  // Get document content
  getDocumentContent: (documentId: string) => 
    api.get(`/google-docs/${documentId}/content/`),
  
  // Update document
  updateDocument: (documentId: string, requests: any[]) => 
    api.post(`/google-docs/${documentId}/update/`, { requests }),
  
  // Share document
  shareDocument: (documentId: string, data: { email: string; role: string }) => 
    api.post(`/google-docs/${documentId}/share/`, data),
};

// WebSocket connection helper
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  
  constructor(private documentId: number) {}
  
  connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      try {
        // Use dynamic URL construction based on environment
        const baseUrl = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8002/api';
        const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
        const wsHost = baseUrl.replace(/^https?:\/\//, '').replace(/\/api$/, '');
        const wsUrl = `${wsProtocol}://${wsHost}/ws/document/${this.documentId}/`;
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          resolve(this.ws!);
        };
        
        this.ws.onerror = (error) => {
          reject(error);
        };
        
        this.ws.onclose = () => {
          this.handleReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    }
  }
  
  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  onMessage(callback: (data: any) => void) {
    if (this.ws) {
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    }
  }
}

export default api;
