from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from django.shortcuts import render
from api.models.user_models import User
from api.serializers.user_serializers import UserSerializer, RegisterSerializer, PublicRegisterSerializer
from api.permissions.role_permissions import IsAdmin

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
        user = serializer.save()
        headers = self.get_success_headers(serializer.data)
        return Response({
            'detail': 'Registration successful. Your account is pending admin approval.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED, headers=headers)

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        # Add user data to the response
        if response.status_code == 200:
            # Get the user from the request
            email = request.data.get('email')
            try:
                user = User.objects.get(email=email)
                user_serializer = UserSerializer(user)
                response.data['user'] = user_serializer.data
            except User.DoesNotExist:
                pass
        return response


def oauth_callback(request):
    """Handle OAuth callback from Google"""
    return render(request, 'oauth_callback.html')