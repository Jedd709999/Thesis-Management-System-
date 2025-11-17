from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from api.models.document_models import Document
from api.models.thesis_models import Thesis
from api.serializers.document_serializers import DocumentSerializer
from api.permissions.role_permissions import IsStudent, IsDocumentOwnerOrGroupMember
from api.services.google_drive_service import drive_service

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
        """Handle local file upload"""
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
            
            self.perform_create(serializer)
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
            folder_name = f"Thesis_{thesis.id}_{thesis.title[:30]}"
            success, folder_id = drive_service.create_folder(folder_name)
            
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
            
            # Create document record
            document = Document.objects.create(
                thesis=thesis,
                uploaded_by=request.user,
                provider='drive',
                google_drive_file_id=file_info['id'],
                google_drive_embed_url=file_info['embed_url'],
                file_size=int(file_info.get('size', 0)),
                mime_type=file_info.get('mime_type', mime_type)
            )
            
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
            
            # Validate Google Doc URL
            if 'docs.google.com' not in google_doc_url:
                return Response(
                    {'error': 'Invalid Google Doc URL'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get thesis
            thesis = get_object_or_404(Thesis, id=thesis_id)
            
            # Create document record
            document = Document.objects.create(
                thesis=thesis,
                uploaded_by=request.user,
                provider='google',
                google_doc_url=google_doc_url
            )
            
            serializer = self.get_serializer(document)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to link Google Doc: {str(e)}'}, 
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
