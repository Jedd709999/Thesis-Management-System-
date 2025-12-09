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

def check_student3():
    try:
        user = User.objects.get(email='student3@test.com')
        print(f"User: {user.email}")
        print(f"Has drive credentials: {hasattr(user, 'drive_credentials')}")
        
        if hasattr(user, 'drive_credentials'):
            creds = user.drive_credentials
            print(f"Client ID: {creds.client_id}")
            print(f"Is active: {creds.is_active}")
            print(f"Is expired: {creds.is_expired()}")
            print(f"Has refresh token: {bool(creds.refresh_token)}")
            print(f"Token data: {creds.token}")
        else:
            print("No drive credentials found")
            
    except User.DoesNotExist:
        print("User student3@test.com not found")

if __name__ == "__main__":
    check_student3()
