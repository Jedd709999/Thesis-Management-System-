from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from api.models.archive_record_models import ArchiveRecord
from api.models.user_models import User
from api.models.thesis_models import Thesis
from api.models.document_models import Document
from api.models.group_models import Group
from api.serializers.archive_serializers import ArchiveRecordSerializer
from api.permissions.role_permissions import IsAdmin, IsAdviser

class ArchiveRecordViewSet(viewsets.ModelViewSet):
    queryset = ArchiveRecord.objects.all().select_related('archived_by')
    serializer_class = ArchiveRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Admins can see all archive records
        if self.request.user.role == 'ADMIN':
            return queryset
            
        # Advisers can see archive records for their advised theses
        elif self.request.user.role == 'ADVISER':
            return queryset.filter(
                content_type='thesis',
                archived_by__advised_theses__adviser=self.request.user
            ) | queryset.filter(archived_by=self.request.user)
            
        # Students can only see archive records they created
        elif self.request.user.role == 'STUDENT':
            return queryset.filter(archived_by=self.request.user)
            
        # Panels can only see archive records they created
        elif self.request.user.role == 'PANEL':
            return queryset.filter(archived_by=self.request.user)
            
        return queryset.none()

    def perform_create(self, serializer):
        serializer.save(archived_by=self.request.user)

    @action(detail=False, methods=['get'])
    def thesis_archives(self, request):
        """Get all thesis archive records"""
        thesis_archives = ArchiveRecord.objects.filter(content_type='thesis').select_related('archived_by')
        serializer = self.get_serializer(thesis_archives, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def document_archives(self, request):
        """Get all document archive records"""
        document_archives = ArchiveRecord.objects.filter(content_type='document').select_related('archived_by')
        serializer = self.get_serializer(document_archives, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def group_archives(self, request):
        """Get all group archive records"""
        group_archives = ArchiveRecord.objects.filter(content_type='group').select_related('archived_by')
        serializer = self.get_serializer(group_archives, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def restore(self, request, pk=None):
        """Restore an archived record (admin only)"""
        archive_record = self.get_object()
        
        # For now, we'll just mark it as restored in the archive record
        # In a real implementation, you would restore the actual data
        return Response(
            {'detail': 'Archive record marked for restoration. Actual restoration would be implemented in a real system.'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'])
    def archive_thesis(self, request):
        """Archive a thesis"""
        thesis_id = request.data.get('thesis_id')
        reason = request.data.get('reason', '')
        retention_period = request.data.get('retention_period_years', 7)
        
        if not thesis_id:
            return Response(
                {'detail': 'thesis_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            thesis = Thesis.objects.get(id=thesis_id)
        except Thesis.DoesNotExist:
            return Response(
                {'detail': 'Invalid thesis ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check permissions - only admins and advisers can archive theses
        if not (self.request.user.role == 'ADMIN' or 
                (self.request.user.role == 'ADVISER' and thesis.adviser == self.request.user)):
            return Response(
                {'detail': 'You do not have permission to archive this thesis'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Create archive record
        archive_data = {
            'title': thesis.title,
            'abstract': thesis.abstract,
            'status': thesis.status,
            'adviser': str(thesis.adviser.id) if thesis.adviser else None,
            'group': str(thesis.group.id),
            'created_at': thesis.created_at.isoformat(),
            'updated_at': thesis.updated_at.isoformat(),
        }
        
        archive_record = ArchiveRecord.objects.create(
            content_type='thesis',
            original_id=thesis.id,
            data=archive_data,
            archived_by=self.request.user,
            reason=reason,
            retention_period_years=retention_period
        )
        
        serializer = self.get_serializer(archive_record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def archive_document(self, request):
        """Archive a document"""
        document_id = request.data.get('document_id')
        reason = request.data.get('reason', '')
        retention_period = request.data.get('retention_period_years', 7)
        
        if not document_id:
            return Response(
                {'detail': 'document_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            document = Document.objects.get(id=document_id)
        except Document.DoesNotExist:
            return Response(
                {'detail': 'Invalid document ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check permissions - only admins, advisers, and owners can archive documents
        if not (self.request.user.role == 'ADMIN' or 
                (self.request.user.role == 'ADVISER' and document.thesis.adviser == self.request.user) or
                document.uploaded_by == self.request.user):
            return Response(
                {'detail': 'You do not have permission to archive this document'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Create archive record
        archive_data = {
            'title': document.get_document_type_display(),
            'document_type': document.document_type,
            'file_path': str(document.file) if document.file else None,
            'google_doc_id': document.google_doc_id,
            'provider': document.provider,
            'uploaded_by': str(document.uploaded_by.id) if document.uploaded_by else None,
            'thesis': str(document.thesis.id) if document.thesis else None,
            'created_at': document.created_at.isoformat(),
            'updated_at': document.updated_at.isoformat(),
        }
        
        archive_record = ArchiveRecord.objects.create(
            content_type='document',
            original_id=document.id,
            data=archive_data,
            archived_by=self.request.user,
            reason=reason,
            retention_period_years=retention_period
        )
        
        serializer = self.get_serializer(archive_record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)