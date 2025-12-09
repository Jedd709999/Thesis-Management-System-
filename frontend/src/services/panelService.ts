import api from '../api/api';

export const panelActions = {
  approve: (scheduleId: string, comments: string = '') => 
    api.post(`/panel-actions/${scheduleId}/approve/`, { comments }),

  requestRevision: (scheduleId: string, comments: string = '') => 
    api.post(`/panel-actions/${scheduleId}/request_revision/`, { comments }),

  reject: (scheduleId: string, comments: string = '') => 
    api.post(`/panel-actions/${scheduleId}/reject/`, { comments }),
    
  // New methods that work directly with thesis IDs
  approveByThesis: (thesisId: string, comments: string = '') => 
    api.post(`/theses/${thesisId}/panel_approve/`, { comments }),

  requestRevisionByThesis: (thesisId: string, comments: string = '') => 
    api.post(`/theses/${thesisId}/panel_request_revision/`, { comments }),

  rejectByThesis: (thesisId: string, comments: string = '') => 
    api.post(`/theses/${thesisId}/panel_reject/`, { comments }),

  getActions: (scheduleId: string) => 
    api.get(`/panel-actions/?schedule=${scheduleId}`),
    
  // New method to get panel actions for a specific thesis (for students)
  getThesisActions: (thesisId: string) => 
    api.get(`/panel-actions/?thesis=${thesisId}`)
};

export default panelActions;