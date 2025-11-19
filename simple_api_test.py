#!/usr/bin/env python3
"""
Simple API connection test
"""
import requests
import sys

BASE_URL = "http://localhost:8000/api"

def test_api_connection():
    """Test basic API connection"""
    try:
        response = requests.get(f"{BASE_URL}/groups/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_login():
    """Test login with different credentials"""
    login_data = {
        "email": "admin12@email.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        print(f"Login Status Code: {response.status_code}")
        print(f"Login Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Login Error: {e}")
        return False

if __name__ == "__main__":
    print("Testing API Connection...")
    test_api_connection()
    
    print("\nTesting Login...")
    test_login()
