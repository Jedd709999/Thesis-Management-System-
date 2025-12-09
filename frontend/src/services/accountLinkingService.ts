import api from '../api/api';
import { googleOAuthService } from './googleOAuthService';

export interface GoogleConnectionStatus {
  connected: boolean;
  email?: string;
  message?: string;
}

export const accountLinkingService = {
  /**
   * Connect Google account to the current user
   * @returns Promise with connection status and user info
   */
  async connectGoogleAccount(): Promise<GoogleConnectionStatus> {
    try {
      // First, get the Google OAuth token using the Google Identity Services client
      const tokenData = await googleOAuthService.signIn();
      
      // Send the token to our backend to link the account
      const response = await api.post<GoogleConnectionStatus>('auth/google/connect/', {
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope,
        token_type: tokenData.token_type,
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
      });
      
      // Update localStorage to reflect the connection status
      if (response.data.connected) {
        localStorage.setItem('drive_connected', 'true');
        localStorage.setItem('drive_reconnected', 'true');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error connecting Google account:', error);
      
      // Provide more specific error messages
      if (error.message && error.message.includes('Invalid Google Client ID')) {
        throw new Error('Google OAuth is not properly configured. Please contact the system administrator.');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || 'Invalid Google credentials. Please try again.';
        throw new Error(`Connection failed: ${errorMessage}`);
      } else if (error.response?.status === 500) {
        throw new Error('Server error while connecting Google account. Please try again later.');
      } else if (error.message) {
        throw new Error(`Connection error: ${error.message}`);
      } else {
        throw new Error('Failed to connect Google account. Please check your internet connection and try again.');
      }
    }
  },

  /**
   * Disconnect Google account from the current user
   * @returns Promise with disconnection status
   */
  async disconnectGoogleAccount(): Promise<GoogleConnectionStatus> {
    try {
      const response = await api.post<GoogleConnectionStatus>('auth/google/disconnect/');
      
      // Update localStorage to reflect the disconnection status
      if (!response.data.connected) {
        localStorage.setItem('drive_connected', 'false');
        localStorage.setItem('drive_reconnected', 'false');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error disconnecting Google account:', error);
      throw new Error(error.response?.data?.error || 'Failed to disconnect Google account');
    }
  },

  /**
   * Check if the current user has a Google account connected
   * @returns Promise with connection status
   */
  async isGoogleConnected(): Promise<boolean> {
    try {
      const response = await api.get<{ connected: boolean }>('auth/google/status/');
      return response.data.connected;
    } catch (error) {
      console.error('Error checking Google account status:', error);
      return false;
    }
  }
};