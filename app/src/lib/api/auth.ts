import { api } from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  role: 'user' | 'admin';
  neurodivergentTraits: string[];
  specialInterests: string[];
  communicationPreferences: {
    preferredToneTags: boolean;
    aiExplanations: boolean;
    voiceMessages: boolean;
  };
  subscription: {
    plan: 'free' | 'premium' | 'pro';
    status: 'active' | 'cancelled' | 'past_due';
    expiresAt?: string;
  };
  verification: {
    email: boolean;
    photo: boolean;
    id: boolean;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  neurodivergentTraits?: string[];
  specialInterests?: string[];
}

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<{ token: string; user: User }>('/auth/login', credentials);
    api.setToken(response.token);
    return response;
  },

  register: async (data: RegisterData) => {
    const response = await api.post<{ token: string; user: User }>('/auth/register', data);
    api.setToken(response.token);
    return response;
  },

  logout: async () => {
    await api.post('/auth/logout', {});
    api.setToken(null);
  },

  getCurrentUser: async () => {
    return api.get<{ user: User }>('/auth/me');
  },

  updateProfile: async (data: Partial<User>) => {
    return api.patch<{ user: User }>('/auth/profile', data);
  }
};
