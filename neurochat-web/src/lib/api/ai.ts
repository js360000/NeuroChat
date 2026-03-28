import { api } from './client'
import type { AIExplanation, AISummary, AIRephrase } from '@/types'

export const aiApi = {
  explainMessage: async (
    message: string,
    toneTag?: string,
    context?: string
  ) => {
    const res = await api.post<{ explanation: AIExplanation }>('/ai/explain', { message, toneTag, context })
    return res.data
  },

  getSuggestions: async (params: {
    userInterests: string[]
    myInterests: string[]
    previousMessages?: { sender: string; content: string }[]
  }) => {
    const res = await api.post<{ suggestions: string[] }>('/ai/suggestions', params)
    return res.data
  },

  getCompatibility: async (params: {
    user1Traits: string[]
    user1Interests: string[]
    user2Traits: string[]
    user2Interests: string[]
  }) => {
    const res = await api.post<{
      compatibility: {
        score: number
        commonInterests: string[]
        commonTraits: string[]
        analysis: string
      }
    }>('/ai/compatibility', params)
    return res.data
  },

  summarizeConversation: async (
    messages: { sender: string; content: string }[]
  ) => {
    const res = await api.post<{ summary: AISummary }>('/ai/summary', { messages })
    return res.data
  },

  rephraseMessage: async (message: string) => {
    const res = await api.post<{ rephrase: AIRephrase }>('/ai/rephrase', { message })
    return res.data
  },
}
