#!/usr/bin/env python
"""
Test script to verify Shared Drive access and permissions
"""

import os
import sys
import django
from pathlib import Path

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.services.google_drive_service import GoogleDriveService
from django.contrib.auth import get_user_model

User = get_user_model()

def test_shared_drive_access():
    """Test Shared Drive access"""
    print("=" * 50)
    print("Testing Shared Drive Access")
    print("=" * 50)
    
    # Check if Shared Drive ID is configured
    shared_drive_id = os.getenv('GOOGLE_SHARED_DRIVE_ID')
    print(f"Shared Drive ID from environment: {shared_drive_id}")
    
    if not shared_drive_id:
        print("❌ No Shared Drive ID configured in environment variables")
        return False
    
    # Try to authenticate with Google Drive
    print("\nAttempting to authenticate with Google Drive...")
    try:
        drive_service = GoogleDriveService()
        if not drive_service.service:
            print("❌ Failed to authenticate with Google Drive")
            return False
        print("✅ Successfully authenticated with Google Drive")
    except Exception as e:
        print(f"❌ Error authenticating with Google Drive: {e}")
        return False
    
    # Try to access the Shared Drive
    print(f"\nAttempting to access Shared Drive: {shared_drive_id}")
    try:
        # Get Shared Drive info
        drive_info = drive_service.service.drives().get(
            driveId=shared_drive_id,
            fields='id,name,kind'
        ).execute()
        
        print(f"✅ Successfully accessed Shared Drive:")
        print(f"  ID: {drive_info.get('id')}")
        print(f"  Name: {drive_info.get('name')}")
        print(f"  Kind: {drive_info.get('kind')}")
        
    except Exception as e:
        print(f"❌ Error accessing Shared Drive: {e}")
        # Try alternative approach - list files in Shared Drive
        try:
            print("\nTrying to list files in Shared Drive...")
            results = drive_service.service.files().list(
                driveId=shared_drive_id,
                corpora='drive',
                supportsAllDrives=True,
                includeItemsFromAllDrives=True,
                pageSize=5,
                fields='files(id,name,mimeType)'
            ).execute()
            
            files = results.get('files', [])
            print(f"✅ Successfully listed {len(files)} files in Shared Drive")
            for file in files:
                print(f"  - {file.get('name')} ({file.get('mimeType')})")
                
        except Exception as e2:
            print(f"❌ Error listing files in Shared Drive: {e2}")
            return False
    
    # Test creating a folder in Shared Drive
    print("\nTesting folder creation in Shared Drive...")
    try:
        folder_metadata = {
            'name': 'Test_Folder_Generated_By_System',
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [shared_drive_id]
        }
        
        folder = drive_service.service.files().create(
            body=folder_metadata,
            supportsAllDrives=True,
            fields='id,name'
        ).execute()
        
        folder_id = folder['id']
        print(f"✅ Successfully created test folder: {folder['name']} (ID: {folder_id})")
        
        # Clean up - delete the test folder
        try:
            drive_service.service.files().delete(
                fileId=folder_id,
                supportsAllDrives=True
            ).execute()
            print("✅ Successfully cleaned up test folder")
        except Exception as e:
            print(f"⚠️  Warning: Could not delete test folder: {e}")
            
    except Exception as e:
        print(f"❌ Error creating folder in Shared Drive: {e}")
        return False
    
    print("\n✅ All Shared Drive tests passed!")
    return True

def test_user_drive_access():
    """Test drive access for a specific user"""
    print("\n" + "=" * 50)
    print("Testing User Drive Access")
    print("=" * 50)
    
    # Try to get a user with drive credentials
    try:
        user_with_creds = User.objects.filter(drive_credentials__isnull=False).first()
        if not user_with_creds:
            print("⚠️  No users found with DriveCredentials")
            return True
            
        print(f"Testing drive access for user: {user_with_creds.email}")
        
        drive_service = GoogleDriveService(user=user_with_creds)
        if not drive_service.service:
            print("❌ Failed to authenticate with user credentials")
            return False
            
        print("✅ Successfully authenticated with user credentials")
        
        # Test listing files with user credentials
        try:
            results = drive_service.service.files().list(
                pageSize=5,
                fields='files(id,name,mimeType)'
            ).execute()
            
            files = results.get('files', [])
            print(f"✅ Successfully listed {len(files)} files with user credentials")
            
        except Exception as e:
            print(f"❌ Error listing files with user credentials: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing user drive access: {e}")
        return False
        
    print("✅ User drive access test passed!")
    return True

if __name__ == "__main__":
    print("Thesis Management System - Shared Drive Access Test")
    
    success1 = test_shared_drive_access()
    success2 = test_user_drive_access()
    
    if success1 and success2:
        print("\n🎉 All tests passed! Google Drive integration is working correctly.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
        sys.exit(1)
