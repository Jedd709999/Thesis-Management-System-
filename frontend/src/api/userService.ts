import api from './api'
import { User, UserRole } from '../types'

/**
 * Fetch all users
 */
export async function fetchUsers(params?: {
  role?: string
  search?: string
  is_active?: boolean
}): Promise<User[]> {
  try {
    const res = await api.get('users/', { params })
    // Ensure we always return an array
    if (Array.isArray(res.data)) {
      return res.data;
    } else if (res.data && Array.isArray(res.data.results)) {
      // Handle paginated response
      return res.data.results;
    } else {
      console.warn('Unexpected response format from fetchUsers:', res.data);
      return [];
    }
  } catch (error) {
    console.error('Error in fetchUsers:', error);
    return [];
  }
}

/**
 * Fetch a single user by ID
 */
export async function fetchUser(id: number): Promise<User> {
  const res = await api.get(`users/${id}/`)
  return res.data
}

/**
 * Update a user
 */
export async function updateUser(id: number, data: Partial<User>): Promise<User> {
  const res = await api.patch(`users/${id}/`, data)
  return res.data
}

/**
 * Update current user profile
 */
export async function updateProfile(data: Partial<User> | FormData): Promise<User> {
  const res = await api.patch('users/update_profile/', data)
  return res.data
}

/**
 * Change current user password
 */
export async function changePassword(data: {
  current_password: string
  new_password: string
  confirm_password: string
}): Promise<{ detail: string }> {
  const res = await api.post('users/change_password/', data)
  return res.data
}

/**
 * Search users by query
 */
export async function searchUsers(query: string, role?: string, excludeInGroup?: boolean): Promise<User[]> {
  const params: any = {};
  
  // Add search parameter if query is provided
  if (query) {
    params.search = query;
  }
  
  // Add role parameter if provided
  if (role) {
    params.role = role;
  }
  
  // Add exclude_in_group parameter if requesting students and excludeInGroup is true
  if (excludeInGroup && role === 'STUDENT') {
    params.exclude_in_group = 'true';
  }
  
  // Set a reasonable limit for empty queries
  if (!query || query.trim().length === 0) {
    params.limit = 50;
  }
  
  try {
    const res = await api.get('users/', { params });
    // Ensure we always return an array
    if (Array.isArray(res.data)) {
      return res.data;
    } else if (res.data && Array.isArray(res.data.results)) {
      // Handle paginated response
      return res.data.results;
    } else {
      console.warn('Unexpected response format from searchUsers:', res.data);
      return [];
    }
  } catch (error) {
    console.error('Error in searchUsers:', error);
    return [];
  }
}

/**
 * Get all students (convenience function)
 */
export async function getStudents(excludeInGroup?: boolean): Promise<User[]> {
  try {
    const params: any = { role: 'STUDENT', limit: 100 };
    
    // Add exclude_in_group parameter if excludeInGroup is true
    if (excludeInGroup) {
      params.exclude_in_group = 'true';
    }
    
    const res = await api.get('users/', { params });
    // Ensure we always return an array
    if (Array.isArray(res.data)) {
      return res.data;
    } else if (res.data && Array.isArray(res.data.results)) {
      // Handle paginated response
      return res.data.results;
    } else {
      console.warn('Unexpected response format from getStudents:', res.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching students:', error);
    // Return empty array on error to prevent app crash
    return [];
  }
}

/**
 * Get all advisers (convenience function)
 */
export async function getAdvisers(): Promise<User[]> {
  try {
    const res = await api.get('users/', { params: { role: 'ADVISER', limit: 100 } });
    // Ensure we always return an array
    if (Array.isArray(res.data)) {
      return res.data;
    } else if (res.data && Array.isArray(res.data.results)) {
      // Handle paginated response
      return res.data.results;
    } else {
      console.warn('Unexpected response format from getAdvisers:', res.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching advisers:', error);
    // Return empty array on error to prevent app crash
    return [];
  }
}

// Legacy exports
export const listUsers = fetchUsers
export const getUser = fetchUser
