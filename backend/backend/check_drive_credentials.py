#!/usr/bin/env python
"""
Script to check Google Drive credentials for users
"""

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models.user_models import User
from api.models.drive_models import DriveCredential

def check_user_credentials():
    """Check Google Drive credentials for all users"""
    
    print("Checking Google Drive credentials for all users...")
    
    users = User.objects.all()
    
    if not users.exists():
        print("No users found in the database")
        return
    
    for user in users:
        print(f"\nUser: {user.email} (Role: {user.role})")
        
        # Check if user has drive credentials
        if hasattr(user, 'drive_credentials'):
            creds = user.drive_credentials
            print(f"  Has DriveCredentials: Yes")
            print(f"  Credential type: {creds.credential_type}")
            print(f"  Is active: {creds.is_active}")
            print(f"  Is expired: {creds.is_expired()}")
            print(f"  Has refresh token: {bool(creds.refresh_token)}")
            print(f"  Client ID: {creds.client_id}")
            print(f"  Client Secret: {'*' * len(creds.client_secret) if creds.client_secret else 'None'}")
            
            # Check if credentials are placeholder values
            if 'YOUR_GOOGLE_CLIENT_ID' in creds.client_id:
                print("  ⚠️  Warning: Credentials contain placeholder values - won't work with real Google APIs")
            elif creds.client_id and creds.client_secret:
                print("  ✓ Credentials appear to have real values")
            else:
                print("  ⚠️  Warning: Missing client ID or secret")
        else:
            print(f"  Has DriveCredentials: No")

if __name__ == "__main__":
    check_user_credentials()
