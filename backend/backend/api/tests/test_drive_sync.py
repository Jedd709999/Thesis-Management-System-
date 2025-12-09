import pytest
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
from api.services.google_drive_service import GoogleDriveService

User = get_user_model()

@pytest.mark.django_db
class TestDriveSync:
    """Test Google Drive synchronization functionality"""
    
    def setup_method(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='drivetest@test.com',
            password='testpass123',
            role='STUDENT'
        )
        
        # Create group and thesis for testing
        self.adviser = User.objects.create_user(
            email='adviserdrive@test.com',
            password='testpass123',
            role='ADVISER'
        )
        
        self.group = self.user.member_groups.create(
            name='Drive Test Group',
            adviser=self.adviser
        )
        
        self.thesis = self.group.thesis.create(
            title='Drive Test Thesis',
            abstract='This is a test thesis for drive sync',
            proposer=self.user
        )
    
    @patch('api.services.google_drive_service.build')
    @patch('api.services.google_drive_service.Credentials')
    def test_create_drive_folder(self, mock_credentials, mock_build):
        """Test creating a Google Drive folder"""
        # Mock Google Drive API
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        
        mock_folder = {
            'id': 'test_folder_id',
            'name': 'Test Folder',
            'webViewLink': 'https://drive.google.com/drive/folders/test_folder_id'
        }
        
        mock_service.files().create().execute.return_value = mock_folder
        
        # Create GoogleDriveService instance
        drive_service = GoogleDriveService()
        
        # Test creating folder for group
        folder = drive_service.create_drive_folder(self.group)
        
        assert folder is not None
        assert folder['id'] == 'test_folder_id'
        assert folder['name'] == 'Test Folder'
        
        # Verify API calls were made
        mock_build.assert_called()
        mock_service.files().create().execute.assert_called()
    
    @patch('api.services.google_drive_service.build')
    @patch('api.services.google_drive_service.Credentials')
    def test_upload_file(self, mock_credentials, mock_build):
        """Test uploading a file to Google Drive"""
        # Mock Google Drive API
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        
        mock_file = {
            'id': 'test_file_id',
            'name': 'test.pdf',
            'mimeType': 'application/pdf'
        }
        
        mock_service.files().create().execute.return_value = mock_file
        
        # Create GoogleDriveService instance
        drive_service = GoogleDriveService()
        
        # Create a mock file
        mock_file_content = b'Test file content'
        
        # Test uploading file
        result = drive_service.upload_file(
            file_content=mock_file_content,
            filename='test.pdf',
            mime_type='application/pdf',
            folder_id='test_folder_id'
        )
        
        assert result is not None
        assert result['id'] == 'test_file_id'
        assert result['name'] == 'test.pdf'
    
    @patch('api.services.google_drive_service.build')
    @patch('api.services.google_drive_service.Credentials')
    def test_convert_to_google_doc(self, mock_credentials, mock_build):
        """Test converting file to Google Doc"""
        # Mock Google Drive API
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        
        mock_doc = {
            'id': 'test_doc_id',
            'name': 'Test Document',
            'mimeType': 'application/vnd.google-apps.document'
        }
        
        mock_service.files().copy().execute.return_value = mock_doc
        
        # Create GoogleDriveService instance
        drive_service = GoogleDriveService()
        
        # Test converting file
        result = drive_service.convert_to_google_doc('test_file_id')
        
        assert result is not None
        assert result['id'] == 'test_doc_id'
        assert result['mimeType'] == 'application/vnd.google-apps.document'
    
    @patch('api.services.google_drive_service.build')
    @patch('api.services.google_drive_service.Credentials')
    def test_generate_export_url(self, mock_credentials, mock_build):
        """Test generating export URL for Google Doc"""
        # Create GoogleDriveService instance
        drive_service = GoogleDriveService()
        
        # Test generating export URL
        export_url = drive_service.generate_export_url('test_doc_id', 'pdf')
        
        expected_url = 'https://docs.google.com/document/d/test_doc_id/export?format=pdf'
        assert export_url == expected_url
    
    @patch('api.services.google_drive_service.build')
    @patch('api.services.google_drive_service.Credentials')
    def test_generate_embed_url(self, mock_credentials, mock_build):
        """Test generating embed URL for Google Doc"""
        # Create GoogleDriveService instance
        drive_service = GoogleDriveService()
        
        # Test generating embed URL
        embed_url = drive_service.generate_embed_url('test_doc_id')
        
        expected_url = 'https://docs.google.com/document/d/test_doc_id/preview'
        assert embed_url == expected_url
    
    @patch('api.services.google_drive_service.build')
    @patch('api.services.google_drive_service.Credentials')
    def test_get_google_doc_edit_url(self, mock_credentials, mock_build):
        """Test getting edit URL for Google Doc"""
        # Create GoogleDriveService instance
        drive_service = GoogleDriveService()
        
        # Test getting edit URL
        edit_url = drive_service.get_google_doc_edit_url('test_doc_id')
        
        expected_url = 'https://docs.google.com/document/d/test_doc_id/edit'
        assert edit_url == expected_url
    
    @patch('api.services.google_drive_service.build')
    @patch('api.services.google_drive_service.Credentials')
    def test_sync_metadata(self, mock_credentials, mock_build):
        """Test syncing document metadata"""
        # Mock Google Drive API
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        
        mock_file_metadata = {
            'id': 'test_file_id',
            'name': 'Test Document',
            'mimeType': 'application/vnd.google-apps.document',
            'modifiedTime': '2023-01-01T10:00:00.000Z',
            'webViewLink': 'https://docs.google.com/document/d/test_file_id/edit'
        }
        
        mock_service.files().get().execute.return_value = mock_file_metadata
        
        # Create GoogleDriveService instance
        drive_service = GoogleDriveService()
        
        # Test syncing metadata
        metadata = drive_service.sync_metadata('test_file_id')
        
        assert metadata is not None
        assert metadata['id'] == 'test_file_id'
        assert metadata['name'] == 'Test Document'
        assert metadata['webViewLink'] is not None
    
    def test_drive_credential_storage(self):
        """Test storing Google Drive credentials"""
        from api.models.drive_models import DriveCredential
        
        # Create drive credential
        credential_data = {
            'token': 'test_token',
            'refresh_token': 'test_refresh_token',
            'token_uri': 'https://oauth2.googleapis.com/token',
            'client_id': 'test_client_id',
            'client_secret': 'test_client_secret'
        }
        
        drive_credential = DriveCredential.objects.create(
            user=self.user,
            credential_type='user',
            token=credential_data,
            refresh_token='test_refresh_token',
            token_uri='https://oauth2.googleapis.com/token',
            client_id='test_client_id',
            client_secret='test_client_secret'
        )
        
        assert drive_credential.user == self.user
        assert drive_credential.credential_type == 'user'
        assert drive_credential.token == credential_data
        assert drive_credential.is_active is True
    
    @patch('api.services.google_drive_service.build')
    @patch('api.services.google_drive_service.Credentials')
    def test_create_thesis_folder_structure(self, mock_credentials, mock_build):
        """Test creating complete thesis folder structure"""
        # Mock Google Drive API
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        
        mock_folder = {
            'id': 'thesis_folder_id',
            'name': 'Test Thesis',
            'webViewLink': 'https://drive.google.com/drive/folders/thesis_folder_id'
        }
        
        mock_service.files().create().execute.return_value = mock_folder
        
        # Create GoogleDriveService instance
        drive_service = GoogleDriveService()
        
        # Test creating thesis folder
        folder = drive_service.create_drive_folder(self.thesis)
        
        assert folder is not None
        assert folder['id'] == 'thesis_folder_id'
        assert folder['name'] == 'Test Thesis'
    
    @patch('api.services.google_drive_service.build')
    @patch('api.services.google_drive_service.Credentials')
    def test_document_version_sync(self, mock_credentials, mock_build):
        """Test syncing document versions with Google Drive"""
        # Mock Google Drive API
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        
        mock_file = {
            'id': 'version_file_id',
            'name': 'Concept Paper v1',
            'mimeType': 'application/vnd.google-apps.document'
        }
        
        mock_service.files().create().execute.return_value = mock_file
        
        # Create GoogleDriveService instance
        drive_service = GoogleDriveService()
        
        # Test creating document version
        from api.models.document_models import Document, DocumentVersion
        
        document = Document.objects.create(
            thesis=self.thesis,
            uploaded_by=self.user,
            provider='google',
            google_doc_id='version_file_id'
        )
        
        version = DocumentVersion.objects.create(
            document=document,
            version=1,
            file_storage_id='version_file_id',
            created_by=self.user
        )
        
        # Test syncing version metadata
        metadata = drive_service.sync_metadata(version.file_storage_id)
        
        assert metadata is not None
        assert metadata['id'] == 'version_file_id'
