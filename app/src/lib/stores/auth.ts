import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, type User } from '../api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ email, password });
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          set({
            error: error.message || 'Login failed',
            isLoading: false
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          set({
            error: error.message || 'Registration failed',
            isLoading: false
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          // Ignore logout errors
        }
        set({
          user: null,
          isAuthenticated: false,
          error: null
        });
      },

      fetchUser: async () => {
        const token = localStorage.getItem('neuronest_token');
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }
        try {
          const response = await authApi.getCurrentUser();
          set({
            user: response.user,
            isAuthenticated: true
          });
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false
          });
        }
      },

      updateProfile: async (data) => {
        try {
          const response = await authApi.updateProfile(data);
          set({ user: response.user });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'neuronest-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
);
