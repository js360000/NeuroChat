import { api } from './client';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: {
    plan: string;
    status: string;
  };
  verification: {
    email: boolean;
    photo: boolean;
    id: boolean;
  };
  createdAt: string;
  lastActive: string;
  isOnline: boolean;
}

export interface DailyActivity {
  date: string;
  users: number;
  messages: number;
  matches: number;
}

export interface DashboardStats {
  stats: {
    users: {
      total: number;
      online: number;
      today: number;
      premium: number;
    };
    matches: {
      total: number;
      pending: number;
      matched: number;
      today: number;
    };
    subscriptions: {
      free: number;
      premium: number;
      pro: number;
    };
  };
  dailyActivity: DailyActivity[];
  recentActivity: {
    newUsers: number;
    newMatches: number;
    activeUsers: number;
  };
}

export const adminApi = {
  getOverview: async () => {
    return api.get<DashboardStats>('/admin/overview');
  },

  getUsers: async (params?: { limit?: number; offset?: number; search?: string; plan?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.plan) queryParams.append('plan', params.plan);
    if (params?.status) queryParams.append('status', params.status);

    return api.get<{ users: AdminUser[]; total: number }>(`/admin/users?${queryParams}`);
  },

  getUser: async (id: string) => {
    return api.get<{ user: AdminUser }>(`/admin/users/${id}`);
  },

  updateUser: async (id: string, data: Partial<AdminUser>) => {
    return api.patch<{ user: AdminUser }>(`/admin/users/${id}`, data);
  },

  suspendUser: async (id: string) => {
    return api.post(`/admin/users/${id}/suspend`, {});
  },

  getAnalytics: async (days?: number) => {
    const params = days ? `?days=${days}` : '';
    return api.get<{
      dailyActivity: DailyActivity[];
      userStats: any;
      subscriptionBreakdown: any;
      retention: any;
    }>(`/admin/analytics${params}`);
  },

  getSettings: async () => {
    return api.get<{ settings: any }>('/admin/settings');
  },

  updateSettings: async (settings: any) => {
    return api.patch('/admin/settings', settings);
  },

  getIntegrations: async () => {
    return api.get<{ integrations: any[] }>('/admin/integrations');
  }
};
