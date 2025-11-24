import api from './api'
import { Schedule, ScheduleFormData, PanelAvailability, AutoScheduleRun } from '../types'

/**
 * Fetch all schedules
 */
export async function fetchSchedules(params?: {
  thesis_id?: string
  status?: string
  date_from?: string
  date_to?: string
}): Promise<Schedule[]> {
  const res = await api.get('schedules/', { params })
  return res.data
}

/**
 * Fetch a single schedule by ID
 */
export async function fetchSchedule(id: string): Promise<Schedule> {
  const res = await api.get(`schedules/${id}/`)
  return res.data
}

/**
 * Create a new schedule
 */
export async function createSchedule(data: ScheduleFormData): Promise<Schedule> {
  const res = await api.post('schedules/', data)
  return res.data
}

/**
 * Update a schedule
 */
export async function updateSchedule(id: string, data: Partial<ScheduleFormData>): Promise<Schedule> {
  const res = await api.patch(`schedules/${id}/`, data)
  return res.data
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(id: string): Promise<void> {
  await api.delete(`schedules/${id}/`)
}

/**
 * Cancel a schedule
 */
export async function cancelSchedule(id: string, reason?: string): Promise<Schedule> {
  const res = await api.post(`schedules/${id}/cancel/`, { reason })
  return res.data
}

/**
 * Complete a schedule
 */
export async function completeSchedule(id: string): Promise<Schedule> {
  const res = await api.post(`schedules/${id}/complete/`)
  return res.data
}

/**
 * Fetch panel member availability
 */
export async function fetchPanelAvailability(params?: {
  panel_member_id?: number
  date_from?: string
  date_to?: string
}): Promise<PanelAvailability[]> {
  const res = await api.get('panel-availability/', { params })
  return res.data
}

/**
 * Create panel availability
 */
export async function createPanelAvailability(data: {
  available_date: string
  start_time: string
  end_time: string
  is_available: boolean
  notes?: string
}): Promise<PanelAvailability> {
  const res = await api.post('panel-availability/', data)
  return res.data
}

/**
 * Update panel availability
 */
export async function updatePanelAvailability(
  id: string,
  data: Partial<PanelAvailability>
): Promise<PanelAvailability> {
  const res = await api.patch(`panel-availability/${id}/`, data)
  return res.data
}

/**
 * Delete panel availability
 */
export async function deletePanelAvailability(id: string): Promise<void> {
  await api.delete(`panel-availability/${id}/`)
}

/**
 * Run auto-scheduler
 */
export async function runAutoSchedule(parameters: Record<string, any>): Promise<AutoScheduleRun> {
  const res = await api.post('schedules/auto-run/', { parameters })
  return res.data
}

/**
 * Fetch auto-schedule results
 */
export async function fetchAutoScheduleResults(runId: string): Promise<AutoScheduleRun> {
  const res = await api.get(`schedules/auto-run/${runId}/`)
  return res.data
}

/**
 * Accept an auto-schedule candidate
 */
export async function acceptScheduleCandidate(candidateId: string): Promise<Schedule> {
  const res = await api.post(`schedules/candidates/${candidateId}/accept/`)
  return res.data
}
