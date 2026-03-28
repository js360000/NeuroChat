import { api } from './client'

export interface Venue {
  id: string
  name: string
  address?: string
  category?: string
  createdAt: string
  reviewCount: number
  averageScores: {
    noise: number
    lighting: number
    crowding: number
    scents: number
    predictability: number
  }
  reviews: VenueReview[]
}

export interface VenueReview {
  id: string
  venueId: string
  userId: string
  userName: string
  noise?: number
  lighting?: number
  crowding?: number
  scents?: number
  predictability?: number
  notes?: string
  timeOfVisit?: string
  createdAt: string
}

export const venuesApi = {
  list: async (params?: { q?: string; category?: string }) => {
    const res = await api.get<{ venues: Venue[] }>('/venues', { params })
    return res.data
  },

  get: async (id: string) => {
    const res = await api.get<{ venue: Venue }>(`/venues/${id}`)
    return res.data
  },

  create: async (data: { name: string; address?: string; category?: string }) => {
    const res = await api.post<{ venue: Venue }>('/venues', data)
    return res.data
  },

  review: async (
    id: string,
    data: {
      noise?: number
      lighting?: number
      crowding?: number
      scents?: number
      predictability?: number
      notes?: string
      timeOfVisit?: string
    }
  ) => {
    const res = await api.post<{ venue: Venue }>(`/venues/${id}/review`, data)
    return res.data
  },
}
