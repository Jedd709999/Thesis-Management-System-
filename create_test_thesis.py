#!/usr/bin/env python3
"""
Helper script to create a test thesis for Google Drive testing
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def get_auth_token():
    """Get authentication token by logging in"""
    login_data = {
        "email": "testuser@example.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get('access')
        else:
            print(f"Login failed: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("Cannot connect to server. Make sure Django server is running on localhost:8000")
        return None

def create_group(token):
    """Create a test group"""
    print("=== Creating Test Group ===")
    
    group_data = {
        "name": "Test Group for Drive Upload",
        "description": "A test group created for testing Google Drive upload functionality"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/groups/",
            json=group_data,
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if response.status_code == 201:
            group = response.json()
            print(f"✓ Group created successfully with ID: {group.get('id')}")
            return group.get('id')
        else:
            print(f"✗ Group creation failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"✗ Error creating group: {e}")
        return None

def create_thesis(token, group_id):
    """Create a test thesis"""
    print(f"=== Creating Test Thesis for Group {group_id} ===")
    
    thesis_data = {
        "title": "Test Thesis for Google Drive Upload",
        "abstract": "This is a test thesis created specifically for testing Google Drive upload functionality in the Thesis Management System.",
        "group": group_id,
        "status": "CONCEPT_SUBMITTED"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/thesis/",
            json=thesis_data,
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if response.status_code == 201:
            thesis = response.json()
            print(f"✓ Thesis created successfully with ID: {thesis.get('id')}")
            return thesis.get('id')
        else:
            print(f"✗ Thesis creation failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"✗ Error creating thesis: {e}")
        return None

def list_theses(token):
    """List existing theses"""
    print("=== Listing Existing Theses ===")
    
    try:
        response = requests.get(
            f"{BASE_URL}/thesis/",
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if response.status_code == 200:
            theses = response.json()
            if isinstance(theses, dict) and 'results' in theses:
                theses = theses['results']
            
            print(f"Found {len(theses)} theses:")
            for thesis in theses:
                print(f"  ID: {thesis.get('id')} - Title: {thesis.get('title')}")
            
            return theses
        else:
            print(f"Failed to list theses: {response.text}")
            return []
            
    except Exception as e:
        print(f"Error listing theses: {e}")
        return []

def main():
    print("Thesis Creation Helper")
    print("======================")
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        print("✗ Could not authenticate")
        return
    
    # Check existing theses
    existing_theses = list_theses(token)
    
    # Look for a thesis with ID 1
    thesis_1 = next((t for t in existing_theses if t.get('id') == 1), None)
    
    if thesis_1:
        print(f"✓ Thesis with ID 1 already exists: {thesis_1.get('title')}")
        return
    else:
        print("No thesis with ID 1 found. Creating one...")
    
    # Create group first
    group_id = create_group(token)
    if not group_id:
        print("✗ Could not create group")
        return
    
    # Create thesis
    thesis_id = create_thesis(token, group_id)
    if thesis_id:
        print(f"\n✓ SUCCESS: Created thesis with ID {thesis_id}")
        if thesis_id == 1:
            print("✓ This thesis can be used for Google Drive testing")
        else:
            print(f"Note: Update your test script to use thesis ID {thesis_id}")
    else:
        print("✗ Could not create thesis")

if __name__ == "__main__":
    main()
