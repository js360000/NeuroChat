import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ChatPreferences {
  showToneTags: boolean
  autoExplain: boolean
  smartReplies: boolean
  showMoodIndicators: boolean
  messageAnimations: boolean
  compactMode: boolean
  sendWithEnter: boolean
  showTimestamps: boolean
  showReadReceipts: boolean
  sensoryBreakInterval: number // minutes, 0 = disabled
  lastBreakReminder: string

  setShowToneTags: (v: boolean) => void
  setAutoExplain: (v: boolean) => void
  setSmartReplies: (v: boolean) => void
  setShowMoodIndicators: (v: boolean) => void
  setMessageAnimations: (v: boolean) => void
  setCompactMode: (v: boolean) => void
  setSendWithEnter: (v: boolean) => void
  setShowTimestamps: (v: boolean) => void
  setShowReadReceipts: (v: boolean) => void
  setSensoryBreakInterval: (mins: number) => void
  recordBreakReminder: () => void
  shouldShowBreakReminder: () => boolean
}

export const useChatStore = create<ChatPreferences>()(
  persist(
    (set, get) => ({
      showToneTags: true,
      autoExplain: false,
      smartReplies: true,
      showMoodIndicators: true,
      messageAnimations: true,
      compactMode: false,
      sendWithEnter: true,
      showTimestamps: true,
      showReadReceipts: true,
      sensoryBreakInterval: 30,
      lastBreakReminder: new Date().toISOString(),

      setShowToneTags: (v) => set({ showToneTags: v }),
      setAutoExplain: (v) => set({ autoExplain: v }),
      setSmartReplies: (v) => set({ smartReplies: v }),
      setShowMoodIndicators: (v) => set({ showMoodIndicators: v }),
      setMessageAnimations: (v) => set({ messageAnimations: v }),
      setCompactMode: (v) => set({ compactMode: v }),
      setSendWithEnter: (v) => set({ sendWithEnter: v }),
      setShowTimestamps: (v) => set({ showTimestamps: v }),
      setShowReadReceipts: (v) => set({ showReadReceipts: v }),
      setSensoryBreakInterval: (mins) => set({ sensoryBreakInterval: mins }),
      recordBreakReminder: () => set({ lastBreakReminder: new Date().toISOString() }),

      shouldShowBreakReminder: () => {
        const { sensoryBreakInterval, lastBreakReminder } = get()
        if (sensoryBreakInterval === 0) return false
        const elapsed = Date.now() - new Date(lastBreakReminder).getTime()
        return elapsed >= sensoryBreakInterval * 60 * 1000
      },
    }),
    { name: 'neurochat-prefs' }
  )
)
