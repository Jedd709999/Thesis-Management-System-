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

def simple_check():
    print("Checking users and their drive credentials...")
    
    users = User.objects.all()
    print(f"Found {users.count()} users")
    
    for user in users:
        print(f"\nUser: {user.email}")
        try:
            creds = user.drive_credentials
            print(f"  Has credentials: Yes")
            print(f"  Client ID: {creds.client_id}")
            print(f"  Is active: {creds.is_active}")
        except DriveCredential.DoesNotExist:
            print(f"  Has credentials: No")

if __name__ == "__main__":
    simple_check()
