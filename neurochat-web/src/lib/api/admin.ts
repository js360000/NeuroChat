import { api } from './client'

export const adminApi = {
  // Stats
  getStats: async () => {
    const res = await api.get<{ stats: Record<string, number> }>('/admin/stats')
    return res.data
  },

  // Users
  getUsers: async (opts?: { q?: string; role?: string; banned?: boolean; limit?: number; offset?: number }) => {
    const params = new URLSearchParams()
    if (opts?.q) params.set('q', opts.q)
    if (opts?.role) params.set('role', opts.role)
    if (opts?.banned) params.set('banned', 'true')
    if (opts?.limit) params.set('limit', String(opts.limit))
    if (opts?.offset) params.set('offset', String(opts.offset))
    const res = await api.get<{ users: any[]; total: number }>(`/admin/users?${params}`)
    return res.data
  },

  updateUser: async (id: string, data: Record<string, any>) => {
    const res = await api.patch<{ user: any }>(`/admin/users/${id}`, data)
    return res.data
  },

  banUser: async (id: string, data: { type: 'temporary' | 'permanent'; reason?: string; durationHours?: number }) => {
    const res = await api.post<{ ban: any }>(`/admin/users/${id}/ban`, data)
    return res.data
  },

  unbanUser: async (id: string) => {
    const res = await api.post<{ ok: boolean }>(`/admin/users/${id}/unban`)
    return res.data
  },

  // Bans
  getBans: async () => {
    const res = await api.get<{ bans: any[] }>('/admin/bans')
    return res.data
  },

  // Keywords
  getKeywords: async () => {
    const res = await api.get<{ keywords: any[] }>('/admin/keywords')
    return res.data
  },

  addKeyword: async (keyword: string, severity: 'warn' | 'mute' | 'ban') => {
    const res = await api.post<{ keyword: any }>('/admin/keywords', { keyword, severity })
    return res.data
  },

  removeKeyword: async (id: string) => {
    const res = await api.delete(`/admin/keywords/${id}`)
    return res.data
  },

  // Violations
  getViolations: async (limit?: number) => {
    const params = limit ? `?limit=${limit}` : ''
    const res = await api.get<{ violations: any[] }>(`/admin/violations${params}`)
    return res.data
  },

  // Config
  getConfig: async () => {
    const res = await api.get<{ config: Record<string, any> }>('/admin/config')
    return res.data
  },

  updateConfig: async (updates: Record<string, any>) => {
    const res = await api.patch<{ config: Record<string, any> }>('/admin/config', updates)
    return res.data
  },

  // Audit log
  getAuditLog: async (limit?: number) => {
    const params = limit ? `?limit=${limit}` : ''
    const res = await api.get<{ entries: any[] }>(`/admin/audit${params}`)
    return res.data
  },

  // Reports
  getReports: async (status?: string) => {
    const params = status ? `?status=${status}` : ''
    const res = await api.get<{ reports: any[] }>(`/admin/reports${params}`)
    return res.data
  },

  updateReport: async (id: string, status: string) => {
    const res = await api.patch(`/admin/reports/${id}`, { status })
    return res.data
  },

  // Feedback
  getFeedback: async (queryString?: string) => {
    const res = await api.get<{ feedback: any[]; summary: any }>(`/admin/feedback${queryString ? `?${queryString}` : ''}`)
    return res.data
  },

  // Content moderation
  deletePost: async (id: string) => {
    const res = await api.delete(`/admin/posts/${id}`)
    return res.data
  },

  deleteMessage: async (id: string) => {
    const res = await api.delete(`/admin/messages/${id}`)
    return res.data
  },
}
