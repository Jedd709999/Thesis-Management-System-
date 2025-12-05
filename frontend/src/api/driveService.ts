import api from './api'
import { DriveCredential, DriveFolder } from '../types'

/**
 * Fetch all drive credentials
 */
export async function fetchDriveCredentials(): Promise<DriveCredential[]> {
  const res = await api.get('/drive-credentials/')
  return res.data
}

/**
 * Fetch a single drive credential by ID
 */
export async function fetchDriveCredential(id: string): Promise<DriveCredential> {
  const res = await api.get(`/drive-credentials/${id}/`)
  return res.data
}

/**
 * Create a new drive credential
 */
export async function createDriveCredential(data: {
  name: string
  credential_type: 'oauth'
  client_id?: string
  credentials_json: Record<string, any>
}): Promise<DriveCredential> {
  const res = await api.post('/drive-credentials/', data)
  return res.data
}

/**
 * Update a drive credential
 */
export async function updateDriveCredential(
  id: string,
  data: Partial<DriveCredential>
): Promise<DriveCredential> {
  const res = await api.patch(`/drive-credentials/${id}/`, data)
  return res.data
}

/**
 * Delete a drive credential
 */
export async function deleteDriveCredential(id: string): Promise<void> {
  await api.delete(`/drive-credentials/${id}/`)
}

/**
 * Fetch all drive folders
 */
export async function fetchDriveFolders(): Promise<DriveFolder[]> {
  const res = await api.get('/drive-folders/')
  return res.data
}

/**
 * Fetch a single drive folder by ID
 */
export async function fetchDriveFolder(id: string): Promise<DriveFolder> {
  const res = await api.get(`/drive-folders/${id}/`)
  return res.data
}

/**
 * Create a new drive folder
 */
export async function createDriveFolder(data: Partial<DriveFolder>): Promise<DriveFolder> {
  const res = await api.post('/drive-folders/', data)
  return res.data
}

/**
 * Update a drive folder
 */
export async function updateDriveFolder(
  id: string,
  data: Partial<DriveFolder>
): Promise<DriveFolder> {
  const res = await api.patch(`/drive-folders/${id}/`, data)
  return res.data
}

/**
 * Delete a drive folder
 */
export async function deleteDriveFolder(id: string): Promise<void> {
  await api.delete(`/drive-folders/${id}/`)
}