import { api } from './client';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: 'user' | 'admin';
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
  },

  getN8nConfig: async () => {
    return api.get<{ config: any }>('/admin/n8n/config');
  },

  updateN8nConfig: async (config: any) => {
    return api.patch<{ config: any }>('/admin/n8n/config', config);
  },

  getN8nWorkflows: async (params?: { active?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.active !== undefined) query.append('active', String(params.active));
    const suffix = query.toString() ? `?${query}` : '';
    return api.get<{ workflows: any[] }>(`/admin/n8n/workflows${suffix}`);
  },

  getN8nWorkflowHooks: async () => {
    return api.get<{ hooks: any[] }>('/admin/n8n/workflows/hooks');
  },

  updateN8nWorkflowHook: async (id: string, webhookUrl: string) => {
    return api.patch<{ hook: any }>(`/admin/n8n/workflows/${id}/hook`, { webhookUrl });
  },

  runN8nWorkflow: async (id: string, payload?: any, webhookUrl?: string) => {
    return api.post(`/admin/n8n/workflows/${id}/run`, { payload, webhookUrl });
  },

  setN8nWorkflowActive: async (id: string, active: boolean) => {
    return api.post(`/admin/n8n/workflows/${id}/activate`, { active });
  },

  getN8nRuns: async (params?: { workflowId?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.workflowId) query.append('workflowId', params.workflowId);
    if (params?.limit) query.append('limit', String(params.limit));
    const suffix = query.toString() ? `?${query}` : '';
    return api.get<{ runs: any[] }>(`/admin/n8n/runs${suffix}`);
  },

  triggerN8nWebhook: async (payload: { event: string; channel: string; payload: any; webhookUrl?: string; scheduleId?: string }) => {
    return api.post('/admin/n8n/trigger', payload);
  },

  getSocialSchedule: async (params?: { channel?: string; status?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.channel) query.append('channel', params.channel);
    if (params?.status) query.append('status', params.status);
    if (params?.limit) query.append('limit', String(params.limit));
    const suffix = query.toString() ? `?${query}` : '';
    return api.get<{ schedules: any[] }>(`/admin/social/schedule${suffix}`);
  },

  createSocialSchedule: async (payload: any) => {
    return api.post<{ schedule: any }>('/admin/social/schedule', payload);
  },

  updateSocialSchedule: async (id: string, payload: any) => {
    return api.patch<{ schedule: any }>(`/admin/social/schedule/${id}`, payload);
  },

  getEnvVars: async () => {
    return api.get<{ vars: any[] }>('/admin/env');
  },

  updateEnvVar: async (key: string, value: string) => {
    return api.patch<{ key: string; valueMasked: string; isSet: boolean; restartRequired: boolean }>(
      '/admin/env',
      { key, value }
    );
  },

  getSitePages: async () => {
    return api.get<{ pages: any[] }>('/admin/pages');
  },

  getSitePage: async (slug: string) => {
    return api.get<{ page: any }>(`/admin/pages/${slug}`);
  },

  updateSitePage: async (slug: string, payload: { title?: string; summary?: string; body?: string }) => {
    return api.patch<{ page: any }>(`/admin/pages/${slug}`, payload);
  },

  getReports: async (params?: { status?: string; targetType?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.targetType) query.append('targetType', params.targetType);
    return api.get<{ reports: any[] }>(`/admin/reports?${query}`);
  },

  reviewReport: async (id: string) => {
    return api.post(`/admin/reports/${id}/review`, {});
  },

  resolveReport: async (id: string) => {
    return api.post(`/admin/reports/${id}/resolve`, {});
  },

  getCommunityPosts: async (params?: { q?: string }) => {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    return api.get<{ posts: any[] }>(`/admin/community/posts?${query}`);
  },

  hideCommunityPost: async (id: string) => {
    return api.post(`/admin/community/posts/${id}/hide`, {});
  },

  unhideCommunityPost: async (id: string) => {
    return api.post(`/admin/community/posts/${id}/unhide`, {});
  },

  getPaymentsSummary: async () => {
    return api.get<{ summary: { monthlyRevenue: number; activeSubscriptions: number; churnRate: number } }>(
      '/admin/payments/summary'
    );
  },

  getPaymentsRecent: async () => {
    return api.get<{ payments: any[] }>('/admin/payments/recent');
  }
};
