from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.conf import settings
from api.models.drive_models import DriveCredential, DriveFolder
from api.models.user_models import User
from api.serializers.drive_serializers import DriveCredentialSerializer, DriveFolderSerializer
from api.permissions.role_permissions import IsAdmin
import json
import os

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

    @action(detail=True, methods=['post'], url_path='refresh')
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

    @action(detail=False, methods=['get'], url_path='my_credentials')
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
    
    @action(detail=False, methods=['post'], url_path='connect_google_account')
    def connect_google_account(self, request):
        """Connect a user's Google account for Drive access"""
        try:
            # Get the authorization code or token from the request
            auth_code = request.data.get('code')
            token_data = request.data.get('token')
            
            if not auth_code and not token_data:
                return Response(
                    {'detail': 'Authorization code or OAuth token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # If we have an authorization code, exchange it for tokens
            if auth_code:
                # Use the Google OAuth flow to exchange the authorization code
                from google_auth_oauthlib.flow import Flow
                
                # Use the same redirect URI as used in the frontend OAuth request
                # This should match what's configured in the Google Cloud Console
                # Use the HTTP_ORIGIN header to determine the correct redirect URI
                http_origin = request.META.get('HTTP_ORIGIN', 'http://localhost:5173')
                redirect_uri = f'{http_origin}/oauth-callback.html' if http_origin in ['http://localhost:5173', 'http://localhost:5174'] else 'http://localhost:5173/oauth-callback.html'
                
                # Create OAuth flow
                flow = Flow.from_client_config(
                    {
                        "web": {
                            "client_id": getattr(settings, 'GOOGLE_OAUTH2_CLIENT_ID', None) or getattr(settings, 'GOOGLE_CLIENT_ID', ''),
                            "client_secret": getattr(settings, 'GOOGLE_OAUTH2_CLIENT_SECRET', None) or getattr(settings, 'GOOGLE_CLIENT_SECRET', ''),
                            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                            "token_uri": "https://oauth2.googleapis.com/token"
                        }
                    },
                    scopes=[
                        'https://www.googleapis.com/auth/drive.file',
                        'https://www.googleapis.com/auth/drive.metadata.readonly'
                    ],
                    redirect_uri=redirect_uri
                )
                
                try:
                    # Exchange authorization code for tokens
                    flow.fetch_token(code=auth_code)
                    credentials = flow.credentials
                    
                    # Convert credentials to serializable format
                    token_data = {
                        'token': credentials.token,
                        'refresh_token': credentials.refresh_token,
                        'token_uri': credentials.token_uri,
                        'client_id': credentials.client_id,
                        'client_secret': credentials.client_secret,
                        'scopes': ' '.join(credentials.scopes)
                    }
                except Exception as e:
                    return Response(
                        {'detail': f'Failed to exchange authorization code: {str(e)}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Parse token data if it's a string
            if isinstance(token_data, str):
                token_data = json.loads(token_data)
            
            # Extract token information
            access_token = token_data.get('token')
            refresh_token = token_data.get('refresh_token')
            token_uri = token_data.get('token_uri', 'https://oauth2.googleapis.com/token')
            client_id = token_data.get('client_id')
            client_secret = token_data.get('client_secret')
            scopes = token_data.get('scopes', '')
            
            if not access_token:
                return Response(
                    {'detail': 'Invalid token data'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create or update the user's credentials
            credential, created = DriveCredential.objects.update_or_create(
                user=request.user,
                defaults={
                    'credential_type': 'user',
                    'token': token_data,
                    'refresh_token': refresh_token,
                    'token_uri': token_uri,
                    'client_id': client_id,
                    'client_secret': client_secret,
                    'scopes': scopes,
                    'is_active': True
                }
            )
            
            serializer = self.get_serializer(credential)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'detail': f'Failed to connect Google account: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='disconnect_google_account')
    def disconnect_google_account(self, request):
        """Disconnect a user's Google account"""
        try:
            credential = DriveCredential.objects.get(user=request.user)
            credential.delete()
            return Response(
                {'detail': 'Google account disconnected successfully'},
                status=status.HTTP_200_OK
            )
        except DriveCredential.DoesNotExist:
            return Response(
                {'detail': 'No Google account connected'},
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
