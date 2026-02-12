import { api } from './client';

export interface BlogAuthor {
  id: string;
  name: string;
  avatar?: string;
}

export type BlogContentBlock =
  | { type: 'heading'; text: string; level?: 2 | 3 | 4 }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; style?: 'bullet' | 'number'; items: Array<{ text: string }> }
  | { type: 'quote'; text: string; author?: string }
  | { type: 'callout'; tone?: 'info' | 'gentle' | 'note' | 'warning'; title?: string; text?: string; body?: string }
  | { type: 'statGrid'; items: Array<{ label: string; value: string; note?: string }> }
  | { type: 'steps'; steps: Array<{ title: string; body?: string }> }
  | { type: 'checklist'; items: Array<{ text: string; checked?: boolean }> }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'divider' }
  | { type: 'cta'; title: string; body: string; buttonLabel: string; buttonHref: string }
  | { type: 'resourceGrid'; items: Array<{ title: string; description: string; href: string }> };

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  contentBlocks?: BlogContentBlock[];
  tags: string[];
  coverImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  status: 'draft' | 'published';
  author: BlogAuthor;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  readingTime: number;
}

export interface BlogComment {
  id: string;
  content: string;
  author: BlogAuthor;
  createdAt: string;
  updatedAt: string;
}

export const blogApi = {
  getPosts: async (options?: { q?: string; tag?: string; status?: string; limit?: number; offset?: number }) => {
    const params = new URLSearchParams();
    if (options?.q) params.append('q', options.q);
    if (options?.tag) params.append('tag', options.tag);
    if (options?.status) params.append('status', options.status);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    return api.get<{ posts: BlogPost[]; total: number }>(`/blog?${params}`);
  },

  createPost: async (data: {
    title: string;
    content?: string;
    contentBlocks?: BlogContentBlock[];
    tags?: string[];
    coverImage?: string;
    status?: 'draft' | 'published';
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    canonicalUrl?: string;
    ogImage?: string;
  }) => {
    return api.post<{ post: BlogPost }>('/blog', data);
  },

  getPost: async (slug: string) => {
    return api.get<{ post: BlogPost }>(`/blog/${slug}`);
  },

  getComments: async (postId: string) => {
    return api.get<{ comments: BlogComment[] }>(`/blog/${postId}/comments`);
  },

  addComment: async (postId: string, content: string) => {
    return api.post<{ comment: BlogComment }>(`/blog/${postId}/comments`, { content });
  }
};
