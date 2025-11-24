from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db import transaction
from api.models.document_models import Document
from api.models.thesis_models import Thesis
from api.serializers.document_serializers import DocumentSerializer
from api.permissions.role_permissions import IsStudent, IsDocumentOwnerOrGroupMember
from api.services.google_drive_service import drive_service
from api.utils.document_utils import handle_document_uploaded, convert_to_google_doc, create_document_version, sync_google_doc_metadata

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all().select_related('thesis','uploaded_by')
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated, IsDocumentOwnerOrGroupMember]

    def create(self, request, *args, **kwargs):
        """Handle both regular file uploads and Google Drive uploads"""
        upload_type = request.data.get('upload_type', 'local')
        
        if upload_type == 'drive':
            return self._handle_drive_upload(request)
        else:
            return self._handle_local_upload(request)
    
    def _handle_local_upload(self, request):
        """Handle local file upload with auto-conversion to Google Doc"""
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Set provider to 'local' for file uploads
            if 'file' in request.FILES:
                serializer.validated_data['provider'] = 'local'
                # Set file size and mime type
                uploaded_file = request.FILES['file']
                serializer.validated_data['file_size'] = uploaded_file.size
                serializer.validated_data['mime_type'] = uploaded_file.content_type
            
            # Save document in a transaction
            with transaction.atomic():
                document = serializer.save(uploaded_by=request.user)
                
                # Auto-convert PDF/DOCX to Google Doc if applicable
                if (document.mime_type in ['application/pdf', 'application/msword', 
                                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
                    and 'file' in request.FILES):
                    file_content = request.FILES['file'].read()
                    success, error = convert_to_google_doc(document, file_content)
                    if not success:
                        print(f"Warning: Failed to convert document to Google Doc: {error}")
                
                # Handle document upload logic
                handle_document_uploaded(document, request.user)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': f'Upload failed: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _handle_drive_upload(self, request):
        """Handle Google Drive upload"""
        try:
            file_obj = request.FILES.get('file')
            thesis_id = request.data.get('thesis')
            
            if not file_obj or not thesis_id:
                return Response(
                    {'error': 'File and thesis ID are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get thesis
            thesis = get_object_or_404(Thesis, id=thesis_id)
            
            # Create a folder for the thesis if it doesn't exist
            success, folder_id, folder_url = drive_service.create_drive_folder(thesis)
            
            if not success:
                return Response(
                    {'error': 'Failed to create Google Drive folder'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Upload file to Google Drive
            file_content = file_obj.read()
            filename = file_obj.name
            mime_type = file_obj.content_type or 'application/octet-stream'
            
            success, file_info = drive_service.upload_file(
                file_content, filename, mime_type, folder_id
            )
            
            if not success:
                return Response(
                    {'error': 'Failed to upload file to Google Drive'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Create document record in a transaction
            with transaction.atomic():
                document = Document.objects.create(
                    thesis=thesis,
                    uploaded_by=request.user,
                    document_type=request.data.get('document_type', 'other'),
                    provider='drive',
                    google_drive_file_id=file_info['id'],
                    viewer_url=file_info['web_view_link'],
                    doc_embed_url=file_info['embed_url'],
                    file_size=int(file_info.get('size', 0)),
                    mime_type=file_info.get('mime_type', mime_type)
                )
                # Handle document upload logic
                handle_document_uploaded(document, request.user)
            
            serializer = self.get_serializer(document)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Drive upload failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='link-google-doc')
    def link_google_doc(self, request):
        """Link a Google Doc URL"""
        try:
            google_doc_url = request.data.get('google_doc_url')
            thesis_id = request.data.get('thesis')
            
            if not google_doc_url or not thesis_id:
                return Response(
                    {'error': 'Google Doc URL and thesis ID are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate Google Doc URL and extract ID
            if 'docs.google.com/document/d/' not in google_doc_url:
                return Response(
                    {'error': 'Invalid Google Doc URL'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Extract Google Doc ID from URL
            import re
            match = re.search(r'/d/([a-zA-Z0-9_-]+)', google_doc_url)
            if not match:
                return Response(
                    {'error': 'Could not extract Google Doc ID from URL'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            google_doc_id = match.group(1)
            
            # Get thesis
            thesis = get_object_or_404(Thesis, id=thesis_id)
            
            # Create document record in a transaction
            with transaction.atomic():
                document = Document.objects.create(
                    thesis=thesis,
                    uploaded_by=request.user,
                    document_type=request.data.get('document_type', 'other'),
                    provider='google',
                    is_google_doc=True,
                    google_doc_id=google_doc_id,
                    google_doc_edit_url=google_doc_url,
                    viewer_url=google_doc_url,
                    doc_embed_url=f"https://docs.google.com/document/d/{google_doc_id}/preview"
                )
                # Handle document upload logic
                handle_document_uploaded(document, request.user)
            
            serializer = self.get_serializer(document)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to link Google Doc: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='create-version')
    def create_version(self, request, pk=None):
        """Create a new version of a document"""
        try:
            document = self.get_object()
            
            # Create new version
            new_document = create_document_version(document, request.user)
            
            serializer = self.get_serializer(new_document)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to create document version: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='sync-metadata')
    def sync_metadata(self, request, pk=None):
        """Sync Google Doc metadata"""
        try:
            document = self.get_object()
            
            # Sync metadata
            success = sync_google_doc_metadata(document)
            
            if success:
                serializer = self.get_serializer(document)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'error': 'Failed to sync Google Doc metadata'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        except Exception as e:
            return Response(
                {'error': f'Failed to sync metadata: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['delete'], url_path='delete-from-drive')
    def delete_from_drive(self, request, pk=None):
        """Delete file from Google Drive and database"""
        try:
            document = self.get_object()
            
            if document.provider == 'drive' and document.google_drive_file_id:
                # Delete from Google Drive
                drive_service.delete_file(document.google_drive_file_id)
            
            # Delete from database
            document.delete()
            
            return Response(
                {'message': 'Document deleted successfully'}, 
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': f'Failed to delete document: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )