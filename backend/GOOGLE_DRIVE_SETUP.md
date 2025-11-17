# Google Drive Integration Setup

This guide will help you set up Google Drive API integration for file uploads in the Thesis Management System.

## Prerequisites

1. Google Cloud Project with Google Drive API enabled
2. OAuth 2.0 credentials or Service Account credentials  
3. Appropriate permissions for Drive API
4. Django server running on localhost:8000

## Quick Start

For immediate testing, use Option 2 (OAuth 2.0) which is simpler for development.

## Setup Options

### Option 1: Service Account (Recommended for Production)

1. **Create a Service Account**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project or create a new one
   - Navigate to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Give it a name (e.g., "thesis-drive-uploader")
   - Click "Create and Continue"
   - Grant it the "Drive API" role or custom permissions
   - Click "Done"

2. **Create and Download Key**:
   - After creating the service account, click on it
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format
   - Download and save the JSON file

3. **Share Drive Folder**:
   - Create a folder in Google Drive where files will be stored
   - Right-click the folder > Share
   - Add the service account email (found in the JSON file)
   - Give it "Editor" permissions

4. **Configure Django**:
   ```python
   # backend/backend/backend/settings.py
   GOOGLE_SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, 'service-account-key.json')
   ```

### Option 2: OAuth 2.0 (Good for Development)

1. **Create OAuth 2.0 Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Desktop app" or "Web application" (for development)
   - Download the JSON file

2. **Rename and Place Credentials**:
   - Rename the downloaded JSON file to `google_credentials.json`
   - Place it in the `backend/backend/` directory

3. **First-time Authentication**:
   - When you first run the application, it will open a browser window
   - Log in with your Google account
   - Grant the requested permissions
   - A `google_token.json` file will be created and stored

## Configuration

Add the following to your Django `settings.py`:

```python
# Google Drive Settings
GOOGLE_SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, 'service-account-key.json')  # Optional
# If not specified, will use OAuth 2.0 flow with google_credentials.json
```

## Testing the Integration

### Automated Testing

Use the provided test scripts:

1. **Get Authentication Token**:
   ```bash
   python get_auth_token.py
   ```

2. **Create Test Thesis**:
   ```bash
   python create_test_thesis.py
   ```

3. **Run Google Drive Tests**:
   ```bash
   python test_drive_upload.py
   ```

### Manual Testing

1. Start the Django server:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. Go to the Document Manager page
3. Select "Google Drive" as upload type
4. Enter a Thesis ID
5. Upload a file
6. Check your Google Drive folder for the uploaded file

## Features

- **Automatic Folder Creation**: Creates a folder for each thesis
- **Public Sharing**: Files are automatically set to public access
- **Embed URLs**: Generates preview URLs for embedding
- **File Management**: Can delete files from both Drive and database

## Troubleshooting

### Authentication Errors (401 Unauthorized)
- Ensure credentials file is correctly placed
- Check that Google Drive API is enabled in your Google Cloud project
- Verify service account has proper permissions
- For OAuth: Make sure you've completed the first-time authentication flow

### Upload Failures (500 Internal Server Error)
- **"Failed to create Google Drive folder"**: Google Drive credentials not configured
- Check file size limits (Google Drive has limits)
- Ensure internet connection is stable
- Check Django logs for specific error messages

### Common Issues and Solutions

1. **"No Thesis matches the given query"**
   - Run `python create_test_thesis.py` to create a test thesis
   - Or use the admin panel to create a thesis

2. **"Given token not valid for any token type"**
   - Run `python get_auth_token.py` to get a fresh JWT token
   - Update the token in your test script

3. **"list object has no attribute 'get'"**
   - This has been fixed in the latest test script
   - Use `test_drive_upload.py` which handles the response format correctly

## Security Notes

- Service account keys should be kept secure
- Consider using environment variables for credentials path
- Regular file uploads should be monitored for abuse
- Implement additional access controls if needed

## API Scopes Used

- `https://www.googleapis.com/auth/drive.file`: Allows access to files created by the app

## Environment Variables (Optional)

For enhanced security, you can use environment variables:

```python
# settings.py
import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_SERVICE_ACCOUNT_FILE = os.getenv('GOOGLE_SERVICE_ACCOUNT_FILE')
```

Create a `.env` file:
```
GOOGLE_SERVICE_ACCOUNT_FILE=/path/to/your/service-account-key.json
```

## Test Results Status

After running the test scripts, you should see:

- Authentication (JWT)
- Thesis Management (CRUD) 
- Google Doc Linking
- Document Listing
- Google Drive Upload (after credentials setup)

If you see for Google Drive Upload, complete the credential setup above and run the test again.
