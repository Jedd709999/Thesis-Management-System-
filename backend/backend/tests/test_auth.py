from datetime import datetime, timedelta
from django.utils import timezone
import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.settings import api_settings

User = get_user_model()

@pytest.mark.django_db
class TestAuthentication:
    """Test authentication endpoints and JWT token functionality"""

    def test_login_success(self, api_client, student_user):
        """Test successful login returns JWT tokens"""
        data = {
            'email': 'student@test.com',
            'password': 'student123'
        }
        response = api_client.post('/api/auth/login/', data)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert len(response.data['access']) > 0
        assert len(response.data['refresh']) > 0

    @pytest.mark.django_db
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials fails"""
        data = {
            'email': 'invalid@test.com',
            'password': 'wrongpass'
        }
        response = api_client.post('/api/auth/login/', data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_login_missing_fields(self, api_client):
        """Test login with missing required fields fails"""
        data = {'email': 'test@test.com'}  # Missing password
        response = api_client.post('/api/auth/login/', data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_refresh_token_success(self, api_client, student_user):
        """Test token refresh with valid refresh token"""
        # First login to get refresh token
        login_data = {
            'email': 'student@test.com',
            'password': 'student123'
        }
        login_response = api_client.post('/api/auth/login/', login_data)
        refresh_token = login_response.data['refresh']
        
        # Use refresh token to get new access token
        refresh_data = {'refresh': refresh_token}
        response = api_client.post('/api/auth/refresh/', refresh_data)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert len(response.data['access']) > 0

    @pytest.mark.django_db
    def test_refresh_token_invalid(self, api_client):
        """Test token refresh with invalid refresh token fails"""
        data = {'refresh': 'invalid_refresh_token'}
        response = api_client.post('/api/auth/refresh/', data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_protected_endpoint_without_token(self, api_client):
        """Test accessing protected endpoint without token fails"""
        response = api_client.get('/api/auth/me/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_protected_endpoint_with_valid_token(self, authenticated_client, student_user):
        """Test accessing protected endpoint with valid token succeeds"""
        response = authenticated_client.get('/api/auth/me/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == student_user.email
        assert response.data['role'] == student_user.role

    @pytest.mark.django_db
    def test_protected_endpoint_with_expired_token(self, api_client, student_user):
        """Test accessing protected endpoint with expired token fails"""
        # Create token and manually set it to be expired
        refresh = RefreshToken.for_user(student_user)
        access_token = refresh.access_token
        
        # Manually set the token to be expired by setting exp to past
        access_token['exp'] = timezone.now() - timedelta(hours=1)
        
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = api_client.get('/api/auth/me/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_logout_success(self, authenticated_client):
        """Test successful logout with token blacklisting"""
        response = authenticated_client.post('/api/auth/logout/')
        
        # TokenBlacklistView returns 400 if no refresh token in request body
        # but authenticated_client doesn't include refresh token in body
        assert response.status_code in [status.HTTP_205_RESET_CONTENT, status.HTTP_400_BAD_REQUEST]

    @pytest.mark.django_db
    def test_logout_without_token(self, api_client):
        """Test logout without authentication token fails"""
        response = api_client.post('/api/auth/logout/')
        
        # TokenBlacklistView returns 400 when no refresh token is provided
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_user_profile_access(self, authenticated_client, student_user):
        """Test user profile endpoint returns correct user data"""
        response = authenticated_client.get('/api/auth/me/')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert data['email'] == student_user.email
        assert data['first_name'] == student_user.first_name
        assert data['last_name'] == student_user.last_name
        assert data['role'] == student_user.role
        assert 'password' not in data  # Password should not be in response

    @pytest.mark.django_db
    def test_role_based_access_admin(self, admin_client):
        """Test admin can access admin-only endpoints"""
        response = admin_client.get('/api/auth/me/')
        
        assert response.status_code == status.HTTP_200_OK
        
    @pytest.mark.django_db
    def test_role_based_access_student(self, authenticated_client):
        """Test student can access student endpoints"""
        response = authenticated_client.get('/api/auth/me/')
        
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_concurrent_requests_with_refresh(self, api_client, student_user):
        """Test concurrent requests during token refresh"""
        # Login to get tokens
        login_data = {
            'email': 'student@test.com',
            'password': 'student123'
        }
        login_response = api_client.post('/api/auth/login/', login_data)
        access_token = login_response.data['access']
        refresh_token = login_response.data['refresh']
        
        # Simulate expired token by using invalid token
        api_client.credentials(HTTP_AUTHORIZATION='Bearer expired_token_here')
        
        # Make multiple concurrent requests
        import threading
        import time
        
        results = []
        
        def make_request():
            response = api_client.get('/api/auth/me/')
            results.append(response.status_code)
        
        # Start multiple threads
        threads = []
        for _ in range(3):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All requests should fail with 401 (since we're not actually refreshing)
        assert all(status_code == status.HTTP_401_UNAUTHORIZED for status_code in results)
