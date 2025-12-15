import api from './api'
import { Thesis, ThesisFormData } from '../types'

/**
 * Fetch all theses
 * @param status Optional status to filter theses by (e.g., 'READY_FOR_CONCEPT_DEFENSE')
 */
export async function fetchTheses(status?: string): Promise<Thesis[]> {
  try {
    // Fix: Pass status as a comma-separated string in the params
    const params: { status?: string } = {};
    if (status) {
      params.status = status;
    }
    
    console.log('fetchTheses: Making API call with params:', params);
    const res = await api.get('/theses/', { params });
    console.log('fetchTheses response:', res);
    console.log('fetchTheses response data:', res.data);
    console.log('fetchTheses response data type:', typeof res.data);
    
    // Handle paginated response
    if (res.data && typeof res.data === 'object' && 'results' in res.data) {
      console.log('Returning paginated results:', res.data.results);
      // Ensure we return an array even if results is not an array
      return Array.isArray(res.data.results) ? res.data.results : [];
    }
    
    // Fallback for non-paginated responses
    console.log('Returning direct data:', res.data);
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error('Error fetching theses:', error);
    // Log more details about the error
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
    }
    return []; // Return empty array on error
  }
}

/**
 * Fetch current user's theses (for advisers, panels - theses from their assigned groups)
 */
export async function fetchCurrentUserTheses(): Promise<Thesis[]> {
  try {
    console.log('ThesisService: Fetching current user theses');
    const res = await api.get('/theses/get_current_user_theses/')
    console.log('ThesisService: Current user theses response:', res.data);
    // Ensure we always return an array
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error('Error fetching current user theses:', error);
    return []; // Return empty array on error
  }
}

/**
 * Fetch other theses (for advisers, panels - theses from other groups)
 */
export async function fetchOtherTheses(): Promise<Thesis[]> {
  try {
    console.log('ThesisService: Fetching other theses');
    const res = await api.get('/theses/get_other_theses/')
    console.log('ThesisService: Other theses response:', res.data);
    // Ensure we always return an array
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error('Error fetching other theses:', error);
    return []; // Return empty array on error
  }
}

/**
 * Fetch theses for the current user
 */
export async function fetchUserTheses(): Promise<Thesis[]> {
  try {
    const res = await api.get('theses/user_theses/')
    // Ensure we always return an array
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error('Error fetching user theses:', error);
    return []; // Return empty array on error
  }
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
  console.log('Sending thesis data to backend:', data);
  const res = await api.post('theses/', data)
  console.log('Received response from backend:', res.data);
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

/**
 * Archive a thesis (admin only)
 */
export async function archiveThesis(id: string): Promise<any> {
  const res = await api.post(`theses/${id}/archive/`)
  return res.data
}

import { PanelAction } from '../types';

export const fetchPanelActions = async (thesisId: string): Promise<PanelAction[]> => {
  try {
    console.log('Fetching panel actions for thesis:', thesisId);
    const response = await api.get(`/panel-actions/?thesis=${thesisId}`);
    console.log('Panel actions response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching panel actions:', error);
    throw error;
  }
};

/**
 * Fetch thesis statistics for admin dashboard
 */
export async function fetchThesisStatistics(): Promise<{
  total_theses: number;
  topic_submitted: number;
  topic_approved: number;
  topic_rejected: number;
  concept_submitted: number;
  concept_approved: number;
  proposal_submitted: number;
  proposal_approved: number;
  final_submitted: number;
  final_approved: number;
  archived: number;
}> {
  try {
    console.log('ThesisService: Fetching thesis statistics');
    const res = await api.get('/theses/statistics/')
    console.log('ThesisService: Thesis statistics response:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error fetching thesis statistics:', error);
    throw error;
  }
}

// Legacy exports
export const listThesis = fetchTheses
export const getAllTheses = fetchTheses
export const getThesis = fetchThesis

/**
 * Find similar theses by keywords
 */
export async function findSimilarTheses(thesisId: string): Promise<any> {
  try {
    console.log('ThesisService: Finding similar theses for:', thesisId);
    const res = await api.get(`/theses/find_similar_by_keywords/`, { params: { thesis_id: thesisId } });
    console.log('ThesisService: Similar theses response:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error finding similar theses:', error);
    throw error;
  }
}

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
