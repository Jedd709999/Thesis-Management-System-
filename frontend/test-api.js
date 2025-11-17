// Test script to verify API configuration
console.log('Testing API configuration...');

// Test the API base URL
const API_BASE = import.meta.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/';
console.log('API_BASE:', API_BASE);

// Test if we can construct a proper URL
const testUrl = `${API_BASE}groups/`;
console.log('Test URL:', testUrl);

// Check if the URL has proper protocol
try {
  const url = new URL(testUrl);
  console.log('Protocol:', url.protocol);
  console.log('Hostname:', url.hostname);
  console.log('Port:', url.port);
  console.log('Pathname:', url.pathname);
  console.log('✅ URL is valid');
} catch (error) {
  console.error('❌ Invalid URL:', error.message);
}
