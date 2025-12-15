import os
import django
from django.contrib.auth.models import User
from backend.api.utils.notification_utils import create_notification

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Create a test notification
user = User.objects.first()
print("Creating notification for user:", user)
create_notification(user, "test", "Test Notification", "This is a test notification")
print("Notification created successfully")