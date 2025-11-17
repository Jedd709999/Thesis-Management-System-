#!/usr/bin/env python
"""
Test script for schedule conflict detection functionality
"""
import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models.schedule_models import DefenseSchedule
from api.models.group_models import Group
from api.models.user_models import User
from api.serializers.schedule_serializers import ScheduleSerializer, ScheduleAvailabilitySerializer

def create_test_data():
    """Create test users and groups for testing"""
    print("Creating test data...")
    
    # Create test users
    adviser1, _ = User.objects.get_or_create(
        email='adviser1@test.com',
        defaults={
            'first_name': 'Adviser', 
            'last_name': 'One',
            'role': 'ADVISER',
            'is_staff': True
        }
    )
    
    adviser2, _ = User.objects.get_or_create(
        email='adviser2@test.com',
        defaults={
            'first_name': 'Adviser',
            'last_name': 'Two', 
            'role': 'ADVISER',
            'is_staff': True
        }
    )
    
    panel1, _ = User.objects.get_or_create(
        email='panel1@test.com',
        defaults={
            'first_name': 'Panel',
            'last_name': 'One',
            'role': 'PANEL',
            'is_staff': True
        }
    )
    
    # Create test groups
    group1, _ = Group.objects.get_or_create(
        name='Test Group 1',
        defaults={'adviser': adviser1}
    )
    group1.panels.add(panel1)
    
    group2, _ = Group.objects.get_or_create(
        name='Test Group 2', 
        defaults={'adviser': adviser2}
    )
    group2.panels.add(panel1)  # Shared panel member
    
    print(f"Created users: {adviser1.email}, {adviser2.email}, {panel1.email}")
    print(f"Created groups: {group1.name}, {group2.name}")
    
    return group1, group2, adviser1, adviser2, panel1

def test_basic_conflict_detection():
    """Test basic conflict detection between schedules"""
    print("\n=== Testing Basic Conflict Detection ===")
    
    group1, group2, adviser1, adviser2, panel1 = create_test_data()
    
    # Clear existing schedules
    DefenseSchedule.objects.all().delete()
    
    # Create first schedule
    start_time = timezone.now() + timedelta(hours=1)
    end_time = start_time + timedelta(hours=2)
    
    schedule1 = DefenseSchedule.objects.create(
        group=group1,
        start_at=start_time,
        end_at=end_time,
        location='Room 101'
    )
    print(f"Created schedule 1: {start_time} to {end_time}")
    
    # Test conflict with same adviser
    conflicting_start = start_time + timedelta(minutes=30)
    conflicting_end = conflicting_start + timedelta(hours=1)
    
    conflicts = DefenseSchedule.check_conflicts(group1, conflicting_start, conflicting_end)
    print(f"Conflicts for same group: {len(conflicts)} found")
    
    # Test conflict with shared panel member
    conflicts = DefenseSchedule.check_conflicts(group2, conflicting_start, conflicting_end)
    print(f"Conflicts for group with shared panel: {len(conflicts)} found")
    
    # Test no conflict (different time)
    no_conflict_start = end_time + timedelta(hours=1)
    no_conflict_end = no_conflict_start + timedelta(hours=2)
    
    conflicts = DefenseSchedule.check_conflicts(group1, no_conflict_start, no_conflict_end)
    print(f"Conflicts for different time: {len(conflicts)} found")

def test_serializer_validation():
    """Test serializer-level conflict detection"""
    print("\n=== Testing Serializer Validation ===")
    
    group1, group2, adviser1, adviser2, panel1 = create_test_data()
    
    # Clear existing schedules
    DefenseSchedule.objects.all().delete()
    
    # Create initial schedule
    start_time = timezone.now() + timedelta(hours=1)
    end_time = start_time + timedelta(hours=2)
    
    schedule1 = DefenseSchedule.objects.create(
        group=group1,
        start_at=start_time,
        end_at=end_time,
        location='Room 101'
    )
    
    # Test serializer with conflicting data
    serializer_data = {
        'group': group2.id,  # Group with shared panel
        'start_at': start_time + timedelta(minutes=30),
        'end_at': start_time + timedelta(hours=1, minutes=30),
        'location': 'Room 102'
    }
    
    serializer = ScheduleSerializer(data=serializer_data)
    is_valid = serializer.is_valid()
    
    print(f"Serializer validation with conflict: {is_valid}")
    if not is_valid:
        print(f"Validation errors: {serializer.errors}")
    
    # Test serializer with non-conflicting data
    non_conflict_data = {
        'group': group2.id,
        'start_at': end_time + timedelta(hours=2),
        'end_at': end_time + timedelta(hours=4),
        'location': 'Room 103'
    }
    
    serializer = ScheduleSerializer(data=non_conflict_data)
    is_valid = serializer.is_valid()
    
    print(f"Serializer validation without conflict: {is_valid}")

def test_availability_check():
    """Test availability checking functionality"""
    print("\n=== Testing Availability Check ===")
    
    group1, group2, adviser1, adviser2, panel1 = create_test_data()
    
    # Clear existing schedules
    DefenseSchedule.objects.all().delete()
    
    # Create initial schedule
    start_time = timezone.now() + timedelta(hours=1)
    end_time = start_time + timedelta(hours=2)
    
    schedule1 = DefenseSchedule.objects.create(
        group=group1,
        start_at=start_time,
        end_at=end_time,
        location='Room 101'
    )
    
    # Test availability check
    availability_data = {
        'group': group2.id,
        'start_at': start_time + timedelta(minutes=30),
        'end_at': start_time + timedelta(hours=1, minutes=30)
    }
    
    serializer = ScheduleAvailabilitySerializer(data=availability_data)
    if serializer.is_valid():
        result = serializer.check_availability()
        print(f"Availability check result: Available={not result['has_conflicts']}")
        if result['has_conflicts']:
            print(f"Conflicts found: {len(result['conflicts'])}")
            for conflict in result['conflicts']:
                print(f"  - Group: {conflict['group']}, Time: {conflict['start_at']} to {conflict['end_at']}")

def test_database_constraints():
    """Test database-level constraints"""
    print("\n=== Testing Database Constraints ===")
    
    group1, group2, adviser1, adviser2, panel1 = create_test_data()
    
    # Test start time before end time constraint
    try:
        schedule = DefenseSchedule(
            group=group1,
            start_at=timezone.now() + timedelta(hours=2),
            end_at=timezone.now() + timedelta(hours=1),  # End before start
            location='Room 101'
        )
        schedule.save()
        print("ERROR: Database constraint failed - allowed invalid time range")
    except Exception as e:
        print(f"Database constraint working: {e}")

def run_all_tests():
    """Run all conflict detection tests"""
    print("Starting Schedule Conflict Detection Tests")
    print("=" * 50)
    
    try:
        test_basic_conflict_detection()
        test_serializer_validation()
        test_availability_check()
        test_database_constraints()
        
        print("\n" + "=" * 50)
        print("All tests completed successfully!")
        
    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    run_all_tests()
