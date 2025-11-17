#!/usr/bin/env python3
"""
Simple OAuth flow to create Google Drive token
"""

import os
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials

def main():
    print("=== Google Drive OAuth Setup ===")
    print("This will open a browser window for OAuth authentication")
    print()
    
    # Paths
    credentials_path = 'backend/backend/backend/google_credentials.json'
    token_path = 'backend/backend/backend/google_token.json'
    
    # OAuth settings
    SCOPES = ['https://www.googleapis.com/auth/drive.file']
    
    if not os.path.exists(credentials_path):
        print(f"❌ Credentials file not found: {credentials_path}")
        return False
    
    try:
        # Start OAuth flow
        print("🌐 Opening browser for OAuth authentication...")
        flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
        
        # Use port 8081 to avoid conflicts
        credentials = flow.run_local_server(port=8081)
        
        # Save the token
        with open(token_path, 'w') as token:
            token.write(credentials.to_json())
        
        print(f"✅ Token saved to: {token_path}")
        print("🎉 Google Drive authentication is now ready!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🚀 Now you can run the Google Drive upload test!")
    else:
        print("\n💡 Check your credentials file and try again")
