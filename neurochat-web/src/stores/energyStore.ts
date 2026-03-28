import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type EnergyLevel = 'full' | 'high' | 'medium' | 'low' | 'depleted'

interface EnergyState {
  level: number // 0-100
  status: EnergyLevel
  lastUpdated: string
  autoReminders: boolean
  quietHoursStart: string // "22:00"
  quietHoursEnd: string   // "08:00"

  setLevel: (level: number) => void
  decrementEnergy: (amount: number) => void
  incrementEnergy: (amount: number) => void
  setAutoReminders: (enabled: boolean) => void
  setQuietHours: (start: string, end: string) => void
  getStatus: () => EnergyLevel
}

function levelToStatus(level: number): EnergyLevel {
  if (level >= 80) return 'full'
  if (level >= 60) return 'high'
  if (level >= 40) return 'medium'
  if (level >= 20) return 'low'
  return 'depleted'
}

export const useEnergyStore = create<EnergyState>()(
  persist(
    (set, get) => ({
      level: 75,
      status: 'high',
      lastUpdated: new Date().toISOString(),
      autoReminders: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',

      setLevel: (level) => {
        const clamped = Math.max(0, Math.min(100, level))
        set({
          level: clamped,
          status: levelToStatus(clamped),
          lastUpdated: new Date().toISOString(),
        })
      },

      decrementEnergy: (amount) => {
        const newLevel = Math.max(0, get().level - amount)
        set({
          level: newLevel,
          status: levelToStatus(newLevel),
          lastUpdated: new Date().toISOString(),
        })
      },

      incrementEnergy: (amount) => {
        const newLevel = Math.min(100, get().level + amount)
        set({
          level: newLevel,
          status: levelToStatus(newLevel),
          lastUpdated: new Date().toISOString(),
        })
      },

      setAutoReminders: (enabled) => set({ autoReminders: enabled }),

      setQuietHours: (start, end) => set({
        quietHoursStart: start,
        quietHoursEnd: end,
      }),

      getStatus: () => levelToStatus(get().level),
    }),
    { name: 'neurochat-energy' }
  )
)
