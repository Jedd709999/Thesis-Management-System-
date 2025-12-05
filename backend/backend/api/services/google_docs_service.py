import os
import json
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class GoogleDocsService:
    """Service for interacting with Google Docs API"""
    
    SCOPES = [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata'
    ]
    
    def __init__(self):
        self.credentials = None
        self.service = None
        self._load_credentials()
    
    def _load_credentials(self):
        """Load Google API credentials from cache or file"""
        try:
            # Try to get credentials from cache first
            cached_creds = cache.get('google_credentials')
            if cached_creds:
                self.credentials = Credentials.from_authorized_user_info(
                    json.loads(cached_creds), self.SCOPES
                )
            
            # If no cached credentials or expired, try to refresh
            # Handle datetime comparison safely
            credentials_expired = False
            if self.credentials:
                try:
                    # First try the normal expired check, but catch datetime errors
                    credentials_expired = self.credentials.expired
                except TypeError as e:
                    if "can't compare offset-naive and offset-aware datetimes" in str(e):
                        # Handle the datetime comparison error by checking expiry manually
                        if hasattr(self.credentials, 'expiry') and self.credentials.expiry:
                            # Handle both naive and timezone-aware datetimes
                            if self.credentials.expiry.tzinfo is None:
                                # Naive datetime - compare directly
                                credentials_expired = self.credentials.expiry < timezone.now().replace(tzinfo=None)
                            else:
                                # Timezone-aware datetime - compare with timezone-aware
                                credentials_expired = self.credentials.expiry < timezone.now()
                        else:
                            # No expiry set, assume not expired
                            credentials_expired = False
                    else:
                        # Re-raise if it's a different error
                        raise e
            
            # Check if credentials are valid in a timezone-safe way
            credentials_valid = True
            if self.credentials:
                try:
                    # First try the normal valid check, but catch datetime errors
                    credentials_valid = self.credentials.valid
                except TypeError as e:
                    if "can't compare offset-naive and offset-aware datetimes" in str(e):
                        # Handle the datetime comparison error by checking expiry manually
                        if hasattr(self.credentials, 'expiry') and self.credentials.expiry:
                            # Handle both naive and timezone-aware datetimes
                            if self.credentials.expiry.tzinfo is None:
                                # Naive datetime - compare directly
                                credentials_valid = self.credentials.expiry >= timezone.now().replace(tzinfo=None)
                            else:
                                # Timezone-aware datetime - compare with timezone-aware
                                credentials_valid = self.credentials.expiry >= timezone.now()
                        else:
                            # No expiry set, assume valid
                            credentials_valid = True
                    else:
                        # Re-raise if it's a different error
                        raise e
            
            if not self.credentials or not credentials_valid:
                if self.credentials and credentials_expired and self.credentials.refresh_token:
                    self.credentials.refresh(Request())
                    self._cache_credentials()
            
            if self.credentials:
                # Build service with increased timeout
                self.service = build('docs', 'v1', credentials=self.credentials, cache_discovery=False)
                
        except Exception as e:
            logger.error(f"Error loading Google credentials: {e}")
    
    def _cache_credentials(self):
        """Cache credentials for future use"""
        if self.credentials:
            cache.set('google_credentials', self.credentials.to_json(), timeout=3600)
    
    def get_authorization_url(self, redirect_uri):
        """Get OAuth authorization URL for user consent"""
        try:
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": getattr(settings, 'GOOGLE_CLIENT_ID', ''),
                        "client_secret": getattr(settings, 'GOOGLE_CLIENT_SECRET', ''),
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token"
                    }
                },
                scopes=self.SCOPES,
                redirect_uri=redirect_uri
            )
            
            auth_url, state = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                prompt='consent'
            )
            
            # Store state in cache for verification
            cache.set(f'oauth_state_{state}', True, timeout=600)
            
            return auth_url, state
            
        except Exception as e:
            logger.error(f"Error generating authorization URL: {e}")
            return None, None
    
    def exchange_code_for_tokens(self, code, state, redirect_uri):
        """Exchange authorization code for access tokens"""
        try:
            # Verify state
            if not cache.get(f'oauth_state_{state}'):
                raise ValueError("Invalid state parameter")
            
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": getattr(settings, 'GOOGLE_CLIENT_ID', ''),
                        "client_secret": getattr(settings, 'GOOGLE_CLIENT_SECRET', ''),
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token"
                    }
                },
                scopes=self.SCOPES,
                redirect_uri=redirect_uri
            )
            
            flow.fetch_token(code=code)
            self.credentials = flow.credentials
            self._cache_credentials()
            
            # Rebuild service with new credentials
            # Build service with increased timeout
            self.service = build('docs', 'v1', credentials=self.credentials, cache_discovery=False)
            
            return True
            
        except Exception as e:
            logger.error(f"Error exchanging code for tokens: {e}")
            return False
    
    def create_document(self, title, content=""):
        """Create a new Google Doc"""
        try:
            if not self.service:
                raise Exception("Google Docs service not initialized")
            
            # Create document
            document = self.service.documents().create(body={
                'title': title
            }).execute()
            
            document_id = document.get('documentId')
            
            # Add initial content if provided
            if content:
                self.service.documents().batchUpdate(
                    documentId=document_id,
                    body={
                        'requests': [
                            {
                                'insertText': {
                                    'location': {
                                        'index': 1
                                    },
                                    'text': content
                                }
                            }
                        ]
                    }
                ).execute()
            
            return {
                'document_id': document_id,
                'document_url': f'https://docs.google.com/document/d/{document_id}/edit'
            }
            
        except HttpError as e:
            logger.error(f"Google Docs API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Error creating document: {e}")
            return None
    
    def get_document_content(self, document_id):
        """Get document content including structure and text"""
        try:
            if not self.service:
                raise Exception("Google Docs service not initialized")
            
            document = self.service.documents().get(
                documentId=document_id,
                includeContent=True
            ).execute()
            
            return document
            
        except HttpError as e:
            logger.error(f"Google Docs API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Error getting document content: {e}")
            return None
    
    def update_document(self, document_id, requests):
        """Update document with batch requests"""
        try:
            if not self.service:
                raise Exception("Google Docs service not initialized")
            
            result = self.service.documents().batchUpdate(
                documentId=document_id,
                body={'requests': requests}
            ).execute()
            
            return result
            
        except HttpError as e:
            logger.error(f"Google Docs API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Error updating document: {e}")
            return None
    
    def insert_text(self, document_id, text, location_index=1):
        """Insert text at specific location"""
        requests = [
            {
                'insertText': {
                    'location': {'index': location_index},
                    'text': text
                }
            }
        ]
        return self.update_document(document_id, requests)
    
    def replace_text(self, document_id, search_text, replace_text):
        """Replace all occurrences of text"""
        requests = [
            {
                'replaceAllText': {
                    'containsText': {
                        'text': search_text,
                        'matchCase': False
                    },
                    'replaceText': replace_text
                }
            }
        ]
        return self.update_document(document_id, requests)
    
    def delete_text(self, document_id, start_index, end_index):
        """Delete text between indices"""
        requests = [
            {
                'deleteContentRange': {
                    'range': {
                        'startIndex': start_index,
                        'endIndex': end_index
                    }
                }
            }
        ]
        return self.update_document(document_id, requests)
    
    def format_text(self, document_id, start_index, end_index, text_style):
        """Format text with styling"""
        requests = [
            {
                'updateTextStyle': {
                    'range': {
                        'startIndex': start_index,
                        'endIndex': end_index
                    },
                    'textStyle': text_style,
                    'fields': ','.join(text_style.keys())
                }
            }
        ]
        return self.update_document(document_id, requests)
    
    def get_document_permissions(self, document_id):
        """Get document sharing permissions"""
        try:
            # Create service with increased timeout
            drive_service = build('drive', 'v3', credentials=self.credentials, cache_discovery=False)
            permissions = drive_service.permissions().list(
                fileId=document_id,
                fields='permissions(id,type,role,emailAddress,displayName)'
            ).execute()
            
            return permissions.get('permissions', [])
            
        except HttpError as e:
            logger.error(f"Google Drive API error: {e}")
            return []
        except Exception as e:
            logger.error(f"Error getting permissions: {e}")
            return []
    
    def share_document(self, document_id, email, role='writer'):
        """Share document with specific user"""
        try:
            # Create service with increased timeout
            drive_service = build('drive', 'v3', credentials=self.credentials, cache_discovery=False)
            
            permission = drive_service.permissions().create(
                fileId=document_id,
                body={
                    'type': 'user',
                    'role': role,
                    'emailAddress': email
                },
                fields='id'
            ).execute()
            
            return permission
            
        except HttpError as e:
            logger.error(f"Google Drive API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Error sharing document: {e}")
            return None
    
    def extract_document_id_from_url(self, url):
        """Extract document ID from Google Docs URL"""
        try:
            import re
            match = re.search(r'/document/d/([a-zA-Z0-9-_]+)', url)
            if match:
                return match.group(1)
            return None
        except Exception:
            return None

# Global service instance
google_docs_service = GoogleDocsService()
