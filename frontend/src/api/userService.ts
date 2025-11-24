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
  const res = await api.get('users/', { params: { search: query } })
  return res.data
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: UserRole | string): Promise<User[]> {
  const res = await api.get('users/', { params: { role } })
  return res.data
}

/**
 * Get all students (convenience function)
 */
export async function getStudents(): Promise<User[]> {
  return getUsersByRole('STUDENT')
}

/**
 * Get all advisers (convenience function)
 */
export async function getAdvisers(): Promise<User[]> {
  return getUsersByRole('ADVISER')
}

// Legacy exports
export const listUsers = fetchUsers
export const getUser = fetchUser
