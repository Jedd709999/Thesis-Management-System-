import api from './api'
import { Schedule, ScheduleFormData, PanelAvailability } from '../types'

/**
 * Fetch all schedules
 */
export async function fetchSchedules(params?: {
  thesis_id?: string
  status?: string
  date_from?: string
  date_to?: string
}): Promise<Schedule[]> {
  try {
    const res = await api.get('/schedules/', { params })
    console.log('fetchSchedules response:', res);
    
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
    console.error('Error fetching schedules:', error);
    // Log more details about the error
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
    }
    return []; // Return empty array on error
  }
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
  // Log the incoming data for debugging
  console.log('Creating schedule with data:', data);
  
  // Log the raw date_time value
  console.log('Raw date_time value:', data.date_time);
  
  // Transform data to match backend's expected format
  // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO format
  const startDateTime = new Date(data.date_time);
  const endDateTime = new Date(startDateTime.getTime() + (data.duration_minutes * 60000));
  
  // Log the parsed dates for debugging
  console.log('Parsed start date:', startDateTime);
  console.log('Parsed end date:', endDateTime);
  console.log('Is start date valid:', !isNaN(startDateTime.getTime()));
  console.log('Is end date valid:', !isNaN(endDateTime.getTime()));
  
  // Validate dates
  if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
    throw new Error('Invalid date format provided');
  }
  
  // Ensure start is before end
  if (startDateTime >= endDateTime) {
    throw new Error('Start time must be before end time');
  }
  
  const requestData = {
    thesis: data.thesis_id,
    start: startDateTime.toISOString(),
    end: endDateTime.toISOString(),
    location: data.location,
    notes: data.notes,
    panel_members: data.panel_ids,
    status: data.status || 'scheduled'
  };
  
  // Log the request data for debugging
  console.log('Sending request data:', requestData);
  
  try {
    const res = await api.post('schedules/', requestData);
    console.log('Schedule creation response:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error creating schedule:', error);
    throw error;
  }
}

/**
 * Update a schedule
 */
export async function updateSchedule(id: string, data: Partial<ScheduleFormData>): Promise<Schedule> {
  // Transform data to match backend's expected format if date_time is provided
  const transformedData: any = { ...data };
  
  if (data.date_time) {
    // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO format
    const startDateTime = new Date(data.date_time);
    transformedData.start = startDateTime.toISOString();
    
    if (data.duration_minutes) {
      const endDateTime = new Date(startDateTime.getTime() + (data.duration_minutes * 60000));
      transformedData.end = endDateTime.toISOString();
    }
    
    // Remove date_time and duration_minutes from transformed data as they're not backend fields
    delete transformedData.date_time;
    delete transformedData.duration_minutes;
  }
  
  const res = await api.patch(`schedules/${id}/`, transformedData);
  return res.data;
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
  const res = await api.get('/panel-availability/', { params })
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