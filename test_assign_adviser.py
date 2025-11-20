#!/usr/bin/env python3
"""
Simple test script for assign adviser functionality
"""
import requests
import json

# Configuration
BASE_URL = "http://localhost:8001/api"
ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "admin123"
ADVISER_EMAIL = "adviser@test.com"

def login_admin():
    """Login as admin and get auth token"""
    login_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
    
    if response.status_code == 200:
        token = response.json().get('access')
        print("✓ Admin login successful")
        return token
    else:
        print(f"✗ Admin login failed: {response.status_code}")
        print(response.text)
        return None

def get_auth_headers(token):
    """Get headers with authentication token"""
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

def test_assign_adviser(token):
    """Test assigning an adviser to a group"""
    headers = get_auth_headers(token)
    
    # First, get a list of groups
    response = requests.get(f"{BASE_URL}/groups/", headers=headers)
    
    if response.status_code != 200:
        print(f"✗ Failed to get groups: {response.status_code}")
        print(response.text)
        return False
    
    groups = response.json()
    print(f"Found {len(groups)} groups")
    if not groups:
        print("✗ No groups found to test with")
        return False
    
    group_id = groups[0]['id']
    print(f"✓ Using group {group_id}: {groups[0]['name']}")
    
    # Get advisers
    response = requests.get(f"{BASE_URL}/users/?role=ADVISER", headers=headers)
    
    if response.status_code != 200:
        print(f"✗ Failed to get advisers: {response.status_code}")
        print(response.text)
        return False
    
    advisers = response.json()
    print(f"Found {len(advisers)} advisers")
    if not advisers:
        print("✗ No advisers found to assign")
        return False
    
    adviser_id = advisers[0]['id']
    print(f"✓ Using adviser {adviser_id}: {advisers[0]['email']}")
    
    # Assign adviser
    assign_data = {"adviser_id": adviser_id}
    response = requests.post(
        f"{BASE_URL}/groups/{group_id}/assign_adviser/",
        json=assign_data,
        headers=headers
    )
    
    if response.status_code == 200:
        updated_group = response.json()
        print(f"✓ Successfully assigned adviser to group")
        print(f"  Group: {updated_group['name']}")
        print(f"  Adviser: {updated_group.get('adviser', 'Not assigned')}")
        return True
    else:
        print(f"✗ Failed to assign adviser: {response.status_code}")
        print(response.text)
        return False

def main():
    """Run the test"""
    print("Testing Assign Adviser Functionality")
    print("=" * 40)
    
    # Login as admin
    token = login_admin()
    if not token:
        return
    
    print("\n" + "=" * 40)
    
    # Test assign adviser
    print("\nTesting assign_adviser...")
    test_assign_adviser(token)
    
    print("\n" + "=" * 40)
    print("Testing completed!")

if __name__ == "__main__":
    main()