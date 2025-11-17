#!/usr/bin/env python
"""
RBAC Testing Script
Tests role-based access control permissions across all API endpoints
"""
import os
import sys
import json
from pathlib import Path
import django
from datetime import datetime, timedelta

# Setup Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

django.setup()

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from api.models.group_models import Group
from api.models.thesis_models import Thesis
from api.models.schedule_models import DefenseSchedule
from api.models.document_models import Document
from api.models.notification_models import Notification

User = get_user_model()

class RBACTestCase(APITestCase):
    """Test RBAC permissions across all endpoints"""
    
    def setUp(self):
        """Create test users and data"""
        # Call parent setUp to initialize client
        super().setUp()
        
        # Manually create the client
        self.client = APIClient()
        
        # Clean up existing test data
        User.objects.filter(email__in=[
            'admin@test.com', 'adviser@test.com', 'student@test.com', 'panel@test.com'
        ]).delete()
        
        # Also clean up groups with these names
        Group.objects.filter(name='Test Group').delete()
        
        # Create users with different roles
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            first_name='Admin',
            last_name='User',
            role='ADMIN',
            is_staff=True
        )
        
        self.adviser_user = User.objects.create_user(
            email='adviser@test.com',
            first_name='Adviser',
            last_name='User',
            role='ADVISER'
        )
        
        self.student_user = User.objects.create_user(
            email='student@test.com',
            first_name='Student',
            last_name='User',
            role='STUDENT'
        )
        
        self.panel_user = User.objects.create_user(
            email='panel@test.com',
            first_name='Panel',
            last_name='User',
            role='PANEL'
        )
        
        # Create test group
        self.test_group = Group.objects.create(
            name='Test Group',
            adviser=self.adviser_user
        )
        self.test_group.members.add(self.student_user)
        self.test_group.panels.add(self.panel_user)
        
        # Create test thesis
        self.test_thesis = Thesis.objects.create(
            title='Test Thesis',
            abstract='Test Description',
            group=self.test_group,
            proposer=self.student_user
        )
        
        # Create test document
        self.test_document = Document.objects.create(
            file='test.pdf',
            thesis=self.test_thesis,
            uploaded_by=self.student_user
        )
        
        # Create test notification
        self.test_notification = Notification.objects.create(
            user=self.student_user,
            title='Test Notification',
            body='Test notification body'
        )
        
        # Create test schedule
        self.test_schedule = DefenseSchedule.objects.create(
            group=self.test_group,
            start_at=datetime.now(),
            end_at=datetime.now() + timedelta(hours=2),
            location='Test Location',
            created_by=self.adviser_user
        )

class AuthViewsRBACTest(RBACTestCase):
    """Test authentication views RBAC"""
    
    def test_register_view_requires_admin(self):
        """Test that RegisterView requires admin permissions"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        
        # Unauthenticated user should be denied
        response = self.client.post('/api/auth/register/', {
            'email': f'newuser_{timestamp}@test.com',
            'password': 'testpass123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'STUDENT'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Student should be denied
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post('/api/auth/register/', {
            'email': f'newuser2_{timestamp}@test.com',
            'password': 'testpass123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'STUDENT'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Admin should be allowed
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post('/api/auth/register/', {
            'email': f'newuser3_{timestamp}@test.com',
            'password': 'testpass123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'STUDENT'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_profile_view_accessible(self):
        """Test that ProfileView is accessible to authenticated users"""
        # Unauthenticated user should be denied
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Any authenticated user should be allowed
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

class UserViewsRBACTest(RBACTestCase):
    """Test user views RBAC"""
    
    def test_user_viewset_requires_admin(self):
        """Test that UserViewSet requires admin permissions"""
        # Unauthenticated user should be denied
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Student should be denied
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Admin should be allowed
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

class ThesisViewsRBACTest(RBACTestCase):
    """Test thesis views RBAC"""
    
    def test_thesis_list_access(self):
        """Test thesis list access permissions"""
        # Unauthenticated user should be denied
        response = self.client.get('/api/theses/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Student should be allowed (list view)
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/theses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Adviser should be allowed
        self.client.force_authenticate(user=self.adviser_user)
        response = self.client.get('/api/theses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_thesis_detail_object_permissions(self):
        """Test thesis detail object-level permissions"""
        # Student can access their own thesis
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(f'/api/theses/{self.test_thesis.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Adviser can access thesis of their group
        self.client.force_authenticate(user=self.adviser_user)
        response = self.client.get(f'/api/theses/{self.test_thesis.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Panel member should be denied (not adviser or owner)
        self.client.force_authenticate(user=self.panel_user)
        response = self.client.get(f'/api/theses/{self.test_thesis.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_thesis_create_requires_student(self):
        """Test that thesis creation requires student role"""
        # Create a new group for this test to avoid unique constraint
        new_group = Group.objects.create(
            name='New Test Group',
            adviser=self.adviser_user
        )
        new_group.members.add(self.student_user)
        
        # Adviser should be denied
        self.client.force_authenticate(user=self.adviser_user)
        response = self.client.post('/api/theses/', {
            'title': 'New Thesis',
            'abstract': 'Description',
            'group': new_group.id
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Student should be allowed
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post('/api/theses/', {
            'title': 'New Thesis',
            'abstract': 'Description',
            'group': new_group.id
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

class GroupViewsRBACTest(RBACTestCase):
    """Test group views RBAC"""
    
    def test_group_access_permissions(self):
        """Test group access permissions"""
        # Unauthenticated user should be denied
        response = self.client.get('/api/groups/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Student should be denied (requires adviser role)
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/groups/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Adviser should be allowed
        self.client.force_authenticate(user=self.adviser_user)
        response = self.client.get('/api/groups/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_group_object_permissions(self):
        """Test group object-level permissions"""
        # Group member can view their group
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(f'/api/groups/{self.test_group.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Group adviser can view their group
        self.client.force_authenticate(user=self.adviser_user)
        response = self.client.get(f'/api/groups/{self.test_group.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Panel member can view their group
        self.client.force_authenticate(user=self.panel_user)
        response = self.client.get(f'/api/groups/{self.test_group.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

class ScheduleViewsRBACTest(RBACTestCase):
    """Test schedule views RBAC"""
    
    def test_schedule_access_permissions(self):
        """Test schedule access permissions"""
        # Student should be denied (requires adviser/panel role)
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/schedules/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Adviser should be allowed
        self.client.force_authenticate(user=self.adviser_user)
        response = self.client.get('/api/schedules/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Panel member should be allowed
        self.client.force_authenticate(user=self.panel_user)
        response = self.client.get('/api/schedules/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_schedule_object_permissions(self):
        """Test schedule object-level permissions"""
        # Group adviser can manage schedule
        self.client.force_authenticate(user=self.adviser_user)
        response = self.client.get(f'/api/schedules/{self.test_schedule.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Panel member can view schedule
        self.client.force_authenticate(user=self.panel_user)
        response = self.client.get(f'/api/schedules/{self.test_schedule.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Student should be denied (not adviser or panel)
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(f'/api/schedules/{self.test_schedule.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

class DocumentViewsRBACTest(RBACTestCase):
    """Test document views RBAC"""
    
    def test_document_access_permissions(self):
        """Test document access permissions"""
        # Student should be allowed
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/documents/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Adviser should be denied (requires student role)
        self.client.force_authenticate(user=self.adviser_user)
        response = self.client.get('/api/documents/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_document_object_permissions(self):
        """Test document object-level permissions"""
        # Document owner can manage document
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(f'/api/documents/{self.test_document.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Group adviser can view document
        self.client.force_authenticate(user=self.adviser_user)
        response = self.client.get(f'/api/documents/{self.test_document.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Panel member can view document
        self.client.force_authenticate(user=self.panel_user)
        response = self.client.get(f'/api/documents/{self.test_document.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

class NotificationViewsRBACTest(RBACTestCase):
    """Test notification views RBAC"""
    
    def test_notification_access_permissions(self):
        """Test notification access permissions"""
        # Unauthenticated user should be denied
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Authenticated user should be allowed
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_notification_object_permissions(self):
        """Test notification object-level permissions"""
        # User can manage their own notifications
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(f'/api/notifications/{self.test_notification.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Admin can manage any notifications
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'/api/notifications/{self.test_notification.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Other users should not find the notification (404) because it's not in their queryset
        self.client.force_authenticate(user=self.adviser_user)
        response = self.client.get(f'/api/notifications/{self.test_notification.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

def run_rbac_tests():
    """Run all RBAC tests"""
    print("Running RBAC Tests...")
    print("=" * 60)
    
    test_classes = [
        AuthViewsRBACTest,
        UserViewsRBACTest,
        ThesisViewsRBACTest,
        GroupViewsRBACTest,
        ScheduleViewsRBACTest,
        DocumentViewsRBACTest,
        NotificationViewsRBACTest
    ]
    
    total_tests = 0
    passed_tests = 0
    failed_tests = 0
    
    for test_class in test_classes:
        print(f"\nRunning {test_class.__name__}...")
        
        # Create test instance
        test_instance = test_class()
        test_instance.setUp()
        
        # Get all test methods (only callable ones)
        test_methods = [method for method in dir(test_instance) 
                        if method.startswith('test_') and callable(getattr(test_instance, method))]
        
        for test_method in test_methods:
            total_tests += 1
            try:
                # Reset test instance
                test_instance.setUp()
                # Run test method
                getattr(test_instance, test_method)()
                passed_tests += 1
                print(f"  PASS {test_method}")
            except Exception as e:
                failed_tests += 1
                print(f"  FAIL {test_method}: {str(e)}")
    
    print("\n" + "=" * 60)
    print("RBAC TEST RESULTS")
    print("=" * 60)
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {failed_tests}")
    print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
    
    if failed_tests == 0:
        print("\nAll RBAC tests passed! Security is properly implemented.")
    else:
        print(f"\n{failed_tests} tests failed. Review security implementation.")

if __name__ == '__main__':
    run_rbac_tests()
