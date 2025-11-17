import os
import json
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from django.conf import settings
import io
from typing import Dict, Optional, Tuple

class GoogleDriveService:
    """Google Drive service for uploading and managing files"""
    
    SCOPES = ['https://www.googleapis.com/auth/drive.file']
    SERVICE_ACCOUNT_FILE = getattr(settings, 'GOOGLE_SERVICE_ACCOUNT_FILE', None)
    
    def __init__(self):
        self.service = None
        self._authenticate()
    
    def _authenticate(self):
        """Authenticate with Google Drive API"""
        try:
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
                
                credentials = None
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
        except Exception as e:
            print(f"Google Drive authentication error: {e}")
            self.service = None
    
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
                fields='id,name,webViewLink,webViewUrl,embedLink,size,mimeType'
            ).execute()
            
            # Make file publicly accessible
            self.service.permissions().create(
                fileId=file['id'],
                body={
                    'role': 'reader',
                    'type': 'anyone'
                }
            ).execute()
            
            # Get embed URL
            embed_url = f"https://drive.google.com/file/d/{file['id']}/preview"
            
            return True, {
                'id': file['id'],
                'name': file['name'],
                'web_view_link': file.get('webViewLink') or file.get('webViewUrl'),
                'embed_url': embed_url,
                'size': file.get('size'),
                'mime_type': file.get('mimeType')
            }
            
        except Exception as e:
            print(f"Error uploading file to Google Drive: {e}")
            return False, None
    
    def create_folder(self, folder_name: str, parent_folder_id: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        """
        Create a folder in Google Drive
        
        Args:
            folder_name: Name of the folder
            parent_folder_id: Optional parent folder ID
            
        Returns:
            Tuple of (success: bool, folder_id: str or None)
        """
        if not self.service:
            return False, None
        
        try:
            file_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            
            if parent_folder_id:
                file_metadata['parents'] = [parent_folder_id]
            
            folder = self.service.files().create(
                body=file_metadata,
                fields='id'
            ).execute()
            
            # Make folder accessible
            self.service.permissions().create(
                fileId=folder['id'],
                body={
                    'role': 'reader',
                    'type': 'anyone'
                }
            ).execute()
            
            return True, folder['id']
            
        except Exception as e:
            print(f"Error creating Google Drive folder: {e}")
            return False, None
    
    def get_file_info(self, file_id: str) -> Optional[Dict]:
        """Get file information from Google Drive"""
        if not self.service:
            return None
        
        try:
            file = self.service.files().get(
                fileId=file_id,
                fields='id,name,webViewLink,webViewUrl,embedLink,size,mimeType'
            ).execute()
            
            return {
                'id': file['id'],
                'name': file['name'],
                'web_view_link': file.get('webViewLink') or file.get('webViewUrl'),
                'embed_url': file.get('embedLink') or f"https://drive.google.com/file/d/{file['id']}/preview",
                'size': file.get('size'),
                'mime_type': file.get('mimeType')
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
