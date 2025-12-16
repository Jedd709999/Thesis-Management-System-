from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken, Token
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate, get_user_model
from django.shortcuts import render, get_object_or_404
from django.utils.translation import gettext_lazy as _
from api.models.user_models import User
from api.models.drive_models import DriveCredential
from api.serializers.user_serializers import UserSerializer, RegisterSerializer, PublicRegisterSerializer
from api.permissions.role_permissions import IsAdmin
from api.utils.email_utils import send_verification_email
from api.services.google_drive_service import GoogleDriveService
from rest_framework.exceptions import ValidationError

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

class PublicRegisterView(generics.CreateAPIView):
    """Public registration view - no authentication required, users are not approved by default"""
    queryset = User.objects.all()
    serializer_class = PublicRegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if email already exists
        email = serializer.validated_data.get('email')
        if User.objects.filter(email=email).exists():
            raise ValidationError({'email': _('A user with this email already exists.')})
        
        # Create the user
        user = serializer.save()
        
        # Send verification email
        try:
            email_sent = send_verification_email(user, request)
            email_sent_successfully = email_sent
        except Exception as e:
            # Log the error
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Failed to send verification email: {e}')
            email_sent_successfully = False
        
        headers = self.get_success_headers(serializer.data)
        response_data = {
            'user': UserSerializer(user).data
        }
        
        # Check if email settings are configured
        from django.conf import settings
        email_configured = (
            hasattr(settings, 'EMAIL_HOST') and 
            settings.EMAIL_HOST and 
            settings.EMAIL_HOST != 'localhost' and
            hasattr(settings, 'EMAIL_HOST_USER') and 
            settings.EMAIL_HOST_USER and
            settings.EMAIL_HOST_USER != 'dummy'
        )
        
        if email_configured and email_sent_successfully:
            response_data['detail'] = _('Registration successful. Please check your email to verify your account.')
        elif email_configured and not email_sent_successfully:
            response_data['detail'] = _('Registration successful, but we couldn\'t send the verification email. Please contact support or request a new verification email after logging in.')
            response_data['email_verification_needed'] = True
        else:
            # Email not configured, allow immediate login
            user.is_email_verified = True
            user.save(update_fields=['is_email_verified'])
            response_data['detail'] = _('Registration successful. Email verification is currently disabled, so you can log in immediately.')
            response_data['email_verified'] = True
            
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class CustomTokenObtainPairView(TokenObtainPairView):
    def get_token(self, user):
        """
        Generate a token for the given user.
        """
        return RefreshToken.for_user(user)
        
    def post(self, request, *args, **kwargs):
        # First, try to get the user
        email = request.data.get('email')
        password = request.data.get('password')
        
        user = authenticate(request, email=email, password=password)
        
        # Check if user exists and credentials are valid
        if user is None:
            return Response(
                {'detail': 'No active account found with the given credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if email is verified
        # Only require email verification if email settings are configured
        from django.conf import settings
        email_configured = (
            hasattr(settings, 'EMAIL_HOST') and 
            settings.EMAIL_HOST and 
            settings.EMAIL_HOST != 'localhost' and
            hasattr(settings, 'EMAIL_HOST_USER') and 
            settings.EMAIL_HOST_USER and
            settings.EMAIL_HOST_USER != 'dummy'
        )
        
        if email_configured and not user.is_email_verified:
            return Response(
                {
                    'detail': 'Please verify your email address before logging in.', 
                    'resend_verification': True,
                    'email': user.email,
                    'message': 'Click here to resend verification email'
                },
                status=status.HTTP_403_FORBIDDEN
            )
        elif not email_configured and not user.is_email_verified:
            # If email is not configured, we can allow login but should log a warning
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f'Allowing login for unverified user {user.email} because email is not configured')
        
        # If we get here, user is authenticated and email is verified
        # Generate tokens
        refresh = self.get_token(user)
        
        # Add user data to response
        user_serializer = UserSerializer(user)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': user_serializer.data
        }
        
        # Check if user has Google Drive credentials and attempt to reconnect
        try:
            print(f"Checking Google Drive credentials for user: {user.email}")
            if hasattr(user, 'drive_credentials'):
                print("User has drive_credentials attribute")
                try:
                    drive_credential = user.drive_credentials
                    print(f"Drive credential exists: {bool(drive_credential)}")
                    if drive_credential and drive_credential.is_active:
                        print("Drive credential is active, testing credentials")
                        # Attempt to create a GoogleDriveService to test credentials
                        drive_service = GoogleDriveService(user=user)
                        print(f"GoogleDriveService created, service exists: {bool(drive_service.service)}")
                        if drive_service.service:
                            # Credentials are valid
                            print("Google Drive credentials are valid")
                            data['drive_connected'] = True
                            data['drive_reconnected'] = True
                        else:
                            # Credentials are invalid
                            print("Google Drive credentials are invalid")
                            data['drive_connected'] = True
                            data['drive_reconnected'] = False
                    else:
                        print("Drive credential is not active or doesn't exist")
                        data['drive_connected'] = False
                        data['drive_reconnected'] = False
                except DriveCredential.DoesNotExist:
                    print("DriveCredential.DoesNotExist caught")
                    data['drive_connected'] = False
                    data['drive_reconnected'] = False
            else:
                print("User does not have drive_credentials attribute")
                data['drive_connected'] = False
                data['drive_reconnected'] = False
        except Exception as e:
            # If there's any error checking credentials, just mark as not connected
            data['drive_connected'] = False
            data['drive_reconnected'] = False
            # Log the error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f'Error checking Google Drive credentials for user {user.email}: {e}')
        
        return Response(data, status=status.HTTP_200_OK)


class VerifyEmailView(APIView):
    """Verify user's email address with token"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, user_id, token):
        User = get_user_model()
        try:
            user = User.objects.get(pk=user_id)
            
            if user.is_email_verified:
                return Response(
                    {'detail': _('Email has already been verified.')},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if user.is_verification_token_valid(token):
                user.is_email_verified = True
                user.save(update_fields=['is_email_verified'])
                return Response(
                    {'detail': _('Email verified successfully. You can now log in.')},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'detail': _('Invalid or expired verification link.')},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except (User.DoesNotExist, ValueError):
            return Response(
                {'detail': _('Invalid verification link.')},
                status=status.HTTP_400_BAD_REQUEST
            )

class ResendVerificationEmailView(APIView):
    """Resend verification email to user"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {'email': _('This field is required.')},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            user = User.objects.get(email=email)
            if user.is_email_verified:
                return Response(
                    {'detail': _('This email has already been verified.')},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Generate new token and send email
            user.generate_verification_token()
            try:
                send_verification_email(user, request)
                message = _('Verification email has been resent. Please check your inbox.')
            except Exception as e:
                # Log the error but still return success to avoid revealing if email exists
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f'Failed to send verification email: {e}')
                message = _('If your email is registered, a verification email has been sent. Please check your inbox.')
            
            return Response({
                'detail': message
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # Don't reveal if email exists, just return generic message
            return Response({
                'detail': _('If your email is registered, a verification email has been sent. Please check your inbox.')
            }, status=status.HTTP_200_OK)

def oauth_callback(request):
    """Handle OAuth callback from Google"""
    return render(request, 'oauth_callback.html')
