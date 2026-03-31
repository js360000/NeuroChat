import { api } from './client'
import type { Conversation, Message } from '@/types'

export const messagesApi = {
  getConversations: async () => {
    const res = await api.get<{ conversations: Conversation[] }>('/messages/conversations')
    return res.data
  },

  getMessages: async (
    conversationId: string,
    options?: { limit?: number; before?: string }
  ) => {
    const params = new URLSearchParams()
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.before) params.append('before', options.before)
    const res = await api.get<{ messages: Message[] }>(`/messages/conversations/${conversationId}?${params}`)
    return res.data
  },

  sendMessage: async (params: {
    conversationId: string
    content: string
    toneTag?: string
  }) => {
    const res = await api.post<{ message: Message }>('/messages', params)
    return res.data
  },

  createConversation: async (userId: string) => {
    const res = await api.post('/messages/conversations', { userId })
    return res.data as { conversation: { id: string; user: any; updatedAt: string } }
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    await api.post(`/messages/conversations/${conversationId}/read`)
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await api.delete(`/messages/${messageId}`)
  },
}
