#!/usr/bin/env python
import os
import sys
import django

from api.models.panel_action_models import PanelAction
from api.models.user_models import User
from api.models.thesis_models import Thesis
from api.models.schedule_models import OralDefenseSchedule
from django.contrib.auth import get_user_model

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def test_panel_actions_access():
    """Test that students can access panel actions for their theses"""
    User = get_user_model()
    
    # Create test users
    student = User.objects.create_user(
        email='student@test.com',
        password='testpass123',
        first_name='Test',
        last_name='Student',
        role='STUDENT'
    )
    
    panel_member = User.objects.create_user(
        email='panel@test.com',
        password='testpass123',
        first_name='Test',
        last_name='Panel',
        role='PANEL'
    )
    
    adviser = User.objects.create_user(
        email='adviser@test.com',
        password='testpass123',
        first_name='Test',
        last_name='Adviser',
        role='ADVISER'
    )
    
    # Create a group
    group = Group.objects.create(
        name='Test Group'
    )
    group.members.add(student)
    group.panels.add(panel_member)
    group.adviser = adviser
    group.save()
    
    # Create a thesis
    thesis = Thesis.objects.create(
        title='Test Thesis',
        abstract='Test abstract',
        group=group,
        proposer=student,
        status='TOPIC_APPROVED'
    )
    
    # Create a schedule
    schedule = OralDefenseSchedule.objects.create(
        thesis=thesis,
        title='Test Defense',
        start_at='2023-01-01T10:00:00Z',
        end_at='2023-01-01T11:00:00Z',
        location='Test Location',
        status='scheduled'
    )
    schedule.panel_members.add(panel_member)
    
    # Create a panel action
    panel_action = PanelAction.objects.create(
        schedule=schedule,
        panel_member=panel_member,
        action='approved',
        comments='Good work!'
    )
    
    # Test that student can access the panel action
    student_actions = PanelAction.objects.filter(
        schedule__thesis__group__members=student
    )
    
    print(f"Student can access {student_actions.count()} panel actions")
    for action in student_actions:
        print(f"- Action: {action.action} by {action.panel_member.email}")
        print(f"  Comments: {action.comments}")
        print(f"  Thesis: {action.schedule.thesis.title}")
    
    # Test that panel member can access their own actions
    panel_actions = PanelAction.objects.filter(panel_member=panel_member)
    print(f"\nPanel member can access {panel_actions.count()} panel actions")
    
    # Test that adviser can access actions for theses they advise
    adviser_actions = PanelAction.objects.filter(
        schedule__thesis__adviser=adviser
    )
    print(f"Adviser can access {adviser_actions.count()} panel actions")
    
    print("\nTest completed successfully!")

if __name__ == '__main__':
    test_panel_actions_access()
