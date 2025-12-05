from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from rest_auth.registration.views import SocialLoginView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from allauth.socialaccount.models import SocialAccount

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    callback_url = 'http://localhost:3000/oauth/callback'  # Update with your frontend URL

class GoogleConnect(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        # Get the authorization code from the request
        code = request.data.get('code')
        if not code:
            return Response(
                {'error': 'Authorization code is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get or create the social account
            social_account = SocialAccount.objects.get(
                provider='google',
                user=request.user
            )
            # Update the existing social account
            # Note: In a real implementation, you might want to update tokens here
            return Response({
                'message': 'Google account is already connected',
                'connected': True
            })
        except SocialAccount.DoesNotExist:
            # Create a new social account
            SocialAccount.objects.create(
                provider='google',
                uid=request.data.get('uid'),
                user=request.user,
                extra_data={
                    'access_token': request.data.get('access_token'),
                    'token_type': 'Bearer',
                    'expires_at': request.data.get('expires_in'),
                }
            )
            return Response({
                'message': 'Google account connected successfully',
                'connected': True
            })

class GoogleDisconnect(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        try:
            social_account = SocialAccount.objects.get(
                provider='google',
                user=request.user
            )
            social_account.delete()
            return Response({
                'message': 'Google account disconnected successfully',
                'connected': False
            })
        except SocialAccount.DoesNotExist:
            return Response({
                'message': 'No Google account is connected',
                'connected': False
            })
