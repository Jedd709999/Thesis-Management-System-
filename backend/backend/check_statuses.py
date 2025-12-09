#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append('/app/backend')

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Setup Django
django.setup()

from api.models.thesis_models import Thesis

def check_statuses():
    print("Available thesis statuses:")
    for choice in Thesis.STATUS_CHOICES:
        print(f"  {choice[0]}: {choice[1]}")
    
    # Check if our new statuses are present
    new_statuses = [
        'CONCEPT_REVISIONS_REQUIRED',
        'PROPOSAL_REVISIONS_REQUIRED', 
        'FINAL_REVISIONS_REQUIRED'
    ]
    
    print("\nChecking for new revision statuses:")
    for status in new_statuses:
        found = any(choice[0] == status for choice in Thesis.STATUS_CHOICES)
        print(f"  {status}: {'Found' if found else 'Not found'}")

if __name__ == '__main__':
    check_statuses()
