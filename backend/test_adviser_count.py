import os
import sys
import django
from django.conf import settings

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models.user_models import User
from api.models.group_models import Group
from api.serializers.user_serializers import UserSerializer

# Create test data
def create_test_data():
    # Create an adviser
    adviser = User.objects.create_user(
        email='testadviser@example.com',
        password='testpass123',
        first_name='Test',
        last_name='Adviser',
        role='ADVISER'
    )
    
    # Create some groups and assign them to the adviser
    for i in range(3):
        Group.objects.create(
            name=f'Test Group {i+1}',
            adviser=adviser,
            status='APPROVED'
        )
    
    return adviser

# Test the serializer
def test_serializer():
    adviser = create_test_data()
    
    # Serialize the adviser
    serializer = UserSerializer(adviser)
    data = serializer.data
    
    print("Serialized adviser data:")
    print(data)
    
    # Check if assigned_groups_count is present
    if 'assigned_groups_count' in data:
        print(f"SUCCESS: assigned_groups_count field is present with value: {data['assigned_groups_count']}")
    else:
        print("ERROR: assigned_groups_count field is missing")

if __name__ == '__main__':
    test_serializer()