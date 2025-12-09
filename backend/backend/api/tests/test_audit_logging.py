import json
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from api.models.audit_log_models import AuditLog
from api.models.group_models import Group
from api.models.user_models import User

User = get_user_model()

class AuditLoggingTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_group_creates_audit_log(self):
        """Test that creating a group creates an audit log entry."""
        url = reverse('group-list')
        data = {
            'name': 'Test Group',
            'description': 'Test Description'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that an audit log entry was created
        audit_logs = AuditLog.objects.filter(action='create')
        self.assertEqual(audit_logs.count(), 1)
        
        audit_log = audit_logs.first()
        self.assertEqual(audit_log.user, self.user)
        self.assertEqual(audit_log.content_object.name, 'Test Group')
        self.assertIsNotNone(audit_log.new_values)
        self.assertIsNone(audit_log.old_values)

    def test_update_group_creates_audit_log(self):
        """Test that updating a group creates an audit log entry."""
        group = Group.objects.create(
            name='Original Group',
            description='Original Description'
        )
        
        url = reverse('group-detail', kwargs={'pk': group.pk})
        data = {
            'name': 'Updated Group',
            'description': 'Updated Description'
        }
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that an audit log entry was created
        audit_logs = AuditLog.objects.filter(action='update')
        self.assertEqual(audit_logs.count(), 1)
        
        audit_log = audit_logs.first()
        self.assertEqual(audit_log.user, self.user)
        self.assertEqual(audit_log.content_object, group)
        self.assertIsNotNone(audit_log.new_values)
        self.assertIsNotNone(audit_log.old_values)
        
        # Check that old and new values are different
        self.assertNotEqual(audit_log.old_values['name'], audit_log.new_values['name'])

    def test_delete_group_creates_audit_log(self):
        """Test that deleting a group creates an audit log entry."""
        group = Group.objects.create(
            name='Group to Delete',
            description='Description'
        )
        
        url = reverse('group-detail', kwargs={'pk': group.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check that an audit log entry was created
        audit_logs = AuditLog.objects.filter(action='delete')
        self.assertEqual(audit_logs.count(), 1)
        
        audit_log = audit_logs.first()
        self.assertEqual(audit_log.user, self.user)
        self.assertIsNotNone(audit_log.old_values)
        self.assertIsNone(audit_log.new_values)
