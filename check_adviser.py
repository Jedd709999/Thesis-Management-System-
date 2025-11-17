#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models.thesis_models import Thesis
from api.models.group_models import Group
from api.serializers.thesis_serializers import ThesisSerializer

def check_adviser_data():
    print("=== Checking Thesis and Group Adviser Data ===")
    
    # Check all theses
    theses = Thesis.objects.all()
    print(f"Total theses: {theses.count()}")
    
    for thesis in theses:
        print(f"\n--- Thesis: {thesis.title} ---")
        print(f"Thesis ID: {thesis.id}")
        print(f"Group: {thesis.group}")
        
        if thesis.group:
            print(f"Group ID: {thesis.group.id}")
            print(f"Group Name: {thesis.group.name}")
            print(f"Group Adviser: {thesis.group.adviser}")
            
            if thesis.group.adviser:
                adviser = thesis.group.adviser
                print(f"Adviser ID: {adviser.id}")
                print(f"Adviser Email: {adviser.email}")
                print(f"Adviser First Name: {adviser.first_name}")
                print(f"Adviser Last Name: {adviser.last_name}")
                
                # Test serializer
                serializer = ThesisSerializer(thesis)
                serialized_adviser = serializer.data.get('adviser')
                print(f"Serialized Adviser: {serialized_adviser}")
            else:
                print("No adviser assigned to this group")
        else:
            print("No group assigned to this thesis")
    
    # Check all groups
    print("\n\n=== Checking All Groups ===")
    groups = Group.objects.all()
    print(f"Total groups: {groups.count()}")
    
    for group in groups:
        print(f"\n--- Group: {group.name} ---")
        print(f"Group ID: {group.id}")
        print(f"Adviser: {group.adviser}")
        
        if group.adviser:
            adviser = group.adviser
            print(f"Adviser: {adviser.first_name} {adviser.last_name} ({adviser.email})")
        else:
            print("No adviser assigned")

if __name__ == "__main__":
    check_adviser_data()
