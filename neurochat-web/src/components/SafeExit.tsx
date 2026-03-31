import { useState, useEffect, useRef } from 'react'

/**
 * Safe Exit — triple-tap or shake gesture to instantly blank the screen.
 * Shows a neutral "screen off" view. Tap anywhere to return.
 * For ND users in environments where they need discretion.
 */
export function SafeExit() {
  const [active, setActive] = useState(false)
  const tapTimesRef = useRef<number[]>([])

  useEffect(() => {
    // Triple-tap detection (3 taps within 600ms)
    function handleTap() {
      const now = Date.now()
      tapTimesRef.current.push(now)
      // Keep only taps in the last 800ms
      tapTimesRef.current = tapTimesRef.current.filter(t => now - t < 800)
      if (tapTimesRef.current.length >= 3) {
        setActive(true)
        tapTimesRef.current = []
      }
    }

    // Keyboard shortcut: Escape 3 times fast
    let escCount = 0
    let escTimer: ReturnType<typeof setTimeout> | null = null
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        escCount++
        if (escTimer) clearTimeout(escTimer)
        escTimer = setTimeout(() => { escCount = 0 }, 800)
        if (escCount >= 3) {
          setActive(true)
          escCount = 0
        }
      }
    }

    // Device shake detection (mobile)
    let lastAccel = { x: 0, y: 0, z: 0 }
    let shakeCount = 0
    let shakeTimer: ReturnType<typeof setTimeout> | null = null
    function handleMotion(e: DeviceMotionEvent) {
      const accel = e.accelerationIncludingGravity
      if (!accel?.x || !accel?.y || !accel?.z) return
      const delta = Math.abs(accel.x - lastAccel.x) + Math.abs(accel.y - lastAccel.y) + Math.abs(accel.z - lastAccel.z)
      lastAccel = { x: accel.x, y: accel.y, z: accel.z }
      if (delta > 30) {
        shakeCount++
        if (shakeTimer) clearTimeout(shakeTimer)
        shakeTimer = setTimeout(() => { shakeCount = 0 }, 1000)
        if (shakeCount >= 3) {
          setActive(true)
          shakeCount = 0
        }
      }
    }

    // Use touchstart for mobile triple-tap
    document.addEventListener('touchstart', handleTap, { passive: true })
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('devicemotion', handleMotion)

    return () => {
      document.removeEventListener('touchstart', handleTap)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('devicemotion', handleMotion)
    }
  }, [])

  if (!active) return null

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black cursor-pointer select-none"
      onClick={() => setActive(false)}
      onTouchStart={() => setActive(false)}
      role="button"
      aria-label="Tap to return to app"
    >
      {/* Looks like a locked/off screen — completely blank except for a subtle clock */}
      <div className="flex items-center justify-center h-full">
        <div className="text-center opacity-30">
          <p className="text-4xl font-light text-white tabular-nums">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-sm text-white/50 mt-1">
            {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  )
}
