import { api } from './client'
import type { User } from '@/types'

export const profileApi = {
  getCurrent: async () => {
    const res = await api.get<{ profile: User }>('/user/profile')
    return res.data
  },

  update: async (data: Partial<User>) => {
    const res = await api.patch<{ profile: User }>('/user/profile', data)
    return res.data
  },

  getById: async (id: string) => {
    const res = await api.get<{ profile: User }>(`/user/${id}`)
    return res.data
  },
}
