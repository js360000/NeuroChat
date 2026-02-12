import { create } from 'zustand';
import { messagesApi } from '../api/messages';

interface MessagesState {
  unreadCount: number;
  fetchUnreadCount: () => Promise<void>;
  setUnreadCount: (count: number) => void;
  decrementUnread: (by?: number) => void;
}

export const useMessagesStore = create<MessagesState>()((set) => ({
  unreadCount: 0,

  fetchUnreadCount: async () => {
    try {
      const response = await messagesApi.getConversations();
      const total = response.conversations.reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0
      );
      set({ unreadCount: total });
    } catch {
      // silently fail — badge just won't show
    }
  },

  setUnreadCount: (count) => set({ unreadCount: count }),

  decrementUnread: (by = 1) =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - by) })),
}));
