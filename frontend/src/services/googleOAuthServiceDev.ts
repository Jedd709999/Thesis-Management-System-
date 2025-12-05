// Google OAuth service for connecting user Google accounts (Development version with reduced scopes)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

class GoogleOAuthService {
  private clientId: string;
  private scope: string;
  private google: any;
  
  constructor() {
    this.clientId = GOOGLE_CLIENT_ID;
    this.scope = GOOGLE_SCOPE;
  }
  
  // Load Google Identity Services library
  loadGoogleClient(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (typeof window !== 'undefined' && (window as any).google && (window as any).google.accounts) {
        console.log('Google Identity Services already loaded');
        this.google = (window as any).google;
        resolve();
        return;
      }
      
      // Create script element
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        console.log('Google Identity Services loaded successfully');
        this.google = (window as any).google;
        resolve();
      };
      script.onerror = (error) => {
        console.error('Failed to load Google Identity Services client:', error);
        reject(new Error('Failed to load Google Identity Services client'));
      };
      
      document.head.appendChild(script);
    });
  }
  
  // Sign in with Google using the traditional OAuth flow
  async signIn(): Promise<any> {
    try {
      console.log('Attempting to sign in with Google');
      await this.loadGoogleClient();
      
      // Validate client ID
      if (!this.clientId || this.clientId === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
        throw new Error('Invalid Google Client ID. Please check your environment configuration.');
      }
      
      console.log('Client ID:', this.clientId);
      console.log('Scope:', this.scope);
      
      // Build the OAuth URL
      const redirectUri = window.location.origin + '/oauth-callback.html';
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      
      authUrl.searchParams.append('client_id', this.clientId);
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('scope', this.scope);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('prompt', 'select_account consent');
      authUrl.searchParams.append('access_type', 'offline');
      
      console.log('OAuth URL:', authUrl.toString());
      
      // Open popup window
      const popup = window.open(
        authUrl.toString(),
        'google_oauth',
        'width=500,height=600,menubar=no,location=no,resizable=no,scrollbars=no,status=no'
      );
      
      if (!popup) {
        throw new Error('Failed to open Google OAuth popup. Please check your popup blocker settings.');
      }
      
      // Wait for the popup to close and get the result
      return new Promise((resolve, reject) => {
        // Use message passing instead of direct popup access
        const messageHandler = (event: MessageEvent) => {
          // Check if the message is from our OAuth redirect
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'google-oauth-callback') {
            window.removeEventListener('message', messageHandler);
            popup.close();
            
            if (event.data.error) {
              reject(new Error(`Google OAuth error: ${event.data.error}`));
            } else if (event.data.code) {
              resolve({
                code: event.data.code
              });
            } else {
              reject(new Error('Failed to get authorization code from Google OAuth response.'));
            }
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Also check if popup is closed periodically, but handle errors gracefully
        const interval = setInterval(() => {
          try {
            // Try to check if popup is closed, but don't throw error if we can't
            if (popup.closed) {
              clearInterval(interval);
              window.removeEventListener('message', messageHandler);
              reject(new Error('Google sign-in popup was closed. Please try again and complete the authentication process.'));
              return;
            }
          } catch (e) {
            // Ignore Cross-Origin-Opener-Policy errors
            // In this case, we rely on the timeout or message passing
          }
        }, 1000);
        
        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(interval);
          window.removeEventListener('message', messageHandler);
          try {
            if (!popup.closed) {
              popup.close();
            }
          } catch (e) {
            // Ignore Cross-Origin-Opener-Policy errors
          }
          reject(new Error('Google OAuth timeout. Please try again.'));
        }, 300000);
      });
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    }
  }
  
  // Sign out (this is handled by Google Identity Services automatically)
  async signOut(): Promise<void> {
    try {
      await this.loadGoogleClient();
      // Google Identity Services handles token revocation automatically
      // We just need to clean up any local state
      return Promise.resolve();
    } catch (error) {
      console.error('Google Sign Out Error:', error);
      // Don't throw error on sign out, just log it
      return Promise.resolve();
    }
  }
}

// Export singleton instance
export const googleOAuthServiceDev = new GoogleOAuthService();