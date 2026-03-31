import { api } from './client'

export const roomsApi = {
  list: (opts?: { type?: string; tag?: string }) => {
    const params = new URLSearchParams()
    if (opts?.type) params.set('type', opts.type)
    if (opts?.tag) params.set('tag', opts.tag)
    return api.get(`/rooms?${params}`).then((r) => r.data)
  },

  create: (data: { name: string; activity?: string; maxParticipants?: number; roomType?: string; interestTag?: string; description?: string; allowChat?: boolean }) =>
    api.post('/rooms', data).then((r) => r.data),

  join: (id: string) => api.post(`/rooms/${id}/join`).then((r) => r.data),

  leave: (id: string) => api.post(`/rooms/${id}/leave`).then((r) => r.data),

  updateStatus: (id: string, data: { status?: string; activity?: string }) =>
    api.patch(`/rooms/${id}/status`, data).then((r) => r.data),
}
