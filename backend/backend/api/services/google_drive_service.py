import os
import json
import time
import random
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from django.conf import settings
from django.utils import timezone
import io
from typing import Dict, Optional, Tuple, Callable, Any
from django.contrib.contenttypes.models import ContentType
from ..models.drive_models import DriveCredential, DriveFolder
from ..models.group_models import Group
from ..models.thesis_models import Thesis
from ..models.document_models import Document

# Retry configuration
MAX_RETRIES = 3
INITIAL_DELAY = 1  # seconds
MAX_DELAY = 60  # seconds
BACKOFF_MULTIPLIER = 2
JITTER_RANGE = 0.1  # 10% jitter


class GoogleDriveService:
    """Google Drive service for uploading and managing files"""
    
    SCOPES = [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents'
    ]
    
    def __init__(self, user=None):
        self.service = None
        self.docs_service = None
        self.user = user
        self._authenticate()
    
    def _retry_with_backoff(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute a function with exponential backoff retry logic.
        
        Args:
            func: Function to execute
            *args: Positional arguments for the function
            **kwargs: Keyword arguments for the function
            
        Returns:
            Result of the function call
            
        Raises:
            Last exception encountered after all retries are exhausted
        """
        delay = INITIAL_DELAY
        last_exception = None
        
        for attempt in range(MAX_RETRIES + 1):
            try:
                result = func(*args, **kwargs)
                if attempt > 0:
                    print(f"Retry successful on attempt {attempt + 1}")
                return result
            except Exception as e:
                last_exception = e
                print(f"Attempt {attempt + 1} failed: {str(e)}")
                
                # If this was the last attempt, don't retry
                if attempt == MAX_RETRIES:
                    break
                
                # Calculate delay with exponential backoff and jitter
                jitter = random.uniform(-JITTER_RANGE, JITTER_RANGE) * delay
                actual_delay = max(0, delay + jitter)
                actual_delay = min(actual_delay, MAX_DELAY)
                
                print(f"Retrying in {actual_delay:.2f} seconds...")
                time.sleep(actual_delay)
                
                # Increase delay for next attempt
                delay = min(delay * BACKOFF_MULTIPLIER, MAX_DELAY)
        
        # If we get here, all retries failed
        print(f"All {MAX_RETRIES + 1} attempts failed. Raising last exception.")
        raise last_exception
    
    def _authenticate(self):
        """Authenticate with Google Drive API using user credentials or OAuth2"""
        try:
            from google.oauth2.credentials import Credentials
            credentials = None
            
            # Try to get user-specific credentials first (higher priority)
            if self.user and hasattr(self.user, 'drive_credentials'):
                try:
                    drive_credential = self.user.drive_credentials
                    if drive_credential.is_active and not drive_credential.is_expired():
                        # Use stored user credentials
                        token_data = drive_credential.token
                        
                        # Check if we have all required fields for refresh
                        has_refresh_fields = (
                            drive_credential.refresh_token and 
                            drive_credential.token_uri and 
                            drive_credential.client_id and 
                            drive_credential.client_secret
                        )
                        
                        if has_refresh_fields:
                            # Create credentials with refresh capability
                            credentials = Credentials(
                                token=token_data.get('access_token'),
                                refresh_token=drive_credential.refresh_token,
                                token_uri=drive_credential.token_uri,
                                client_id=drive_credential.client_id,
                                client_secret=drive_credential.client_secret,
                                scopes=self.SCOPES
                            )
                            
                            # Check if credentials need to be refreshed
                            try:
                                # Test if credentials are valid
                                if not self._test_credentials(credentials):
                                    # Try to refresh if they're invalid
                                    if credentials.refresh_token:
                                        credentials.refresh(Request())
                                        # Test refreshed credentials
                                        if self._test_credentials(credentials):
                                            # Update stored credentials
                                            drive_credential.token = {
                                                'access_token': credentials.token,
                                                'expires_in': credentials.expiry.timestamp() if credentials.expiry else None
                                            }
                                            drive_credential.expires_at = credentials.expiry
                                            drive_credential.save(update_fields=['token', 'expires_at', 'updated_at'])
                                            print(f"Successfully refreshed credentials for user: {self.user.email}")
                                        else:
                                            print(f"Refreshed credentials are still invalid for user: {self.user.email}")
                                            credentials = None
                                    else:
                                        print(f"Credentials invalid and no refresh token available for user: {self.user.email}")
                                        credentials = None
                            except Exception as e:
                                print(f"Error checking or refreshing user credentials: {e}")
                                credentials = None
                            
                            if credentials:
                                print(f"Using user credentials with refresh capability for: {self.user.email}")
                        else:
                            # Create credentials without refresh capability
                            if token_data and 'access_token' in token_data:
                                credentials = Credentials(
                                    token=token_data.get('access_token'),
                                    scopes=self.SCOPES
                                )
                                print(f"Using user credentials without refresh capability for: {self.user.email}")
                            else:
                                print("User credentials are invalid or missing access token.")
                                credentials = None
                except DriveCredential.DoesNotExist:
                    pass
            
            # Try OAuth2 authentication second if user credentials aren't available
            if not credentials:
                credentials_path = os.path.join(settings.BASE_DIR, 'google_credentials.json')
                token_path = os.path.join(settings.BASE_DIR, 'google_token.json')
                
                if os.path.exists(credentials_path):
                    print(f"Using OAuth authentication with file: {credentials_path}")
                    # Check if the credentials file contains placeholder values
                    try:
                        with open(credentials_path, 'r') as f:
                            creds_data = json.load(f)
                            client_id = creds_data.get('web', {}).get('client_id', '')
                            if 'YOUR_GOOGLE_CLIENT_ID' in client_id:
                                print("Google credentials file contains placeholder values. Please update with real OAuth credentials.")
                            else:
                                # Load credentials from token file
                                if os.path.exists(token_path):
                                    credentials = Credentials.from_authorized_user_file(token_path, self.SCOPES)
                                    
                                    # Check if credentials need to be refreshed
                                    try:
                                        # Test if credentials are valid
                                        if not self._test_credentials(credentials):
                                            # Try to refresh if they're invalid
                                            if credentials.refresh_token:
                                                credentials.refresh(Request())
                                                # Save refreshed credentials
                                                with open(token_path, 'w') as token:
                                                    token.write(credentials.to_json())
                                                print("Successfully refreshed OAuth credentials from file")
                                            else:
                                                print("OAuth credentials invalid and no refresh token available")
                                                credentials = None
                                    except Exception as e:
                                        print(f"Error checking or refreshing OAuth credentials: {e}")
                                        credentials = None
                                else:
                                    print("No token file found. User needs to authenticate through OAuth flow.")
                    except json.JSONDecodeError:
                        print("Invalid JSON in Google credentials file")
                    except ValueError as ve:
                        if "missing fields refresh_token" in str(ve):
                            print("Google credentials file found but it contains placeholder values. Please update with real OAuth credentials.")
                        else:
                            raise ve
            
            if credentials:
                # Build services with increased timeout
                self.service = build('drive', 'v3', credentials=credentials, cache_discovery=False)
                self.docs_service = build('docs', 'v1', credentials=credentials, cache_discovery=False)
                print("Successfully authenticated with Google Drive API")
                
                # Update last used timestamp for user credentials
                if self.user and hasattr(self.user, 'drive_credentials'):
                    try:
                        drive_credential = self.user.drive_credentials
                        drive_credential.update_usage()
                    except DriveCredential.DoesNotExist:
                        pass
            else:
                print("Failed to authenticate with Google Drive API")
                self.service = None
                self.docs_service = None
                
        except Exception as e:
            print(f"Google Drive authentication error: {e}")
            import traceback
            traceback.print_exc()
            self.service = None
            self.docs_service = None
    
    def _test_credentials(self, credentials) -> bool:
        """
        Test if credentials are valid by making a simple API call to Google Drive.
        
        Args:
            credentials: Google OAuth credentials
            
        Returns:
            bool: True if credentials are valid, False otherwise
        """
        try:
            # Create a temporary service to test credentials
            temp_service = build('drive', 'v3', credentials=credentials, cache_discovery=False)
            
            # Make a simple API call to test if credentials work
            # This will raise an exception if credentials are invalid
            temp_service.files().list(
                pageSize=1,
                fields='files(id, name)'
            ).execute()
            
            # If we get here, credentials are valid
            return True
        except Exception as e:
            # If we get a 401 or similar auth error, credentials are invalid
            if 'Invalid Credentials' in str(e) or 'invalid_grant' in str(e) or '401' in str(e):
                print(f"DEBUG: Credentials test failed with auth error: {e}")
                return False
            else:
                # For other errors, we'll assume credentials are still valid
                # as the error might be temporary or unrelated to auth
                print(f"DEBUG: Credentials test failed with non-auth error: {e}")
                return True
    
    def create_drive_folder(self, obj) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Create a Google Drive folder for a group or thesis in a Shared Drive
        
        Args:
            obj: Group or Thesis object
            
        Returns:
            Tuple of (success: bool, folder_id: str or None, folder_url: str or None)
        """
        if not self.service:
            print("ERROR: Google Drive service not initialized for folder creation")
            return False, None, "Google Drive service not initialized"
        
        # Skip credentials expiry check to avoid datetime comparison errors
        # Since we're setting expiry to None, the credentials won't be checked for expiration
        try:
            credentials = self.service._http.credentials
            if (not hasattr(credentials, 'refresh_token') or not credentials.refresh_token or
                not hasattr(credentials, 'token_uri') or not credentials.token_uri or
                not hasattr(credentials, 'client_id') or not credentials.client_id or
                not hasattr(credentials, 'client_secret') or not credentials.client_secret):
                print("WARNING: Credentials don't have refresh capability. Folder creation may fail if token expires.")
        except Exception as e:
            print(f"DEBUG: Could not check credential refresh capability: {e}")
        
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
            
            # Get Shared Drive ID from environment variable (optional)
            shared_drive_id = os.getenv('GOOGLE_SHARED_DRIVE_ID')
            print(f"DEBUG: shared_drive_id from env: {shared_drive_id}")
            if shared_drive_id:
                print("DEBUG: Using Shared Drive for folder creation")
            else:
                print("DEBUG: Using regular Google Drive for folder creation")
            
            # Create folder metadata
            file_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            
            # Set parent folder if we have a Shared Drive
            if shared_drive_id:
                file_metadata['parents'] = [shared_drive_id]
            
            # Create folder (support Shared Drives if applicable)
            create_kwargs = {
                'body': file_metadata,
                'fields': 'id,webViewLink'
            }
            
            # Add Shared Drive support if we have a Shared Drive ID
            if shared_drive_id:
                create_kwargs['supportsAllDrives'] = True
            
            print(f"DEBUG: Creating folder with metadata: {file_metadata}")
            folder = self.service.files().create(**create_kwargs).execute()
            
            folder_id = folder['id']
            folder_url = folder.get('webViewLink', f"https://drive.google.com/drive/folders/{folder_id}")
            print(f"DEBUG: Created folder with ID: {folder_id}, URL: {folder_url}")
            print(f"DEBUG: Folder webViewLink from API: {folder.get('webViewLink')}")
            
            # Make folder accessible (support Shared Drives if applicable)
            permission = {
                'role': 'writer',
                'type': 'anyone'
            }
            print(f"DEBUG: Setting folder permissions for folder {folder_id}: {permission}")
            
            permission_kwargs = {
                'fileId': folder_id,
                'body': permission
            }
            
            # Add Shared Drive support if we have a Shared Drive ID
            if shared_drive_id:
                permission_kwargs['supportsAllDrives'] = True
            
            print(f"DEBUG: Setting permissions: {permission}")
            self.service.permissions().create(**permission_kwargs).execute()
            print("DEBUG: Permissions set successfully")
            
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
                print(f"DEBUG: Saving Group {obj.id} with drive_folder_id: {folder_id}")
                obj.save(update_fields=['drive_folder_id'])
                print("DEBUG: Group saved successfully")
            elif isinstance(obj, Thesis):
                obj.drive_folder_id = folder_id
                print(f"DEBUG: Saving Thesis {obj.id} with drive_folder_id: {folder_id}")
                obj.save(update_fields=['drive_folder_id'])
                print("DEBUG: Thesis saved successfully")
            
            return True, folder_id, folder_url
            
        except Exception as e:
            print(f"Error creating Google Drive folder: {e}")
            import traceback
            traceback.print_exc()
            return False, None, str(e)
    
    def _get_or_create_thesis_folder(self) -> Optional[str]:
        """
        Find or create a 'Thesis' folder in the root of Google Drive
        
        Returns:
            Folder ID of the 'Thesis' folder or None if failed
        """
        if not self.service:
            print("ERROR: Google Drive service not initialized for Thesis folder creation")
            return None
        
        # Skip credentials expiry check to avoid datetime comparison errors
        # Since we're setting expiry to None, the credentials won't be checked for expiration
        # If credentials are valid but don't have refresh capability, log a warning but continue
        try:
            credentials = self.service._http.credentials
            if (not hasattr(credentials, 'refresh_token') or not credentials.refresh_token or
                not hasattr(credentials, 'token_uri') or not credentials.token_uri or
                not hasattr(credentials, 'client_id') or not credentials.client_id or
                not hasattr(credentials, 'client_secret') or not credentials.client_secret):
                print("WARNING: Credentials don't have refresh capability. Folder creation may fail if token expires.")
        except Exception as e:
            print(f"DEBUG: Could not check credential refresh capability: {e}")
        
        try:
            # Try to find existing Thesis folder
            query = "name='Thesis' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false"
            print(f"DEBUG: Searching for Thesis folder with query: {query}")
            results = self.service.files().list(
                q=query,
                spaces='drive',
                fields='files(id, name)'
            ).execute()
            
            items = results.get('files', [])
            print(f"DEBUG: Found Thesis folder items: {items}")
            
            if items:
                folder_id = items[0]['id']
                print(f"DEBUG: Using existing Thesis folder: {folder_id}")
                return folder_id
                
            # Create Thesis folder if not found
            file_metadata = {
                'name': 'Thesis',
                'mimeType': 'application/vnd.google-apps.folder',
                'parents': ['root']
            }
            
            print(f"DEBUG: Creating new Thesis folder with metadata: {file_metadata}")
            folder = self.service.files().create(
                body=file_metadata,
                fields='id'
            ).execute()
            print(f"DEBUG: Created new Thesis folder with ID: {folder['id']}")
            
            # Make folder accessible
            permission = {
                'role': 'writer',
                'type': 'anyone',
                'allowFileDiscovery': True
            }
            
            print(f"DEBUG: Setting permissions on Thesis folder {folder['id']}: {permission}")
            self.service.permissions().create(
                fileId=folder['id'],
                body=permission
            ).execute()
            print("DEBUG: Thesis folder permissions set successfully")
            
            return folder['id']
            
        except Exception as e:
            print(f"Error finding/creating Thesis folder: {e}")
            import traceback
            traceback.print_exc()
            return None

    def upload_file(self, file_content: bytes, filename: str, mime_type: str, 
                   folder_id: Optional[str] = None) -> Tuple[bool, Optional[Dict]]:
        """
        Upload a file to Google Drive in a Shared Drive with retry mechanism        
        Args:
            file_content: File content as bytes
            filename: Name of the file
            mime_type: MIME type of the file
            folder_id: Optional Google Drive folder ID. If not provided, will use the 'Thesis' folder
            
        Returns:
            Tuple of (success: bool, file_info: dict or None)
        """
        if not self.service:
            print("ERROR: Google Drive service not initialized")
            return False, {"error": "Google Drive service not initialized"}
        
        # Skip credentials expiry check to avoid datetime comparison errors
        # Since we're setting expiry to None, the credentials won't be checked for expiration
        # If credentials are valid but don't have refresh capability, log a warning but continue
        try:
            credentials = self.service._http.credentials
            if (not hasattr(credentials, 'refresh_token') or not credentials.refresh_token or
                not hasattr(credentials, 'token_uri') or not credentials.token_uri or
                not hasattr(credentials, 'client_id') or not credentials.client_id or
                not hasattr(credentials, 'client_secret') or not credentials.client_secret):
                print("WARNING: Credentials don't have refresh capability. Upload may fail if token expires.")
        except Exception as e:
            print(f"DEBUG: Could not check credential refresh capability: {e}")
            
        # If no folder_id is provided, use the Thesis folder
        if folder_id is None:
            print("DEBUG: No folder_id provided, using Thesis folder")
            folder_id = self._get_or_create_thesis_folder()
            if folder_id is None:
                print("DEBUG: Failed to get or create Thesis folder")
                return False, {"error": "Failed to get or create Thesis folder"}
        else:
            print(f"DEBUG: Using provided folder_id: {folder_id}")
        
        try:
            # Prepare file metadata
            file_metadata = {
                'name': filename,
            }
            print(f"DEBUG: Preparing to upload file '{filename}' to folder '{folder_id}'")
            
            # Set parent folder if provided
            if folder_id:
                file_metadata['parents'] = [folder_id]
                print(f"DEBUG: Setting parent folder for file: {folder_id}")
                
                # Check if we're uploading to a Shared Drive (optional)
                shared_drive_id = os.getenv('GOOGLE_SHARED_DRIVE_ID')
                is_shared_drive_upload = bool(shared_drive_id)
                print(f"DEBUG: shared_drive_id: {shared_drive_id}, is_shared_drive_upload: {is_shared_drive_upload}")
                if is_shared_drive_upload:
                    print("DEBUG: Using Shared Drive for file upload")
                else:
                    print("DEBUG: Using regular Google Drive for file upload")
            else:
                print("DEBUG: No parent folder specified for file upload")
                is_shared_drive_upload = False
            
            # Create media upload object
            media = MediaIoBaseUpload(
                io.BytesIO(file_content),
                mimetype=mime_type,
                resumable=True
            )
            
            # Upload file (support Shared Drives if applicable)
            create_kwargs = {
                'body': file_metadata,
                'media_body': media,
                'fields': 'id,name,webViewLink,webContentLink,size,mimeType'
            }
            
            # Add Shared Drive support if we have a Shared Drive ID
            if is_shared_drive_upload:
                create_kwargs['supportsAllDrives'] = True
            
            print(f"DEBUG: Creating file with kwargs: {create_kwargs}")
            file = self.service.files().create(**create_kwargs).execute()
            print(f"DEBUG: File created successfully with ID: {file['id']}")
            print(f"DEBUG: File parents: {file.get('parents', [])}")
            
            # Make file accessible (support Shared Drives if applicable)
            permission = {
                'role': 'writer',
                'type': 'anyone',
                'allowFileDiscovery': True
            }
            
            permission_kwargs = {
                'fileId': file['id'],
                'body': permission
            }
            
            # Add Shared Drive support if we have a Shared Drive ID
            if is_shared_drive_upload:
                permission_kwargs['supportsAllDrives'] = True
            
            print(f"DEBUG: Setting file permissions: {permission}")
            self.service.permissions().create(**permission_kwargs).execute()
            print("DEBUG: File permissions set successfully")
            
            # Get web view link - handle both regular and Shared Drive files
            web_view_link = file.get('webViewLink')
            if not web_view_link and 'webContentLink' in file:
                web_view_link = file['webContentLink'].split('&export=download')[0]
            
            # Get embed URL
            embed_url = f"https://drive.google.com/file/d/{file['id']}/preview"
            
            file_info = {
                'id': file['id'],
                'name': file['name'],
                'web_view_link': web_view_link,
                'embed_url': embed_url,
                'size': int(file.get('size', 0)) if file.get('size') else 0,
                'mime_type': file.get('mimeType')
            }
            
            print(f"DEBUG: Returning file info: {file_info}")
            return True, file_info
            
        except Exception as e:
            print(f"Error uploading file to Google Drive: {e}")
            import traceback
            traceback.print_exc()
            
            return False, {"error": str(e)}
    
    def convert_to_google_doc(self, file_id: str) -> Tuple[bool, Optional[str]]:
        """
        Convert a file to Google Docs format in a Shared Drive with retry mechanism        
        Args:
            file_id: Google Drive file ID
            
        Returns:
            Tuple of (success: bool, google_doc_id: str or None)
        """
        if not self.service:
            return False, None
        
        try:
            # Check if we're working with a Shared Drive
            shared_drive_id = os.getenv('GOOGLE_SHARED_DRIVE_ID')
            is_shared_drive_file = shared_drive_id
            
            # Copy the file and convert to Google Docs format
            copied_file = {
                'name': 'Converted Document',
                'mimeType': 'application/vnd.google-apps.document'
            }
            
            # Copy file (support Shared Drives if applicable)
            copy_kwargs = {
                'fileId': file_id,
                'body': copied_file
            }
            
            # Add Shared Drive support if we have a Shared Drive ID
            if is_shared_drive_file:
                copy_kwargs['supportsAllDrives'] = True
            
            google_doc = self.service.files().copy(**copy_kwargs).execute()
            
            google_doc_id = google_doc['id']
            
            # Make the Google Doc accessible (support Shared Drives if applicable)
            permission = {
                'role': 'writer',
                'type': 'anyone'
            }
            
            permission_kwargs = {
                'fileId': google_doc_id,
                'body': permission
            }
            
            # Add Shared Drive support if we have a Shared Drive ID
            if is_shared_drive_file:
                permission_kwargs['supportsAllDrives'] = True
            
            self.service.permissions().create(**permission_kwargs).execute()
            
            return True, google_doc_id
            
        except Exception as e:
            print(f"Error converting file to Google Doc: {e}")
            import traceback
            traceback.print_exc()
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
        Sync document metadata with Google Drive in a Shared Drive
        
        Args:
            document: Document object
            
        Returns:
            Success status
        """
        if not self.service:
            print("ERROR: Google Drive service not initialized for metadata sync")
            return False
        
        if not document.google_drive_file_id:
            print(f"ERROR: Document {document.id} has no Google Drive file ID for sync")
            return False
        
        try:
            print(f"DEBUG: Syncing metadata for document {document.id} with file ID {document.google_drive_file_id}")
            
            # Get file info from Google Drive
            file_info = self.get_file_info(document.google_drive_file_id)
            if not file_info:
                print(f"ERROR: Could not retrieve file info for document {document.id}")
                return False
            
            print(f"DEBUG: Retrieved file info: {file_info}")
            
            # Update document metadata
            document.viewer_url = file_info.get('web_view_link')
            document.doc_embed_url = file_info.get('embed_url')
            document.mime_type = file_info.get('mime_type')
            document.file_size = int(file_info.get('size', 0)) if file_info.get('size') else 0
            document.last_synced_at = timezone.now()
            
            document.save(update_fields=[
                'viewer_url', 'doc_embed_url', 'mime_type', 
                'file_size', 'last_synced_at'
            ])
            
            print(f"DEBUG: Successfully synced metadata for document {document.id}")
            return True
            
        except Exception as e:
            print(f"Error syncing document metadata: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def find_file_by_name(self, filename: str, folder_id: Optional[str] = None) -> Optional[Dict]:
        """
        Find a file by name in Google Drive
        
        Args:
            filename: Name of the file to find
            folder_id: Optional folder ID to search within
            
        Returns:
            File info dictionary or None
        """
        if not self.service:
            return None
        
        try:
            # Build query
            # Escape single quotes in filename
            escaped_filename = filename.replace("'", "\\'")
            query = f"name = '{escaped_filename}' and trashed = false"
            if folder_id:
                query += f" and '{folder_id}' in parents"
            
            print(f"DEBUG: Searching for file with query: {query}")
            
            # Search for file (support Shared Drives if applicable)
            list_kwargs = {
                'q': query,
                'fields': 'files(id,name,webViewLink,size,mimeType,modifiedTime,createdTime)',
                'pageSize': 10  # Increase page size to get more results
            }
            
            # Add Shared Drive support if we have a Shared Drive ID
            shared_drive_id = os.getenv('GOOGLE_SHARED_DRIVE_ID')
            if shared_drive_id:
                list_kwargs['driveId'] = shared_drive_id
                list_kwargs['supportsAllDrives'] = True
                list_kwargs['includeItemsFromAllDrives'] = True
            
            results = self.service.files().list(**list_kwargs).execute()
            files = results.get('files', [])
            
            print(f"DEBUG: Found {len(files)} files matching the query")
            
            if files:
                file = files[0]
                print(f"DEBUG: Selected file: {file}")
                return {
                    'id': file['id'],
                    'name': file['name'],
                    'web_view_link': file.get('webViewLink'),
                    'embed_url': f"https://drive.google.com/file/d/{file['id']}/preview",
                    'size': int(file.get('size', 0)) if file.get('size') else 0,
                    'mime_type': file.get('mimeType'),
                    'modified_time': file.get('modifiedTime'),
                    'created_time': file.get('createdTime')
                }
            
            # If we didn't find the file with exact name matching, try partial matching
            if len(files) == 0 and folder_id:
                # Try searching more broadly in the folder
                broad_query = f"'{folder_id}' in parents and trashed = false"
                print(f"DEBUG: Trying broader search with query: {broad_query}")
                
                broad_list_kwargs = {
                    'q': broad_query,
                    'fields': 'files(id,name,webViewLink,size,mimeType,modifiedTime,createdTime)',
                    'pageSize': 100
                }
                
                if shared_drive_id:
                    broad_list_kwargs['driveId'] = shared_drive_id
                    broad_list_kwargs['supportsAllDrives'] = True
                    broad_list_kwargs['includeItemsFromAllDrives'] = True
                
                broad_results = self.service.files().list(**broad_list_kwargs).execute()
                broad_files = broad_results.get('files', [])
                
                print(f"DEBUG: Found {len(broad_files)} files in folder for manual inspection")
                
                # Look for files that might match (partial name matching)
                for file in broad_files:
                    if filename.lower() in file['name'].lower() or file['name'].lower() in filename.lower():
                        print(f"DEBUG: Found potential match: {file['name']}")
                        return {
                            'id': file['id'],
                            'name': file['name'],
                            'web_view_link': file.get('webViewLink'),
                            'embed_url': f"https://drive.google.com/file/d/{file['id']}/preview",
                            'size': int(file.get('size', 0)) if file.get('size') else 0,
                            'mime_type': file.get('mimeType'),
                            'modified_time': file.get('modifiedTime'),
                            'created_time': file.get('createdTime')
                        }
            
            return None
            
        except Exception as e:
            print(f"Error finding file by name in Google Drive: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def get_file_info(self, file_id: str) -> Optional[Dict]:
        """Get file information from Google Drive in a Shared Drive"""
        if not self.service:
            return None
        
        try:
            # Check if we're working with a Shared Drive
            shared_drive_id = os.getenv('GOOGLE_SHARED_DRIVE_ID')
            is_shared_drive_file = shared_drive_id
            
            # Get file info (support Shared Drives if applicable)
            get_kwargs = {
                'fileId': file_id,
                'fields': 'id,name,webViewLink,size,mimeType,modifiedTime,createdTime'
            }
            
            # Add Shared Drive support if we have a Shared Drive ID
            if is_shared_drive_file:
                get_kwargs['supportsAllDrives'] = True
            
            file = self.service.files().get(**get_kwargs).execute()
            
            return {
                'id': file['id'],
                'name': file['name'],
                'web_view_link': file.get('webViewLink'),
                'embed_url': f"https://drive.google.com/file/d/{file['id']}/preview",
                'size': int(file.get('size', 0)) if file.get('size') else 0,
                'mime_type': file.get('mimeType'),
                'modified_time': file.get('modifiedTime'),
                'created_time': file.get('createdTime')
            }
            
        except Exception as e:
            print(f"Error getting file info from Google Drive: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def delete_file(self, file_id: str) -> bool:
        """Delete a file from Google Drive in a Shared Drive"""
        if not self.service:
            return False
        
        try:
            # Check if we're working with a Shared Drive
            shared_drive_id = os.getenv('GOOGLE_SHARED_DRIVE_ID')
            is_shared_drive_file = shared_drive_id
            
            # Delete file (support Shared Drives if applicable)
            delete_kwargs = {
                'fileId': file_id
            }
            
            # Add Shared Drive support if we have a Shared Drive ID
            if is_shared_drive_file:
                delete_kwargs['supportsAllDrives'] = True
            
            self.service.files().delete(**delete_kwargs).execute()
            return True
        except Exception as e:
            print(f"Error deleting file from Google Drive: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def delete_folder(self, folder_id: str) -> bool:
        """Delete a folder from Google Drive"""
        return self.delete_file(folder_id)
    
    def update_folder_permissions_to_readonly(self, folder_id: str) -> bool:
        """
        Update a Google Drive folder's permissions to read-only for all users.
        
        Args:
            folder_id: Google Drive folder ID
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.service:
            print("ERROR: Google Drive service not initialized")
            return False
        
        try:
            # First, get all existing permissions
            # Note: For regular Drive folders, we don't need supportsAllDrives parameter
            permissions = self.service.permissions().list(
                fileId=folder_id,
                fields='permissions(id,role,type,emailAddress,domain)'
            ).execute()
            
            # Update each permission to reader role (except owner)
            for permission in permissions.get('permissions', []):
                # Skip owner permissions - don't change them
                if permission.get('role') == 'owner':
                    continue
                    
                # Update permission to reader role (read-only)
                updated_permission = {
                    'role': 'reader'
                }
                
                # For regular Drive folders, we don't need supportsAllDrives parameter
                self.service.permissions().update(
                    fileId=folder_id,
                    permissionId=permission['id'],
                    body=updated_permission
                ).execute()
            
            print(f"Successfully updated folder {folder_id} permissions to read-only")
            return True
            
        except Exception as e:
            print(f"Error updating folder permissions to read-only: {e}")
            import traceback
            traceback.print_exc()
            return False
