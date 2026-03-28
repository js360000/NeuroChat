import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeMode = 'light' | 'dark' | 'system'

interface A11ySettings {
  theme: ThemeMode
  highContrast: boolean
  largeText: boolean
  dyslexicFont: boolean
  reduceMotion: boolean
  fontSize: number
  lineHeight: number
  letterSpacing: number
}

interface A11yStore extends A11ySettings {
  setTheme: (theme: ThemeMode) => void
  setHighContrast: (enabled: boolean) => void
  setLargeText: (enabled: boolean) => void
  setDyslexicFont: (enabled: boolean) => void
  setReduceMotion: (enabled: boolean) => void
  setFontSize: (size: number) => void
  setLineHeight: (height: number) => void
  setLetterSpacing: (spacing: number) => void
  applySettings: () => void
}

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useA11yStore = create<A11yStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      highContrast: false,
      largeText: false,
      dyslexicFont: false,
      reduceMotion: false,
      fontSize: 100,
      lineHeight: 1.6,
      letterSpacing: 0,

      setTheme: (theme) => {
        set({ theme })
        get().applySettings()
      },
      setHighContrast: (enabled) => { set({ highContrast: enabled }); get().applySettings() },
      setLargeText: (enabled) => { set({ largeText: enabled }); get().applySettings() },
      setDyslexicFont: (enabled) => { set({ dyslexicFont: enabled }); get().applySettings() },
      setReduceMotion: (enabled) => { set({ reduceMotion: enabled }); get().applySettings() },
      setFontSize: (size) => { set({ fontSize: size }); get().applySettings() },
      setLineHeight: (height) => { set({ lineHeight: height }); get().applySettings() },
      setLetterSpacing: (spacing) => { set({ letterSpacing: spacing }); get().applySettings() },

      applySettings: () => {
        if (typeof document === 'undefined') return
        const root = document.documentElement
        const settings = get()

        const actualTheme = settings.theme === 'system' ? getSystemTheme() : settings.theme
        root.classList.toggle('dark', actualTheme === 'dark')
        root.classList.toggle('a11y-high-contrast', settings.highContrast)
        root.classList.toggle('a11y-large-text', settings.largeText)
        root.classList.toggle('a11y-dyslexic', settings.dyslexicFont)
        root.classList.toggle('a11y-reduce-motion', settings.reduceMotion)

        root.style.setProperty('--a11y-font-size', `${settings.fontSize}%`)
        root.style.setProperty('--a11y-line-height', `${settings.lineHeight}`)
        root.style.setProperty('--a11y-letter-spacing', `${settings.letterSpacing}em`)
      },
    }),
    { name: 'neurochat-a11y' }
  )
)
