import os
import sys
import django
from django.conf import settings

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models.user_models import User

def create_test_users():
    # Create test users
    test_users = [
        {
            'email': 'admin@test.com',
            'password': 'admin123',
            'role': 'ADMIN',
            'first_name': 'Admin',
            'last_name': 'User'
        },
        {
            'email': 'adviser@test.com',
            'password': 'adviser123',
            'role': 'ADVISER',
            'first_name': 'Adviser',
            'last_name': 'User'
        },
        {
            'email': 'student@test.com',
            'password': 'student123',
            'role': 'STUDENT',
            'first_name': 'Student',
            'last_name': 'User'
        },
        {
            'email': 'panel@test.com',
            'password': 'panel123',
            'role': 'PANEL',
            'first_name': 'Panel',
            'last_name': 'User'
        }
    ]
    
    for user_data in test_users:
        email = user_data['email']
        if not User.objects.filter(email=email).exists():
            user = User.objects.create_user(**user_data)
            if user_data['role'] == 'ADMIN':
                user.is_staff = True
                user.is_superuser = True
                user.save()
            print(f"Created {user_data['role'].lower()} user: {email}")
        else:
            print(f"User {email} already exists")

if __name__ == '__main__':
    create_test_users()