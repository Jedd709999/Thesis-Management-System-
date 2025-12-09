from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from ..models.drive_models import DriveCredential
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)
User = get_user_model()

class GoogleConnect(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        try:
            access_token = request.data.get('access_token')
            expires_in = request.data.get('expires_in')
            scope = request.data.get('scope', '')
            token_type = request.data.get('token_type', 'Bearer')
            
            if not access_token:
                return Response(
                    {'error': 'Access token is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify the token with Google
            try:
                credentials = Credentials(
                    token=access_token,
                    token_uri='https://oauth2.googleapis.com/token',
                    client_id=request.data.get('client_id', ''),
                    client_secret=request.data.get('client_secret', '')
                )
                
                # Test the credentials by making a simple API call
                service = build('oauth2', 'v2', credentials=credentials)
                user_info = service.userinfo().get().execute()
                
                if not user_info.get('email'):
                    raise Exception('Could not retrieve user email from Google')
                
                # Calculate token expiration
                expires_at = timezone.now() + timedelta(seconds=int(expires_in)) if expires_in else None
                
                # Test if credentials are valid for Google Drive API
                try:
                    drive_service = build('drive', 'v3', credentials=credentials)
                    # Try a simple Drive API call to verify access
                    drive_service.files().list(pageSize=1, fields='files(id)').execute()
                except Exception as drive_error:
                    logger.warning(f'Google Drive API access test failed: {str(drive_error)}')
                    # Continue anyway as the user might just need to grant additional permissions
                
                # Save or update the credentials
                with transaction.atomic():
                    DriveCredential.objects.update_or_create(
                        user=request.user,
                        defaults={
                            'token': {
                                'access_token': access_token,
                                'token_type': token_type,
                                'expires_in': expires_in,
                                'scope': scope,
                                'created_at': timezone.now().isoformat(),
                            },
                            'expires_at': expires_at,
                            'is_active': True,
                            'client_id': credentials.client_id,
                            'client_secret': credentials.client_secret,
                            'token_uri': credentials.token_uri,
                            'scopes': scope,
                        }
                    )
                
                return Response({
                    'connected': True,
                    'email': user_info.get('email'),
                    'message': 'Google account connected successfully. You can now use Google Drive integration.'
                })
                
            except Exception as e:
                logger.error(f'Error connecting Google account: {str(e)}')
                error_msg = str(e)
                if 'Invalid Credentials' in error_msg:
                    error_msg = 'Invalid Google credentials. Please try reconnecting your Google account.'
                elif 'insufficient_scope' in error_msg:
                    error_msg = 'Insufficient permissions. Please grant all required Google Drive permissions.'
                elif 'invalid_grant' in error_msg:
                    error_msg = 'Authentication failed. Please try reconnecting your Google account.'
                
                return Response(
                    {'error': f'Failed to connect Google account: {error_msg}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f'Unexpected error in GoogleConnect: {str(e)}')
            return Response(
                {'error': 'An unexpected error occurred while connecting your Google account. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GoogleDisconnect(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        try:
            # Delete the user's DriveCredential
            DriveCredential.objects.filter(user=request.user).delete()
            return Response({
                'connected': False,
                'message': 'Google account disconnected successfully'
            })
        except Exception as e:
            logger.error(f'Error disconnecting Google account: {str(e)}')
            return Response(
                {'error': 'Failed to disconnect Google account'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GoogleStatus(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        try:
            has_credential = DriveCredential.objects.filter(
                user=request.user,
                is_active=True
            ).exists()
            
            return Response({
                'connected': has_credential
            })
            
        except Exception as e:
            logger.error(f'Error checking Google status: {str(e)}')
            return Response(
                {'error': 'Failed to check Google account status'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
