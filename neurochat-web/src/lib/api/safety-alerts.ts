import { api } from './client'

export const safetyApi = {
  scan: (conversationId: string) =>
    api.post('/safety/scan', { conversationId }).then(r => r.data),
  alerts: () => api.get('/safety/alerts').then(r => r.data),
  acknowledge: (id: string) =>
    api.post(`/safety/alerts/${id}/acknowledge`).then(r => r.data),
  gutCheck: (conversationId: string) =>
    api.get(`/safety/gut-check/${conversationId}`).then(r => r.data),
}
