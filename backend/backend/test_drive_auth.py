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

def test_drive_auth():
    try:
        user = User.objects.get(email='student3@test.com')
        print(f"Testing Google Drive authentication for user: {user.email}")
        
        # Create Google Drive service instance
        drive_service = GoogleDriveService(user=user)
        
        print(f"Service initialized: {drive_service.service is not None}")
        print(f"Docs service initialized: {drive_service.docs_service is not None}")
        
        if drive_service.service:
            print("Google Drive service is properly authenticated")
            # Try to list files to test the connection
            try:
                results = drive_service.service.files().list(
                    pageSize=5,
                    fields="nextPageToken, files(id, name)"
                ).execute()
                items = results.get('files', [])
                print(f"Successfully connected to Google Drive. Found {len(items)} files.")
                if items:
                    for item in items:
                        print(f"  - {item['name']} ({item['id']})")
            except Exception as e:
                print(f"Error listing files: {e}")
        else:
            print("Google Drive service failed to authenticate")
            
    except User.DoesNotExist:
        print("User student3@test.com not found")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_drive_auth()
