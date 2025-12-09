import os
import sys
import django
from io import BytesIO

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models.user_models import User
from api.models.thesis_models import Thesis
from api.models.document_models import Document
from api.services.google_drive_service import GoogleDriveService
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.utils import timezone

def test_document_creation():
    try:
        # Get the student3 user
        user = User.objects.get(email='student3@test.com')
        print(f"Testing document creation for user: {user.email}")
        
        # Get a thesis for this user
        thesis = Thesis.objects.first()
        if not thesis:
            print("No thesis found in database")
            return
            
        print(f"Using thesis: {thesis.title} (ID: {thesis.id})")
        print(f"Thesis drive folder ID: {thesis.drive_folder_id}")
        
        # Create Google Drive service instance for this user
        drive_service = GoogleDriveService(user=user)
        
        # Check if service is properly authenticated
        if not drive_service.service:
            print("ERROR: Google Drive service failed to authenticate")
            return
            
        print("Google Drive service is properly authenticated")
        
        # Create a simple test file content
        test_content = b"This is a test document for direct upload to Google Drive."
        filename = "direct_test_document.txt"
        mime_type = "text/plain"
        
        # Upload the file directly to Google Drive
        print(f"Uploading file '{filename}' to folder '{thesis.drive_folder_id}'...")
        success, file_info = drive_service.upload_file(
            test_content, filename, mime_type, thesis.drive_folder_id
        )
        
        if success:
            print("File uploaded successfully!")
            print(f"File ID: {file_info['id']}")
            print(f"File name: {file_info['name']}")
            print(f"Web view link: {file_info['web_view_link']}")
            print(f"Embed URL: {file_info['embed_url']}")
            
            # Now create a document record in the database
            print("Creating document record in database...")
            document = Document.objects.create(
                thesis=thesis,
                uploaded_by=user,
                title="Direct Test Document",
                document_type="concept_paper",
                provider="drive",
                google_drive_file_id=file_info['id'],
                viewer_url=file_info['web_view_link'],
                doc_embed_url=file_info['embed_url'],
                file_size=file_info['size'],
                mime_type=file_info['mime_type'],
                status="draft"
            )
            
            print(f"Document created successfully with ID: {document.id}")
            print(f"Document provider: {document.provider}")
            print(f"Document Google Drive file ID: {document.google_drive_file_id}")
            
        else:
            print(f"File upload failed: {file_info}")
            
    except User.DoesNotExist:
        print("User student3@test.com not found")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_document_creation()
