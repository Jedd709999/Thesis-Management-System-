import api from '../api/api';

// Drive credentials API service
export const driveCredentialsService = {
  // Get user's drive credentials
  async getMyCredentials() {
    try {
      console.log('Fetching drive credentials from: /drive-credentials/my_credentials/');
      const response = await api.get('/drive-credentials/my_credentials/');
      console.log('Drive credentials response:', response);
      return response.data;
    } catch (error: any) {
      // Log the error for debugging
      console.info('Drive credentials check result:', error.response?.status, error.response?.data?.detail);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 404) {
          // This is expected when no credentials are found
          console.info('No credentials found for user');
          return null; // No credentials found
        } else {
          // Other server errors
          console.error('Error fetching drive credentials:', error);
          throw new Error(`Server error: ${error.response.status} - ${error.response.statusText}`);
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error('Error fetching drive credentials:', error);
        throw new Error('Network error: No response received from server');
      } else {
        // Something else happened
        console.error('Error fetching drive credentials:', error);
        throw new Error(`Request error: ${error.message}`);
      }
    }
  },
  
  // Connect Google account
  async connectGoogleAccount(authData: any) {
    const response = await api.post('/drive-credentials/connect_google_account/', authData);
    return response.data;
  },
  
  // Disconnect Google account
  async disconnectGoogleAccount() {
    const response = await api.post('/drive-credentials/disconnect_google_account/');
    return response.data;
  }
};