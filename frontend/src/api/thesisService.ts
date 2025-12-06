import api from './api'
import { Thesis, ThesisFormData } from '../types'

/**
 * Fetch all theses
 */
export async function fetchTheses(): Promise<Thesis[]> {
  const res = await api.get('/theses/')
  return res.data
}

/**
 * Fetch current user's theses (for advisers, panels - theses from their assigned groups)
 */
export async function fetchCurrentUserTheses(): Promise<Thesis[]> {
  console.log('ThesisService: Fetching current user theses');
  const res = await api.get('/theses/get_current_user_theses/')
  console.log('ThesisService: Current user theses response:', res.data);
  return res.data
}

/**
 * Fetch other theses (for advisers, panels - theses from other groups)
 */
export async function fetchOtherTheses(): Promise<Thesis[]> {
  console.log('ThesisService: Fetching other theses');
  const res = await api.get('/theses/get_other_theses/')
  console.log('ThesisService: Other theses response:', res.data);
  return res.data
}

/**
 * Fetch theses for the current user
 */
export async function fetchUserTheses(): Promise<Thesis[]> {
  const res = await api.get('theses/user_theses/')
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
  action: 'approve_topic' | 'request_revision' | 'reject' | 'approve_thesis' | 'approve_proposal' | 'approve_final',
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

/**
 * Search for thesis topics by keyword to prevent duplication
 */
export async function searchTopics(query: string): Promise<{
  query: string;
  exists: boolean;
  results: Array<{
    id: string;
    title: string;
    abstract: string;
    keywords: string;
    status: string;
    status_display: string;
    // Group information
    group_name: string | null;
    group_leader: string | null;
    group_leader_email: string | null;
    // People involved
    proposer_name: string | null;
    proposer_email: string | null;
    adviser_name: string | null;
    adviser_email: string | null;
    panel_members: string[];
    group_members: string[];
    // Dates
    created_at: string;
    updated_at: string;
    created_date_display: string;
    created_time_display: string;
    // Location
    location: string;
  }>;
  message: string;
  total_results: number;
}> {
  const res = await api.get('/theses/search_topics/', { params: { q: query } });
  return res.data;
}
