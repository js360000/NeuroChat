import { api } from './client'

export const roomsApi = {
  list: () => api.get('/rooms').then((r) => r.data),

  create: (data: { name: string; activity?: string; maxParticipants?: number }) =>
    api.post('/rooms', data).then((r) => r.data),

  join: (id: string) => api.post(`/rooms/${id}/join`).then((r) => r.data),

  leave: (id: string) => api.post(`/rooms/${id}/leave`).then((r) => r.data),

  updateStatus: (id: string, data: { status?: string; activity?: string }) =>
    api.patch(`/rooms/${id}/status`, data).then((r) => r.data),
}
