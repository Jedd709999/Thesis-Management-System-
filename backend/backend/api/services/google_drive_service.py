import os
import json
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from django.conf import settings
from django.utils import timezone
import io
from typing import Dict, Optional, Tuple
from django.contrib.contenttypes.models import ContentType
from ..models.drive_models import DriveCredential, DriveFolder
from ..models.group_models import Group
from ..models.thesis_models import Thesis
from ..models.document_models import Document

class GoogleDriveService:
    """Google Drive service for uploading and managing files"""
    
    SCOPES = [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents'
    ]
    SERVICE_ACCOUNT_FILE = getattr(settings, 'GOOGLE_SERVICE_ACCOUNT_FILE', None)
    
    def __init__(self, user=None):
        self.service = None
        self.docs_service = None
        self.user = user
        self._authenticate()
    
    def _authenticate(self):
        """Authenticate with Google Drive API using stored credentials"""
        try:
            credentials = None
            
            # Try to get user-specific credentials
            if self.user and hasattr(self.user, 'drive_credentials'):
                try:
                    drive_credential = self.user.drive_credentials
                    if drive_credential.is_active and not drive_credential.is_expired():
                        # Use stored credentials
                        token_data = drive_credential.token
                        credentials = Credentials(
                            token=token_data.get('token'),
                            refresh_token=drive_credential.refresh_token,
                            token_uri=drive_credential.token_uri,
                            client_id=drive_credential.client_id,
                            client_secret=drive_credential.client_secret,
                            scopes=self.SCOPES
                        )
                except DriveCredential.DoesNotExist:
                    pass
            
            # Fallback to service account or default OAuth
            if not credentials:
                if self.SERVICE_ACCOUNT_FILE and os.path.exists(self.SERVICE_ACCOUNT_FILE):
                    # Service account authentication
                    from google.oauth2 import service_account
                    credentials = service_account.Credentials.from_service_account_file(
                        self.SERVICE_ACCOUNT_FILE, scopes=self.SCOPES
                    )
                else:
                    # OAuth2 authentication (for development)
                    credentials_path = os.path.join(settings.BASE_DIR, 'google_credentials.json')
                    token_path = os.path.join(settings.BASE_DIR, 'google_token.json')
                    
                    if os.path.exists(token_path):
                        credentials = Credentials.from_authorized_user_file(token_path, self.SCOPES)
                    
                    if not credentials or not credentials.valid:
                        if credentials and credentials.expired and credentials.refresh_token:
                            credentials.refresh(Request())
                        else:
                            flow = InstalledAppFlow.from_client_secrets_file(
                                credentials_path, self.SCOPES
                            )
                            credentials = flow.run_local_server(port=8081)                    
                        with open(token_path, 'w') as token:
                            token.write(credentials.to_json())
            
            self.service = build('drive', 'v3', credentials=credentials)
            # Build Docs API service
            self.docs_service = build('docs', 'v1', credentials=credentials)
            
            # Update last used timestamp
            if self.user and hasattr(self.user, 'drive_credentials'):
                try:
                    drive_credential = self.user.drive_credentials
                    drive_credential.update_usage()
                except DriveCredential.DoesNotExist:
                    pass
                    
        except Exception as e:
            print(f"Google Drive authentication error: {e}")
            self.service = None
            self.docs_service = None
    
    def create_drive_folder(self, obj) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Create a Google Drive folder for a group or thesis
        
        Args:
            obj: Group or Thesis object
            
        Returns:
            Tuple of (success: bool, folder_id: str or None, folder_url: str or None)
        """
        if not self.service:
            return False, None, None
        
        try:
            folder_name = ""
            folder_type = ""
            parent_folder_id = None
            
            if isinstance(obj, Group):
                folder_name = f"Group_{obj.name}_{obj.id}"
                folder_type = "group"
                # Check if group already has a drive folder
                if hasattr(obj, 'drive_folder_id') and obj.drive_folder_id:
                    return True, obj.drive_folder_id, f"https://drive.google.com/drive/folders/{obj.drive_folder_id}"
            elif isinstance(obj, Thesis):
                folder_name = f"Thesis_{obj.title}_{obj.id}"
                folder_type = "thesis"
                # Check if thesis already has a drive folder
                if hasattr(obj, 'drive_folder_id') and obj.drive_folder_id:
                    return True, obj.drive_folder_id, f"https://drive.google.com/drive/folders/{obj.drive_folder_id}"
            else:
                raise ValueError("Object must be Group or Thesis instance")
            
            # Create folder metadata
            file_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            
            # Set parent folder if specified
            if parent_folder_id:
                file_metadata['parents'] = [parent_folder_id]
            
            # Create folder
            folder = self.service.files().create(
                body=file_metadata,
                fields='id,webViewLink'
            ).execute()
            
            folder_id = folder['id']
            folder_url = folder.get('webViewLink', f"https://drive.google.com/drive/folders/{folder_id}")
            
            # Make folder accessible
            permission = {
                'role': 'writer',
                'type': 'anyone'
            }
            self.service.permissions().create(
                fileId=folder_id,
                body=permission
            ).execute()
            
            # Save folder info to database
            content_type = ContentType.objects.get_for_model(obj)
            DriveFolder.objects.update_or_create(
                folder_id=folder_id,
                defaults={
                    'name': folder_name,
                    'folder_type': folder_type,
                    'owner': self.user,
                    'web_view_link': folder_url,
                    'created_in_drive_at': None  # Will be set by Google
                }
            )
            
            # Update the object with the folder ID
            if isinstance(obj, Group):
                obj.drive_folder_id = folder_id
                obj.save(update_fields=['drive_folder_id'])
            elif isinstance(obj, Thesis):
                obj.drive_folder_id = folder_id
                obj.save(update_fields=['drive_folder_id'])
            
            return True, folder_id, folder_url
            
        except Exception as e:
            print(f"Error creating Google Drive folder: {e}")
            return False, None, None
    
    def upload_file(self, file_content: bytes, filename: str, mime_type: str, 
                   folder_id: Optional[str] = None) -> Tuple[bool, Optional[Dict]]:
        """
        Upload a file to Google Drive
        
        Args:
            file_content: File content as bytes
            filename: Name of the file
            mime_type: MIME type of the file
            folder_id: Optional Google Drive folder ID
            
        Returns:
            Tuple of (success: bool, file_info: dict or None)
        """
        if not self.service:
            return False, None
        
        try:
            # Prepare file metadata
            file_metadata = {
                'name': filename,
            }
            
            if folder_id:
                file_metadata['parents'] = [folder_id]
            
            # Create media upload object
            media = MediaIoBaseUpload(
                io.BytesIO(file_content),
                mimetype=mime_type,
                resumable=True
            )
            
            # Upload file
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id,name,webViewLink,size,mimeType'
            ).execute()
            
            # Make file publicly accessible
            permission = {
                'role': 'reader',
                'type': 'anyone'
            }
            self.service.permissions().create(
                fileId=file['id'],
                body=permission
            ).execute()
            
            # Get embed URL
            embed_url = f"https://drive.google.com/file/d/{file['id']}/preview"
            
            return True, {
                'id': file['id'],
                'name': file['name'],
                'web_view_link': file.get('webViewLink'),
                'embed_url': embed_url,
                'size': file.get('size'),
                'mime_type': file.get('mimeType')
            }
            
        except Exception as e:
            print(f"Error uploading file to Google Drive: {e}")
            return False, None
    
    def convert_to_google_doc(self, file_id: str) -> Tuple[bool, Optional[str]]:
        """
        Convert a file to Google Docs format
        
        Args:
            file_id: Google Drive file ID
            
        Returns:
            Tuple of (success: bool, google_doc_id: str or None)
        """
        if not self.service:
            return False, None
        
        try:
            # Copy the file and convert to Google Docs format
            copied_file = {
                'name': 'Converted Document',
                'mimeType': 'application/vnd.google-apps.document'
            }
            
            google_doc = self.service.files().copy(
                fileId=file_id,
                body=copied_file
            ).execute()
            
            google_doc_id = google_doc['id']
            
            # Make the Google Doc accessible
            permission = {
                'role': 'writer',
                'type': 'anyone'
            }
            self.service.permissions().create(
                fileId=google_doc_id,
                body=permission
            ).execute()
            
            return True, google_doc_id
            
        except Exception as e:
            print(f"Error converting file to Google Doc: {e}")
            return False, None
    
    def generate_export_url(self, file_id: str, export_format: str = 'pdf') -> Optional[str]:
        """
        Generate export URL for a Google Drive file
        
        Args:
            file_id: Google Drive file ID
            export_format: Export format (pdf, docx, txt, etc.)
            
        Returns:
            Export URL or None
        """
        if not self.service:
            return None
        
        try:
            # Get file metadata to determine MIME type
            file = self.service.files().get(
                fileId=file_id,
                fields='mimeType'
            ).execute()
            
            mime_type = file.get('mimeType', '')
            
            # Map MIME types to export formats
            export_formats = {
                'application/vnd.google-apps.document': {
                    'pdf': 'application/pdf',
                    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'txt': 'text/plain',
                    'html': 'text/html'
                },
                'application/vnd.google-apps.spreadsheet': {
                    'pdf': 'application/pdf',
                    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'csv': 'text/csv'
                },
                'application/vnd.google-apps.presentation': {
                    'pdf': 'application/pdf',
                    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                }
            }
            
            if mime_type in export_formats and export_format in export_formats[mime_type]:
                export_mime_type = export_formats[mime_type][export_format]
                return f"https://docs.google.com/feeds/download/documents/export/Export?id={file_id}&exportFormat={export_format}&format={export_mime_type}"
            
            # For non-Google files, use direct download
            return f"https://drive.google.com/uc?export=download&id={file_id}"
            
        except Exception as e:
            print(f"Error generating export URL: {e}")
            return None
    
    def generate_embed_url(self, file_id: str) -> Optional[str]:
        """
        Generate embed URL for a Google Drive file
        
        Args:
            file_id: Google Drive file ID
            
        Returns:
            Embed URL or None
        """
        try:
            return f"https://drive.google.com/file/d/{file_id}/preview"
        except Exception as e:
            print(f"Error generating embed URL: {e}")
            return None
    
    def get_google_doc_edit_url(self, google_doc_id: str) -> Optional[str]:
        """
        Get the edit URL for a Google Doc
        
        Args:
            google_doc_id: Google Doc ID
            
        Returns:
            Edit URL or None
        """
        try:
            return f"https://docs.google.com/document/d/{google_doc_id}/edit"
        except Exception as e:
            print(f"Error generating Google Doc edit URL: {e}")
            return None
    
    def sync_metadata(self, document: Document) -> bool:
        """
        Sync document metadata with Google Drive
        
        Args:
            document: Document object
            
        Returns:
            Success status
        """
        if not self.service or not document.google_drive_file_id:
            return False
        
        try:
            # Get file info from Google Drive
            file_info = self.get_file_info(document.google_drive_file_id)
            if not file_info:
                return False
            
            # Update document metadata
            document.viewer_url = file_info.get('web_view_link')
            document.doc_embed_url = file_info.get('embed_url')
            document.mime_type = file_info.get('mime_type')
            document.file_size = file_info.get('size', 0)
            document.last_synced_at = timezone.now()
            
            document.save(update_fields=[
                'viewer_url', 'doc_embed_url', 'mime_type', 
                'file_size', 'last_synced_at'
            ])
            
            return True
            
        except Exception as e:
            print(f"Error syncing document metadata: {e}")
            return False
    
    def get_file_info(self, file_id: str) -> Optional[Dict]:
        """Get file information from Google Drive"""
        if not self.service:
            return None
        
        try:
            file = self.service.files().get(
                fileId=file_id,
                fields='id,name,webViewLink,size,mimeType,modifiedTime,createdTime'
            ).execute()
            
            return {
                'id': file['id'],
                'name': file['name'],
                'web_view_link': file.get('webViewLink'),
                'embed_url': f"https://drive.google.com/file/d/{file['id']}/preview",
                'size': file.get('size'),
                'mime_type': file.get('mimeType'),
                'modified_time': file.get('modifiedTime'),
                'created_time': file.get('createdTime')
            }
            
        except Exception as e:
            print(f"Error getting file info from Google Drive: {e}")
            return None
    
    def delete_file(self, file_id: str) -> bool:
        """Delete a file from Google Drive"""
        if not self.service:
            return False
        
        try:
            self.service.files().delete(fileId=file_id).execute()
            return True
        except Exception as e:
            print(f"Error deleting file from Google Drive: {e}")
            return False

# Singleton instance
drive_service = GoogleDriveService()