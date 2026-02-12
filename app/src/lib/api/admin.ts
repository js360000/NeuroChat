import { api } from './client';
import type { AppConfig } from './pages';

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

export interface ExperienceStats {
  stats: {
    totalUsers: number;
    calmAdoptionRate: number;
    reduceMotionRate: number;
    reduceSaturationRate: number;
    densityBreakdown: {
      cozy: number;
      balanced: number;
      compact: number;
    };
    onboardingCompleted: number;
    onboardingIncomplete: number;
    onboardingSteps: Record<string, number>;
    consent: {
      total: number;
      analytics: number;
      marketing: number;
    };
  };
}

export interface DigestEntry {
  id: string;
  scheduledFor: string;
  status: 'queued' | 'sent';
  createdAt: string;
}

export interface ContentCalendarEntry {
  id: string;
  channel: 'blog' | 'community';
  title: string;
  notes?: string;
  scheduledFor: string;
  status: 'planned' | 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentSettings {
  landingHeroVariant: 'default' | 'calm' | 'bold';
  onboardingToneVariant: 'gentle' | 'direct';
  discoveryIntentVariant: 'cards' | 'list';
  compassCtaVariant: 'standard' | 'mentor';
}

export interface AdminSettings {
  siteName: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxMatchesPerDay: number;
  aiExplanationsEnabled: boolean;
}

export interface AdSlot {
  id: string;
  label: string;
  area: string;
  format: 'banner' | 'sidebar' | 'in-feed';
  adSlotId: string;
  enabled: boolean;
}

export interface AdConfig {
  adsenseClientId: string;
  globalEnabled: boolean;
  showToFreeOnly: boolean;
  slots: AdSlot[];
}

export interface UserStats {
  total: number;
  online: number;
  today: number;
  premium: number;
}

export interface SubscriptionBreakdown {
  free: number;
  premium: number;
  pro: number;
}

export interface RetentionStats {
  day1: number;
  day7: number;
  day30: number;
}

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  webhookUrl?: string;
  status?: 'connected' | 'disconnected';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface N8nWorkflowHook {
  id: string;
  name: string;
  webhookUrl: string;
}

export interface N8nRun {
  id: string;
  workflowId: string;
  status: string;
  responseStatus?: number;
  startedAt: string;
  triggeredAt: string;
  finishedAt?: string;
  error?: string;
}

export interface N8nConfigData {
  baseUrl: string;
  apiKey?: string;
  apiKeyMasked?: string;
  apiVersion: number;
  webhookUrl: string;
  enabled: boolean;
}

export interface SocialSchedule {
  id: string;
  channel: string;
  title?: string;
  content?: string;
  caption?: string;
  description?: string;
  mediaUrl?: string;
  scheduledFor?: string;
  scheduledAt?: string;
  status?: string;
  webhookUrl?: string;
  createdAt: string;
}

export interface EnvVar {
  key: string;
  valueMasked: string;
  description: string;
  isSecret: boolean;
  isSet: boolean;
  restartRequired: boolean;
}

export interface AdminSitePage {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  updatedAt: string;
}

export interface ConsentLog {
  id: string;
  userId?: string;
  analytics: boolean;
  marketing: boolean;
  version?: string;
  healthDataConsent?: boolean;
  userAgent?: string;
  ip?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId?: string;
  reporterName?: string;
  targetId: string;
  targetType: string;
  reason: string;
  description?: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  reporter?: { id: string; name: string; email?: string };
  createdAt: string;
}

export interface AdminCommunityPost {
  id: string;
  title?: string;
  content: string;
  tags: string[];
  toneTag?: string;
  contentWarning?: string;
  hidden: boolean;
  reportCount?: number;
  sentiment?: { score: number; label: 'positive' | 'negative' | 'neutral' };
  flaggedKeywords?: string[];
  author: { id: string; name: string; email?: string };
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userName?: string;
  amount: number;
  currency: string;
  plan: string;
  status: string;
  createdAt: string;
}

export interface SelfieVerificationEntry {
  userId: string;
  userName: string;
  email: string;
  avatar?: string;
  status: 'pending' | 'verified' | 'rejected';
  authenticityScore?: number;
  selfieDataUrl?: string;
  submittedAt?: string;
  verifiedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface SelfieVerificationDetail {
  userId: string;
  userName: string;
  email: string;
  avatar?: string;
  selfieVerification: {
    status: 'none' | 'pending' | 'verified' | 'rejected';
    authenticityScore?: number;
    selfieDataUrl?: string;
    submittedAt?: string;
    verifiedAt?: string;
    reviewedBy?: string;
    reviewNotes?: string;
  };
  verification: {
    email: boolean;
    photo: boolean;
    id: boolean;
  };
  createdAt: string;
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
      userStats: UserStats;
      subscriptionBreakdown: SubscriptionBreakdown;
      retention: RetentionStats;
    }>(`/admin/analytics${params}`);
  },

  getExperienceStats: async () => {
    return api.get<ExperienceStats>('/admin/experience');
  },

  getSettings: async () => {
    return api.get<{ settings: AdminSettings }>('/admin/settings');
  },

  updateSettings: async (settings: Partial<AdminSettings>) => {
    return api.patch<{ settings: AdminSettings }>('/admin/settings', settings);
  },

  getExperiments: async () => {
    return api.get<{ experiments: ExperimentSettings }>('/admin/experiments');
  },

  updateExperiments: async (experiments: Partial<ExperimentSettings>) => {
    return api.patch<{ experiments: ExperimentSettings }>('/admin/experiments', experiments);
  },

  getAppConfig: async () => {
    return api.get<{ config: AppConfig }>('/admin/config');
  },

  updateAppConfig: async (config: Partial<AppConfig>) => {
    return api.patch<{ config: AppConfig }>('/admin/config', config);
  },

  getIntegrations: async () => {
    return api.get<{ integrations: N8nWorkflow[] }>('/admin/integrations');
  },

  getN8nConfig: async () => {
    return api.get<{ config: N8nConfigData }>('/admin/n8n/config');
  },

  updateN8nConfig: async (config: Partial<N8nConfigData>) => {
    return api.patch<{ config: N8nConfigData }>('/admin/n8n/config', config);
  },

  getN8nWorkflows: async (params?: { active?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.active !== undefined) query.append('active', String(params.active));
    const suffix = query.toString() ? `?${query}` : '';
    return api.get<{ workflows: N8nWorkflow[] }>(`/admin/n8n/workflows${suffix}`);
  },

  getN8nWorkflowHooks: async () => {
    return api.get<{ hooks: N8nWorkflowHook[] }>('/admin/n8n/workflows/hooks');
  },

  updateN8nWorkflowHook: async (id: string, webhookUrl: string) => {
    return api.patch<{ hook: N8nWorkflowHook }>(`/admin/n8n/workflows/${id}/hook`, { webhookUrl });
  },

  runN8nWorkflow: async (id: string, payload?: Record<string, unknown>, webhookUrl?: string) => {
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
    return api.get<{ runs: N8nRun[] }>(`/admin/n8n/runs${suffix}`);
  },

  triggerN8nWebhook: async (payload: { event: string; channel: string; payload: Record<string, unknown>; webhookUrl?: string; scheduleId?: string }) => {
    return api.post('/admin/n8n/trigger', payload);
  },

  getSocialSchedule: async (params?: { channel?: string; status?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.channel) query.append('channel', params.channel);
    if (params?.status) query.append('status', params.status);
    if (params?.limit) query.append('limit', String(params.limit));
    const suffix = query.toString() ? `?${query}` : '';
    return api.get<{ schedules: SocialSchedule[] }>(`/admin/social/schedule${suffix}`);
  },

  createSocialSchedule: async (payload: Partial<SocialSchedule>) => {
    return api.post<{ schedule: SocialSchedule }>('/admin/social/schedule', payload);
  },

  updateSocialSchedule: async (id: string, payload: Partial<SocialSchedule>) => {
    return api.patch<{ schedule: SocialSchedule }>(`/admin/social/schedule/${id}`, payload);
  },

  getEnvVars: async () => {
    return api.get<{ vars: EnvVar[] }>('/admin/env');
  },

  updateEnvVar: async (key: string, value: string) => {
    return api.patch<{ key: string; valueMasked: string; isSet: boolean; restartRequired: boolean }>(
      '/admin/env',
      { key, value }
    );
  },

  getSitePages: async () => {
    return api.get<{ pages: AdminSitePage[] }>('/admin/pages');
  },

  getSitePage: async (slug: string) => {
    return api.get<{ page: AdminSitePage }>(`/admin/pages/${slug}`);
  },

  updateSitePage: async (slug: string, payload: { title?: string; summary?: string; body?: string }) => {
    return api.patch<{ page: AdminSitePage }>(`/admin/pages/${slug}`, payload);
  },

  getConsentLogs: async (params?: { limit?: number; offset?: number; analytics?: string; marketing?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));
    if (params?.analytics) query.append('analytics', params.analytics);
    if (params?.marketing) query.append('marketing', params.marketing);
    const suffix = query.toString() ? `?${query}` : '';
    return api.get<{ logs: ConsentLog[]; total: number }>(`/admin/consent${suffix}`);
  },

  exportConsentLogs: async () => {
    return api.get<{ logs: ConsentLog[] }>('/admin/consent/export');
  },

  getReports: async (params?: { status?: string; targetType?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.targetType) query.append('targetType', params.targetType);
    return api.get<{ reports: Report[] }>(`/admin/reports?${query}`);
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
    return api.get<{ posts: AdminCommunityPost[] }>(`/admin/community/posts?${query}`);
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
    return api.get<{ payments: PaymentRecord[] }>('/admin/payments/recent');
  },

  getDigestQueue: async (params?: { status?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    const suffix = query.toString() ? `?${query}` : '';
    return api.get<{ digests: DigestEntry[] }>(`/admin/digest${suffix}`);
  },

  createDigestEntry: async (scheduledFor: string) => {
    return api.post<{ digest: DigestEntry }>('/admin/digest', { scheduledFor });
  },

  updateDigestEntry: async (id: string, payload: Partial<DigestEntry>) => {
    return api.patch<{ digest: DigestEntry }>(`/admin/digest/${id}`, payload);
  },

  getContentCalendar: async (params?: { channel?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.channel) query.append('channel', params.channel);
    if (params?.status) query.append('status', params.status);
    const suffix = query.toString() ? `?${query}` : '';
    return api.get<{ entries: ContentCalendarEntry[] }>(`/admin/content-calendar${suffix}`);
  },

  createContentCalendarEntry: async (payload: Partial<ContentCalendarEntry>) => {
    return api.post<{ entry: ContentCalendarEntry }>('/admin/content-calendar', payload);
  },

  updateContentCalendarEntry: async (id: string, payload: Partial<ContentCalendarEntry>) => {
    return api.patch<{ entry: ContentCalendarEntry }>(`/admin/content-calendar/${id}`, payload);
  },

  deleteContentCalendarEntry: async (id: string) => {
    return api.delete(`/admin/content-calendar/${id}`);
  },

  getAnomalies: async () => {
    return api.get<{
      totals: { totalReports: number; pending: number; last24h: number };
      topReporters: { id: string; name: string; count: number }[];
      topTargets: { id: string; count: number }[];
      reasons: { reason: string; count: number }[];
      suspiciousReporters: { id: string; name: string; count: number }[];
      suspiciousTargets: { id: string; count: number }[];
    }>('/admin/anomalies');
  },

  getVerifications: async (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return api.get<{ verifications: SelfieVerificationEntry[]; total: number; pending: number }>(`/admin/verifications${query}`);
  },

  getVerificationDetail: async (userId: string) => {
    return api.get<SelfieVerificationDetail>(`/admin/verifications/${userId}`);
  },

  approveVerification: async (userId: string, notes?: string) => {
    return api.patch<{ success: boolean; verification: SelfieVerificationEntry }>(`/admin/verifications/${userId}/approve`, { notes });
  },

  rejectVerification: async (userId: string, notes?: string) => {
    return api.patch<{ success: boolean; verification: SelfieVerificationEntry }>(`/admin/verifications/${userId}/reject`, { notes });
  },

  resetVerification: async (userId: string) => {
    return api.patch<{ success: boolean }>(`/admin/verifications/${userId}/reset`, {});
  },

  getAdConfig: async () => {
    return api.get<{ adConfig: AdConfig }>('/admin/ads');
  },

  updateAdConfig: async (config: Partial<AdConfig>) => {
    return api.patch<{ adConfig: AdConfig }>('/admin/ads', config);
  }
};
