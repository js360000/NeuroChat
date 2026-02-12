import { api } from './client';

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  neurodivergentTraits: string[];
  specialInterests: string[];
  connectionGoals?: string[];
  verification?: {
    email: boolean;
    photo: boolean;
    id: boolean;
    self?: boolean;
    peer?: boolean;
    admin?: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
  isPaused?: boolean;
  isOnline: boolean;
  lastActive: string;
}

export interface Match {
  id: string;
  userId1: string;
  userId2: string;
  compatibilityScore: number;
  status: 'pending' | 'matched' | 'unmatched';
  createdAt: string;
  user?: UserProfile;
}

export const usersApi = {
  getPotentialMatches: async () => {
    return api.get<{ users: UserProfile[] }>('/users');
  },

  getUser: async (id: string) => {
    return api.get<{ user: UserProfile }>(`/users/${id}`);
  },

  likeUser: async (id: string) => {
    return api.post<{ message: string; match: boolean; conversationId?: string }>(`/users/${id}/like`, {});
  },

  getMatches: async () => {
    return api.get<{ matches: Match[] }>('/users/me/matches');
  },

  unmatchUser: async (id: string) => {
    return api.delete(`/users/${id}/unmatch`);
  },

  blockUser: async (id: string) => {
    return api.post(`/users/${id}/block`, {});
  },

  reportUser: async (id: string, reason: string, details?: string) => {
    return api.post(`/users/${id}/report`, { reason, details });
  },

  exportData: async () => {
    return api.get<{ data: any }>('/users/me/export');
  },

  deleteAccount: async (confirm: string) => {
    return api.delete('/users/me', { confirm });
  },

  getPremiumStatus: async () => {
    return api.get<{
      plan: string;
      limits: {
        dailyLikes: number;
        dailySuperLikes: number;
        monthlyBoosts: number;
        canSeeWhoLikedYou: boolean;
        canRewind: boolean;
        advancedFilters: boolean;
        priorityInbox: boolean;
        incognitoMode: boolean;
        queueSize: number;
      };
      usage: { likesToday: number; superLikesToday: number };
      remaining: { likes: number; superLikes: number };
    }>('/users/me/premium-status');
  },

  getLikesReceived: async () => {
    return api.get<{
      likes: Array<{
        id: string;
        isSuper: boolean;
        createdAt: string;
        user: {
          id: string;
          name: string;
          avatar?: string;
          bio?: string;
          neurodivergentTraits: string[];
          specialInterests: string[];
          isOnline: boolean;
        } | null;
      }>;
      count: number;
      revealed: boolean;
    }>('/users/me/likes-received');
  },

  superLikeUser: async (id: string) => {
    return api.post<{ message: string; match: boolean; conversationId?: string; isSuper: boolean; remaining: number }>(`/users/${id}/like`, { isSuper: true });
  },

  rewind: async () => {
    return api.post<{ message: string; targetUserId: string }>('/users/rewind', {});
  }
};
