import { api } from './client';

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role?: string;
  avatar?: string;
  micro?: string;
  featured: boolean;
  status?: 'draft' | 'published';
  createdAt?: string;
  updatedAt?: string;
}

export const testimonialsApi = {
  listPublic: async (params?: { featured?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.featured !== undefined) query.append('featured', String(params.featured));
    const suffix = query.toString() ? `?${query}` : '';
    return api.get<{ testimonials: Testimonial[] }>(`/pages/testimonials${suffix}`);
  },

  listAdmin: async (params?: { status?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    const suffix = query.toString() ? `?${query}` : '';
    return api.get<{ testimonials: Testimonial[] }>(`/admin/testimonials${suffix}`);
  },

  create: async (payload: Omit<Testimonial, 'id' | 'createdAt' | 'updatedAt'>) => {
    return api.post<{ testimonial: Testimonial }>('/admin/testimonials', payload);
  },

  update: async (id: string, payload: Partial<Testimonial>) => {
    return api.patch<{ testimonial: Testimonial }>(`/admin/testimonials/${id}`, payload);
  },

  remove: async (id: string) => {
    return api.delete(`/admin/testimonials/${id}`);
  }
};
