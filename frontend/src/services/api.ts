import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Helpers
export const SessionAPI = {
  createOrGet: (data: { visitorName: string; visitorEmail: string; visitorPhone: string; sessionId?: string }) =>
    apiClient.post('/sessions', data),
  get: (id: string) => apiClient.get(`/sessions/${id}`),
  list: (status?: string) => apiClient.get('/sessions', { params: { status } }),
  escalate: (id: string, reason?: string) => apiClient.post(`/sessions/${id}/escalate`, { reason }),
  claim: (id: string, agentName?: string) => apiClient.post(`/sessions/${id}/claim`, { agentName }),
  close: (id: string, feedback?: string) => apiClient.post(`/sessions/${id}/close`, { feedback }),
};

export const ChatAPI = {
  sendMessage: (data: { sessionId: string; senderType?: string; senderName?: string; content: string }) =>
    apiClient.post('/chat/message', data),
};

export const TicketAPI = {
  create: (data: any) => apiClient.post('/tickets', data),
  list: (params?: any) => apiClient.get('/tickets', { params }),
  track: (params: { ticketNumber?: string; email?: string; phone?: string }) =>
    apiClient.get('/tickets/track', { params }),
  get: (id: string) => apiClient.get(`/tickets/${id}`),
  updateStatus: (id: string, data: any) => apiClient.patch(`/tickets/${id}/status`, data),
  addComment: (id: string, data: any) => apiClient.post(`/tickets/${id}/comments`, data),
};

export const KnowledgeAPI = {
  list: (params?: any) => apiClient.get('/knowledge', { params }),
  create: (data: any) => apiClient.post('/knowledge', data),
  update: (id: string, data: any) => apiClient.put(`/knowledge/${id}`, data),
  delete: (id: string) => apiClient.delete(`/knowledge/${id}`),
  scrape: () => apiClient.post('/knowledge/scrape'),
};

export const AnalyticsAPI = {
  getOverview: () => apiClient.get('/analytics/overview'),
  getDailyTokens: () => apiClient.get('/analytics/tokens-daily'),
  getTickets: () => apiClient.get('/analytics/tickets'),
};
