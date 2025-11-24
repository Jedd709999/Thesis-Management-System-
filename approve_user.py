#!/usr/bin/env python3
"""
Simple script to approve users from the command line
"""
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models.user_models import User

def approve_user(email):
    """Approve a user by email"""
    try:
        user = User.objects.get(email=email)
        user.is_approved = True
        user.save()
        print(f"✅ Successfully approved user: {email}")
        return True
    except User.DoesNotExist:
        print(f"❌ User with email {email} does not exist")
        return False

def reject_user(email):
    """Reject a user by email"""
    try:
        user = User.objects.get(email=email)
        user.is_approved = False
        user.save()
        print(f"✅ Successfully rejected user: {email}")
        return True
    except User.DoesNotExist:
        print(f"❌ User with email {email} does not exist")
        return False

def list_pending_users():
    """List all users pending approval"""
    pending_users = User.objects.filter(is_approved=False)
    if pending_users.exists():
        print("📋 Users pending approval:")
        for user in pending_users:
            print(f"  - {user.email} ({user.first_name} {user.last_name}) - {user.role}")
    else:
        print("✅ No users pending approval")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python approve_user.py --list                    # List pending users")
        print("  python approve_user.py --approve <email>         # Approve a user")
        print("  python approve_user.py --reject <email>          # Reject a user")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "--list":
        list_pending_users()
    elif command == "--approve" and len(sys.argv) > 2:
        email = sys.argv[2]
        approve_user(email)
    elif command == "--reject" and len(sys.argv) > 2:
        email = sys.argv[2]
        reject_user(email)
    else:
        print("Invalid command or missing email")
        sys.exit(1)