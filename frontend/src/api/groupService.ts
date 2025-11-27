import api from './api'
import { Group, GroupFormData } from '../types'

/**
 * Fetch all groups (approved only for non-admins)
 */
export async function fetchGroups(params?: {
  search?: string
  keywords?: string
  topics?: string
}): Promise<Group[]> {
  console.log('GroupService: Fetching groups with params:', params);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.get('groups/', { params })
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
  const groupIds = result.map(g => g.id);
  const uniqueGroupIds = [...new Set(groupIds)];
  if (groupIds.length !== uniqueGroupIds.length) {
    console.warn('GroupService: Duplicate groups found in groups response');
    console.log('GroupService: Duplicate IDs:', groupIds.filter((id, index) => groupIds.indexOf(id) !== index));
  }
  
  // Log detailed group information
  result.forEach((group, index) => {
    console.log(`GroupService: Group ${index} details:`, {
      id: group.id,
      name: group.name,
      members: group.members,
      membersType: typeof group.members,
      membersLength: Array.isArray(group.members) ? group.members.length : 'Not an array'
    });
  });
  
  // Ensure we always return an array
  return result;
}

/**
 * Fetch a single group by ID
 */
export async function fetchGroup(id: string): Promise<Group> {
  console.log('GroupService: Fetching group:', id);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.get(`groups/${id}/`)
  console.log('GroupService: Group response received', res);
  return res.data
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
    member_ids: data.member_ids ? data.member_ids.map(id => String(id)) : []
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
  const res = await api.get('groups/pending_proposals/')
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
    const res = await api.get('groups/get_current_user_groups/')
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
    } else if (res.data) {
      // If it's a single group, return it as an array with one item
      result = [res.data];
    }
    
    // Log group IDs to check for duplicates
    console.log('GroupService: Current user group IDs:', result.map(g => g.id));
    
    // Check for duplicates in the response and remove them
    const uniqueGroups = result.filter((group, index, self) => 
      index === self.findIndex(g => g.id === group.id)
    );
    
    if (uniqueGroups.length !== result.length) {
      console.warn('GroupService: Duplicate groups found and removed from current user groups response');
      console.log('GroupService: Original count:', result.length, 'Unique count:', uniqueGroups.length);
    }
    
    // Log detailed group information
    uniqueGroups.forEach((group, index) => {
      console.log(`GroupService: Group ${index} details:`, {
        id: group.id,
        name: group.name,
        members: group.members,
        membersType: typeof group.members,
        membersLength: Array.isArray(group.members) ? group.members.length : 'Not an array'
      });
    });
    
    // Ensure we always return an array with unique groups
    return uniqueGroups;
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
    const res = await api.get('groups/get_other_groups/')
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
    const uniqueGroups = result.filter((group, index, self) => 
      index === self.findIndex(g => g.id === group.id)
    );
    
    if (uniqueGroups.length !== result.length) {
      console.warn('GroupService: Duplicate groups found and removed from other groups response');
      console.log('GroupService: Original count:', result.length, 'Unique count:', uniqueGroups.length);
    }
    
    // Log detailed group information
    uniqueGroups.forEach((group, index) => {
      console.log(`GroupService: Other Group ${index} details:`, {
        id: group.id,
        name: group.name,
        members: group.members,
        membersType: typeof group.members,
        membersLength: Array.isArray(group.members) ? group.members.length : 'Not an array'
      });
    });
    
    return uniqueGroups;
  } catch (error) {
    console.error('GroupService: Error fetching other groups:', error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
}

/**
 * Assign an adviser to a group (Admin only)
 */
export async function assignAdviser(groupId: string, adviserId: number): Promise<Group> {
  console.log('GroupService: Assigning adviser:', adviserId, 'to group:', groupId);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.post(`groups/${groupId}/assign_adviser/`, { adviser_id: adviserId })
  console.log('GroupService: Assign adviser response received', res);
  return res.data
}

/**
 * Assign panel members to a group (Admin only)
 */
export async function assignPanel(groupId: string, panelIds: number[]): Promise<Group> {
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
 * Remove a panel member from a group (Admin only)
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
  const res = await api.get('groups/', { params: { keywords } })
  console.log('GroupService: Search by keywords response received', res);
  // Ensure we always return an array
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * Search groups by topics
 */
export async function searchGroupsByTopics(topics: string): Promise<Group[]> {
  console.log('GroupService: Searching groups by topics:', topics);
  console.log('GroupService: localStorage access_token:', localStorage.getItem('access_token'));
  const res = await api.get('groups/', { params: { topics } })
  console.log('GroupService: Search by topics response received', res);
  // Ensure we always return an array
  return Array.isArray(res.data) ? res.data : [];
}

// Legacy exports for backward compatibility
export const listGroups = fetchGroups
export const getCurrentUserGroups = fetchCurrentUserGroups
export const addMember = addGroupMember
export const removeMember = removeGroupMember
export const getGroup = fetchGroup
export const assignPanels = assignPanel
export const searchUsers = (query: string) => api.get(`users/?search=${encodeURIComponent(query)}`)
