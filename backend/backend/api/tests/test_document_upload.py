import os
import requests
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from django.contrib.auth import get_user_model
from api.models.thesis_models import Thesis, Group
from api.models.user_models import User

# Get the User model
User = get_user_model()

class DocumentUploadTest(APITestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            role='STUDENT'
        )
        
        # Create a test group
        self.group = Group.objects.create(
            name='Test Group',
            adviser=User.objects.create_user(
                email='adviser@example.com',
                password='adviserpass',
                first_name='Adviser',
                last_name='User',
                role='ADVISER'
            )
        )
        self.group.members.add(self.user)
        
        # Create a test thesis
        self.thesis = Thesis.objects.create(
            title='Test Thesis',
            description='This is a test thesis',
            group=self.group,
            status='in_progress'
        )
        
        # Set up the test client
        self.client = APIClient()
        
        # Log in the test user
        self.client.force_authenticate(user=self.user)
        
        # Create a test file
        self.test_file = SimpleUploadedFile(
            'test_document.pdf',
            b'This is a test PDF file',
            content_type='application/pdf'
        )
    
    def test_document_upload_to_thesis_folder(self):
        """Test that a document is uploaded to the correct thesis folder in Google Drive"""
        # Make sure the test file exists
        self.assertTrue(hasattr(self, 'test_file'))
        
        # Prepare the request data
        data = {
            'file': self.test_file,
            'thesis': str(self.thesis.id),
            'title': 'Test Document',
            'document_type': 'concept_paper',
            'upload_type': 'drive'  # Explicitly request Google Drive upload
        }
        
        # Make the request to upload the document
        url = reverse('documents-list')
        response = self.client.post(url, data, format='multipart')
        
        # Check that the response is successful
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that the document was created with the correct thesis
        document_data = response.data
        self.assertEqual(document_data['thesis'], str(self.thesis.id))
        
        # Check that the document has a Google Drive file ID
        self.assertIsNotNone(document_data.get('google_drive_file_id'))
        
        # Check that the document has a viewer URL
        self.assertIsNotNone(document_data.get('viewer_url'))
        
        # Verify the document is in the database
        from api.models.document_models import Document
        document = Document.objects.get(id=document_data['id'])
        self.assertEqual(document.thesis.id, self.thesis.id)
        
        # Print success message
        print("\nDocument upload test passed successfully!")
        print(f"Document ID: {document.id}")
        print(f"Thesis ID: {document.thesis.id}")
        print(f"Google Drive File ID: {document.google_drive_file_id}")
        print(f"Viewer URL: {document.viewer_url}")

    def tearDown(self):
        # Clean up any created files
        if hasattr(self, 'test_file') and os.path.exists(self.test_file.name):
            os.remove(self.test_file.name)
        
        # Clean up database
        self.user.delete()
        self.group.adviser.delete()
        self.group.delete()
        self.thesis.delete()
