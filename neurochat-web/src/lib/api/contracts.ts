import { api } from './client'

export interface CommunicationContract {
  id: string
  conversationId: string
  createdBy: string
  rules: ContractRule[]
  acceptedBy: string[]
  createdAt: string
  updatedAt: string
}

export interface ContractRule {
  id: string
  text: string
  icon: string
  enabled: boolean
}

export const contractsApi = {
  get: (conversationId: string) =>
    api.get(`/contracts/${conversationId}`).then(r => r.data as { contract: CommunicationContract | null }),
  save: (conversationId: string, rules: ContractRule[]) =>
    api.post('/contracts', { conversationId, rules }).then(r => r.data),
  accept: (id: string) =>
    api.post(`/contracts/${id}/accept`).then(r => r.data),
}
