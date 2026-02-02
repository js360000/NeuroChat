import { api } from './client';

export interface CommunityAuthor {
  id: string;
  name: string;
  avatar?: string;
}

export interface CommunityPost {
  id: string;
  title?: string;
  content: string;
  tags: string[];
  toneTag?: string;
  contentWarning?: string;
  author: CommunityAuthor;
  createdAt: string;
  updatedAt: string;
  reactionCounts: Record<string, number>;
  commentCount: number;
}

export interface CommunityComment {
  id: string;
  content: string;
  author: CommunityAuthor;
  createdAt: string;
  updatedAt: string;
}

export const communityApi = {
  getFeed: async (options?: { q?: string; tag?: string; limit?: number; offset?: number }) => {
    const params = new URLSearchParams();
    if (options?.q) params.append('q', options.q);
    if (options?.tag) params.append('tag', options.tag);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    return api.get<{ posts: CommunityPost[]; total: number }>(`/community?${params}`);
  },

  getPost: async (postId: string) => {
    return api.get<{ post: CommunityPost }>(`/community/${postId}`);
  },

  createPost: async (data: { title?: string; content: string; tags?: string[]; toneTag?: string; contentWarning?: string }) => {
    return api.post<{ post: CommunityPost }>('/community', data);
  },

  updatePost: async (postId: string, data: Partial<{ title?: string; content: string; tags: string[]; toneTag?: string; contentWarning?: string }>) => {
    return api.patch<{ post: CommunityPost }>(`/community/${postId}`, data);
  },

  deletePost: async (postId: string) => {
    return api.delete(`/community/${postId}`);
  },

  getComments: async (postId: string) => {
    return api.get<{ comments: CommunityComment[] }>(`/community/${postId}/comments`);
  },

  addComment: async (postId: string, content: string) => {
    return api.post<{ comment: CommunityComment }>(`/community/${postId}/comments`, { content });
  },

  toggleReaction: async (postId: string, type: 'like' | 'support' | 'insightful' = 'like') => {
    return api.post<{ reactionCounts: Record<string, number> }>(`/community/${postId}/reactions`, { type });
  },

  reportPost: async (postId: string, reason: string, details?: string) => {
    return api.post<{ success: boolean; hidden?: boolean }>(`/community/${postId}/report`, { reason, details });
  }
};
