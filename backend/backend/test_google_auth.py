import os
import sys
import django
from django.conf import settings

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.services.google_drive_service import GoogleDriveService
from api.models.user_models import User

def test_google_auth():
    print("Testing Google Drive authentication...")
    
    # Try to get a user
    try:
        user = User.objects.get(email='student@test.com')
        if user:
            print(f"Found user: {user.email}")
            
            # Check if user has drive credentials
            if hasattr(user, 'drive_credentials'):
                try:
                    creds = user.drive_credentials
                    print(f"User has drive credentials: {creds.is_active}, expired: {creds.is_expired()}")
                    print(f"Credential type: {creds.credential_type}")
                    print(f"Token keys: {list(creds.token.keys()) if creds.token else 'None'}")
                    print(f"Has refresh token: {bool(creds.refresh_token)}")
                    print(f"Has client_id: {bool(creds.client_id)}")
                    print(f"Has client_secret: {bool(creds.client_secret)}")
                except Exception as e:
                    print(f"Error accessing drive credentials: {e}")
            else:
                print("User does not have drive_credentials attribute")
            
            # Try to create GoogleDriveService
            print("\nTrying to create GoogleDriveService...")
            service = GoogleDriveService(user=user)
            print(f"Service created, service object: {service}")
            print(f"Service has service attribute: {hasattr(service, 'service')}")
            if service.service:
                print("Google Drive service is properly initialized")
            else:
                print("Google Drive service is NOT initialized")
        else:
            print("No users found in database")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_google_auth()
