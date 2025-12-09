import os
import sys
import django
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models.user_models import User
from api.models.thesis_models import Thesis
from api.models.document_models import Document
from api.views.document_views import DocumentViewSet
from django.http import HttpRequest
from django.contrib.auth.models import AnonymousUser
from rest_framework.test import APIRequestFactory

def test_api_document_upload():
    try:
        # Get the student3 user
        user = User.objects.get(email='student3@test.com')
        print(f"Testing API document upload for user: {user.email}")
        
        # Get a thesis for this user
        thesis = Thesis.objects.first()
        if not thesis:
            print("No thesis found in database")
            return
            
        print(f"Using thesis: {thesis.title} (ID: {thesis.id})")
        
        # Create a mock request
        factory = APIRequestFactory()
        request = factory.post('/api/documents/', {})
        request.user = user
        
        # Create a simple test file content
        test_content = b"This is a test document for API upload to Google Drive."
        file_stream = BytesIO(test_content)
        test_file = InMemoryUploadedFile(
            file_stream,
            field_name='file',
            name='test_api_document.txt',
            content_type='text/plain',
            size=len(test_content),
            charset=None
        )
        
        # Create request data
        request_data = {
            'thesis': str(thesis.id),
            'title': 'Test API Document',
            'document_type': 'concept_paper',
            'file': test_file
        }
        
        # Create a DocumentViewSet instance
        view = DocumentViewSet()
        view.request = request
        view.format_kwarg = None
        
        print("Calling DocumentViewSet.create()...")
        response = view.create(request)
        
        print(f"Response status code: {response.status_code}")
        print(f"Response data: {response.data}")
        
        if response.status_code == 201:
            print("Document created successfully!")
            document_id = response.data['id']
            print(f"Document ID: {document_id}")
            
            # Verify the document was created
            try:
                document = Document.objects.get(id=document_id)
                print(f"Document found in database: {document.title}")
                print(f"Provider: {document.provider}")
                print(f"Google Drive file ID: {document.google_drive_file_id}")
                print(f"Viewer URL: {document.viewer_url}")
            except Document.DoesNotExist:
                print("Document not found in database")
        else:
            print("Document creation failed!")
            
    except User.DoesNotExist:
        print("User student3@test.com not found")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_api_document_upload()
