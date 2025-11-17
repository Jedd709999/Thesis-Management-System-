#!/usr/bin/env python3
"""
Manual OAuth flow to create Google Drive token
"""

import os
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials

# OAuth settings
SCOPES = ['https://www.googleapis.com/auth/drive.file']
CREDENTIALS_PATH = 'backend/google_credentials.json'
TOKEN_PATH = 'backend/google_token.json'

def main():
    print("=== Google Drive OAuth Token Generator ===")
    print(f"Credentials file: {CREDENTIALS_PATH}")
    print(f"Token file will be saved to: {TOKEN_PATH}")
    print()
    
    if not os.path.exists(CREDENTIALS_PATH):
        print(f"❌ Credentials file not found: {CREDENTIALS_PATH}")
        return False
    
    try:
        # Check if token already exists
        if os.path.exists(TOKEN_PATH):
            print("⚠️  Token file already exists.")
            response = input("Do you want to overwrite it? (y/N): ")
            if response.lower() != 'y':
                print("Keeping existing token.")
                return True
        
        # Start OAuth flow
        print("🌐 Starting OAuth flow - this will open a browser window...")
        flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
        
        # Run local server for OAuth callback
        credentials = flow.run_local_server(port=0)
        
        # Save the credentials
        with open(TOKEN_PATH, 'w') as token:
            token.write(credentials.to_json())
        
        print(f"✅ Token saved successfully to: {TOKEN_PATH}")
        print("🎉 Google Drive authentication is now ready!")
        return True
        
    except Exception as e:
        print(f"❌ Error during OAuth flow: {e}")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🚀 You can now run the Google Drive upload test!")
    else:
        print("\n💡 Please check your credentials file and try again.")
