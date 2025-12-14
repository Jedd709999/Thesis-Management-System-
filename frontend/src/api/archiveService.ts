import api from './api'
import { ArchiveRecord } from '../types'

/**
 * Fetch all archive records
 */
export async function fetchArchives(params?: {
  thesis_id?: string
  archived_by?: number
  date_from?: string
  date_to?: string
}): Promise<ArchiveRecord[]> {
  const res = await api.get('/archives/', { params })
  return res.data
}

/**
 * Search archive records by query and year
 */
export async function searchArchives(query: string, year: string): Promise<ArchiveRecord[]> {
  const res = await api.get('/archives/search/', { params: { q: query, year } })
  return res.data
}

/**
 * Fetch a single archive record by ID
 */
export async function fetchArchive(id: string): Promise<ArchiveRecord> {
  const res = await api.get(`archives/${id}/`)
  return res.data
}

/**
 * Create a new archive record
 */
export async function createArchive(data: {
  thesis_id: string
  reason: string
  metadata?: Record<string, any>
}): Promise<ArchiveRecord> {
  const res = await api.post('archives/', data)
  return res.data
}

/**
 * Update an archive record
 */
export async function updateArchive(
  id: string,
  data: Partial<{
    reason: string
    metadata: Record<string, any>
  }>
): Promise<ArchiveRecord> {
  const res = await api.patch(`archives/${id}/`, data)
  return res.data
}

/**
 * Delete an archive record
 */
export async function deleteArchive(id: string): Promise<void> {
  await api.delete(`archives/${id}/`)
}

/**
 * Download archive as ZIP
 */
export async function downloadArchive(id: string): Promise<Blob> {
  const res = await api.get(`archives/${id}/download/`, {
    responseType: 'blob'
  })
  return res.data
}