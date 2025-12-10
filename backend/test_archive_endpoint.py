#!/usr/bin/env python
"""
Test script to verify the archive download_report endpoint is working correctly.
"""

import os
import sys
import django
import json

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Temporarily add testserver to ALLOWED_HOSTS for testing
from django.conf import settings
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def test_archive_endpoint():
    """Test the archive download_report endpoint"""
    print("=== Testing Archive Download Report Endpoint ===")
    
    # Create a test admin user
    try:
        admin_user = User.objects.get(email='admin@example.com')
        print(f"Found existing admin user: {admin_user.email}")
    except User.DoesNotExist:
        admin_user = User.objects.create_user(
            email='admin@example.com',
            password='admin123',
            first_name='Admin',
            last_name='User',
            role='ADMIN',
            is_approved=True,
            is_staff=True
        )
        print(f"Created new admin user: {admin_user.email}")
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(admin_user)
    access_token = str(refresh.access_token)
    print(f"Generated access token: {access_token[:10]}...")
    
    # Create API client
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    # Test the download_report endpoint
    url = '/api/archives/download_report/'
    data = {
        'year': '2025',
        'format': 'pdf'
    }
    
    print(f"Making POST request to {url} with data: {data}")
    
    try:
        response = client.post(url, data, format='json')
        print(f"Response status code: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("SUCCESS: Download report endpoint is working!")
            print("Content-Type:", response.headers.get('Content-Type', 'Unknown'))
            print("Content-Disposition:", response.headers.get('Content-Disposition', 'Unknown'))
        elif response.status_code == 400:
            print("BAD REQUEST: Check the request data")
            try:
                error_data = response.json()
                print(f"Error details: {error_data}")
            except:
                print("Could not parse error response")
        elif response.status_code == 403:
            print("FORBIDDEN: Check user permissions")
            try:
                error_data = response.json()
                print(f"Error details: {error_data}")
            except:
                print("Could not parse error response")
        else:
            print(f"UNEXPECTED RESPONSE: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data}")
            except:
                print("Could not parse error response")
                
    except Exception as e:
        print(f"ERROR: Exception occurred during request: {e}")
        import traceback
        traceback.print_exc()
    
    print("=== Test Completed ===")

if __name__ == "__main__":
    test_archive_endpoint()