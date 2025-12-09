#!/usr/bin/env python
"""
Script to test the Google Drive service for a user
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
from api.services.google_drive_service import GoogleDriveService

def test_google_drive_service(email):
    """Test the Google Drive service for a user"""
    
    print(f"Testing Google Drive service for user: {email}")
    
    try:
        user = User.objects.get(email=email)
        print(f"User found: {user.email} (ID: {user.id})")
    except User.DoesNotExist:
        print(f"User with email {email} not found")
        return
    
    # Test Google Drive service
    try:
        print("Creating GoogleDriveService instance...")
        drive_service = GoogleDriveService(user=user)
        
        print(f"GoogleDriveService created successfully")
        print(f"Drive service has service: {bool(drive_service.service)}")
        print(f"Drive service has docs_service: {bool(drive_service.docs_service)}")
        
        if drive_service.service:
            print("Google Drive service is working!")
        else:
            print("Google Drive service failed to initialize")
            
    except Exception as e:
        print(f"Error creating GoogleDriveService: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        email = sys.argv[1]
    else:
        email = input("Enter user email: ")
    
    test_google_drive_service(email)