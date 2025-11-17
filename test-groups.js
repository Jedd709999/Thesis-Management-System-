// Test script to check group API endpoint
console.log('Testing group API endpoint...');

// Test the API base URL
const API_BASE = import.meta.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/';
console.log('API_BASE:', API_BASE);

// Check if user is authenticated
const token = localStorage.getItem('access_token');
console.log('Has token:', !!token);

if (token) {
  // Test getting current user groups
  fetch(`${API_BASE}groups/get_current_user_groups/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('Response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('User groups:', data);
    if (data.length > 0) {
      console.log('✅ User has groups:', data.map(g => g.name));
    } else {
      console.log('❌ No groups found for user');
    }
  })
  .catch(error => {
    console.error('❌ Error fetching groups:', error);
  });
} else {
  console.log('❌ No authentication token found');
}
