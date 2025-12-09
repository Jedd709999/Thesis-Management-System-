#!/usr/bin/env python
"""
Script to help set up Google OAuth for testing
"""

import os
import sys
import json
import django
from pathlib import Path

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models.user_models import User
from api.models.drive_models import DriveCredential

def setup_google_oauth_help():
    """Display instructions for setting up Google OAuth"""
    
    print("=" * 60)
    print("Google OAuth Setup Instructions")
    print("=" * 60)
    
    print("\n1. Create a Google Cloud Project:")
    print("   - Go to https://console.cloud.google.com/")
    print("   - Create a new project or select an existing one")
    
    print("\n2. Enable Required APIs:")
    print("   - In the Google Cloud Console, go to 'APIs & Services' > 'Library'")
    print("   - Enable these APIs:")
    print("     * Google Drive API")
    print("     * Google Docs API")
    
    print("\n3. Create OAuth 2.0 Credentials:")
    print("   - Go to 'APIs & Services' > 'Credentials'")
    print("   - Click 'Create Credentials' > 'OAuth 2.0 Client IDs'")
    print("   - If you haven't configured the OAuth consent screen:")
    print("     * Click 'Configure Consent Screen'")
    print("     * Select 'External' (for testing)")
    print("     * Fill in required fields (App name, support email, developer contact)")
    print("     * Add these scopes:")
    print("       - ../auth/drive.file")
    print("       - ../auth/drive")
    print("       - ../auth/documents")
    print("     * Save the consent screen")
    print("   - Back in Credentials creation:")
    print("     * Application type: 'Web application'")
    print("     * Name: 'Thesis Management System'")
    print("     * Authorized redirect URIs (must match exactly):")
    print("       http://localhost:5173/oauth-callback.html")
    print("       http://localhost:5173")
    print("       http://localhost:8000/api/auth/google/callback/")
    print("       http://localhost:5174")
    print("   - Click 'Create' and download the JSON file")
    
    print("\n4. Configure Your Application:")
    print("   - Replace the placeholder values in 'google_credentials.json' with your actual credentials")
    print("   - Or set these environment variables:")
    print("     GOOGLE_CLIENT_ID=your_actual_client_id")
    print("     GOOGLE_CLIENT_SECRET=your_actual_client_secret")
    
    print("\n5. Test the Setup:")
    print("   - Start your frontend and backend servers")
    print("   - Navigate to the application in your browser")
    print("   - Go to Settings > Connect Google Account")
    print("   - Follow the OAuth flow to connect your Google account")
    
    print("\n" + "=" * 60)

def check_current_setup():
    """Check the current Google OAuth setup"""
    
    print("\nChecking current setup...")
    
    # Check if google_credentials.json exists
    credentials_file = os.path.join(os.path.dirname(__file__), 'google_credentials.json')
    if os.path.exists(credentials_file):
        print("✓ google_credentials.json file exists")
        try:
            with open(credentials_file, 'r') as f:
                credentials = json.load(f)
                client_id = credentials.get('web', {}).get('client_id', 'NOT FOUND')
                if 'YOUR_GOOGLE_CLIENT_ID' in client_id:
                    print("⚠️  google_credentials.json contains placeholder values - needs to be updated with real credentials")
                else:
                    print("✓ google_credentials.json contains what appears to be real credentials")
        except Exception as e:
            print(f"✗ Error reading google_credentials.json: {e}")
    else:
        print("✗ google_credentials.json file does not exist")
    
    # Check environment variables
    client_id_env = os.getenv('GOOGLE_CLIENT_ID', '')
    client_secret_env = os.getenv('GOOGLE_CLIENT_SECRET', '')
    
    if client_id_env and 'YOUR_GOOGLE_CLIENT_ID' not in client_id_env:
        print("✓ GOOGLE_CLIENT_ID environment variable is set")
    elif client_id_env:
        print("⚠️  GOOGLE_CLIENT_ID environment variable contains placeholder value")
    else:
        print("⚠️  GOOGLE_CLIENT_ID environment variable is not set")
        
    if client_secret_env and 'YOUR_GOOGLE_CLIENT_SECRET' not in client_secret_env:
        print("✓ GOOGLE_CLIENT_SECRET environment variable is set")
    elif client_secret_env:
        print("⚠️  GOOGLE_CLIENT_SECRET environment variable contains placeholder value")
    else:
        print("⚠️  GOOGLE_CLIENT_SECRET environment variable is not set")
    
    # Check for users with DriveCredentials
    users_with_creds = User.objects.filter(drive_credentials__isnull=False)
    if users_with_creds.exists():
        print(f"\n✓ Found {users_with_creds.count()} user(s) with DriveCredentials:")
        for user in users_with_creds:
            creds = user.drive_credentials
            print(f"  - {user.email}:")
            print(f"    Credential type: {creds.credential_type}")
            print(f"    Has refresh token: {bool(creds.refresh_token)}")
            print(f"    Has client_id: {bool(creds.client_id)}")
            print(f"    Has client_secret: {bool(creds.client_secret)}")
            if creds.client_id == 'test_client_id':
                print("    ⚠️  This user has test credentials - needs real OAuth flow")
    else:
        print("\n⚠️  No users found with DriveCredentials")

def reset_test_credentials():
    """Reset test credentials to prompt users to connect through OAuth"""
    
    print("\nResetting test credentials...")
    
    users_with_fake_creds = User.objects.filter(
        drive_credentials__client_id='test_client_id'
    )
    
    if users_with_fake_creds.exists():
        for user in users_with_fake_creds:
            print(f"Deleting test credentials for {user.email}")
            user.drive_credentials.delete()
        print("✓ Test credentials have been removed")
        print("Users will need to connect their Google accounts through the OAuth flow")
    else:
        print("No test credentials found to reset")

if __name__ == "__main__":
    print("Thesis Management System - Google OAuth Setup Helper")
    
    if len(sys.argv) > 1:
        if sys.argv[1] == '--check':
            check_current_setup()
        elif sys.argv[1] == '--reset-test':
            reset_test_credentials()
        elif sys.argv[1] == '--instructions':
            setup_google_oauth_help()
        else:
            print("Usage: python setup_google_oauth.py [--check|--reset-test|--instructions]")
    else:
        setup_google_oauth_help()
        check_current_setup()
