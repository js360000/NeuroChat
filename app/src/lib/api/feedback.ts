import { api } from './client';

export interface FeedbackSubmission {
  area: string;
  rating: number;
  message: string;
  anonymous?: boolean;
}

export interface FeedbackItem {
  id: string;
  userId?: string;
  userName?: string;
  anonymous: boolean;
  area: string;
  rating: number;
  message: string;
  status: 'new' | 'reviewed' | 'actioned';
  adminNotes?: string;
  createdAt: string;
}

export interface ChangelogEntryPublic {
  id: string;
  title: string;
  description: string;
  category: 'feature' | 'improvement' | 'fix' | 'feedback-driven';
  feedbackQuote?: string;
  version?: string;
  publishedAt: string;
}

export interface ChangelogEntryAdmin extends ChangelogEntryPublic {
  feedbackId?: string;
  createdAt: string;
}

export const feedbackApi = {
  submit: async (data: FeedbackSubmission) => {
    return api.post<{ success: boolean; id: string; message: string }>('/feedback', data);
  },

  getChangelog: async () => {
    return api.get<{ entries: ChangelogEntryPublic[] }>('/feedback/changelog');
  },
};

export const adminFeedbackApi = {
  list: async (params?: { status?: string; area?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.area) query.append('area', params.area);
    const suffix = query.toString() ? `?${query}` : '';
    return api.get<{ feedback: FeedbackItem[]; total: number }>(`/admin/feedback${suffix}`);
  },

  update: async (id: string, data: { status?: string; adminNotes?: string }) => {
    return api.patch<{ feedback: FeedbackItem }>(`/admin/feedback/${id}`, data);
  },

  getChangelog: async () => {
    return api.get<{ entries: ChangelogEntryAdmin[] }>('/admin/changelog');
  },

  createChangelog: async (data: {
    title: string;
    description: string;
    category?: string;
    feedbackId?: string;
    version?: string;
  }) => {
    return api.post<{ entry: ChangelogEntryAdmin }>('/admin/changelog', data);
  },

  updateChangelog: async (id: string, data: Partial<{
    title: string;
    description: string;
    category: string;
    feedbackId: string;
    version: string;
  }>) => {
    return api.patch<{ entry: ChangelogEntryAdmin }>(`/admin/changelog/${id}`, data);
  },

  deleteChangelog: async (id: string) => {
    return api.delete(`/admin/changelog/${id}`);
  },
};
