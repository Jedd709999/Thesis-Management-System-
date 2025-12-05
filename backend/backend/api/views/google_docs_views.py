from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from api.services.google_docs_service import google_docs_service
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def google_oauth_url(request):
    """Get Google OAuth authorization URL"""
    try:
        # Use the frontend OAuth callback page as redirect URI
        # This should match what's configured in the Google Cloud Console
        # Use the HTTP_ORIGIN header to determine the correct redirect URI
        http_origin = request.META.get('HTTP_ORIGIN', 'http://localhost:5173')
        redirect_uri = f'{http_origin}/oauth-callback.html' if http_origin in ['http://localhost:5173', 'http://localhost:5174'] else 'http://localhost:5173/oauth-callback.html'
        auth_url, state = google_docs_service.get_authorization_url(redirect_uri)
        
        if auth_url:
            return Response({
                'authorization_url': auth_url,
                'state': state
            })
        else:
            return Response(
                {'error': 'Failed to generate authorization URL'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Error generating OAuth URL: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def google_oauth_callback(request):
    """Handle Google OAuth callback"""
    try:
        code = request.data.get('code')
        state = request.data.get('state')
        
        if not code or not state:
            return Response(
                {'error': 'Code and state are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use the frontend OAuth callback page as redirect URI
        # This should match what's configured in the Google Cloud Console
        # Use the HTTP_ORIGIN header to determine the correct redirect URI
        http_origin = request.META.get('HTTP_ORIGIN', 'http://localhost:5173')
        redirect_uri = f'{http_origin}/oauth-callback.html' if http_origin in ['http://localhost:5173', 'http://localhost:5174'] else 'http://localhost:5173/oauth-callback.html'
        success = google_docs_service.exchange_code_for_tokens(code, state, redirect_uri)
        
        if success:
            return Response({'message': 'Authorization successful'})
        else:
            return Response(
                {'error': 'Failed to exchange authorization code'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        logger.error(f"Error in OAuth callback: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_google_doc(request):
    """Create a new Google Doc"""
    try:
        title = request.data.get('title', 'Untitled Document')
        content = request.data.get('content', '')
        
        result = google_docs_service.create_document(title, content)
        
        if result:
            return Response(result)
        else:
            return Response(
                {'error': 'Failed to create document'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Error creating Google Doc: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_google_doc_content(request, document_id):
    """Get Google Doc content"""
    try:
        document = google_docs_service.get_document_content(document_id)
        
        if document:
            return Response(document)
        else:
            return Response(
                {'error': 'Document not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )
            
    except Exception as e:
        logger.error(f"Error getting Google Doc content: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_google_doc(request, document_id):
    """Update Google Doc content"""
    try:
        requests = request.data.get('requests', [])
        
        if not requests:
            return Response(
                {'error': 'No update requests provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = google_docs_service.update_document(document_id, requests)
        
        if result:
            return Response(result)
        else:
            return Response(
                {'error': 'Failed to update document'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Error updating Google Doc: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def share_google_doc(request, document_id):
    """Share Google Doc with user"""
    try:
        email = request.data.get('email')
        role = request.data.get('role', 'writer')
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = google_docs_service.share_document(document_id, email, role)
        
        if result:
            return Response(result)
        else:
            return Response(
                {'error': 'Failed to share document'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Error sharing Google Doc: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
