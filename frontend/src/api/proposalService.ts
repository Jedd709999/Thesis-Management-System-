import api from './api'
import { TopicProposal, ProposalFormData } from '../types'

/**
 * Fetch all topic proposals
 */
export async function fetchProposals(): Promise<TopicProposal[]> {
  const res = await api.get('/topic-proposals/')
  return res.data
}

/**
 * Fetch a single proposal by ID
 */
export async function fetchProposal(id: string): Promise<TopicProposal> {
  const res = await api.get(`topic-proposals/${id}/`)
  return res.data
}

/**
 * Create a new topic proposal
 */
export async function createProposal(data: ProposalFormData): Promise<TopicProposal> {
  const res = await api.post('topic-proposals/', data)
  return res.data
}

/**
 * Update a topic proposal
 */
export async function updateProposal(id: string, data: Partial<ProposalFormData>): Promise<TopicProposal> {
  const res = await api.patch(`topic-proposals/${id}/`, data)
  return res.data
}

/**
 * Delete a topic proposal
 */
export async function deleteProposal(id: string): Promise<void> {
  await api.delete(`topic-proposals/${id}/`)
}

/**
 * Submit a proposal for review
 */
export async function submitProposal(id: string): Promise<TopicProposal> {
  const res = await api.post(`topic-proposals/${id}/submit/`)
  return res.data
}

/**
 * Review a proposal (Adviser only)
 */
export async function reviewProposal(
  id: string,
  status: 'approved' | 'rejected' | 'needs_revision',
  comments: string
): Promise<TopicProposal> {
  const res = await api.post(`topic-proposals/${id}/review/`, {
    status,
    comments
  })
  return res.data
}

/**
 * Request revisions to a proposal
 */
export async function requestRevision(id: string): Promise<TopicProposal> {
  const res = await api.post(`topic-proposals/${id}/request_revision/`)
  return res.data
}
