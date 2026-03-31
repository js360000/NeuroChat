import { api } from './client'

export const uploadsApi = {
  upload: async (file: File | Blob, filename?: string) => {
    const formData = new FormData()
    formData.append('file', file, filename || 'upload')
    const res = await api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data as { url: string; filename: string; originalName: string; size: number; mimetype: string }
  },
}
