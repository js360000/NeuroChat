import { api } from './client';

export interface Message {
  id: string;
  content: string;
  toneTag?: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  readAt?: string;
  isMe: boolean;
}

export interface Conversation {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
  };
  lastMessage?: {
    id: string;
    content: string;
    toneTag?: string;
    createdAt: string;
    isMe: boolean;
  };
  unreadCount: number;
  updatedAt: string;
}

export const messagesApi = {
  getConversations: async () => {
    return api.get<{ conversations: Conversation[] }>('/messages/conversations');
  },

  getMessages: async (conversationId: string, options?: { limit?: number; before?: string }) => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.before) params.append('before', options.before);
    
    return api.get<{ messages: Message[] }>(`/messages/conversations/${conversationId}?${params}`);
  },

  sendMessage: async (conversationId: string, content: string, toneTag?: string) => {
    return api.post<{ message: Message }>(`/messages/conversations/${conversationId}`, {
      content,
      toneTag
    });
  },

  markAsRead: async (conversationId: string) => {
    return api.post(`/messages/conversations/${conversationId}/read`, {});
  },

  createConversation: async (userId: string) => {
    return api.post<{ conversationId: string }>('/messages/conversations', { userId });
  }
};
