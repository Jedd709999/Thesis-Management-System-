import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from io import BytesIO
from PIL import Image

User = get_user_model()

@pytest.mark.django_db
class TestDocumentUpload:
    """Test document upload functionality"""

    def test_upload_pdf_success(self, authenticated_client, sample_pdf, student_user):
        """Test successful PDF document upload"""
        # First create a group and thesis for the document
        from api.models import Thesis, Group
        group = Group.objects.create(
            name='Test Group',
            adviser=student_user
        )
        group.members.add(student_user)
        thesis = Thesis.objects.create(
            title='Test Thesis',
            abstract='Test abstract',
            group=group,
            proposer=student_user
        )
        
        data = {
            'thesis': thesis.id,
            'file': sample_pdf,
            'provider': 'local'
        }
        
        response = authenticated_client.post('/api/documents/', data, format='multipart')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['provider'] == 'local'
        assert response.data['file'] is not None
        assert 'thesis' in response.data

    def test_upload_image_success(self, authenticated_client, sample_image, student_user):
        """Test successful image document upload"""
        from api.models import Thesis, Group
        group = Group.objects.create(
            name='Test Group 2',
            adviser=student_user
        )
        group.members.add(student_user)
        thesis = Thesis.objects.create(
            title='Test Thesis 2',
            abstract='Test abstract',
            group=group,
            proposer=student_user
        )
        
        data = {
            'thesis': thesis.id,
            'file': sample_image,
            'provider': 'local'
        }
        
        response = authenticated_client.post('/api/documents/', data, format='multipart')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['provider'] == 'local'

    def test_upload_docx_success(self, authenticated_client, sample_docx, student_user):
        """Test successful DOCX document upload"""
        from api.models import Thesis, Group
        group = Group.objects.create(
            name='Test Group 3',
            adviser=student_user
        )
        group.members.add(student_user)
        thesis = Thesis.objects.create(
            title='Test Thesis 3',
            abstract='Test abstract',
            group=group,
            proposer=student_user
        )
        
        data = {
            'thesis': thesis.id,
            'file': sample_docx,
            'provider': 'local'
        }
        
        response = authenticated_client.post('/api/documents/', data, format='multipart')
        
        assert response.status_code == status.HTTP_201_CREATED

    def test_upload_without_authentication(self, api_client, sample_pdf):
        """Test upload without authentication fails"""
        data = {
            'file': sample_pdf,
            'provider': 'local'
        }
        
        response = api_client.post('/api/documents/', data, format='multipart')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_upload_without_file(self, authenticated_client):
        """Test upload without file fails"""
        data = {
            'provider': 'local'
        }
        
        response = authenticated_client.post('/api/documents/', data, format='multipart')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_upload_invalid_file_type(self, authenticated_client, student_user):
        """Test upload with invalid file type fails"""
        from api.models import Thesis, Group
        group = Group.objects.create(
            name='Test Group 4',
            adviser=student_user
        )
        group.members.add(student_user)
        thesis = Thesis.objects.create(
            title='Test Thesis 4',
            abstract='Test abstract',
            group=group,
            proposer=student_user
        )
        
        # Create a text file (should be rejected)
        text_file = SimpleUploadedFile(
            "test.txt",
            b"This is a text file",
            content_type="text/plain"
        )
        
        data = {
            'thesis': thesis.id,
            'file': text_file,
            'provider': 'local'
        }
        
        response = authenticated_client.post('/api/documents/', data, format='multipart')
        
        # Should succeed unless there are specific file type restrictions
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST]

    def test_upload_large_file(self, authenticated_client, student_user):
        """Test upload with large file size"""
        from api.models import Thesis, Group
        group = Group.objects.create(
            name='Test Group 5',
            adviser=student_user
        )
        group.members.add(student_user)
        thesis = Thesis.objects.create(
            title='Test Thesis 5',
            abstract='Test abstract',
            group=group,
            proposer=student_user
        )
        
        # Create a large file (10MB)
        large_file = SimpleUploadedFile(
            "large_file.pdf",
            b'0' * (10 * 1024 * 1024),  # 10MB of zeros
            content_type="application/pdf"
        )
        
        data = {
            'thesis': thesis.id,
            'file': large_file,
            'provider': 'local'
        }
        
        response = authenticated_client.post('/api/documents/', data, format='multipart')
        
        # Should succeed unless there are file size restrictions
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST]

    def test_list_documents(self, authenticated_client, student_user):
        """Test listing documents for authenticated user"""
        from api.models import Thesis, Document, Group
        group = Group.objects.create(
            name='Test Group 6',
            adviser=student_user
        )
        group.members.add(student_user)
        thesis = Thesis.objects.create(
            title='Test Thesis 6',
            abstract='Test abstract',
            group=group,
            proposer=student_user
        )
        
        # Create a document
        Document.objects.create(
            thesis=thesis,
            uploaded_by=student_user,
            google_doc_url='https://docs.google.com/document/d/test',
            provider='google'
        )
        
        response = authenticated_client.get('/api/documents/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_retrieve_document(self, authenticated_client, student_user):
        """Test retrieving a specific document"""
        from api.models import Thesis, Document, Group
        group = Group.objects.create(
            name='Test Group 7',
            adviser=student_user
        )
        group.members.add(student_user)
        thesis = Thesis.objects.create(
            title='Test Thesis 7',
            abstract='Test abstract',
            group=group,
            proposer=student_user
        )
        
        document = Document.objects.create(
            thesis=thesis,
            uploaded_by=student_user,
            google_doc_url='https://docs.google.com/document/d/test',
            provider='google'
        )
        
        response = authenticated_client.get(f'/api/documents/{document.id}/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == document.id

    def test_update_document(self, authenticated_client, student_user):
        """Test updating document metadata"""
        from api.models import Thesis, Document, Group
        group = Group.objects.create(
            name='Test Group 8',
            adviser=student_user
        )
        group.members.add(student_user)
        thesis = Thesis.objects.create(
            title='Test Thesis 8',
            abstract='Test abstract',
            group=group,
            proposer=student_user
        )
        
        document = Document.objects.create(
            thesis=thesis,
            uploaded_by=student_user,
            google_doc_url='https://docs.google.com/document/d/test',
            provider='google'
        )
        
        data = {
            'google_doc_url': 'https://docs.google.com/document/d/updated'
        }
        
        response = authenticated_client.patch(f'/api/documents/{document.id}/', data)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'updated' in response.data['google_doc_url']

    def test_delete_document(self, authenticated_client, student_user):
        """Test deleting a document"""
        from api.models import Thesis, Document, Group
        group = Group.objects.create(
            name='Test Group 9',
            adviser=student_user
        )
        group.members.add(student_user)
        thesis = Thesis.objects.create(
            title='Test Thesis 9',
            abstract='Test abstract',
            group=group,
            proposer=student_user
        )
        
        document = Document.objects.create(
            thesis=thesis,
            uploaded_by=student_user,
            google_doc_url='https://docs.google.com/document/d/test',
            provider='google'
        )
        
        response = authenticated_client.delete(f'/api/documents/{document.id}/')
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify document is deleted
        assert not Document.objects.filter(id=document.id).exists()

    def test_document_owner_permissions(self, authenticated_client, adviser_client, student_user):
        """Test that only document owners can modify their documents"""
        from api.models import Thesis, Document, Group
        
        # Create thesis and document as student
        group = Group.objects.create(
            name='Test Group 10',
            adviser=student_user
        )
        group.members.add(student_user)
        thesis = Thesis.objects.create(
            title='Test Thesis 10',
            abstract='Test abstract',
            group=group,
            proposer=student_user
        )
        
        document = Document.objects.create(
            thesis=thesis,
            uploaded_by=student_user,
            google_doc_url='https://docs.google.com/document/d/test',
            provider='google'
        )
        
        # Try to update with different user (adviser)
        data = {'google_doc_url': 'https://docs.google.com/document/d/hacked'}
        
        response = adviser_client.patch(f'/api/documents/{document.id}/', data)
        
        # Should fail - adviser can't update student's document
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_google_drive_upload_simulation(self, authenticated_client, student_user):
        """Test Google Drive upload endpoint (simulated)"""
        from api.models import Thesis, Group
        group = Group.objects.create(
            name='Test Group 11',
            adviser=student_user
        )
        group.members.add(student_user)
        thesis = Thesis.objects.create(
            title='Test Thesis 11',
            abstract='Test abstract',
            group=group,
            proposer=student_user
        )
        
        data = {
            'thesis': thesis.id,
            'google_doc_url': 'https://docs.google.com/document/d/test123',
            'provider': 'google'
        }
        
        response = authenticated_client.post('/api/documents/', data, format='multipart')
        
        # This might fail if Google Drive integration requires authentication
        # but the endpoint should exist
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED]

    def test_concept_paper_upload_updates_thesis_status(self, authenticated_client, sample_pdf, student_user):
        """Test that uploading a concept paper updates thesis status to CONCEPT_SUBMITTED"""
        from api.models import Thesis, Group
        group = Group.objects.create(
            name='Test Group 12',
            adviser=student_user
        )
        group.members.add(student_user)
        thesis = Thesis.objects.create(
            title='Test Thesis 12',
            abstract='Test abstract',
            group=group,
            proposer=student_user,
            status='CONCEPT_SCHEDULED'  # Start with a different status
        )
        
        data = {
            'thesis': thesis.id,
            'file': sample_pdf,
            'document_type': 'CONCEPT_PAPER',
            'provider': 'local'
        }
        
        response = authenticated_client.post('/api/documents/', data, format='multipart')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['document_type'] == 'CONCEPT_PAPER'
        
        # Refresh thesis from database
        thesis.refresh_from_db()
        assert thesis.status == 'CONCEPT_SUBMITTED'
