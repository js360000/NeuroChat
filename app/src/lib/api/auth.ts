import { api } from './client';
import type { A11ySettings } from '../a11y';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  age?: number;
  dateOfBirth?: string;
  location?: string;
  pronouns?: string;
  gender?: string;
  role: 'user' | 'admin';
  neurodivergentTraits: string[];
  specialInterests: string[];
  communicationPreferences: {
    preferredToneTags: boolean;
    aiExplanations: boolean;
    voiceMessages: boolean;
    responsePace?: 'slow' | 'balanced' | 'fast';
    directness?: 'direct' | 'gentle';
  };
  experiencePreferences?: {
    calmMode: number;
    density: 'cozy' | 'balanced' | 'compact';
    reduceMotion: boolean;
    reduceSaturation: boolean;
    moodTheme?: 'calm' | 'warm' | 'crisp';
  };
  connectionGoals?: string[];
  matchPreferences?: {
    similarityWeight: number;
    complementWeight: number;
  };
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
  boundaries?: string[];
  safetyChecklist?: {
    boundariesSet: boolean;
    filtersSet: boolean;
    resourcesViewed: boolean;
    completed: boolean;
  };
  accessibilityPreset?: Partial<A11ySettings>;
  isPaused?: boolean;
  nameChanges?: string[];
  blockNsfwImages?: boolean;
  subscription: {
    plan: 'free' | 'premium' | 'pro';
    status: 'active' | 'inactive' | 'cancelled' | 'past_due';
    expiresAt?: string;
  };
  verification: {
    email: boolean;
    photo: boolean;
    id: boolean;
    self?: boolean;
    peer?: boolean;
    admin?: boolean;
  };
  onboarding?: {
    completed: boolean;
    completedAt?: string;
    step?: number;
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
