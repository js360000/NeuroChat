import { api } from './client'
import type { CommunityPost, ReactionType } from '@/types'

export const communityApi = {
  getPosts: async (opts?: { tag?: string; limit?: number; offset?: number }) => {
    const params = new URLSearchParams()
    if (opts?.tag) params.set('tag', opts.tag)
    if (opts?.limit) params.set('limit', String(opts.limit))
    if (opts?.offset) params.set('offset', String(opts.offset))
    const res = await api.get<{ posts: CommunityPost[] }>(`/community/posts?${params}`)
    return res.data
  },

  createPost: async (data: { content: string; toneTag?: string; contentWarning?: string; tags?: string[] }) => {
    const res = await api.post<{ post: CommunityPost }>('/community/posts', data)
    return res.data
  },

  react: async (postId: string, type: ReactionType) => {
    const res = await api.post<{ post: CommunityPost }>(`/community/posts/${postId}/react`, { type })
    return res.data
  },

  getReplies: async (postId: string) => {
    const res = await api.get<{ replies: CommunityPost[] }>(`/community/posts/${postId}/replies`)
    return res.data
  },

  reply: async (postId: string, data: { content: string; toneTag?: string }) => {
    const res = await api.post<{ reply: CommunityPost }>(`/community/posts/${postId}/reply`, data)
    return res.data
  },

  getTags: async () => {
    const res = await api.get<{ tags: string[] }>('/community/tags')
    return res.data
  },
}
