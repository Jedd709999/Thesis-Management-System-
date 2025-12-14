import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from api.models import (
    User, Group, Thesis, 
    Document, OralDefenseSchedule, 
    Notification, AutoScheduleRun
)
from api.models.group_models import GroupMember
from api.models.document_models import DocumentVersion
from api.models.schedule_models import ApprovalSheet
from api.models.drive_models import DriveCredential, DriveFolder
from api.models.archive_record_models import ArchiveRecord
from api.models.audit_log_models import AuditLog

User = get_user_model()

@pytest.mark.django_db
class TestUserModel:
    """Test User model functionality"""
    
    def test_user_creation(self):
        """Test user creation with all fields"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            role='STUDENT'
        )
        
        assert user.email == 'test@example.com'
        assert user.first_name == 'Test'
        assert user.last_name == 'User'
        assert user.role == 'STUDENT'
        assert user.is_active is True
        assert user.is_staff is False
        assert user.check_password('testpass123') is True
    
    def test_user_uuid_primary_key(self):
        """Test that user has UUID primary key"""
        user = User.objects.create_user(
            email='test2@example.com',
            password='testpass123'
        )
        
        # UUID is stored as UUID object, not string
        import uuid
        assert isinstance(user.id, uuid.UUID)
        assert len(str(user.id)) > 0
    
    def test_user_str_representation(self):
        """Test user string representation"""
        user = User.objects.create_user(
            email='test3@example.com',
            first_name='John',
            last_name='Doe'
        )
        
        assert str(user) == 'test3@example.com (STUDENT)'


@pytest.mark.django_db
class TestGroupModel:
    """Test Group model functionality"""
    
    def test_group_creation(self):
        """Test group creation"""
        adviser = User.objects.create_user(
            email='adviser@test.com',
            password='testpass123',
            role='ADVISER'
        )
        
        group = Group.objects.create(
            name='Test Group',
            adviser=adviser
        )
        
        assert group.name == 'Test Group'
        assert group.adviser == adviser
        assert group.status == 'PENDING'
    
    def test_group_uuid_primary_key(self):
        """Test that group has UUID primary key"""
        adviser = User.objects.create_user(
            email='adviser2@test.com',
            password='testpass123',
            role='ADVISER'
        )
        
        group = Group.objects.create(name='Test Group 2', adviser=adviser)
        
        # UUID is stored as UUID object, not string
        import uuid
        assert isinstance(group.id, uuid.UUID)
        assert len(str(group.id)) > 0


@pytest.mark.django_db
class TestThesisModel:
    """Test Thesis model functionality"""
    
    def test_thesis_creation(self):
        """Test thesis creation"""
        adviser = User.objects.create_user(
            email='adviser3@test.com',
            password='testpass123',
            role='ADVISER'
        )
        
        student = User.objects.create_user(
            email='student@test.com',
            password='testpass123',
            role='STUDENT'
        )
        
        group = Group.objects.create(
            name='Thesis Group',
            adviser=adviser
        )
        group.members.add(student)
        
        thesis = Thesis.objects.create(
            title='Test Thesis',
            abstract='This is a test thesis abstract',
            group=group
        )
        
        assert thesis.title == 'Test Thesis'
        assert thesis.abstract == 'This is a test thesis abstract'
        assert thesis.group == group
        assert thesis.status == 'TOPIC_SUBMITTED'
    
    def test_thesis_status_choices(self):
        """Test thesis status choices"""
        valid_statuses = [
            'TOPIC_SUBMITTED', 'TOPIC_APPROVED', 'TOPIC_REJECTED',
            'CONCEPT_SUBMITTED', 'CONCEPT_SCHEDULED', 'CONCEPT_DEFENDED', 'CONCEPT_APPROVED',
            'PROPOSAL_SUBMITTED', 'PROPOSAL_SCHEDULED', 'PROPOSAL_DEFENDED', 'PROPOSAL_APPROVED',
            'RESEARCH_IN_PROGRESS', 'FINAL_SUBMITTED', 'FINAL_SCHEDULED', 'FINAL_DEFENDED',
            'FINAL_APPROVED', 'REVISIONS_REQUIRED', 'REJECTED', 'ARCHIVED'
        ]
        
        adviser = User.objects.create_user(
            email='adviser4@test.com',
            password='testpass123',
            role='ADVISER'
        )
        
        student = User.objects.create_user(
            email='student2@test.com',
            password='testpass123',
            role='STUDENT'
        )
        
        group = Group.objects.create(
            name='Thesis Group 2',
            adviser=adviser
        )
        group.members.add(student)
        
        thesis = Thesis.objects.create(
            title='Test Thesis 2',
            abstract='This is a test thesis abstract',
            group=group
        )
        
        # Test setting each valid status
        for status in valid_statuses:
            thesis.status = status
            thesis.save()
            thesis.refresh_from_db()
            assert thesis.status == status


@pytest.mark.django_db
class TestDocumentModel:
    """Test Document model functionality"""
    
    def test_document_creation(self):
        """Test document creation"""
        adviser = User.objects.create_user(
            email='adviser5@test.com',
            password='testpass123',
            role='ADVISER'
        )
        
        student = User.objects.create_user(
            email='student3@test.com',
            password='testpass123',
            role='STUDENT'
        )
        
        group = Group.objects.create(
            name='Document Group',
            adviser=adviser
        )
        group.members.add(student)
        
        thesis = Thesis.objects.create(
            title='Document Thesis',
            abstract='This is a test thesis for documents',
            group=group
        )
        
        document = Document.objects.create(
            thesis=thesis,
            uploaded_by=student,
            document_type='other',
            google_doc_id='test',
            is_google_doc=True
        )
        
        assert document.thesis == thesis
        assert document.uploaded_by == student
        assert document.document_type == 'other'
        assert document.google_doc_id == 'test'
        assert document.is_google_doc is True


@pytest.mark.django_db
class TestScheduleModel:
    """Test Schedule model functionality"""
    
    def test_schedule_creation(self):
        """Test schedule creation"""
        adviser = User.objects.create_user(
            email='adviser6@test.com',
            password='testpass123',
            role='ADVISER'
        )
        
        student = User.objects.create_user(
            email='student4@test.com',
            password='testpass123',
            role='STUDENT'
        )
        
        group = Group.objects.create(
            name='Schedule Group',
            adviser=adviser
        )
        group.members.add(student)
        
        thesis = Thesis.objects.create(
            title='Schedule Thesis',
            abstract='This is a test thesis for schedules',
            group=group
        )
        
        start_time = timezone.now() + timezone.timedelta(days=1)
        end_time = start_time + timezone.timedelta(hours=2)
        
        schedule = OralDefenseSchedule.objects.create(
            thesis=thesis,
            title='Test Defense',
            start=start_time,
            end=end_time,
            location='Room 101',
            organizer=adviser
        )
        
        assert schedule.thesis == thesis
        assert schedule.title == 'Test Defense'
        assert schedule.start == start_time
        assert schedule.end == end_time
        assert schedule.location == 'Room 101'
        assert schedule.organizer == adviser
        assert schedule.status == 'scheduled'


@pytest.mark.django_db
class TestNotificationModel:
    """Test Notification model functionality"""
    
    def test_notification_creation(self):
        """Test notification creation"""
        user = User.objects.create_user(
            email='notify@test.com',
            password='testpass123'
        )
        
        notification = Notification.objects.create(
            recipient=user,
            notification_type='thesis_submitted',
            priority='normal',
            title='Test Notification',
            message='This is a test notification'
        )
        
        assert notification.recipient == user
        assert notification.notification_type == 'thesis_submitted'
        assert notification.priority == 'normal'
        assert notification.title == 'Test Notification'
        assert notification.message == 'This is a test notification'
        assert notification.is_read is False


@pytest.mark.django_db
class TestAuditLogModel:
    """Test AuditLog model functionality"""
    
    def test_audit_log_creation(self):
        """Test audit log creation"""
        user = User.objects.create_user(
            email='audit@test.com',
            password='testpass123'
        )
        
        audit_log = AuditLog.objects.create(
            action='create',
            user=user,
            ip_address='127.0.0.1',
            user_agent='Test Agent',
            request_path='/api/test/',
            status_code=200
        )
        
        assert audit_log.action == 'create'
        assert audit_log.user == user
        assert audit_log.ip_address == '127.0.0.1'
        assert audit_log.user_agent == 'Test Agent'
        assert audit_log.request_path == '/api/test/'
        assert audit_log.status_code == 200
