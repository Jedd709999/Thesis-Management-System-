# Google OAuth Setup Guide

This guide will help you set up Google OAuth for the Thesis Management System to enable Google Drive integration.

## Prerequisites

- A Google account
- Access to the Google Cloud Console

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top and select "New Project"
3. Enter a project name (e.g., "Thesis Management System")
4. Click "Create"

### 2. Enable Required APIs

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - Google Drive API
   - Google Docs API

### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (for testing purposes)
3. Fill in the required fields:
   - App name: Thesis Management System
   - User support email: Your email
   - Developer contact information: Your email
4. Click "Save and Continue"
5. On the Scopes page, click "Add or Remove Scopes"
6. Add these scopes:
   - `../auth/drive.file` (See, edit, create, and delete only the specific Google Drive files you use with this app)
   - `../auth/drive` (See, edit, create, and delete all of your Google Drive files)
   - `../auth/documents` (Google Docs API)
7. Click "Update" then "Save and Continue"
8. On the Test users page, add your Google account email
9. Click "Save and Continue"
10. Review the summary and click "Back to Dashboard"

### 4. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Application type: "Web application"
4. Name: "Thesis Management System"
5. Authorized redirect URIs (these must match exactly):
   ```
   http://localhost:5173/oauth-callback.html
   http://localhost:5173
   http://localhost:8000/api/auth/google/callback/
   http://localhost:5174
   ```
6. Authorized JavaScript origins:
   ```
   http://localhost:5173
   http://localhost:5174
   ```
7. Click "Create"
8. Copy the Client ID and Client Secret - you'll need these in the next step

### 5. Configure Your Application

You have two options to configure your application with the credentials:

#### Option A: Environment Variables (Recommended)

Set these environment variables:
```bash
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
```

#### Option B: Update google_credentials.json

Replace the placeholder values in `backend/backend/google_credentials.json` with your actual credentials:
```json
{
  "web": {
    "client_id": "your_actual_client_id_here.apps.googleusercontent.com",
    "project_id": "your-project-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "your_actual_client_secret_here",
    "redirect_uris": [
      "http://localhost:5173/oauth-callback.html",
      "http://localhost:5173",
      "http://localhost:8000/api/auth/google/callback/",
      "http://localhost:5174"
    ],
    "javascript_origins": [
      "http://localhost:5173",
      "http://localhost:5174"
    ]
  }
}
```

### 6. Test the Setup

1. Start your backend server:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. Start your frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to the application in your browser
4. Log in as a user (e.g., student@test.com with password test123)
5. Go to Settings > Connect Google Account
6. Follow the OAuth flow to connect your Google account

### 7. Verify the Connection

After completing the OAuth flow:
1. Check that the user now has valid DriveCredentials in the database
2. Try uploading a document - it should now be uploaded to Google Drive
3. Verify that the document appears in the correct thesis folder in Google Drive

## Troubleshooting

### Common Issues

1. **"invalid_client: The OAuth client was not found"**
   - Make sure you've replaced the placeholder values with your actual client ID and secret
   - Verify that the client ID ends with `.apps.googleusercontent.com`

2. **Redirect URI mismatch**
   - Ensure the redirect URIs in the Google Cloud Console exactly match the ones in your application
   - The URIs are case-sensitive and must include the exact protocol (http vs https)

3. **OAuth consent screen not configured**
   - Make sure you've completed the OAuth consent screen setup
   - Add your test user email to the test users list

### Testing with Test Accounts

For testing purposes, you can add test accounts to your OAuth consent screen:
1. Go to "APIs & Services" > "OAuth consent screen"
2. Click "Test users" tab
3. Click "Add users" and enter your Google account email

## Security Notes

- Never commit your actual client ID and secret to version control
- Use environment variables in production
- The test credentials should only be used for development/testing purposes
- Regularly rotate your credentials for security

## Need Help?

If you encounter issues with the setup:
1. Double-check all the steps above
2. Verify your Google Cloud project settings
3. Check the application logs for error messages
4. Ensure all redirect URIs match exactly