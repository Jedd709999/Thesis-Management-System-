#!/usr/bin/env python3
"""
Helper script to get authentication token for Google Drive testing
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def register_user():
    """Register a new user"""
    print("=== Registering User ===")
    
    user_data = {
        "email": "testuser@example.com",
        "password": "testpass123",
        "first_name": "Test",
        "last_name": "User",
        "role": "STUDENT"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register/", json=user_data)
        
        if response.status_code == 201:
            print("✓ User registered successfully")
            return True
        elif response.status_code == 400 and "already exists" in response.text:
            print("✓ User already exists")
            return True
        else:
            print(f"✗ Registration failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to server. Make sure Django server is running on localhost:8000")
        return False

def get_auth_token():
    """Get authentication token"""
    print("\n=== Getting Authentication Token ===")
    
    login_data = {
        "email": "testuser@example.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get('access')
            refresh_token = token_data.get('refresh')
            
            print(f"✓ Access token: {access_token}")
            print(f"✓ Refresh token: {refresh_token}")
            
            print(f"\n=== USE THIS TOKEN IN YOUR TEST ===")
            print(f"Replace 'YOUR_TOKEN_HERE' with:")
            print(f"'{access_token}'")
            
            return access_token
        else:
            print(f"✗ Login failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to server. Make sure Django server is running on localhost:8000")
        return None

def main():
    print("Authentication Token Helper")
    print("===========================")
    print("Make sure your Django server is running on localhost:8000")
    print()
    
    # Register user (or use existing)
    if register_user():
        # Get token
        token = get_auth_token()
        
        if token:
            print(f"\n=== SUCCESS ===")
            print(f"Your token is ready to use in test_drive_upload.py")
        else:
            print(f"\n=== FAILED ===")
            print(f"Could not get authentication token")

if __name__ == "__main__":
    main()
