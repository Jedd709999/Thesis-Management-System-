from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.utils import timezone
import os
from io import BytesIO
from api.models.document_models import Document
from api.models.thesis_models import Thesis
from api.serializers.document_serializers import DocumentSerializer
from api.permissions.role_permissions import IsStudent, IsDocumentOwnerOrGroupMember, CanViewDraftDocuments
from api.services.google_drive_service import GoogleDriveService
from api.utils.document_utils import handle_document_uploaded, convert_to_google_doc, create_document_version, sync_google_doc_metadata

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all().select_related('thesis','uploaded_by')
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated, IsDocumentOwnerOrGroupMember, CanViewDraftDocuments]
    
    def list(self, request, *args, **kwargs):
        """Override list method to disable pagination for documents"""
        # Disable pagination for this endpoint
        self.pagination_class = None
        return super().list(request, *args, **kwargs)
    
    def get_queryset(self):
        """Filter queryset based on user role and document status.
        
        - Students can see all documents they have access to
        - Advisers and panel members can only see 'submitted' or 'approved' documents
        - Admins can see all documents
        """
        queryset = super().get_queryset()
        
        # For list view only
        if self.action == 'list':
            user = self.request.user
            
            print(f"DEBUG: DocumentViewSet.get_queryset - User: {user.email} (ID: {user.id}), Role: {user.role}")
            print(f"DEBUG: DocumentViewSet.get_queryset - Total documents before filtering: {queryset.count()}")
            
            # For non-admin, non-student users (advisers, panel members)
            if user.role in ['ADVISER', 'PANEL']:
                # Show submitted, approved, revision, or rejected documents
                queryset = queryset.filter(status__in=['submitted', 'approved', 'revision', 'rejected'])
                print(f"DEBUG: DocumentViewSet.get_queryset - Filtered for adviser/panel - Count: {queryset.count()}")
            # For students
            elif user.role == 'STUDENT':
                # Students can see all documents they uploaded themselves
                # And documents from their group that are not in draft status
                queryset_before = queryset.count()
                # Get documents uploaded by the user
                user_documents = queryset.filter(uploaded_by=user)
                print(f"DEBUG: DocumentViewSet.get_queryset - Student uploaded documents: {user_documents.count()}")
                
                # Get documents from user's groups that are not draft
                from django.db.models import Q
                group_documents = queryset.filter(
                    thesis__group__members=user
                ).exclude(status='draft')
                print(f"DEBUG: DocumentViewSet.get_queryset - Group documents (non-draft): {group_documents.count()}")
                
                # Combine both querysets
                queryset = user_documents | group_documents
                queryset = queryset.distinct()
                
                print(f"DEBUG: DocumentViewSet.get_queryset - Filtered for student:")
                print(f"  - Before filtering: {queryset_before}")
                print(f"  - After filtering: {queryset.count()}")
                print(f"  - Uploaded by current user: {user_documents.count()}")
                print(f"  - Non-draft group documents: {group_documents.count()}")
                
                # Print all documents for debugging
                for doc in queryset:
                    print(f"  - Document: {doc.title} (ID: {doc.id})")
                    print(f"    - Status: {doc.status}")
                    print(f"    - Uploaded by: {doc.uploaded_by.email} (ID: {doc.uploaded_by.id})")
                    print(f"    - Current user is uploader: {doc.uploaded_by == user}")
                    print(f"    - Thesis group: {doc.thesis.group.name if doc.thesis and doc.thesis.group else 'None'}")
                    if doc.thesis and doc.thesis.group:
                        print(f"    - User is group member: {user in doc.thesis.group.members.all()}")
            
            print(f"DEBUG: DocumentViewSet.get_queryset - Final count: {queryset.count()}")
        
        return queryset
    def create(self, request, *args, **kwargs):
        """Handle both regular file uploads and Google Drive uploads"""
        # Log the incoming request for debugging
        print(f"DEBUG: Document create request received with data: {request.data}")
        print(f"DEBUG: Files in request: {request.FILES}")
        print(f"DEBUG: User: {request.user.email}")
        print(f"DEBUG: User has drive_credentials: {hasattr(request.user, 'drive_credentials')}")
        if hasattr(request.user, 'drive_credentials'):
            creds = request.user.drive_credentials
            print(f"DEBUG: Drive credentials active: {creds.is_active}, expired: {creds.is_expired()}")
            print(f"DEBUG: Drive credentials has refresh_token: {bool(creds.refresh_token)}")
        
        # Log all headers for debugging
        print(f"DEBUG: Request headers: {dict(request.headers)}")
        
        # By default, all uploads go to Google Drive if a thesis folder exists
        # Only use local storage if explicitly requested or if no thesis folder exists
        upload_type = request.data.get('upload_type', 'drive')
        print(f"DEBUG: Upload type: {upload_type}")
        
        if upload_type == 'local':
            return self._handle_local_upload(request)
        else:
            # Default to drive upload (automatic)
            return self._handle_drive_upload(request)
    
    def _validate_file_type(self, file_obj):
        """Validate that only document files are uploaded"""
        if not file_obj:
            return True, ""
        
        # Check file size (100MB limit)
        if file_obj.size > 100 * 1024 * 1024:
            return False, "File size must be less than 100MB"
        
        # Check MIME type for document files only
        valid_mime_types = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        
        if file_obj.content_type not in valid_mime_types:
            return False, "Only PDF and Word documents are allowed"
        
        return True, ""
    
    def _handle_local_upload(self, request):
        """Handle local file upload with auto-upload to Google Drive"""
        print(f"DEBUG: Starting _handle_local_upload with request data: {request.data}")
        try:
            # Log the incoming data for debugging
            print(f"Received document upload request with data: {request.data}")
            print(f"Files in request: {request.FILES}")
            
            # Validate file type if file is provided
            if 'file' in request.FILES:
                is_valid, error_msg = self._validate_file_type(request.FILES['file'])
                if not is_valid:
                    return Response(
                        {'error': error_msg}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Get thesis to check for Google Drive folder
            thesis_id = request.data.get('thesis')
            thesis = None
            if thesis_id:
                thesis = get_object_or_404(Thesis, id=thesis_id)
                print(f"DEBUG: Retrieved thesis {thesis.id} with drive_folder_id: {thesis.drive_folder_id}")
            else:
                print("DEBUG: No thesis ID provided in request")
            
            # Check if we should upload to Google Drive
            # Always attempt Google Drive upload if a thesis exists, regardless of Shared Drive configuration
            if thesis:
                # Ensure thesis has a drive folder, create one if it doesn't exist
                if not thesis.drive_folder_id:
                    # Use the thesis proposer's Google Drive service if available, otherwise fall back to current user
                    from api.services.google_drive_service import GoogleDriveService
                    drive_user = thesis.proposer if thesis.proposer else request.user
                    user_drive_service = GoogleDriveService(user=drive_user)
                    success, folder_id, folder_url = user_drive_service.create_drive_folder(thesis)
                    
                    if not success:
                        # If we can't create a folder, fall back to local storage
                        print(f"Failed to create Google Drive folder, falling back to local storage: {folder_url}")
                        return self._handle_local_fallback(request, thesis)
                    
                    # Refresh the thesis object to get the updated drive_folder_id
                    thesis.refresh_from_db()
                
                # Upload to Google Drive instead of local storage
                result = self._upload_to_drive_from_local(request, thesis)
                # If Google Drive upload fails, the method will handle fallback internally
                return result
            else:
                # Fall back to local storage if no thesis
                return self._handle_local_fallback(request, thesis)
        except Exception as e:
            print(f"Document upload error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Upload failed: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _handle_drive_upload(self, request):
        """Handle Google Drive upload"""
        print(f"DEBUG: Starting _handle_drive_upload with request data: {request.data}")
        print(f"DEBUG: Request FILES: {request.FILES}")
        try:
            file_obj = request.FILES.get('file')
            thesis_id = request.data.get('thesis')
            
            print(f"DEBUG: file_obj: {file_obj}")
            print(f"DEBUG: thesis_id: {thesis_id}")
            
            if not file_obj or not thesis_id:
                print(f"DEBUG: Missing file or thesis_id - file_obj: {file_obj}, thesis_id: {thesis_id}")
                return Response(
                    {'error': 'File and thesis ID are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate file type
            is_valid, error_msg = self._validate_file_type(file_obj)
            if not is_valid:
                return Response(
                    {'error': error_msg}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get thesis
            thesis = get_object_or_404(Thesis, id=thesis_id)
            print(f"DEBUG: Retrieved thesis {thesis.id} with drive_folder_id: {thesis.drive_folder_id}")
            print(f"DEBUG: Thesis title: {thesis.title}")
            print(f"DEBUG: Thesis proposer: {thesis.proposer}")
            
            # Always attempt Google Drive upload regardless of Shared Drive configuration
            print("Proceeding with Google Drive upload.")
            
            # Ensure thesis has a drive folder, create one if it doesn't exist
            if not thesis.drive_folder_id:
                print("DEBUG: Thesis has no drive folder, creating one...")
                # Use the thesis proposer's Google Drive service if available, otherwise fall back to current user
                from api.services.google_drive_service import GoogleDriveService
                drive_user = thesis.proposer if thesis.proposer else request.user
                print(f"DEBUG: Using drive user: {drive_user.email}")
                user_drive_service = GoogleDriveService(user=drive_user)
                success, folder_id, folder_url = user_drive_service.create_drive_folder(thesis)
                
                if not success:
                    # If we can't create a folder, fall back to local storage
                    print(f"Failed to create Google Drive folder, falling back to local storage: {folder_url}")
                    return self._handle_local_fallback(request, thesis)
                
                # Refresh the thesis object to get the updated drive_folder_id
                thesis.refresh_from_db()
                print(f"DEBUG: Thesis folder created, new drive_folder_id: {thesis.drive_folder_id}")
            
            # Upload file to Google Drive using the thesis folder
            file_content = file_obj.read()
            filename = file_obj.name
            mime_type = file_obj.content_type or 'application/octet-stream'
            folder_id = thesis.drive_folder_id  # Use the thesis folder ID
            
            print(f"DEBUG: Uploading file to folder_id: {folder_id} for thesis: {thesis.id}")
            print(f"DEBUG: File details - name: {filename}, size: {len(file_content)}, mime_type: {mime_type}")
            
            # Use user-specific Google Drive service
            from api.services.google_drive_service import GoogleDriveService
            user_drive_service = GoogleDriveService(user=request.user)
            
            # Check if Google Drive service is properly authenticated
            if not user_drive_service.service:
                print("Google Drive service not authenticated, falling back to local storage")
                return self._handle_local_fallback_after_drive_failure(request, thesis, file_content, filename, mime_type)
            
            success, file_info = user_drive_service.upload_file(
                file_content, filename, mime_type, folder_id
            )
            
            print(f"DEBUG: Upload result - success: {success}, file_info: {file_info}")
            
            if not success:
                # If Google Drive upload fails, fall back to local storage
                error_msg = file_info.get('error', 'Unknown error') if isinstance(file_info, dict) else str(file_info)
                print(f"Google Drive upload failed, falling back to local storage: {error_msg}")
                
                # Provide a more informative error message to the user
                if "Service accounts cannot store files" in error_msg:
                    user_error_msg = "Document will be stored locally because Google Drive credentials are not properly configured. "
                    user_error_msg += "To enable Google Drive storage, please connect your Google account through the Settings page."
                    print(f"User-friendly error message: {user_error_msg}")
                elif "Credentials expired and cannot be refreshed" in error_msg:
                    user_error_msg = "Google Drive credentials have expired and cannot be refreshed. Please reconnect your Google Drive account through the Settings page."
                    print(f"User-friendly error message: {user_error_msg}")
                elif "need to refresh the access token" in error_msg:
                    user_error_msg = "Google Drive credentials need to be refreshed. Please reconnect your Google Drive account through the Settings page."
                    print(f"User-friendly error message: {user_error_msg}")
                
                return self._handle_local_fallback_after_drive_failure(request, thesis, file_content, filename, mime_type)
            
            # Create document record in a transaction
            with transaction.atomic():
                # Prepare data for serializer
                document_data = {
                    'thesis': thesis.id,
                    'title': request.data.get('title', ''),
                    'document_type': request.data.get('document_type', 'concept_paper'),
                    'provider': 'drive',
                    'google_drive_file_id': file_info['id'],
                    'viewer_url': file_info['web_view_link'],
                    'doc_embed_url': file_info['embed_url'],
                    'file_size': int(file_info.get('size', 0)) if file_info.get('size') else 0,
                    'mime_type': file_info.get('mime_type', mime_type)
                }
                
                print(f"DEBUG: Creating document with data: {document_data}")
                
                # Create document using serializer to ensure proper validation
                serializer = self.get_serializer(data=document_data)
                if not serializer.is_valid():
                    print(f"Serializer validation errors: {serializer.errors}")
                    return Response(
                        {'error': f'Validation failed: {serializer.errors}'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                document = serializer.save(uploaded_by=request.user)
                
                # Ensure the document is properly linked to the thesis folder
                # Sync metadata to ensure all fields are properly populated
                try:
                    from api.services.google_drive_service import GoogleDriveService
                    sync_service = GoogleDriveService(user=request.user)
                    sync_service.sync_metadata(document)
                    # Refresh document from database to get updated fields
                    document.refresh_from_db()
                except Exception as sync_error:
                    print(f"Warning: Failed to sync document metadata: {sync_error}")
                
                # Handle document upload logic
                handle_document_uploaded(document, request.user)
            
            serializer = self.get_serializer(document)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # If any exception occurs, fall back to local storage
            print(f"Exception during Google Drive upload, falling back to local storage: {str(e)}")
            import traceback
            traceback.print_exc()
            return self._handle_local_fallback(request, thesis)
    
    def _handle_local_fallback(self, request, thesis):
        """Handle fallback to local storage when Google Drive upload fails"""
        try:
            # Validate file type if file is provided
            if 'file' in request.FILES:
                is_valid, error_msg = self._validate_file_type(request.FILES['file'])
                if not is_valid:
                    return Response(
                        {'error': error_msg}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                print(f"Serializer validation errors: {serializer.errors}")
                return Response(
                    {'error': f'Validation failed: {serializer.errors}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
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
                    success, error = convert_to_google_doc(document, file_content, request.user)
                    if not success:
                        print(f"Warning: Failed to convert document to Google Doc: {error}")
                
                # Handle document upload logic
                handle_document_uploaded(document, request.user)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Local fallback error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Local fallback failed: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _handle_local_fallback_after_drive_failure(self, request, thesis, file_content, filename, mime_type):
        """Handle fallback to local storage after Google Drive upload failure"""
        try:
            # Create a temporary file-like object from the content
            from io import BytesIO
            
            # Create a new InMemoryUploadedFile with the content
            file_stream = BytesIO(file_content)
            temp_file = InMemoryUploadedFile(
                file_stream,
                field_name='file',
                name=filename,
                content_type=mime_type,
                size=len(file_content),
                charset=None
            )
            
            # Create a copy of the request data
            request_data = request.data.copy()
            
            # Create a new serializer with the request data
            serializer = self.get_serializer(data=request_data)
            if not serializer.is_valid():
                print(f"Serializer validation errors: {serializer.errors}")
                return Response(
                    {'error': f'Validation failed: {serializer.errors}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set provider to 'local' for file uploads
            serializer.validated_data['provider'] = 'local'
            serializer.validated_data['file_size'] = len(file_content)
            serializer.validated_data['mime_type'] = mime_type
            
            # Save document in a transaction
            with transaction.atomic():
                document = serializer.save(uploaded_by=request.user)
                
                # Auto-convert PDF/DOCX to Google Doc if applicable
                if mime_type in ['application/pdf', 'application/msword', 
                               'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
                    success, error = convert_to_google_doc(document, file_content, request.user)
                    if not success:
                        print(f"Warning: Failed to convert document to Google Doc: {error}")
                
                # Handle document upload logic
                handle_document_uploaded(document, request.user)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Local fallback error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Local fallback failed: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _upload_to_drive_from_local(self, request, thesis):
        """Upload a local file to Google Drive automatically"""
        try:
            file_obj = request.FILES.get('file')
            if not file_obj:
                return Response(
                    {'error': 'File is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Always attempt Google Drive upload regardless of Shared Drive configuration
            print("Proceeding with Google Drive upload.")
            
            # Ensure thesis has a drive folder, create one if it doesn't exist
            if not thesis.drive_folder_id:
                # Use the thesis proposer's Google Drive service if available, otherwise fall back to current user
                from api.services.google_drive_service import GoogleDriveService
                drive_user = thesis.proposer if thesis.proposer else request.user
                user_drive_service = GoogleDriveService(user=drive_user)
                success, folder_id, folder_url = user_drive_service.create_drive_folder(thesis)
                
                if not success:
                    # If we can't create a folder, fall back to local storage
                    print(f"Failed to create Google Drive folder, falling back to local storage: {folder_url}")
                    return self._handle_local_fallback(request, thesis)
                
                # Refresh the thesis object to get the updated drive_folder_id
                thesis.refresh_from_db()
            
            # Save file content to memory so we can retry if Google Drive fails
            file_content = file_obj.read()
            filename = file_obj.name
            mime_type = file_obj.content_type or 'application/octet-stream'
            folder_id = thesis.drive_folder_id  # Use the thesis folder ID
            
            print(f"DEBUG: Uploading file to folder_id: {folder_id} for thesis: {thesis.id}")
            
            # Use user-specific Google Drive service
            from api.services.google_drive_service import GoogleDriveService
            user_drive_service = GoogleDriveService(user=request.user)
            
            # Check if Google Drive service is properly authenticated
            if not user_drive_service.service:
                print("Google Drive service not authenticated, falling back to local storage")
                return self._handle_local_fallback_after_drive_failure(request, thesis, file_content, filename, mime_type)
            
            success, file_info = user_drive_service.upload_file(
                file_content, filename, mime_type, folder_id
            )
            
            print(f"DEBUG: Upload result - success: {success}, file_info: {file_info}")
            
            if not success:
                # If Google Drive upload fails, fall back to local storage
                error_msg = file_info.get('error', 'Unknown error') if isinstance(file_info, dict) else str(file_info)
                print(f"Google Drive upload failed, falling back to local storage: {error_msg}")
                
                # Provide a more informative error message to the user
                if "Service accounts cannot store files" in error_msg:
                    user_error_msg = "Document will be stored locally because Google Drive credentials are not properly configured. "
                    user_error_msg += "To enable Google Drive storage, please connect your Google account through the Settings page."
                    print(f"User-friendly error message: {user_error_msg}")
                elif "Credentials expired and cannot be refreshed" in error_msg:
                    user_error_msg = "Google Drive credentials have expired and cannot be refreshed. Please reconnect your Google Drive account through the Settings page."
                    print(f"User-friendly error message: {user_error_msg}")
                elif "need to refresh the access token" in error_msg:
                    user_error_msg = "Google Drive credentials need to be refreshed. Please reconnect your Google Drive account through the Settings page."
                    print(f"User-friendly error message: {user_error_msg}")
                
                return self._handle_local_fallback_after_drive_failure(request, thesis, file_content, filename, mime_type)
            
            # Create document record in a transaction
            with transaction.atomic():
                # Prepare data for serializer
                document_data = {
                    'thesis': thesis.id,
                    'title': request.data.get('title', ''),
                    'document_type': request.data.get('document_type', 'concept_paper'),
                    'provider': 'drive',
                    'google_drive_file_id': file_info['id'],
                    'viewer_url': file_info['web_view_link'],
                    'doc_embed_url': file_info['embed_url'],
                    'file_size': int(file_info.get('size', 0)) if file_info.get('size') else 0,
                    'mime_type': file_info.get('mime_type', mime_type)
                }
                
                print(f"DEBUG: Creating document with data: {document_data}")
                
                # Create document using serializer to ensure proper validation
                serializer = self.get_serializer(data=document_data)
                if not serializer.is_valid():
                    print(f"Serializer validation errors: {serializer.errors}")
                    return Response(
                        {'error': f'Validation failed: {serializer.errors}'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                document = serializer.save(uploaded_by=request.user)
                
                # Ensure the document is properly linked to the thesis folder
                # Sync metadata to ensure all fields are properly populated
                try:
                    from api.services.google_drive_service import GoogleDriveService
                    sync_service = GoogleDriveService(user=request.user)
                    sync_service.sync_metadata(document)
                    # Refresh document from database to get updated fields
                    document.refresh_from_db()
                except Exception as sync_error:
                    print(f"Warning: Failed to sync document metadata: {sync_error}")
                
                # Handle document upload logic
                handle_document_uploaded(document, request.user)
            
            serializer = self.get_serializer(document)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # If any exception occurs, fall back to local storage
            print(f"Exception during Google Drive upload, falling back to local storage: {str(e)}")
            import traceback
            traceback.print_exc()
            return self._handle_local_fallback(request, thesis)
    
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
                # Prepare data for serializer
                document_data = {
                    'thesis': thesis.id,
                    'title': request.data.get('title', ''),
                    'document_type': request.data.get('document_type', 'concept_paper'),
                    'provider': 'google',
                    'is_google_doc': True,
                    'google_doc_id': google_doc_id,
                    'google_doc_edit_url': google_doc_url,
                    'viewer_url': google_doc_url,
                    'doc_embed_url': f"https://docs.google.com/document/d/{google_doc_id}/preview"
                }
                
                # Create document using serializer to ensure proper validation
                serializer = self.get_serializer(data=document_data)
                if not serializer.is_valid():
                    print(f"Serializer validation errors: {serializer.errors}")
                    return Response(
                        {'error': f'Validation failed: {serializer.errors}'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                document = serializer.save(uploaded_by=request.user)
                
                # Ensure the document is properly linked to the thesis folder
                # Sync metadata to ensure all fields are properly populated
                try:
                    from api.services.google_drive_service import GoogleDriveService
                    sync_service = GoogleDriveService(user=request.user)
                    sync_service.sync_metadata(document)
                    # Refresh document from database to get updated fields
                    document.refresh_from_db()
                except Exception as sync_error:
                    print(f"Warning: Failed to sync document metadata: {sync_error}")
                
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
    
    @action(detail=True, methods=['post'], url_path='link-to-drive')
    def link_to_drive(self, request, pk=None):
        """Link a local document to an existing Google Drive file"""
        try:
            document = self.get_object()
            
            # Check if document is already linked to Google Drive
            if document.provider == 'drive' and document.google_drive_file_id:
                return Response(
                    {'error': 'Document is already linked to Google Drive'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if this is a local document
            if document.provider != 'local':
                return Response(
                    {'error': 'Only local documents can be linked to Google Drive'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if document has a file attached
            if not document.file:
                return Response(
                    {'error': 'Document has no file attached'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the filename from the stored file
            filename = os.path.basename(document.file.name)
            print(f"DEBUG: Looking for file '{filename}' in Google Drive")
            
            # Use user-specific Google Drive service
            from api.services.google_drive_service import GoogleDriveService
            user_drive_service = GoogleDriveService(user=request.user)
            
            # Try to find the file in the thesis folder if it exists
            folder_id = None
            folder_info = "root (main drive)"
            if document.thesis and document.thesis.drive_folder_id:
                folder_id = document.thesis.drive_folder_id
                folder_info = f"thesis folder (ID: {folder_id})"
            
            print(f"DEBUG: Searching in {folder_info}")
            
            # Search for the file in Google Drive
            file_info = user_drive_service.find_file_by_name(filename, folder_id)
            
            if not file_info:
                # Provide more detailed error information
                error_msg = f'Could not find file "{filename}" in Google Drive. '
                error_msg += f'The file was searched for in the {folder_info}. '
                error_msg += 'Please make sure the file exists in Google Drive with the exact same name, '
                error_msg += 'or upload the file to Google Drive first.'
                
                return Response(
                    {'error': error_msg}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            print(f"DEBUG: Found file in Google Drive: {file_info}")
            
            # Update document with Google Drive information
            document.provider = 'drive'
            document.google_drive_file_id = file_info['id']
            document.viewer_url = file_info['web_view_link']
            document.doc_embed_url = file_info['embed_url']
            document.mime_type = file_info['mime_type']
            document.file_size = file_info['size']
            document.last_synced_at = timezone.now()
            
            document.save(update_fields=[
                'provider', 'google_drive_file_id', 'viewer_url', 
                'doc_embed_url', 'mime_type', 'file_size', 'last_synced_at'
            ])
            
            print(f"DEBUG: Document updated with Google Drive info: {document.id}")
            
            serializer = self.get_serializer(document)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"ERROR: Failed to link document to Google Drive: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Failed to link document to Google Drive: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='sync-metadata')
    def sync_metadata(self, request, pk=None):
        """Sync Google Doc metadata"""
        try:
            document = self.get_object()
            
            # Sync metadata
            success = sync_google_doc_metadata(document, request.user)
            
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
    
    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        """Update document status"""
        try:
            document = self.get_object()
            new_status = request.data.get('status')
            
            if not new_status:
                return Response(
                    {'error': 'Status is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Import the utility function
            from api.utils.document_utils import update_document_status
            
            # Update document status
            updated_document = update_document_status(document, new_status, request.user)
            
            serializer = self.get_serializer(updated_document)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to update document status: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        """Delete a document permanently from database and Google Drive if applicable"""
        try:
            document = self.get_object()
            
            # Delete from Google Drive if it's a Google Drive document
            if document.provider == 'drive' and document.google_drive_file_id:
                try:
                    from api.services.google_drive_service import GoogleDriveService
                    drive_service = GoogleDriveService(user=request.user)
                    drive_service.delete_file(document.google_drive_file_id)
                except Exception as e:
                    print(f"Warning: Failed to delete file from Google Drive: {str(e)}")
            
            # Perform hard delete from database
            document.hard_delete()
            
            return Response(
                {'message': 'Document deleted successfully'}, 
                status=status.HTTP_204_NO_CONTENT
            )
            
        except Exception as e:
            return Response(
                {'error': f'Failed to delete document: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['delete'], url_path='delete-from-drive')
    def delete_from_drive(self, request, pk=None):
        """Delete file from Google Drive and database"""
        try:
            document = self.get_object()

            if document.provider == 'drive' and document.google_drive_file_id:
                # Delete from Google Drive
                from api.services.google_drive_service import GoogleDriveService
                drive_service = GoogleDriveService(user=request.user)
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

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def search_documents(self, request):
        """Search documents by title, thesis title, or uploaded by user"""
        query = request.query_params.get('q', '').strip()

        if not query:
            return Response({
                'query': query,
                'results': [],
                'message': 'Please provide a search query',
                'total_results': 0
            })

        # Search in document title, thesis title, and uploader name
        documents = Document.objects.filter(
            Q(title__icontains=query) |
            Q(thesis__title__icontains=query) |
            Q(uploaded_by__first_name__icontains=query) |
            Q(uploaded_by__last_name__icontains=query) |
            Q(uploaded_by__email__icontains=query)
        ).select_related('thesis', 'uploaded_by')

        # Apply user permissions
        user = request.user
        if user.role in ['ADVISER', 'PANEL']:
            # Advisers and panel members can only see submitted/approved documents
            documents = documents.filter(status__in=['submitted', 'approved', 'revision', 'rejected'])
        elif user.role == 'STUDENT':
            # Students can see documents they have access to
            documents = documents.exclude(
                ~Q(uploaded_by=user),
                status='draft'
            )

        results = []
        for doc in documents:
            results.append({
                'id': str(doc.id),
                'title': doc.title,
                'document_type': doc.document_type,
                'status': doc.status,
                'provider': doc.provider,
                'file_size': doc.file_size,
                'mime_type': doc.mime_type,
                'created_at': doc.created_at.isoformat(),
                'thesis_title': doc.thesis.title if doc.thesis else None,
                'thesis_id': str(doc.thesis.id) if doc.thesis else None,
                'uploaded_by': {
                    'id': str(doc.uploaded_by.id),
                    'name': f"{doc.uploaded_by.first_name} {doc.uploaded_by.last_name}",
                    'email': doc.uploaded_by.email
                },
                'viewer_url': doc.viewer_url,
                'doc_embed_url': doc.doc_embed_url
            })

        return Response({
            'query': query,
            'results': results,
            'message': f"Found {len(results)} document(s) matching '{query}'",
            'total_results': len(results)
        })

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        """Download a document file"""
        try:
            document = self.get_object()

            # Check if user has permission to download this document
            if not self._user_can_download(request.user, document):
                return Response(
                    {'error': 'You do not have permission to download this document'},
                    status=status.HTTP_403_FORBIDDEN
                )

            if document.provider == 'drive' and document.google_drive_file_id:
                # Download from Google Drive
                return self._download_from_drive(document, request.user)
            elif document.provider == 'local' and document.file:
                # Download from local storage
                return self._download_from_local(document)
            elif document.provider == 'google' and document.google_doc_id:
                # For Google Docs, redirect to the document URL
                return Response(
                    {'redirect_url': document.viewer_url},
                    status=status.HTTP_302_FOUND
                )
            else:
                return Response(
                    {'error': 'Document file not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        except Exception as e:
            print(f"Download error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Failed to download document: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _user_can_download(self, user, document):
        """Check if user can download the document"""
        # Admins can download everything
        if user.role == 'ADMIN':
            return True

        # Users can download their own documents
        if document.uploaded_by == user:
            return True

        # Advisers and panel members can download submitted/approved documents
        if user.role in ['ADVISER', 'PANEL']:
            return document.status in ['submitted', 'approved', 'revision', 'rejected']

        # Students can download documents they have access to
        if user.role == 'STUDENT':
            # Students can download their own documents or documents from their groups
            if document.uploaded_by == user:
                return True

            # Check if student is in the same group as the document's thesis
            if document.thesis:
                from api.models.group_models import GroupMember
                return GroupMember.objects.filter(
                    group__thesis=document.thesis,
                    user=user
                ).exists()

        return False

    def _download_from_drive(self, document, user):
        """Download file from Google Drive"""
        try:
            from api.services.google_drive_service import GoogleDriveService
            drive_service = GoogleDriveService(user=user)

            # Download the file content
            success, file_content = drive_service.download_file(document.google_drive_file_id)

            if not success:
                return Response(
                    {'error': f'Failed to download from Google Drive: {file_content}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Create response with file content
            from django.http import HttpResponse
            response = HttpResponse(file_content, content_type=document.mime_type or 'application/octet-stream')

            # Set content disposition for download
            filename = document.title or f"document_{document.id}"
            if document.mime_type == 'application/pdf':
                filename += '.pdf'
            elif document.mime_type in ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
                filename += '.docx' if 'vnd.openxmlformats' in document.mime_type else '.doc'

            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Content-Length'] = len(file_content)

            return response

        except Exception as e:
            print(f"Google Drive download error: {str(e)}")
            return Response(
                {'error': f'Failed to download from Google Drive: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _download_from_local(self, document):
        """Download file from local storage"""
        try:
            if not document.file or not document.file.path:
                return Response(
                    {'error': 'Local file not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Open and read the file
            with open(document.file.path, 'rb') as f:
                file_content = f.read()

            # Create response with file content
            from django.http import HttpResponse
            response = HttpResponse(file_content, content_type=document.mime_type or 'application/octet-stream')

            # Set content disposition for download
            filename = document.title or f"document_{document.id}"
            if document.mime_type == 'application/pdf':
                filename += '.pdf'
            elif document.mime_type in ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
                filename += '.docx' if 'vnd.openxmlformats' in document.mime_type else '.doc'

            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Content-Length'] = len(file_content)

            return response

        except FileNotFoundError:
            return Response(
                {'error': 'File not found on server'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Local file download error: {str(e)}")
            return Response(
                {'error': f'Failed to download local file: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
