import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Circle,
  RotateCcw,
  Wind,
  Palette,
  Fingerprint,
  Minus,
  X,
  Timer,
  Vibrate,
  Grip,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

type StimTab = 'bubbles' | 'spinner' | 'breathing' | 'colors' | 'texture'

interface StimWidgetProps {
  defaultOpen?: boolean
  className?: string
}

/* ─────────────────────────────────────────────
   Tab config
   ───────────────────────────────────────────── */

const TABS: { id: StimTab; label: string; icon: typeof Circle }[] = [
  { id: 'bubbles', label: 'Bubble Pop', icon: Grip },
  { id: 'spinner', label: 'Spinner', icon: RotateCcw },
  { id: 'breathing', label: 'Breathe', icon: Wind },
  { id: 'colors', label: 'Color Mix', icon: Palette },
  { id: 'texture', label: 'Texture', icon: Fingerprint },
]

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */

function tryVibrate(ms: number, enabled: boolean) {
  if (enabled && typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms)
  }
}

function formatStimTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

/* ═════════════════════════════════════════════
   Bubble Pop Grid
   ═════════════════════════════════════════════ */

function BubblePopGrid({
  haptics,
  onInteract,
}: {
  haptics: boolean
  onInteract: () => void
}) {
  const ROWS = 5
  const COLS = 6
  const total = ROWS * COLS
  const [popped, setPopped] = useState<Set<number>>(new Set())
  const [animating, setAnimating] = useState<Set<number>>(new Set())
  const popCount = popped.size

  function pop(idx: number) {
    if (popped.has(idx)) return
    tryVibrate(15, haptics)
    onInteract()
    setAnimating((prev) => new Set(prev).add(idx))
    setTimeout(() => {
      setPopped((prev) => new Set(prev).add(idx))
      setAnimating((prev) => {
        const next = new Set(prev)
        next.delete(idx)
        return next
      })
    }, 200)
  }

  function reset() {
    tryVibrate(30, haptics)
    setPopped(new Set())
    setAnimating(new Set())
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        }}
      >
        {Array.from({ length: total }, (_, i) => {
          const isPopped = popped.has(i)
          const isAnimating = animating.has(i)
          const hue = (i / total) * 360
          return (
            <button
              key={i}
              onClick={() => pop(i)}
              disabled={isPopped}
              className={cn(
                'w-9 h-9 rounded-full transition-all duration-200 ease-out',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isPopped
                  ? 'border-2 border-dashed border-muted-foreground/20 bg-transparent scale-90 opacity-40'
                  : 'shadow-inner cursor-pointer hover:scale-110 active:scale-90',
                isAnimating && 'scale-50 opacity-0',
              )}
              style={
                !isPopped
                  ? {
                      background: `linear-gradient(135deg, hsl(${hue} 70% 60% / 0.7), hsl(${hue + 30} 70% 50% / 0.5))`,
                      boxShadow: `inset 0 -2px 4px hsl(${hue} 50% 30% / 0.3), inset 0 2px 4px hsl(${hue} 80% 80% / 0.4)`,
                    }
                  : undefined
              }
              aria-label={isPopped ? `Bubble ${i + 1} popped` : `Pop bubble ${i + 1}`}
            />
          )
        })}
      </div>

      <div className="flex items-center justify-between w-full">
        <span className="text-xs text-muted-foreground">
          {popCount}/{total} popped
        </span>
        <button
          onClick={reset}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            'bg-primary/10 text-primary hover:bg-primary/20 active:scale-95',
          )}
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════
   Fidget Spinner
   ═════════════════════════════════════════════ */

function FidgetSpinner({
  haptics,
  onInteract,
}: {
  haptics: boolean
  onInteract: () => void
}) {
  const [angle, setAngle] = useState(0)
  const [_velocity, setVelocity] = useState(0)
  const [rpm, setRpm] = useState(0)
  const lastPointer = useRef<{ x: number; y: number; time: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)

  // Physics loop
  useEffect(() => {
    let prevTime = performance.now()
    function tick(now: number) {
      const dt = (now - prevTime) / 1000
      prevTime = now
      setVelocity((v) => {
        const friction = 0.97
        const newV = v * friction
        if (Math.abs(newV) < 0.5) return 0
        setAngle((a) => a + newV * dt)
        setRpm(Math.round(Math.abs(newV) / 6))
        return newV
      })
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  function getAngleFromCenter(clientX: number, clientY: number) {
    if (!containerRef.current) return 0
    const rect = containerRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI)
  }

  function handlePointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    lastPointer.current = { x: e.clientX, y: e.clientY, time: performance.now() }
    onInteract()
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!lastPointer.current) return
    const prevAngle = getAngleFromCenter(lastPointer.current.x, lastPointer.current.y)
    const currAngle = getAngleFromCenter(e.clientX, e.clientY)
    let delta = currAngle - prevAngle
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    setAngle((a) => a + delta)
    const dt = (performance.now() - lastPointer.current.time) / 1000
    if (dt > 0) {
      setVelocity(delta / dt)
    }
    lastPointer.current = { x: e.clientX, y: e.clientY, time: performance.now() }
  }

  function handlePointerUp() {
    if (lastPointer.current) {
      tryVibrate(10, haptics)
    }
    lastPointer.current = null
  }

  const arms = [0, 120, 240]

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        className="relative w-48 h-48 cursor-grab active:cursor-grabbing touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Spinner body */}
        <div
          className="absolute inset-0 transition-none"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          {/* Arms */}
          {arms.map((armAngle) => (
            <div
              key={armAngle}
              className="absolute left-1/2 top-1/2 origin-center"
              style={{
                width: '40%',
                height: '18px',
                marginLeft: '0',
                marginTop: '-9px',
                transform: `rotate(${armAngle}deg)`,
                borderRadius: '0 9999px 9999px 0',
                background: `linear-gradient(90deg, hsl(var(--primary) / 0.8), hsl(var(--secondary) / 0.6))`,
                boxShadow: `0 0 12px hsl(var(--primary) / 0.3)`,
              }}
            >
              {/* Arm weight */}
              <div
                className="absolute right-0 top-1/2 w-6 h-6 -translate-y-1/2 translate-x-1/2 rounded-full"
                style={{
                  background: `radial-gradient(circle, hsl(var(--primary)), hsl(var(--secondary)))`,
                  boxShadow: `0 0 8px hsl(var(--primary) / 0.5)`,
                }}
              />
            </div>
          ))}

          {/* Center hub */}
          <div
            className="absolute left-1/2 top-1/2 w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full z-10"
            style={{
              background: `radial-gradient(circle at 35% 35%, hsl(var(--surface-elevated)), hsl(var(--card)))`,
              border: `2px solid hsl(var(--border))`,
              boxShadow: `0 0 15px hsl(var(--primary) / 0.2), inset 0 1px 2px hsl(var(--primary) / 0.1)`,
            }}
          />
        </div>
      </div>

      {/* RPM display */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30">
        <RotateCcw
          className={cn(
            'w-3.5 h-3.5 text-primary',
            rpm > 0 && 'animate-spin',
          )}
          style={rpm > 0 ? { animationDuration: `${Math.max(0.1, 2 / (rpm / 30))}s` } : undefined}
        />
        <span className="text-sm font-mono font-medium text-foreground">{rpm}</span>
        <span className="text-xs text-muted-foreground">RPM</span>
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════
   Breathing Pacer
   ═════════════════════════════════════════════ */

type BreathPhase = 'in' | 'hold' | 'out' | 'rest'

const BREATH_PATTERNS: Record<string, { in: number; hold: number; out: number; rest: number; label: string }> = {
  '4-7-8': { in: 4, hold: 7, out: 8, rest: 0, label: '4-7-8 Relaxing' },
  '4-4-4-4': { in: 4, hold: 4, out: 4, rest: 4, label: 'Box Breathing' },
  '5-0-5-0': { in: 5, hold: 0, out: 5, rest: 0, label: 'Simple Calm' },
}

function BreathingPacer({ onInteract }: { onInteract: () => void }) {
  const [isActive, setIsActive] = useState(false)
  const [phase, setPhase] = useState<BreathPhase>('in')
  const [progress, setProgress] = useState(0)
  const [cycleCount, setCycleCount] = useState(0)
  const [patternKey, setPatternKey] = useState('4-7-8')
  const pattern = BREATH_PATTERNS[patternKey]
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const phaseRef = useRef<BreathPhase>('in')
  const tickRef = useRef(0)

  const phaseLabel: Record<BreathPhase, string> = {
    in: 'Breathe in...',
    hold: 'Hold...',
    out: 'Breathe out...',
    rest: 'Rest...',
  }

  const phaseDuration = useCallback(
    (p: BreathPhase) => {
      return pattern[p === 'in' ? 'in' : p === 'hold' ? 'hold' : p === 'out' ? 'out' : 'rest']
    },
    [pattern],
  )

  const nextPhase = useCallback(
    (current: BreathPhase): BreathPhase => {
      const order: BreathPhase[] = ['in', 'hold', 'out', 'rest']
      let idx = order.indexOf(current)
      do {
        idx = (idx + 1) % order.length
      } while (phaseDuration(order[idx]) === 0)
      return order[idx]
    },
    [phaseDuration],
  )

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    onInteract()
    phaseRef.current = 'in'
    tickRef.current = 0
    setPhase('in')
    setProgress(0)

    timerRef.current = setInterval(() => {
      tickRef.current += 0.05
      const dur = phaseDuration(phaseRef.current)
      if (dur === 0 || tickRef.current >= dur) {
        const prev = phaseRef.current
        const next = nextPhase(prev)
        if (next === 'in' && prev !== 'in') {
          setCycleCount((c) => c + 1)
        }
        phaseRef.current = next
        tickRef.current = 0
        setPhase(next)
        setProgress(0)
      } else {
        setProgress(tickRef.current / dur)
      }
    }, 50)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, patternKey, phaseDuration, nextPhase, onInteract])

  const circleScale = phase === 'in' ? 1 + progress * 0.5 : phase === 'hold' ? 1.5 : phase === 'out' ? 1.5 - progress * 0.5 : 1

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pattern selector */}
      <div className="flex gap-1.5 w-full">
        {Object.entries(BREATH_PATTERNS).map(([key, p]) => (
          <button
            key={key}
            onClick={() => {
              setPatternKey(key)
              setIsActive(false)
              setCycleCount(0)
            }}
            className={cn(
              'flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all',
              key === patternKey
                ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Breathing circle */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        {/* Outer glow ring */}
        <div
          className="absolute rounded-full transition-all ease-in-out"
          style={{
            width: `${circleScale * 100}%`,
            height: `${circleScale * 100}%`,
            background: `radial-gradient(circle, hsl(var(--primary) / 0.05), transparent 70%)`,
            transitionDuration: '100ms',
          }}
        />
        {/* Main circle */}
        <div
          className="absolute rounded-full transition-all ease-in-out"
          style={{
            width: `${circleScale * 70}%`,
            height: `${circleScale * 70}%`,
            background:
              phase === 'in'
                ? `radial-gradient(circle at 40% 40%, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.2))`
                : phase === 'hold'
                  ? `radial-gradient(circle at 40% 40%, hsl(var(--secondary) / 0.4), hsl(var(--primary) / 0.2))`
                  : phase === 'out'
                    ? `radial-gradient(circle at 40% 40%, hsl(var(--accent) / 0.4), hsl(var(--secondary) / 0.2))`
                    : `radial-gradient(circle at 40% 40%, hsl(var(--muted) / 0.3), hsl(var(--primary) / 0.1))`,
            boxShadow: isActive
              ? `0 0 40px hsl(var(--primary) / 0.2), inset 0 0 20px hsl(var(--primary) / 0.1)`
              : 'none',
            transitionDuration: '100ms',
          }}
        />
        {/* Center text */}
        <div className="relative z-10 flex flex-col items-center">
          {isActive ? (
            <>
              <span className="text-sm font-medium text-foreground">{phaseLabel[phase]}</span>
              <span className="text-[10px] text-muted-foreground mt-1">Cycle {cycleCount + 1}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Tap Start</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <button
        onClick={() => {
          setIsActive(!isActive)
          if (isActive) {
            setCycleCount(0)
          }
        }}
        className={cn(
          'px-5 py-2 rounded-xl text-sm font-medium transition-all active:scale-95',
          isActive
            ? 'bg-muted text-muted-foreground hover:bg-muted/80'
            : 'bg-primary/15 text-primary hover:bg-primary/25 glow-sm',
        )}
      >
        {isActive ? 'Stop' : 'Start'}
      </button>
    </div>
  )
}

/* ═════════════════════════════════════════════
   Color Mixer
   ═════════════════════════════════════════════ */

function ColorMixer({
  haptics,
  onInteract,
}: {
  haptics: boolean
  onInteract: () => void
}) {
  const [leftColor, setLeftColor] = useState({ h: 220, s: 80, l: 60 })
  const [rightColor, setRightColor] = useState({ h: 340, s: 80, l: 60 })
  const [leftPressure, setLeftPressure] = useState(0)
  const [rightPressure, setRightPressure] = useState(0)
  const [mixRatio, setMixRatio] = useState(0.5)
  const [blobPhase, setBlobPhase] = useState(0)
  const leftTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const rightTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Animate blob morphing
  useEffect(() => {
    const interval = setInterval(() => {
      setBlobPhase((p) => p + 0.02)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  function startPress(side: 'left' | 'right') {
    onInteract()
    tryVibrate(10, haptics)
    const setter = side === 'left' ? setLeftPressure : setRightPressure
    const timerRefSide = side === 'left' ? leftTimerRef : rightTimerRef
    setter(0.3)
    timerRefSide.current = setInterval(() => {
      setter((p) => Math.min(1, p + 0.05))
      setMixRatio((r) => {
        const delta = side === 'left' ? -0.02 : 0.02
        return Math.max(0, Math.min(1, r + delta))
      })
    }, 50)
  }

  function endPress(side: 'left' | 'right') {
    const setter = side === 'left' ? setLeftPressure : setRightPressure
    const timerRefSide = side === 'left' ? leftTimerRef : rightTimerRef
    if (timerRefSide.current) {
      clearInterval(timerRefSide.current)
      timerRefSide.current = null
    }
    setter(0)
  }

  function randomizeColor(side: 'left' | 'right') {
    const newColor = { h: Math.random() * 360, s: 60 + Math.random() * 30, l: 45 + Math.random() * 20 }
    if (side === 'left') setLeftColor(newColor)
    else setRightColor(newColor)
    tryVibrate(15, haptics)
  }

  const mixedH = leftColor.h * (1 - mixRatio) + rightColor.h * mixRatio
  const mixedS = leftColor.s * (1 - mixRatio) + rightColor.s * mixRatio
  const mixedL = leftColor.l * (1 - mixRatio) + rightColor.l * mixRatio

  const blobRadius = (angle: number) => {
    return 38 + 8 * Math.sin(angle * 3 + blobPhase) + 5 * Math.cos(angle * 5 - blobPhase * 1.3)
  }

  const blobPath = () => {
    const points: string[] = []
    for (let i = 0; i <= 360; i += 5) {
      const rad = (i * Math.PI) / 180
      const r = blobRadius(rad)
      const x = 50 + r * Math.cos(rad)
      const y = 50 + r * Math.sin(rad)
      points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`)
    }
    return points.join(' ') + ' Z'
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 w-full">
        {/* Left color well */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <button
            onPointerDown={() => startPress('left')}
            onPointerUp={() => endPress('left')}
            onPointerLeave={() => endPress('left')}
            onPointerCancel={() => endPress('left')}
            className="w-16 h-16 rounded-2xl transition-transform duration-100 cursor-pointer touch-none select-none"
            style={{
              background: `hsl(${leftColor.h} ${leftColor.s}% ${leftColor.l}%)`,
              transform: `scale(${1 - leftPressure * 0.15})`,
              boxShadow: `0 0 ${20 + leftPressure * 20}px hsl(${leftColor.h} ${leftColor.s}% ${leftColor.l}% / ${0.3 + leftPressure * 0.3})`,
            }}
            aria-label="Press to squeeze left color"
          />
          <button
            onClick={() => randomizeColor('left')}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Shuffle
          </button>
        </div>

        {/* Mixed blob */}
        <div className="w-24 h-24 relative flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <radialGradient id="mixGrad" cx="40%" cy="40%">
                <stop
                  offset="0%"
                  stopColor={`hsl(${mixedH} ${mixedS}% ${Math.min(mixedL + 15, 85)}%)`}
                />
                <stop
                  offset="100%"
                  stopColor={`hsl(${mixedH} ${mixedS}% ${mixedL}%)`}
                />
              </radialGradient>
            </defs>
            <path
              d={blobPath()}
              fill="url(#mixGrad)"
              style={{
                filter: `drop-shadow(0 0 12px hsl(${mixedH} ${mixedS}% ${mixedL}% / 0.4))`,
              }}
            />
          </svg>
        </div>

        {/* Right color well */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <button
            onPointerDown={() => startPress('right')}
            onPointerUp={() => endPress('right')}
            onPointerLeave={() => endPress('right')}
            onPointerCancel={() => endPress('right')}
            className="w-16 h-16 rounded-2xl transition-transform duration-100 cursor-pointer touch-none select-none"
            style={{
              background: `hsl(${rightColor.h} ${rightColor.s}% ${rightColor.l}%)`,
              transform: `scale(${1 - rightPressure * 0.15})`,
              boxShadow: `0 0 ${20 + rightPressure * 20}px hsl(${rightColor.h} ${rightColor.s}% ${rightColor.l}% / ${0.3 + rightPressure * 0.3})`,
            }}
            aria-label="Press to squeeze right color"
          />
          <button
            onClick={() => randomizeColor('right')}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Shuffle
          </button>
        </div>
      </div>

      {/* Mix ratio indicator */}
      <div className="w-full h-2 rounded-full overflow-hidden bg-muted/30">
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{
            width: `${mixRatio * 100}%`,
            background: `linear-gradient(90deg, hsl(${leftColor.h} ${leftColor.s}% ${leftColor.l}%), hsl(${rightColor.h} ${rightColor.s}% ${rightColor.l}%))`,
          }}
        />
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Press and hold each color to squeeze it into the mix
      </p>
    </div>
  )
}

/* ═════════════════════════════════════════════
   Texture Pad (Scratch-off)
   ═════════════════════════════════════════════ */

function TexturePad({
  haptics,
  onInteract,
}: {
  haptics: boolean
  onInteract: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const [scratchPercent, setScratchPercent] = useState(0)

  // Draw gradient underneath
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height

    // Create a pretty gradient
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#6366f1')
    grad.addColorStop(0.25, '#8b5cf6')
    grad.addColorStop(0.5, '#06b6d4')
    grad.addColorStop(0.75, '#10b981')
    grad.addColorStop(1, '#f59e0b')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Add sparkle dots
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      const r = 1 + Math.random() * 2
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.5})`
      ctx.fill()
    }
  }, [])

  // Draw texture overlay
  useEffect(() => {
    const canvas = overlayRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height

    // Fill with a textured pattern
    ctx.fillStyle = '#1e1b3a'
    ctx.fillRect(0, 0, w, h)

    // Draw crosshatch texture pattern
    ctx.strokeStyle = 'rgba(100, 100, 140, 0.4)'
    ctx.lineWidth = 1
    const spacing = 8
    for (let x = 0; x < w; x += spacing) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y < h; y += spacing) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // Diagonal texture
    ctx.strokeStyle = 'rgba(130, 120, 170, 0.2)'
    for (let x = -h; x < w; x += spacing * 2) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + h, h)
      ctx.stroke()
    }

    // Add dots
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      ctx.beginPath()
      ctx.arc(x, y, 1, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(150, 140, 190, ${0.2 + Math.random() * 0.3})`
      ctx.fill()
    }
  }, [])

  function getPos(e: React.PointerEvent) {
    const canvas = overlayRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function scratch(e: React.PointerEvent) {
    const canvas = overlayRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'

    // Calculate scratch percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let transparent = 0
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparent++
    }
    const total = imageData.data.length / 4
    setScratchPercent(Math.round((transparent / total) * 100))
  }

  function handlePointerDown(e: React.PointerEvent) {
    isDrawing.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    onInteract()
    scratch(e)
    tryVibrate(5, haptics)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDrawing.current) return
    scratch(e)
  }

  function handlePointerUp() {
    isDrawing.current = false
  }

  function resetOverlay() {
    const canvas = overlayRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height

    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = '#1e1b3a'
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = 'rgba(100, 100, 140, 0.4)'
    ctx.lineWidth = 1
    const spacing = 8
    for (let x = 0; x < w; x += spacing) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y < h; y += spacing) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(130, 120, 170, 0.2)'
    for (let x = -h; x < w; x += spacing * 2) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + h, h)
      ctx.stroke()
    }
    for (let i = 0; i < 120; i++) {
      const xx = Math.random() * w
      const yy = Math.random() * h
      ctx.beginPath()
      ctx.arc(xx, yy, 1, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(150, 140, 190, ${0.2 + Math.random() * 0.3})`
      ctx.fill()
    }
    setScratchPercent(0)
    tryVibrate(20, haptics)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative rounded-xl overflow-hidden border border-border/50 touch-none select-none">
        <canvas
          ref={canvasRef}
          width={280}
          height={180}
          className="block"
          style={{ width: '100%', height: 'auto' }}
        />
        <canvas
          ref={overlayRef}
          width={280}
          height={180}
          className="absolute inset-0 cursor-crosshair"
          style={{ width: '100%', height: 'auto' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      <div className="flex items-center justify-between w-full">
        <span className="text-xs text-muted-foreground">
          {scratchPercent}% revealed
        </span>
        <button
          onClick={resetOverlay}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            'bg-primary/10 text-primary hover:bg-primary/20 active:scale-95',
          )}
        >
          <RotateCcw className="w-3 h-3" />
          New Texture
        </button>
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════
   Main StimWidget
   ═════════════════════════════════════════════ */

export function StimWidget({ defaultOpen = false, className }: StimWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeTab, setActiveTab] = useState<StimTab>('bubbles')
  const [haptics, setHaptics] = useState(true)
  const [stimTime, setStimTime] = useState(0)
  const [isInteracting, setIsInteracting] = useState(false)
  const interactionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Stim time tracker
  useEffect(() => {
    if (isOpen && !isMinimized) {
      timerRef.current = setInterval(() => {
        setStimTime((t) => t + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isOpen, isMinimized])

  function onInteract() {
    setIsInteracting(true)
    if (interactionTimeout.current) clearTimeout(interactionTimeout.current)
    interactionTimeout.current = setTimeout(() => setIsInteracting(false), 300)
  }

  // Minimized FAB
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50',
          'w-12 h-12 rounded-full glass-heavy shadow-glow-md',
          'flex items-center justify-center',
          'hover:scale-110 active:scale-95 transition-all duration-200',
          'animate-float',
          className,
        )}
        aria-label="Open stim widget"
      >
        <Grip className="w-5 h-5 text-primary" />
      </button>
    )
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={cn(
          'fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50',
          'flex items-center gap-2 px-3 py-2 rounded-xl glass-heavy shadow-glow-sm',
          'hover:scale-105 active:scale-95 transition-all duration-200',
          className,
        )}
        aria-label="Expand stim widget"
      >
        <Grip className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-foreground">
          {TABS.find((t) => t.id === activeTab)?.label}
        </span>
        <span className="text-[10px] text-muted-foreground">{formatStimTime(stimTime)}</span>
      </button>
    )
  }

  const ActiveIcon = TABS.find((t) => t.id === activeTab)?.icon ?? Circle

  return (
    <div
      className={cn(
        'fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50',
        'w-[340px] max-h-[520px] rounded-2xl glass-heavy shadow-glow-md',
        'flex flex-col overflow-hidden',
        'animate-scale-in',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200',
              isInteracting
                ? 'bg-primary/20 glow-primary scale-110'
                : 'bg-primary/10',
            )}
          >
            <ActiveIcon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground leading-tight">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h3>
            <div className="flex items-center gap-2">
              <Timer className="w-2.5 h-2.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{formatStimTime(stimTime)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Haptics toggle */}
          <button
            onClick={() => setHaptics(!haptics)}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              haptics
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:bg-muted/50',
            )}
            title={haptics ? 'Vibration on' : 'Vibration off'}
            aria-label={haptics ? 'Disable vibration' : 'Enable vibration'}
          >
            <Vibrate className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
            aria-label="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/30">
        {TABS.map((tab) => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 transition-all',
                'text-[10px] font-medium',
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
              )}
              aria-label={tab.label}
              aria-selected={activeTab === tab.id}
            >
              <TabIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'bubbles' && (
          <BubblePopGrid haptics={haptics} onInteract={onInteract} />
        )}
        {activeTab === 'spinner' && (
          <FidgetSpinner haptics={haptics} onInteract={onInteract} />
        )}
        {activeTab === 'breathing' && (
          <BreathingPacer onInteract={onInteract} />
        )}
        {activeTab === 'colors' && (
          <ColorMixer haptics={haptics} onInteract={onInteract} />
        )}
        {activeTab === 'texture' && (
          <TexturePad haptics={haptics} onInteract={onInteract} />
        )}
      </div>
    </div>
  )
}
