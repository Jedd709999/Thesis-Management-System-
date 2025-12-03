import api from './api'
import { Evaluation, EvaluationFormData, ApprovalSheet, ApprovalFormData } from '../types'

/**
 * Fetch all evaluations
 */
export async function fetchEvaluations(thesisId?: string): Promise<Evaluation[]> {
  const params = thesisId ? { thesis: thesisId } : {}
  const res = await api.get('/evaluations/', { params })
  return res.data
}

/**
 * Fetch a single evaluation by ID
 */
export async function fetchEvaluation(id: string): Promise<Evaluation> {
  const res = await api.get(`evaluations/${id}/`)
  return res.data
}

/**
 * Create a new evaluation
 */
export async function createEvaluation(data: EvaluationFormData): Promise<Evaluation> {
  const res = await api.post('evaluations/', data)
  return res.data
}

/**
 * Update an evaluation
 */
export async function updateEvaluation(id: string, data: Partial<EvaluationFormData>): Promise<Evaluation> {
  const res = await api.patch(`evaluations/${id}/`, data)
  return res.data
}

/**
 * Delete an evaluation
 */
export async function deleteEvaluation(id: string): Promise<void> {
  await api.delete(`evaluations/${id}/`)
}

/**
 * Fetch all approval sheets
 */
export async function fetchApprovalSheets(thesisId?: string): Promise<ApprovalSheet[]> {
  const params = thesisId ? { thesis: thesisId } : {}
  const res = await api.get('/approval-sheets/', { params })
  return res.data
}

/**
 * Fetch a single approval sheet by ID
 */
export async function fetchApprovalSheet(id: string): Promise<ApprovalSheet> {
  const res = await api.get(`approval-sheets/${id}/`)
  return res.data
}

/**
 * Create a new approval sheet
 */
export async function createApprovalSheet(data: ApprovalFormData): Promise<ApprovalSheet> {
  const formData = new FormData()
  formData.append('thesis_id', data.thesis_id)
  formData.append('decision', data.decision)
  formData.append('comments', data.comments)
  
  if (data.attached_file) {
    formData.append('attached_file', data.attached_file)
  }
  
  const res = await api.post('approval-sheets/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return res.data
}

/**
 * Update an approval sheet
 */
export async function updateApprovalSheet(
  id: string,
  data: Partial<ApprovalFormData>
): Promise<ApprovalSheet> {
  const formData = new FormData()
  
  if (data.decision) formData.append('decision', data.decision)
  if (data.comments) formData.append('comments', data.comments)
  if (data.attached_file) formData.append('attached_file', data.attached_file)
  
  const res = await api.patch(`approval-sheets/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return res.data
}

/**
 * Delete an approval sheet
 */
export async function deleteApprovalSheet(id: string): Promise<void> {
  await api.delete(`approval-sheets/${id}/`)
}

/**
 * Approve an approval sheet
 */
export async function approveSheet(id: string, signature?: string): Promise<ApprovalSheet> {
  const res = await api.post(`approval-sheets/${id}/approve/`, { signature })
  return res.data
}
