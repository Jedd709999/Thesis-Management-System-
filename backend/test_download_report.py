#!/usr/bin/env python
"""
Script to test the download_report endpoint.
"""
import os
import sys
import django
import requests
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()

def test_download_report():
    """Test the download_report endpoint"""

    # Get admin user
    try:
        admin_user = User.objects.get(role='ADMIN')
        print(f"Found admin user: {admin_user.email}")
    except User.DoesNotExist:
        print("No admin user found")
        return

    # Get or create token
    token, created = Token.objects.get_or_create(user=admin_user)
    print(f"Token: {token.key}")

    # Test the endpoint
    url = 'http://localhost:8000/api/archives/download_report/'
    headers = {
        'Authorization': f'Token {token.key}',
        'Content-Type': 'application/json'
    }
    data = {
        'year': '2025',
        'format': 'pdf'
    }

    try:
        response = requests.post(url, json=data, headers=headers)
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")

        if response.status_code == 200:
            print("Download successful!")
            # Save the file
            with open('test_report_2025.pdf', 'wb') as f:
                f.write(response.content)
            print("Report saved as test_report_2025.pdf")
        else:
            print(f"Error: {response.text}")

    except Exception as e:
        print(f"Error calling endpoint: {e}")

if __name__ == '__main__':
    test_download_report()