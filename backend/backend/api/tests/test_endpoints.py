import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from io import BytesIO

User = get_user_model()

@pytest.mark.django_db
class TestUserEndpoints:
    """Test user-related endpoints"""
    
    def test_user_list_endpoint(self, admin_client):
        """Test listing users (admin only)"""
        response = admin_client.get('/api/users/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_user_detail_endpoint(self, admin_client, student_user):
        """Test retrieving user details"""
        response = admin_client.get(f'/api/users/{student_user.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == student_user.email
    
    def test_user_update_endpoint(self, admin_client, student_user):
        """Test updating user details"""
        data = {'first_name': 'Updated', 'last_name': 'Name'}
        response = admin_client.patch(f'/api/users/{student_user.id}/', data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == 'Updated'


@pytest.mark.django_db
class TestGroupEndpoints:
    """Test group-related endpoints"""
    
    def test_group_list_endpoint(self, authenticated_client):
        """Test listing groups"""
        response = authenticated_client.get('/api/groups/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_group_create_endpoint(self, adviser_client, adviser_user):
        """Test creating a group"""
        student = User.objects.create_user(
            email='studentgroup@test.com',
            password='testpass123',
            role='STUDENT'
        )
        
        data = {
            'name': 'Test Group',
            'members': [student.id]
        }
        response = adviser_client.post('/api/groups/', data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Test Group'
    
    def test_group_detail_endpoint(self, authenticated_client, student_user):
        """Test retrieving group details"""
        # Create a group with the student as member
        adviser = User.objects.create_user(
            email='advisergroup@test.com',
            password='testpass123',
            role='ADVISER'
        )
        
        group = student_user.member_groups.create(
            name='Detail Test Group',
            adviser=adviser
        )
        
        response = authenticated_client.get(f'/api/groups/{group.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Detail Test Group'


@pytest.mark.django_db
class TestThesisEndpoints:
    """Test thesis-related endpoints"""
    
    def test_thesis_list_endpoint(self, authenticated_client):
        """Test listing theses"""
        response = authenticated_client.get('/api/theses/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_thesis_create_endpoint(self, authenticated_client, student_user):
        """Test creating a thesis"""
        # First create a group
        adviser = User.objects.create_user(
            email='adviserthesis@test.com',
            password='testpass123',
            role='ADVISER'
        )
        
        group = student_user.member_groups.create(
            name='Thesis Group',
            adviser=adviser
        )
        
        data = {
            'title': 'Test Thesis',
            'abstract': 'This is a test thesis',
            'group': group.id
        }
        response = authenticated_client.post('/api/theses/', data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'Test Thesis'


@pytest.mark.django_db
class TestDocumentEndpoints:
    """Test document-related endpoints"""
    
    def test_document_list_endpoint(self, authenticated_client):
        """Test listing documents"""
        response = authenticated_client.get('/api/documents/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_document_upload_endpoint(self, authenticated_client, student_user):
        """Test uploading a document"""
        # First create a group and thesis
        adviser = User.objects.create_user(
            email='adviserdoc@test.com',
            password='testpass123',
            role='ADVISER'
        )
        
        group = student_user.member_groups.create(
            name='Document Group',
            adviser=adviser
        )
        
        thesis = group.thesis.create(
            title='Document Thesis',
            abstract='This is a test thesis for documents',
            proposer=student_user
        )
        
        # Create a simple PDF file
        pdf_content = b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000102 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n149\n%%EOF'
        pdf_file = SimpleUploadedFile(
            "test.pdf",
            pdf_content,
            content_type="application/pdf"
        )
        
        data = {
            'thesis': thesis.id,
            'file': pdf_file,
            'provider': 'local'
        }
        response = authenticated_client.post('/api/documents/', data, format='multipart')
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestScheduleEndpoints:
    """Test schedule-related endpoints"""
    
    def test_schedule_list_endpoint(self, authenticated_client):
        """Test listing schedules"""
        response = authenticated_client.get('/api/schedules/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_schedule_create_endpoint(self, adviser_client, adviser_user):
        """Test creating a schedule"""
        # First create a group and thesis
        student = User.objects.create_user(
            email='studentsched@test.com',
            password='testpass123',
            role='STUDENT'
        )
        
        group = Group.objects.create(
            name='Schedule Group',
            adviser=adviser_user
        )
        group.members.add(student)
        
        thesis = Thesis.objects.create(
            title='Schedule Thesis',
            abstract='This is a test thesis for schedules',
            group=group,
            proposer=student
        )
        
        import datetime
        from django.utils import timezone
        start_time = timezone.now() + datetime.timedelta(days=1)
        end_time = start_time + datetime.timedelta(hours=2)
        
        data = {
            'thesis': thesis.id,
            'title': 'Test Defense',
            'start': start_time.isoformat(),
            'end': end_time.isoformat(),
            'location': 'Room 101'
        }
        response = adviser_client.post('/api/schedules/', data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'Test Defense'


@pytest.mark.django_db
class TestNotificationEndpoints:
    """Test notification-related endpoints"""
    
    def test_notification_list_endpoint(self, authenticated_client, student_user):
        """Test listing notifications"""
        # Create a notification for the user
        Notification.objects.create(
            recipient=student_user,
            notification_type='thesis_submitted',
            title='Test Notification',
            message='This is a test notification'
        )
        
        response = authenticated_client.get('/api/notifications/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
    
    def test_notification_mine_endpoint(self, authenticated_client, student_user):
        """Test getting user's notifications"""
        # Create a notification for the user
        Notification.objects.create(
            recipient=student_user,
            notification_type='thesis_submitted',
            title='My Notification',
            message='This is my notification'
        )
        
        response = authenticated_client.get('/api/notifications/mine/')
        assert response.status_code == status.HTTP_200_OK
        assert any(notif['title'] == 'My Notification' for notif in response.data)


@pytest.mark.django_db
class TestApprovalSheetEndpoints:
    """Test approval sheet endpoints"""
    
    def test_approval_sheet_list_endpoint(self, authenticated_client):
        """Test listing approval sheets"""
        response = authenticated_client.get('/api/approval-sheets/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestEvaluationEndpoints:
    """Test evaluation endpoints"""
    
    def test_evaluation_list_endpoint(self, authenticated_client):
        """Test listing evaluations"""
        response = authenticated_client.get('/api/evaluations/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestArchiveEndpoints:
    """Test archive endpoints"""
    
    def test_archive_list_endpoint(self, authenticated_client):
        """Test listing archives"""
        response = authenticated_client.get('/api/archives/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestDriveEndpoints:
    """Test drive endpoints"""
    
    def test_drive_credentials_list_endpoint(self, authenticated_client):
        """Test listing drive credentials"""
        response = authenticated_client.get('/api/drive-credentials/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_drive_folders_list_endpoint(self, authenticated_client):
        """Test listing drive folders"""
        response = authenticated_client.get('/api/drive-folders/')
        assert response.status_code == status.HTTP_200_OK
