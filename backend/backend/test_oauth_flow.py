#!/usr/bin/env python
"""
Script to simulate the OAuth flow for testing purposes
"""

import os
import sys
import django
import json
from datetime import datetime, timedelta
from django.utils import timezone

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models.user_models import User
from api.models.drive_models import DriveCredential

def simulate_oauth_connection():
    """Simulate a user connecting their Google account through OAuth"""
    
    print("Simulating Google OAuth connection flow...")
    
    # Get a test user
    try:
        user = User.objects.get(email='student@test.com')
        print(f"Found user: {user.email}")
    except User.DoesNotExist:
        print("Test user not found. Creating one...")
        user = User.objects.create_user(
            email='student@test.com',
            password='test123',
            first_name='Test',
            last_name='Student',
            role='STUDENT'
        )
        print(f"Created user: {user.email}")
    
    # Simulate OAuth token response (this would normally come from Google)
    # In a real scenario, this data would come from the Google OAuth flow
    token_data = {
        'access_token': 'ya29.fake-access-token-for-testing',
        'token_type': 'Bearer',
        'expires_in': 3599,
        'scope': 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents',
        'created_at': timezone.now().isoformat()
    }
    
    # These would normally come from the google_credentials.json file or environment variables
    # For testing, we'll use placeholder values - in reality, these need to be real credentials
    client_id = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'
    client_secret = 'YOUR_GOOGLE_CLIENT_SECRET'
    refresh_token = 'fake-refresh-token-for-testing'
    token_uri = 'https://oauth2.googleapis.com/token'
    
    print("\nCreating DriveCredential record...")
    
    # Create or update the DriveCredential
    drive_credential, created = DriveCredential.objects.update_or_create(
        user=user,
        defaults={
            'credential_type': 'user',
            'token': token_data,
            'refresh_token': refresh_token,
            'token_uri': token_uri,
            'client_id': client_id,
            'client_secret': client_secret,
            'scopes': token_data['scope'],
            'expires_at': timezone.now() + timedelta(seconds=token_data['expires_in']),
            'is_active': True
        }
    )
    
    if created:
        print("✓ Created new DriveCredential record")
    else:
        print("✓ Updated existing DriveCredential record")
    
    print(f"User {user.email} now has Google Drive credentials")
    print("Note: These credentials use placeholder values and won't work with real Google APIs")
    print("For actual Google Drive integration, you need real OAuth credentials from Google Cloud Console")
    
    return drive_credential

def check_user_credentials(email='student@test.com'):
    """Check if a user has valid Google Drive credentials"""
    
    print(f"\nChecking Google Drive credentials for {email}...")
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        print(f"User {email} not found")
        return False
    
    if hasattr(user, 'drive_credentials'):
        creds = user.drive_credentials
        print(f"✓ User has DriveCredentials")
        print(f"  Credential type: {creds.credential_type}")
        print(f"  Is active: {creds.is_active}")
        print(f"  Is expired: {creds.is_expired()}")
        print(f"  Has refresh token: {bool(creds.refresh_token)}")
        print(f"  Client ID: {creds.client_id}")
        print(f"  Client Secret: {'*' * len(creds.client_secret) if creds.client_secret else 'None'}")
        
        # Check if credentials are placeholder values
        if 'YOUR_GOOGLE_CLIENT_ID' in creds.client_id:
            print("⚠️  Warning: Credentials contain placeholder values - won't work with real Google APIs")
            return False
        else:
            print("✓ Credentials appear to have real values")
            return True
    else:
        print(f"✗ User {email} does not have DriveCredentials")
        return False

def show_instructions():
    """Show instructions for setting up real Google OAuth"""
    
    print("\n" + "="*60)
    print("INSTRUCTIONS FOR REAL GOOGLE OAUTH SETUP")
    print("="*60)
    print("\nTo set up real Google OAuth credentials:")
    print("1. Follow the instructions in GOOGLE_OAUTH_SETUP.md")
    print("2. Create a Google Cloud Project")
    print("3. Enable Google Drive and Docs APIs")
    print("4. Create OAuth 2.0 credentials")
    print("5. Configure your application with real client ID/secret")
    print("\nThen users can connect their Google accounts through the app UI")

if __name__ == "__main__":
    print("Thesis Management System - OAuth Flow Simulator")
    print("="*50)
    
    if len(sys.argv) > 1:
        if sys.argv[1] == '--simulate':
            simulate_oauth_connection()
            check_user_credentials()
        elif sys.argv[1] == '--check':
            email = sys.argv[2] if len(sys.argv) > 2 else 'student@test.com'
            check_user_credentials(email)
        else:
            print("Usage: python test_oauth_flow.py [--simulate|--check [email]]")
    else:
        print("Available commands:")
        print("  --simulate  : Simulate OAuth connection (creates placeholder credentials)")
        print("  --check     : Check if user has credentials (defaults to student@test.com)")
        print("\nExample:")
        print("  python test_oauth_flow.py --simulate")
        print("  python test_oauth_flow.py --check admin@test.com")
        
    show_instructions()
