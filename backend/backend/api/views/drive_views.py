from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from api.models.drive_models import DriveCredential, DriveFolder
from api.models.user_models import User
from api.serializers.drive_serializers import DriveCredentialSerializer, DriveFolderSerializer
from api.permissions.role_permissions import IsAdmin

class DriveCredentialViewSet(viewsets.ModelViewSet):
    queryset = DriveCredential.objects.all().select_related('user')
    serializer_class = DriveCredentialSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Admins can see all credentials
        if self.request.user.role == 'ADMIN':
            return queryset
            
        # Users can only see their own credentials
        return queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Users can only create credentials for themselves
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def refresh(self, request, pk=None):
        """Refresh the Google Drive credentials"""
        credential = self.get_object()
        
        # Only the owner or admin can refresh credentials
        if not (self.request.user.role == 'ADMIN' or credential.user == self.request.user):
            return Response(
                {'detail': 'You do not have permission to refresh these credentials'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # In a real implementation, you would refresh the OAuth token here
        # For now, we'll just update the last used timestamp
        credential.update_usage()
        
        return Response(
            {'detail': 'Credentials refreshed successfully'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def my_credentials(self, request):
        """Get the current user's credentials"""
        try:
            credential = DriveCredential.objects.get(user=request.user)
            serializer = self.get_serializer(credential)
            return Response(serializer.data)
        except DriveCredential.DoesNotExist:
            return Response(
                {'detail': 'No credentials found for this user'},
                status=status.HTTP_404_NOT_FOUND
            )


class DriveFolderViewSet(viewsets.ModelViewSet):
    queryset = DriveFolder.objects.all().select_related('owner', 'parent_folder')
    serializer_class = DriveFolderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Admins can see all folders
        if self.request.user.role == 'ADMIN':
            return queryset
            
        # Users can see folders they own or have access to
        return queryset.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['get'])
    def thesis_folders(self, request):
        """Get all thesis folders"""
        thesis_folders = DriveFolder.objects.filter(folder_type='thesis').select_related('owner')
        serializer = self.get_serializer(thesis_folders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def group_folders(self, request):
        """Get all group folders"""
        group_folders = DriveFolder.objects.filter(folder_type='group').select_related('owner')
        serializer = self.get_serializer(group_folders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def archive_folders(self, request):
        """Get all archive folders"""
        archive_folders = DriveFolder.objects.filter(folder_type='archive').select_related('owner')
        serializer = self.get_serializer(archive_folders, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def path(self, request, pk=None):
        """Get the full path of a folder"""
        folder = self.get_object()
        return Response({'path': folder.get_path()})