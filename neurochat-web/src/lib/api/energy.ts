import { api } from './client'

export interface EnergyLog {
  id: string
  social: number
  sensory: number
  cognitive: number
  physical: number
  note?: string
  createdAt: string
}

export interface MaskingLog {
  id: string
  level: number
  context: string
  recoveryActivity?: string
  createdAt: string
}

export interface AutoResponderConfig {
  enabled: boolean
  message: string
  threshold: number
}

export interface EnergyState {
  current: {
    social: number
    sensory: number
    cognitive: number
    physical: number
  }
  history: EnergyLog[]
  maskingHistory: MaskingLog[]
  autoResponder: AutoResponderConfig
  visible: boolean
  recoveryMode: {
    active: boolean
    startedAt: string | null
  }
}

export const energyApi = {
  get: async (): Promise<EnergyState> => {
    const res = await api.get<EnergyState>('/energy')
    return res.data
  },

  log: async (data: {
    social: number
    sensory: number
    cognitive: number
    physical: number
    note?: string
  }): Promise<EnergyLog> => {
    const res = await api.post<EnergyLog>('/energy', data)
    return res.data
  },

  logMasking: async (data: {
    level: number
    context: string
    recoveryActivity?: string
  }): Promise<MaskingLog> => {
    const res = await api.post<MaskingLog>('/energy/masking', data)
    return res.data
  },

  setAutoResponder: async (data: {
    enabled: boolean
    message?: string
    threshold?: number
  }): Promise<AutoResponderConfig> => {
    const res = await api.patch<AutoResponderConfig>('/energy/auto-responder', data)
    return res.data
  },

  setVisibility: async (visible: boolean): Promise<{ visible: boolean }> => {
    const res = await api.patch<{ visible: boolean }>('/energy/visibility', { visible })
    return res.data
  },

  getBudget: async () => api.get('/energy/budget').then(r => r.data),
}
