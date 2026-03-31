import { api } from './client'

export const contactsApi = {
  lookup: (phoneHashes: string[]) =>
    api.post('/contacts/lookup', { phoneHashes }).then(r => r.data),

  search: (query: string, hash?: string) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (hash) params.set('hash', hash)
    return api.get(`/contacts/search?${params}`).then(r => r.data)
  },
}
