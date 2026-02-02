import { api } from './client';

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  neurodivergentTraits: string[];
  specialInterests: string[];
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
  }
};
