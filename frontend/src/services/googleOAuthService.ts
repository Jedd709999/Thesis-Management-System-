// Google OAuth service for connecting user Google accounts
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_SCOPE = 'openid profile email https://www.googleapis.com/auth/drive.file';

interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
  // Add other user profile fields as needed
}

interface GoogleAuthError extends Error {
  type?: string;
  error?: string;
  details?: string;
}

class GoogleOAuthService {
  private clientId: string;
  private scope: string;
  private google: any;
  
  constructor() {
    this.clientId = GOOGLE_CLIENT_ID;
    this.scope = GOOGLE_SCOPE;
  }
  
  // Load Google Identity Services library
  /**
   * Loads the Google Identity Services client library
   * @throws {GoogleAuthError} If the client fails to load
   */
  async loadGoogleClient(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (typeof window === 'undefined') {
        reject(new Error('window is not available. This must run in a browser environment.'));
        return;
      }

      if ((window as any).google?.accounts) {
        console.log('[GoogleOAuth] Google Identity Services already loaded');
        this.google = (window as any).google;
        resolve();
        return;
      }
      
      // Create script element with error handling
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onerror = () => {
        const error = new Error('Failed to load Google Identity Services') as GoogleAuthError;
        error.type = 'load_error';
        reject(error);
      };
      
      script.onload = () => {
        if (!(window as any).google?.accounts) {
          const error = new Error('Google Identity Services loaded but not properly initialized') as GoogleAuthError;
          error.type = 'initialization_error';
          reject(error);
          return;
        }
        console.log('[GoogleOAuth] Google Identity Services loaded successfully');
        this.google = (window as any).google;
        resolve();
      };
      
      document.head.appendChild(script);
    });
  }
  
  // Sign in with Google using the Google Identity Services
  async signIn(): Promise<{ access_token: string; expires_in: number; scope: string; token_type: string }> {
    try {
      await this.loadGoogleClient();
      
      // Validate client ID
      if (!this.clientId || this.clientId === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
        throw new Error('Invalid Google Client ID. Please check your environment configuration.');
      }

      return new Promise((resolve, reject) => {
        try {
          const client = this.google.accounts.oauth2.initTokenClient({
            client_id: this.clientId,
            scope: this.scope,
            callback: (tokenResponse: any) => {
              if (tokenResponse && tokenResponse.access_token) {
                resolve({
                  access_token: tokenResponse.access_token,
                  expires_in: tokenResponse.expires_in,
                  scope: tokenResponse.scope,
                  token_type: tokenResponse.token_type,
                });
              } else {
                reject(new Error('Failed to get access token from Google.'));
              }
            },
            error: (error: any) => {
              console.error('Google OAuth error:', error);
              // Provide more specific error messages
              if (error.error === 'popup_closed_by_user') {
                reject(new Error('Authentication popup was closed. Please try again and complete the authentication process.'));
              } else if (error.error === 'access_denied') {
                reject(new Error('Access denied. Please grant the necessary permissions to connect your Google account.'));
              } else if (error.error === 'redirect_uri_mismatch') {
                reject(new Error('Redirect URI mismatch. Please contact the system administrator to configure the correct redirect URI in the Google Cloud Console.'));
              } else {
                reject(new Error(error.message || 'Failed to authenticate with Google.'));
              }
            }
          });

          // Request the access token
          client.requestAccessToken();
        } catch (error) {
          console.error('Error initializing Google OAuth client:', error);
          reject(new Error('Failed to initialize Google OAuth client'));
        }
      });
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    }
  }
  
  // Sign out - revoke the token and clean up
  async signOut(accessToken: string): Promise<void> {
    try {
      await this.loadGoogleClient();
      
      // Revoke the access token
      if (accessToken) {
        await fetch('https://oauth2.googleapis.com/revoke?token=' + accessToken, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
      }
      
      // Clear any stored tokens
      if (this.google && this.google.accounts) {
        this.google.accounts.oauth2.revoke();
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Google Sign Out Error:', error);
      // Don't throw error on sign out, just log it
      return Promise.resolve();
    }
  }
}

// Export singleton instance
export const googleOAuthService = new GoogleOAuthService();