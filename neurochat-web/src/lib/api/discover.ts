import { api } from './client'
import type { DiscoverProfile } from '@/types'

export const discoverApi = {
  getProfiles: async (query?: string) => {
    const params = query ? `?q=${encodeURIComponent(query)}` : ''
    const res = await api.get<{ profiles: DiscoverProfile[] }>(`/discover/profiles${params}`)
    return res.data
  },
}
