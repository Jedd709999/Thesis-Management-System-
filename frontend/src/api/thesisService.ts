import api from './api'
import { Thesis, ThesisFormData } from '../types'

/**
 * Fetch all theses
 */
export async function fetchTheses(): Promise<Thesis[]> {
  const res = await api.get('theses/')
  return res.data
}

/**
 * Fetch a single thesis by ID
 */
export async function fetchThesis(id: string): Promise<Thesis> {
  const res = await api.get(`theses/${id}/`)
  return res.data
}

/**
 * Create a new thesis
 */
export async function createThesis(data: ThesisFormData): Promise<Thesis> {
  const res = await api.post('theses/', data)
  return res.data
}

/**
 * Update a thesis
 */
export async function updateThesis(id: string, data: Partial<ThesisFormData>): Promise<Thesis> {
  const res = await api.patch(`theses/${id}/`, data)
  return res.data
}

/**
 * Delete a thesis
 */
export async function deleteThesis(id: string): Promise<void> {
  await api.delete(`theses/${id}/`)
}

/**
 * Submit thesis for review
 */
export async function submitThesis(id: string): Promise<Thesis> {
  const res = await api.post(`theses/${id}/submit/`)
  return res.data
}

/**
 * Adviser review action
 */
export async function adviserReview(
  id: string,
  action: 'approve_topic' | 'request_revision' | 'reject' | 'approve_thesis',
  feedback?: string
): Promise<Thesis> {
  const res = await api.post(`theses/${id}/adviser_review/`, {
    action,
    feedback
  })
  return res.data
}

// Legacy exports
export const listThesis = fetchTheses
export const getAllTheses = fetchTheses
export const getThesis = fetchThesis
