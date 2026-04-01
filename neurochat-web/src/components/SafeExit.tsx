import { useEffect, useRef } from 'react'

/**
 * Safe Exit — triple-tap Escape to instantly leave the app.
 * Navigates to a neutral page (Google by default) using location.replace
 * so the back button doesn't return to NeuroChat.
 *
 * Common in DV and safeguarding apps. Useful for ND people who face
 * stigma about using a support app and need discretion.
 */

const SAFE_EXIT_KEY = 'neurochat_safe_exit'
const DEFAULT_URL = 'https://www.google.com'
const TAP_WINDOW = 800

interface SafeExitConfig { enabled: boolean; url: string }

function getConfig(): SafeExitConfig {
  try {
    const stored = localStorage.getItem(SAFE_EXIT_KEY)
    return stored ? { enabled: true, url: DEFAULT_URL, ...JSON.parse(stored) } : { enabled: true, url: DEFAULT_URL }
  } catch { return { enabled: true, url: DEFAULT_URL } }
}

export function SafeExit() {
  const taps = useRef<number[]>([])

  useEffect(() => {
    const config = getConfig()
    if (!config.enabled) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      const now = Date.now()
      taps.current = [...taps.current.filter(t => now - t < TAP_WINDOW), now]
      if (taps.current.length >= 3) {
        taps.current = []
        window.location.replace(config.url)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return null
}

export function saveSafeExitConfig(config: Partial<SafeExitConfig>) {
  localStorage.setItem(SAFE_EXIT_KEY, JSON.stringify({ ...getConfig(), ...config }))
}

export function getSafeExitConfig(): SafeExitConfig {
  return getConfig()
}
