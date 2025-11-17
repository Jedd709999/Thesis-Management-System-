import api from './api'
export const listGroups = () => api.get('groups/')
export const createGroup = (payload:any) => api.post('groups/', payload)
export const getCurrentUserGroups = () => {
  console.log('Making API call to get_current_user_groups')
  return api.get('groups/get_current_user_groups/')
}
export const addMember = (groupId:number, userId:number) => api.post(`groups/${groupId}/add_member/`, { user_id: userId })
export const removeMember = (groupId:number, userId:number) => api.post(`groups/${groupId}/remove_member/`, { user_id: userId })
export const getGroup = (id:number) => api.get(`groups/${id}/`)
export const updateGroup = (id:number, payload:any) => api.put(`groups/${id}/`, payload)
export const assignAdviser = (groupId:number, adviserId:number) => api.patch(`groups/${groupId}/`, { adviser: adviserId })
export const assignPanels = (groupId:number, panelIds:number[]) => api.patch(`groups/${groupId}/`, { panels: panelIds })
export const searchUsers = (query:string) => api.get(`users/?search=${encodeURIComponent(query)}`)
