#!/usr/bin/env python3
"""
Test script for admin assignment functionality
"""
import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:8000/api"
ADMIN_EMAIL = "admin12@email.com"
ADMIN_PASSWORD = "admin123"

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
        return False
    
    groups = response.json()
    if not groups:
        print("✗ No groups found to test with")
        return False
    
    group_id = groups[0]['id']
    print(f"✓ Using group {group_id}: {groups[0]['name']}")
    
    # Get advisers
    response = requests.get(f"{BASE_URL}/users/?role=ADVISER", headers=headers)
    
    if response.status_code != 200:
        print(f"✗ Failed to get advisers: {response.status_code}")
        return False
    
    advisers = response.json()
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

def test_assign_panel(token):
    """Test assigning panel members to a group"""
    headers = get_auth_headers(token)
    
    # Get a group
    response = requests.get(f"{BASE_URL}/groups/", headers=headers)
    
    if response.status_code != 200:
        print(f"✗ Failed to get groups: {response.status_code}")
        return False
    
    groups = response.json()
    if not groups:
        print("✗ No groups found to test with")
        return False
    
    group_id = groups[0]['id']
    print(f"✓ Using group {group_id}: {groups[0]['name']}")
    
    # Get panel members
    response = requests.get(f"{BASE_URL}/users/?role=PANEL", headers=headers)
    
    if response.status_code != 200:
        print(f"✗ Failed to get panel members: {response.status_code}")
        return False
    
    panels = response.json()
    if len(panels) < 2:
        print("✗ Need at least 2 panel members for testing")
        return False
    
    panel_ids = [panels[0]['id'], panels[1]['id']]
    print(f"✓ Using panel members: {[p['email'] for p in panels[:2]]}")
    
    # Assign panel members
    assign_data = {"panel_ids": panel_ids}
    response = requests.post(
        f"{BASE_URL}/groups/{group_id}/assign_panel/",
        json=assign_data,
        headers=headers
    )
    
    if response.status_code == 200:
        updated_group = response.json()
        print(f"✓ Successfully assigned panel members to group")
        print(f"  Group: {updated_group['name']}")
        print(f"  Panel members: {len(updated_group.get('panels', []))}")
        return True
    else:
        print(f"✗ Failed to assign panel members: {response.status_code}")
        print(response.text)
        return False

def test_remove_panel(token):
    """Test removing a panel member from a group"""
    headers = get_auth_headers(token)
    
    # Get a group
    response = requests.get(f"{BASE_URL}/groups/", headers=headers)
    
    if response.status_code != 200:
        print(f"✗ Failed to get groups: {response.status_code}")
        return False
    
    groups = response.json()
    if not groups:
        print("✗ No groups found to test with")
        return False
    
    # Find a group with panel members
    group_with_panel = None
    for group in groups:
        if group.get('panels') and len(group['panels']) > 0:
            group_with_panel = group
            break
    
    if not group_with_panel:
        print("✗ No groups with panel members found to test removal")
        return False
    
    group_id = group_with_panel['id']
    panel_to_remove = group_with_panel['panels'][0]
    
    print(f"✓ Using group {group_id}: {group_with_panel['name']}")
    print(f"✓ Removing panel member: {panel_to_remove}")
    
    # Remove panel member
    remove_data = {"panel_id": panel_to_remove}
    response = requests.post(
        f"{BASE_URL}/groups/{group_id}/remove_panel/",
        json=remove_data,
        headers=headers
    )
    
    if response.status_code == 200:
        updated_group = response.json()
        print(f"✓ Successfully removed panel member from group")
        print(f"  Group: {updated_group['name']}")
        print(f"  Remaining panel members: {len(updated_group.get('panels', []))}")
        return True
    else:
        print(f"✗ Failed to remove panel member: {response.status_code}")
        print(response.text)
        return False

def main():
    """Run all tests"""
    print("Testing Admin Assignment Functionality")
    print("=" * 50)
    
    # Login as admin
    token = login_admin()
    if not token:
        sys.exit(1)
    
    print("\n" + "=" * 50)
    
    # Test assign adviser
    print("\n1. Testing assign_adviser...")
    test_assign_adviser(token)
    
    # Test assign panel
    print("\n2. Testing assign_panel...")
    test_assign_panel(token)
    
    # Test remove panel
    print("\n3. Testing remove_panel...")
    test_remove_panel(token)
    
    print("\n" + "=" * 50)
    print("Testing completed!")

if __name__ == "__main__":
    main()
