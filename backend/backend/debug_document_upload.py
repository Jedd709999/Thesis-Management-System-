import os
import sys
import django
from django.conf import settings

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.services.google_drive_service import GoogleDriveService
from api.models.user_models import User
from api.models.thesis_models import Thesis
from api.models.document_models import Document
from django.core.files.base import ContentFile

def debug_document_upload():
    print("Debugging document upload to Google Drive...")
    
    # Get the student user
    try:
        user = User.objects.get(email='student3@test.com')
        print(f"Found user: {user.email}")
        
        # Check if user has drive credentials
        if hasattr(user, 'drive_credentials'):
            try:
                creds = user.drive_credentials
                print(f"User has drive credentials: {creds.is_active}, expired: {creds.is_expired()}")
                print(f"Credential type: {creds.credential_type}")
                print(f"Has refresh token: {bool(creds.refresh_token)}")
                print(f"Has client_id: {bool(creds.client_id)}")
                print(f"Has client_secret: {bool(creds.client_secret)}")
            except Exception as e:
                print(f"Error accessing drive credentials: {e}")
        else:
            print("User does not have drive_credentials attribute")
            return
        
        # Try to create GoogleDriveService
        print("\nTrying to create GoogleDriveService...")
        service = GoogleDriveService(user=user)
        print(f"Service created, service object: {service}")
        print(f"Service has service attribute: {hasattr(service, 'service')}")
        if service.service:
            print("Google Drive service is properly initialized")
        else:
            print("Google Drive service is NOT initialized")
            return
            
        # Try to get a thesis for the user
        thesis = Thesis.objects.first()
        if not thesis:
            print("No thesis found")
            return
            
        print(f"\nFound thesis: {thesis.title}")
        print(f"Thesis drive_folder_id: {thesis.drive_folder_id}")
        
        # If thesis doesn't have a drive folder, create one
        if not thesis.drive_folder_id:
            print("Creating drive folder for thesis...")
            success, folder_id, folder_url = service.create_drive_folder(thesis)
            if success:
                print(f"Created drive folder: {folder_id}")
                # Refresh the thesis object
                thesis.refresh_from_db()
                print(f"Thesis drive_folder_id after refresh: {thesis.drive_folder_id}")
            else:
                print(f"Failed to create drive folder: {folder_url}")
                return
        else:
            print(f"Using existing drive folder: {thesis.drive_folder_id}")
            
        # Simulate document upload
        print("\nSimulating document upload...")
        
        # Create test file content
        test_content = b"This is a test document content for upload to Google Drive."
        filename = "test_document.txt"
        mime_type = "text/plain"
        folder_id = thesis.drive_folder_id
        
        print(f"Uploading file '{filename}' to folder '{folder_id}'")
        
        # Upload file
        success, file_info = service.upload_file(test_content, filename, mime_type, folder_id)
        if success:
            print(f"Successfully uploaded file: {file_info}")
            
            # Create a document record
            print("\nCreating document record...")
            document = Document.objects.create(
                thesis=thesis,
                title="Test Document",
                document_type="concept_paper",
                provider="drive",
                google_drive_file_id=file_info['id'],
                viewer_url=file_info['web_view_link'],
                doc_embed_url=file_info['embed_url'],
                file_size=int(file_info.get('size', 0)),
                mime_type=file_info.get('mime_type', mime_type),
                uploaded_by=user
            )
            print(f"Created document record: {document.id}")
        else:
            print(f"Failed to upload file: {file_info}")
            # Print detailed error information
            if isinstance(file_info, dict) and 'error' in file_info:
                print(f"Error details: {file_info['error']}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_document_upload()
