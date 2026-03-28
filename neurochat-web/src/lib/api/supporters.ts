import { api } from './client'

export const supportersApi = {
  list: () => api.get('/supporters').then(r => r.data),
  supporting: () => api.get('/supporters/supporting').then(r => r.data),
  add: (data: { supporterId: string; safeguardingLevel?: string }) =>
    api.post('/supporters', data).then(r => r.data),
  update: (id: string, data: { safeguardingLevel: string }) =>
    api.patch(`/supporters/${id}`, data).then(r => r.data),
  remove: (id: string) => api.delete(`/supporters/${id}`).then(r => r.data),
  alerts: () => api.get('/supporters/alerts').then(r => r.data),
}
