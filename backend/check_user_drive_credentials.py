#!/usr/bin/env python
"""
Script to check if a user has Google Drive credentials
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

def check_user_drive_credentials(email):
    """Check if a user has Google Drive credentials"""
    
    print(f"Checking Google Drive credentials for user: {email}")
    
    try:
        user = User.objects.get(email=email)
        print(f"User found: {user.email} (ID: {user.id})")
    except User.DoesNotExist:
        print(f"User with email {email} not found")
        return
    
    # Check if user has drive credentials
    try:
        if hasattr(user, 'drive_credentials'):
            drive_credential = user.drive_credentials
            print(f"User has drive credentials:")
            print(f"  - Credential ID: {drive_credential.id}")
            print(f"  - Is active: {drive_credential.is_active}")
            print(f"  - Is expired: {drive_credential.is_expired()}")
            print(f"  - Has refresh token: {bool(drive_credential.refresh_token)}")
            print(f"  - Client ID: {drive_credential.client_id[:50]}{'...' if len(drive_credential.client_id) > 50 else ''}")
        else:
            print("User does not have drive credentials attribute")
    except DriveCredential.DoesNotExist:
        print("User does not have drive credentials")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        email = sys.argv[1]
    else:
        email = input("Enter user email: ")
    
    check_user_drive_credentials(email)