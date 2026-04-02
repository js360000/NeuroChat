import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeMode = 'light' | 'dark' | 'system'
type ColourOverlay = 'none' | 'yellow' | 'blue' | 'pink' | 'green' | 'peach'
type CursorSize = 'default' | 'large' | 'xlarge'
type TextAlign = 'left' | 'justify'

interface A11ySettings {
  // Theme
  theme: ThemeMode
  // Display
  highContrast: boolean
  largeText: boolean
  dyslexicFont: boolean
  reduceMotion: boolean
  monochrome: boolean
  // Blue light & overlays
  blueLightFilter: number // 0-100
  colourOverlay: ColourOverlay
  saturation: number // 0-200
  // Text
  fontSize: number // 80-200
  lineHeight: number // 1.0-3.0
  letterSpacing: number // 0-0.3
  wordSpacing: number // 0-0.5
  paragraphSpacing: number // 0-3
  textAlign: TextAlign
  // Interaction
  cursorSize: CursorSize
  focusHighlight: boolean
  linkUnderline: boolean
  hideImages: boolean
}

interface A11yStore extends A11ySettings {
  setTheme: (theme: ThemeMode) => void
  setHighContrast: (enabled: boolean) => void
  setLargeText: (enabled: boolean) => void
  setDyslexicFont: (enabled: boolean) => void
  setReduceMotion: (enabled: boolean) => void
  setMonochrome: (enabled: boolean) => void
  setBlueLightFilter: (intensity: number) => void
  setColourOverlay: (overlay: ColourOverlay) => void
  setSaturation: (saturation: number) => void
  setFontSize: (size: number) => void
  setLineHeight: (height: number) => void
  setLetterSpacing: (spacing: number) => void
  setWordSpacing: (spacing: number) => void
  setParagraphSpacing: (spacing: number) => void
  setTextAlign: (align: TextAlign) => void
  setCursorSize: (size: CursorSize) => void
  setFocusHighlight: (enabled: boolean) => void
  setLinkUnderline: (enabled: boolean) => void
  setHideImages: (enabled: boolean) => void
  applySettings: () => void
  resetAll: () => void
}

const DEFAULTS: A11ySettings = {
  theme: 'dark',
  highContrast: false,
  largeText: false,
  dyslexicFont: false,
  reduceMotion: false,
  monochrome: false,
  blueLightFilter: 0,
  colourOverlay: 'none',
  saturation: 100,
  fontSize: 100,
  lineHeight: 1.6,
  letterSpacing: 0,
  wordSpacing: 0,
  paragraphSpacing: 0,
  textAlign: 'left',
  cursorSize: 'default',
  focusHighlight: false,
  linkUnderline: false,
  hideImages: false,
}

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useA11yStore = create<A11yStore>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,

      setTheme: (theme) => { set({ theme }); get().applySettings() },
      setHighContrast: (enabled) => { set({ highContrast: enabled }); get().applySettings() },
      setLargeText: (enabled) => { set({ largeText: enabled }); get().applySettings() },
      setDyslexicFont: (enabled) => { set({ dyslexicFont: enabled }); get().applySettings() },
      setReduceMotion: (enabled) => { set({ reduceMotion: enabled }); get().applySettings() },
      setMonochrome: (enabled) => { set({ monochrome: enabled }); get().applySettings() },
      setBlueLightFilter: (intensity) => { set({ blueLightFilter: intensity }); get().applySettings() },
      setColourOverlay: (overlay) => { set({ colourOverlay: overlay }); get().applySettings() },
      setSaturation: (saturation) => { set({ saturation }); get().applySettings() },
      setFontSize: (size) => { set({ fontSize: size }); get().applySettings() },
      setLineHeight: (height) => { set({ lineHeight: height }); get().applySettings() },
      setLetterSpacing: (spacing) => { set({ letterSpacing: spacing }); get().applySettings() },
      setWordSpacing: (spacing) => { set({ wordSpacing: spacing }); get().applySettings() },
      setParagraphSpacing: (spacing) => { set({ paragraphSpacing: spacing }); get().applySettings() },
      setTextAlign: (align) => { set({ textAlign: align }); get().applySettings() },
      setCursorSize: (size) => { set({ cursorSize: size }); get().applySettings() },
      setFocusHighlight: (enabled) => { set({ focusHighlight: enabled }); get().applySettings() },
      setLinkUnderline: (enabled) => { set({ linkUnderline: enabled }); get().applySettings() },
      setHideImages: (enabled) => { set({ hideImages: enabled }); get().applySettings() },

      resetAll: () => { set(DEFAULTS); get().applySettings() },

      applySettings: () => {
        if (typeof document === 'undefined') return
        const root = document.documentElement
        const s = get()

        // Theme
        const actualTheme = s.theme === 'system' ? getSystemTheme() : s.theme
        root.classList.toggle('dark', actualTheme === 'dark')

        // Toggle classes
        root.classList.toggle('a11y-high-contrast', s.highContrast)
        root.classList.toggle('a11y-large-text', s.largeText)
        root.classList.toggle('a11y-dyslexic', s.dyslexicFont)
        root.classList.toggle('a11y-reduce-motion', s.reduceMotion)
        root.classList.toggle('a11y-monochrome', s.monochrome)
        root.classList.toggle('a11y-focus-highlight', s.focusHighlight)
        root.classList.toggle('a11y-link-underline', s.linkUnderline)
        root.classList.toggle('a11y-hide-images', s.hideImages)
        root.classList.toggle('a11y-cursor-large', s.cursorSize === 'large')
        root.classList.toggle('a11y-cursor-xlarge', s.cursorSize === 'xlarge')

        // CSS variables
        root.style.setProperty('--a11y-font-size', `${s.fontSize}%`)
        root.style.setProperty('--a11y-line-height', `${s.lineHeight}`)
        root.style.setProperty('--a11y-letter-spacing', `${s.letterSpacing}em`)
        root.style.setProperty('--a11y-word-spacing', `${s.wordSpacing}em`)
        root.style.setProperty('--a11y-paragraph-spacing', `${s.paragraphSpacing}em`)
        root.style.setProperty('--a11y-text-align', s.textAlign)
        root.style.setProperty('--a11y-saturation', `${s.saturation}%`)

        // Blue light filter (warm overlay via CSS filter)
        if (s.blueLightFilter > 0) {
          const sepia = s.blueLightFilter * 0.5
          const warmth = 100 - s.blueLightFilter * 0.15
          root.style.setProperty('--a11y-blue-filter', `sepia(${sepia}%) brightness(${warmth}%)`)
        } else {
          root.style.setProperty('--a11y-blue-filter', 'none')
        }

        // Colour overlay
        const overlayColors: Record<ColourOverlay, string> = {
          none: 'transparent',
          yellow: 'rgba(255, 255, 150, 0.08)',
          blue: 'rgba(150, 200, 255, 0.08)',
          pink: 'rgba(255, 180, 200, 0.08)',
          green: 'rgba(180, 255, 180, 0.08)',
          peach: 'rgba(255, 218, 185, 0.08)',
        }
        root.style.setProperty('--a11y-colour-overlay', overlayColors[s.colourOverlay])
      },
    }),
    { name: 'neurochat-a11y' }
  )
)
