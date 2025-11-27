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
  const res = await api.get('users/', { params })
  return res.data
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
export async function updateProfile(data: Partial<User>): Promise<User> {
  const res = await api.patch('auth/me/', data)
  return res.data
}

/**
 * Search users by query
 */
export async function searchUsers(query: string): Promise<User[]> {
  // For empty queries, fetch all users (limited to a reasonable number)
  if (!query || query.trim().length === 0) {
    const res = await api.get('users/', { params: { limit: 50 } });
    return res.data;
  }
  
  // For short queries, still search but with a minimum length requirement
  if (query.trim().length < 2) {
    const res = await api.get('users/', { params: { search: query, limit: 50 } });
    return res.data;
  }
  
  const res = await api.get('users/', { params: { search: query } });
  return res.data;
}

/**
 * Get all students (convenience function)
 */
export async function getStudents(): Promise<User[]> {
  try {
    const res = await api.get('users/', { params: { role: 'STUDENT', limit: 100 } });
    return res.data;
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
    return res.data;
  } catch (error) {
    console.error('Error fetching advisers:', error);
    // Return empty array on error to prevent app crash
    return [];
  }
}

// Legacy exports
export const listUsers = fetchUsers
export const getUser = fetchUser
