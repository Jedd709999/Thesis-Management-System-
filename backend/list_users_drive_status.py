#!/usr/bin/env python
"""
Script to list all users and their Google Drive credential status
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

def list_users_drive_status():
    """List all users and their Google Drive credential status"""
    
    print("Listing all users and their Google Drive credential status:")
    print("=" * 60)
    
    users = User.objects.all().order_by('email')
    
    if not users.exists():
        print("No users found in the database")
        return
    
    for user in users:
        print(f"\nUser: {user.email} (ID: {user.id})")
        print(f"  Role: {user.role}")
        print(f"  Is active: {user.is_active}")
        print(f"  Is email verified: {user.is_email_verified}")
        
        # Check if user has drive credentials
        try:
            if hasattr(user, 'drive_credentials'):
                drive_credential = user.drive_credentials
                print(f"  Has drive credentials: Yes")
                print(f"    - Credential ID: {drive_credential.id}")
                print(f"    - Is active: {drive_credential.is_active}")
                print(f"    - Is expired: {drive_credential.is_expired()}")
                print(f"    - Has refresh token: {bool(drive_credential.refresh_token)}")
                print(f"    - Client ID: {drive_credential.client_id[:30]}{'...' if len(drive_credential.client_id) > 30 else ''}")
            else:
                print(f"  Has drive credentials: No (no attribute)")
        except DriveCredential.DoesNotExist:
            print(f"  Has drive credentials: No (DoesNotExist)")

if __name__ == "__main__":
    list_users_drive_status()