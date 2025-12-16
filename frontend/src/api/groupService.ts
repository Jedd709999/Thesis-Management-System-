import api from './api'
import { Group, GroupFormData, User } from '../types'
/**
 * Fetch all groups (approved only for non-admins)
 */
export async function fetchGroups(params?: {
  search?: string
  keywords?: string
  topics?: string
  status?: string
  adviser?: string
}): Promise<Group[]> {
  console.log('GroupService: Fetching groups with params:', params);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.get('/groups/', { params })
  console.log('GroupService: Groups response received', res);
  
  // Log the response data structure for debugging
  console.log('GroupService: Response data:', res.data);
  
  // Check if the response data is an array
  let result: Group[] = [];
  if (Array.isArray(res.data)) {
    result = res.data;
  } else if (res.data && Array.isArray(res.data.results)) {
    // Handle paginated response
    result = res.data.results;
  } else if (res.data) {
    // If it's a single group, return it as an array with one item
    result = [res.data];
  }
  
  // Log group IDs to check for duplicates
  console.log('GroupService: Group IDs:', result.map(g => g.id));
  
  // Check for duplicates in the response
  const groupIds = Array.isArray(result) ? result.map(g => g.id) : [];
  const uniqueGroupIds = [...new Set(groupIds)];
  if (Array.isArray(groupIds) && Array.isArray(uniqueGroupIds) && groupIds.length !== uniqueGroupIds.length) {
    console.warn('GroupService: Duplicate groups found in groups response');
    console.log('GroupService: Duplicate IDs:', groupIds.filter((id, index) => groupIds.indexOf(id) !== index));
  }
  
  // Deduplicate groups and ensure proper structure
  const deduplicatedGroups = result.reduce((acc: Group[], group) => {
    // Check if a group with this ID already exists
    const existingIndex = acc.findIndex(g => g.id === group.id);
    if (existingIndex === -1) {
      // If not found, add it to the accumulator
      acc.push(group);
    } else {
      // If found, merge the data (in case one has more complete information)
      acc[existingIndex] = { ...acc[existingIndex], ...group };
    }
    return acc;
  }, [] as Group[]);
  
  // Ensure members is always an array
  const processedGroups = deduplicatedGroups.map(group => ({
    ...group,
    members: Array.isArray(group.members) ? group.members : [],
    panels: Array.isArray(group.panels) ? group.panels : [],
    adviser: group.adviser || null
  }));
  
  // Log detailed group information
  processedGroups.forEach((group, index) => {
    console.log(`GroupService: Group ${index} details:`, {
      id: group.id,
      name: group.name,
      members: group.members,
      membersType: typeof group.members,
      membersLength: Array.isArray(group.members) ? group.members.length : 'Not an array'
    });
  });
  
  // Ensure we always return an array
  return processedGroups;
}

/**
 * Fetch a single group by ID
 */
export async function fetchGroup(id: string): Promise<Group> {
  console.log('GroupService: Fetching group:', id);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  try {
    const res = await api.get(`groups/${id}/`)
    console.log('GroupService: Group response received', res);
    return res.data
  } catch (error: any) {
    console.error('GroupService: Error fetching group:', id, error);
    throw new Error(`Failed to fetch group ${id}: ${error.message || error}`);
  }
}

/**
 * Create a new group (student creates a proposal)
 */
export async function createGroup(data: GroupFormData): Promise<Group> {
  console.log('GroupService: Creating group with data:', data);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  
  // Process the data to ensure correct format
  const processedData = {
    ...data,
    // Ensure adviser_id is either a string or null/undefined
    adviser_id: data.adviser_id ? String(data.adviser_id) : null,
    // Ensure member_ids are strings
    member_ids: data.member_ids ? data.member_ids.map(id => {
      // If it's already a string that looks like a UUID, keep it as is
      if (typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return id;
      }
      // Otherwise convert to string (handles both numbers and non-UUID strings)
      return String(id);
    }) : []
  };
  
  const res = await api.post('groups/', processedData)
  console.log('GroupService: Create group response received', res);
  return res.data
}
/**
 * Update a group
 */
export async function updateGroup(id: string, data: Partial<GroupFormData>): Promise<Group> {
  console.log('GroupService: Updating group:', id, 'with data:', data);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.patch(`groups/${id}/`, data)
  console.log('GroupService: Update group response received', res);
  return res.data
}

/**
 * Delete a group
 */
export async function deleteGroup(id: string): Promise<void> {
  console.log('GroupService: Deleting group:', id);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  await api.delete(`groups/${id}/`)
  console.log('GroupService: Delete group response received');
}

/**
 * Add a member to a group
 */
export async function addGroupMember(groupId: string, userId: number): Promise<Group> {
  console.log('GroupService: Adding member:', userId, 'to group:', groupId);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.post(`groups/${groupId}/add_member/`, { user_id: userId })
  console.log('GroupService: Add member response received', res);
  return res.data
}

/**
 * Remove a member from a group
 */
export async function removeGroupMember(groupId: string, userId: number): Promise<Group> {
  console.log('GroupService: Removing member:', userId, 'from group:', groupId);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.post(`groups/${groupId}/remove_member/`, { user_id: userId })
  console.log('GroupService: Remove member response received', res);
  return res.data
}

/**
 * Approve a group proposal (Admin only)
 */
export async function approveGroup(groupId: string): Promise<Group> {
  console.log('GroupService: Approving group:', groupId);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.post(`groups/${groupId}/approve/`)
  console.log('GroupService: Approve group response received', res);
  return res.data
}

/**
 * Reject a group proposal (Admin only)
 */
export async function rejectGroup(groupId: string, reason?: string): Promise<Group> {
  console.log('GroupService: Rejecting group:', groupId, 'with reason:', reason);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.post(`groups/${groupId}/reject/`, { rejection_reason: reason })
  console.log('GroupService: Reject group response received', res);
  return res.data
}

/**
 * Fetch pending group proposals (Admin only)
 */
export async function fetchPendingProposals(): Promise<Group[]> {
  console.log('GroupService: Fetching pending proposals');
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.get('/groups/pending_proposals/')
  console.log('GroupService: Pending proposals response received', res);
  // Ensure we always return an array
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * Fetch current user's groups
 */
export async function fetchCurrentUserGroups(): Promise<Group[]> {
  console.log('GroupService: Fetching current user groups');
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  
  try {
    const res = await api.get('/groups/get_current_user_groups/')
    console.log('GroupService: Current user groups response received', res);
    
    // Log the response data structure for debugging
    console.log('GroupService: Response data:', res.data);
    
    // Check if the response data is an array
    let result: Group[] = [];
    if (Array.isArray(res.data)) {
      result = res.data;
    } else if (res.data && Array.isArray(res.data.results)) {
      // Handle paginated response
      result = res.data.results;
    } else if (res.data && typeof res.data === 'object') {
      // If it's a single group object, return it as an array with one item
      result = [res.data];
    }
    
    // Log group IDs to check for duplicates
    console.log('GroupService: Current user group IDs:', result.map(g => g.id));
    
    // Check for duplicates in the response and remove them
    const uniqueGroups = Array.isArray(result) ? result.filter((group, index, self) => 
      index === self.findIndex(g => g.id === group.id)
    ) : [];

    // Log duplicate check information
    if (Array.isArray(result) && Array.isArray(uniqueGroups) && uniqueGroups.length !== result.length) {
      console.log('GroupService: Original count:', result.length, 'Deduplicated count:', uniqueGroups.length);
    }

    // Also deduplicate based on group ID and ensure proper structure
    const deduplicatedGroups = uniqueGroups.reduce((acc: Group[], group) => {
      // Check if a group with this ID already exists
      const existingIndex = acc.findIndex(g => g.id === group.id);
      if (existingIndex === -1) {
        // If not found, add it to the accumulator
        acc.push(group);
      } else {
        // If found, merge the data (in case one has more complete information)
        acc[existingIndex] = { ...acc[existingIndex], ...group };
      }
      return acc;
    }, [] as Group[]);
    
    if (Array.isArray(deduplicatedGroups) && Array.isArray(result) && deduplicatedGroups.length !== result.length) {
      console.warn('GroupService: Duplicate groups found and removed from current user groups response');
      console.log('GroupService: Original count:', result.length, 'Deduplicated count:', deduplicatedGroups.length);
    }
    
    // Ensure members is always an array
    const processedGroups = deduplicatedGroups.map(group => ({
      ...group,
      members: Array.isArray(group.members) ? group.members : [],
      panels: Array.isArray(group.panels) ? group.panels : [],
      adviser: group.adviser || null
    }));
    
    // Log detailed group information
    processedGroups.forEach((group, index) => {
      console.log(`GroupService: Group ${index} details:`, {
        id: group.id,
        name: group.name,
        members: group.members,
        membersType: typeof group.members,
        membersLength: Array.isArray(group.members) ? group.members.length : 'Not an array'
      });
    });
    
    // Ensure we always return an array with unique groups
    return processedGroups;
  } catch (error) {
    console.error('GroupService: Error fetching user groups:', error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
}

/**
 * Fetch other groups (approved groups excluding user's own groups)
 */
export async function fetchOtherGroups(): Promise<Group[]> {
  console.log('GroupService: Fetching other groups');
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  
  try {
    const res = await api.get('/groups/get_other_groups/')
    console.log('GroupService: Other groups response received', res);
    
    // Log the response data structure for debugging
    console.log('GroupService: Response data:', res.data);
    
    // Check if the response data is an array
    let result: Group[] = [];
    if (Array.isArray(res.data)) {
      result = res.data;
    } else if (res.data && Array.isArray(res.data.results)) {
      // Handle paginated response
      result = res.data.results;
    } else if (res.data) {
      // If it's a single group, return it as an array with one item
      result = [res.data];
    }
    
    // Log group IDs to check for duplicates
    console.log('GroupService: Other group IDs:', result.map(g => g.id));
    
    // Check for duplicates in the response and remove them
    const uniqueGroups = Array.isArray(result) ? result.filter((group, index, self) => 
      index === self.findIndex(g => g.id === group.id)
    ) : [];

    // Log duplicate check information
    if (Array.isArray(result) && Array.isArray(uniqueGroups) && uniqueGroups.length !== result.length) {
      console.log('GroupService: Original count:', result.length, 'Deduplicated count:', uniqueGroups.length);
    }

    // Also deduplicate based on group ID and ensure proper structure
    const deduplicatedGroups = uniqueGroups.reduce((acc: Group[], group) => {
      // Check if a group with this ID already exists
      const existingIndex = acc.findIndex(g => g.id === group.id);
      if (existingIndex === -1) {
        // If not found, add it to the accumulator
        acc.push(group);
      } else {
        // If found, merge the data (in case one has more complete information)
        acc[existingIndex] = { ...acc[existingIndex], ...group };
      }
      return acc;
    }, [] as Group[]);
    
    if (Array.isArray(deduplicatedGroups) && Array.isArray(result) && deduplicatedGroups.length !== result.length) {
      console.warn('GroupService: Duplicate groups found and removed from other groups response');
      console.log('GroupService: Original count:', result.length, 'Deduplicated count:', deduplicatedGroups.length);
    }
    
    // Ensure members is always an array
    const processedGroups = deduplicatedGroups.map(group => ({
      ...group,
      members: Array.isArray(group.members) ? group.members : [],
      panels: Array.isArray(group.panels) ? group.panels : [],
      adviser: group.adviser || null
    }));
    
    // Log detailed group information
    processedGroups.forEach((group, index) => {
      console.log(`GroupService: Other Group ${index} details:`, {
        id: group.id,
        name: group.name,
        members: group.members,
        membersType: typeof group.members,
        membersLength: Array.isArray(group.members) ? group.members.length : 'Not an array'
      });
    });
    
    return processedGroups;
  } catch (error) {
    console.error('GroupService: Error fetching other groups:', error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
}

/**
 * Assign an adviser to a group (Admin only)
 */
export async function assignAdviser(groupId: string, adviserId: number | string): Promise<Group> {
  console.log('GroupService: Assigning adviser:', adviserId, 'to group:', groupId);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.post(`groups/${groupId}/assign_adviser/`, { adviser_id: adviserId });
  console.log('GroupService: Assign adviser response received', res);
  return res.data;
}

/**
 * Assign panel members to a group (Admin or Adviser for their groups)
 */
export async function assignPanel(groupId: string, panelIds: (number | string)[]): Promise<Group> {
  console.log('GroupService: Assigning panels:', panelIds, 'to group:', groupId);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.post(`groups/${groupId}/assign_panel/`, { panel_ids: panelIds })
  console.log('GroupService: Assign panel response received', res);
  return res.data
}

/**
 * Resubmit a rejected group proposal (Student only)
 */
export async function resubmitGroup(groupId: string): Promise<Group> {
  console.log('GroupService: Resubmitting group:', groupId);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.post(`groups/${groupId}/resubmit/`)
  console.log('GroupService: Resubmit group response received', res);
  return res.data
}

/**
 * Remove a panel member from a group (Admin or Adviser for their groups)
 */
export async function removePanelMember(groupId: string, panelId: number): Promise<Group> {
  console.log('GroupService: Removing panel:', panelId, 'from group:', groupId);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.post(`groups/${groupId}/remove_panel/`, { panel_id: panelId })
  console.log('GroupService: Remove panel response received', res);
  return res.data
}

/**
 * Search groups by keywords
 */
export async function searchGroupsByKeywords(keywords: string): Promise<Group[]> {
  console.log('GroupService: Searching groups by keywords:', keywords);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.get('/groups/', { params: { keywords } })
  console.log('GroupService: Search by keywords response received', res);
  // Ensure we always return an array
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * Search groups by adviser
 */
export async function searchGroupsByAdviser(adviserId: string): Promise<Group[]> {
  console.log('GroupService: Searching groups by adviser:', adviserId);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.get('/groups/', { params: { adviser: adviserId } })
  console.log('GroupService: Search by adviser response received', res);
  // Ensure we always return an array
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * Search groups by status
 */
export async function searchGroupsByStatus(status: string): Promise<Group[]> {
  console.log('GroupService: Searching groups by status:', status);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.get('/groups/', { params: { status } })
  console.log('GroupService: Search by status response received', res);
  // Ensure we always return an array
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * Search groups by topics
 */
export async function searchGroupsByTopics(topics: string): Promise<Group[]> {
  console.log('GroupService: Searching groups by topics:', topics);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.get('/groups/', { params: { topics } })
  console.log('GroupService: Search by topics response received', res);
  // Ensure we always return an array
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * Get group statistics for admin dashboard
 */
export async function getGroupStatistics(): Promise<{
  total_registered_groups: number;
  active_groups: number;
  pending_groups: number;
  rejected_groups: number;
}> {
  console.log('GroupService: Fetching group statistics');
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.get('/groups/statistics/')
  console.log('GroupService: Group statistics response received', res);
  return res.data;
}

/**
 * Fetch current user's groups (simplified version without debugging)
 */
export async function fetchUserGroups(): Promise<Group[]> {
  const res = await api.get('/groups/get_current_user_groups/')
  return Array.isArray(res.data) ? res.data : [res.data];
}

// Legacy exports for backward compatibility
export const listGroups = fetchGroups
export const getCurrentUserGroups = fetchCurrentUserGroups
export const addMember = addGroupMember
export const removeMember = removeGroupMember
export const getGroup = fetchGroup
export const assignPanels = assignPanel
export const searchUsers = async (query: string, role?: string, excludeInGroup?: boolean): Promise<User[]> => {
  const params: any = {};
  if (query) params.search = query;
  if (role) params.role = role;
  if (excludeInGroup && role === 'STUDENT') params.exclude_in_group = 'true';
  
  try {
    const res = await api.get('users/', { params });
    // Ensure we always return an array
    if (Array.isArray(res.data)) {
      return res.data;
    } else if (res.data && Array.isArray(res.data.results)) {
      // Handle paginated response
      return res.data.results;
    } else {
      console.warn('Unexpected response format from searchUsers:', res.data);
      return [];
    }
  } catch (error) {
    console.error('Error in searchUsers:', error);
    return [];
  }
}
