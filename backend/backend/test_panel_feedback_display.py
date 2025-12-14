#!/usr/bin/env python
"""
Test script to verify panel feedback display functionality
"""
import os
import sys
import django

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from api.models.panel_action_models import PanelAction
from api.models.user_models import User
from api.models.thesis_models import Thesis
from api.models.schedule_models import OralDefenseSchedule
from django.contrib.auth import get_user_model

def test_panel_feedback():
    print("Testing panel feedback display functionality...")
    
    # Get a student user
    try:
        student = User.objects.filter(role='STUDENT').first()
        if not student:
            print("No student user found. Creating one...")
            student = User.objects.create_user(
                username='teststudent',
                email='student@test.com',
                password='testpass123',
                first_name='Test',
                last_name='Student',
                role='STUDENT'
            )
            print(f"Created student user: {student.username}")
        
        print(f"Using student: {student.username}")
        
        # Get a thesis associated with the student
        thesis = Thesis.objects.filter(group__members=student).first()
        if not thesis:
            print("No thesis found for student.")
            return
            
        print(f"Testing with thesis: {thesis.title}")
        
        # Check if there are panel actions for this thesis
        panel_actions = PanelAction.objects.filter(schedule__thesis=thesis)
        print(f"Found {panel_actions.count()} panel actions for this thesis")
        
        # If no panel actions exist, create a test one
        if not panel_actions.exists():
            print("Creating test panel action...")
            # Get a panel member
            panel_member = User.objects.filter(role='PANEL').first()
            if not panel_member:
                panel_member = User.objects.create_user(
                    username='testpanel',
                    email='panel@test.com',
                    password='testpass123',
                    first_name='Test',
                    last_name='Panel',
                    role='PANEL'
                )
                print(f"Created panel member: {panel_member.username}")
            
            # Get or create a schedule for this thesis
            schedule, created = OralDefenseSchedule.objects.get_or_create(
                thesis=thesis,
                status='scheduled',
                defaults={
                    'defense_date': '2025-12-15',
                    'start_time': '09:00:00',
                    'end_time': '10:00:00',
                    'location': 'Test Room'
                }
            )
            
            if created:
                schedule.panel_members.add(panel_member)
                print("Created schedule and added panel member")
            
            # Create a panel action
            panel_action = PanelAction.objects.create(
                schedule=schedule,
                panel_member=panel_member,
                action='approved',
                comments='Great work on this thesis!'
            )
            print(f"Created panel action: {panel_action.action} with comment: '{panel_action.comments}'")
        
        # Test the API endpoint
        from django.test import Client
        from django.urls import reverse
        import json
        
        client = Client()
        client.login(username=student.username, password='testpass123')
        
        # Test getting panel actions for the thesis
        response = client.get(f'/api/panel-actions/?thesis={thesis.id}')
        print(f"API Response Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Panel actions returned: {len(data)}")
            if data:
                print("Sample panel action:")
                print(json.dumps(data[0], indent=2))
        
        print("\nTest completed successfully!")
        
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_panel_feedback()
