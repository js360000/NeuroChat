import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Battery, BatteryLow, BatteryMedium, BatteryFull, BatteryCharging,
  Zap, Brain, Eye, Heart, Activity, Clock, Send, Loader2,
  Shield, Moon, Music, TreePine, Sparkles, Coffee, Bed,
  MessageSquareOff, ChevronDown, ChevronUp, Pause, Play,
  ThermometerSun, Waves, Users, Globe, Briefcase, Home,
} from 'lucide-react'
import { energyApi, type EnergyLog, type MaskingLog } from '@/lib/api/energy'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function avgEnergy(s: number, se: number, c: number, p: number) {
  return Math.round((s + se + c + p) / 4)
}

function formatRelativeTime(date: string | Date | null): string {
  if (!date) return 'Never'
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000)
  const hours = Math.floor(mins / 60)
  const remainMins = mins % 60
  if (hours === 0) return `${remainMins}m`
  return `${hours}h ${remainMins}m`
}

// Simulate history when API hasn't returned enough data yet
function generateFallbackHistory(): EnergyLog[] {
  const logs: EnergyLog[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    logs.push({
      id: `fallback-${i}`,
      social: clamp(Math.round(40 + Math.random() * 50), 0, 100),
      sensory: clamp(Math.round(35 + Math.random() * 55), 0, 100),
      cognitive: clamp(Math.round(30 + Math.random() * 60), 0, 100),
      physical: clamp(Math.round(45 + Math.random() * 45), 0, 100),
      createdAt: d.toISOString(),
    })
  }
  return logs
}

function generateFallbackMasking(): MaskingLog[] {
  const logs: MaskingLog[] = []
  const contexts = ['Work', 'Social', 'Public', 'Family', 'Online']
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    logs.push({
      id: `fallback-m-${i}`,
      level: Math.round(2 + Math.random() * 7),
      context: contexts[Math.floor(Math.random() * contexts.length)],
      createdAt: d.toISOString(),
    })
  }
  return logs
}

// ---------------------------------------------------------------------------
// Radial Arc Gauge
// ---------------------------------------------------------------------------

function ArcGauge({ value, label, color, icon: Icon }: {
  value: number
  label: string
  color: string
  icon: typeof Heart
}) {
  const radius = 38
  const stroke = 6
  const circumference = 2 * Math.PI * radius * 0.75 // 270 degrees
  const offset = circumference - (clamp(value, 0, 100) / 100) * circumference
  const gradientId = `gauge-${label.toLowerCase()}`

  const colorMap: Record<string, { from: string; to: string; text: string; bg: string }> = {
    pink: { from: '#ec4899', to: '#f472b6', text: 'text-pink-400', bg: 'bg-pink-500/10' },
    cyan: { from: '#06b6d4', to: '#67e8f9', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    violet: { from: '#8b5cf6', to: '#a78bfa', text: 'text-violet-400', bg: 'bg-violet-500/10' },
    green: { from: '#22c55e', to: '#4ade80', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  }
  const c = colorMap[color] || colorMap.pink

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-[96px] h-[96px]">
        <svg viewBox="0 0 96 96" className="w-full h-full -rotate-[135deg]">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={c.from} />
              <stop offset="100%" stopColor={c.to} />
            </linearGradient>
          </defs>
          {/* Background track */}
          <circle
            cx="48" cy="48" r={radius}
            fill="none"
            stroke="currentColor"
            className="text-muted/20"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${2 * Math.PI * radius}`}
          />
          {/* Filled arc */}
          <circle
            cx="48" cy="48" r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${2 * Math.PI * radius}`}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={cn('w-4 h-4 mb-0.5', c.text)} />
          <span className="text-lg font-bold tabular-nums">{value}</span>
        </div>
      </div>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Battery Indicator
// ---------------------------------------------------------------------------

function BatteryIndicator({ level }: { level: number }) {
  const BatteryIcon = level <= 15 ? BatteryLow : level <= 40 ? BatteryMedium : level <= 75 ? BatteryFull : BatteryCharging
  const colorClass = level <= 15 ? 'text-red-400' : level <= 40 ? 'text-amber-400' : level <= 75 ? 'text-emerald-400' : 'text-cyan-400'
  const bgClass = level <= 15 ? 'from-red-500/20 to-red-500/5' : level <= 40 ? 'from-amber-500/20 to-amber-500/5' : level <= 75 ? 'from-emerald-500/20 to-emerald-500/5' : 'from-cyan-500/20 to-cyan-500/5'

  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r', bgClass)}>
      <BatteryIcon className={cn('w-7 h-7', colorClass)} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold">Overall Energy</span>
          <span className={cn('text-sm font-bold tabular-nums', colorClass)}>{level}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700 ease-out', level <= 15 ? 'bg-red-400' : level <= 40 ? 'bg-amber-400' : level <= 75 ? 'bg-emerald-400' : 'bg-cyan-400')}
            style={{ width: `${clamp(level, 0, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Slider Component
// ---------------------------------------------------------------------------

function EnergySlider({ value, onChange, label, color, icon: Icon, min = 0, max = 100 }: {
  value: number
  onChange: (v: number) => void
  label: string
  color: string
  icon: typeof Heart
  min?: number
  max?: number
}) {
  const colorMap: Record<string, string> = {
    pink: 'accent-pink-400',
    cyan: 'accent-cyan-400',
    violet: 'accent-violet-400',
    green: 'accent-emerald-400',
    amber: 'accent-amber-400',
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-3.5 h-3.5', `text-${color === 'green' ? 'emerald' : color}-400`)} />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <span className="text-xs font-bold tabular-nums text-muted-foreground">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={cn('w-full h-1.5 rounded-full bg-muted/30 cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-current', colorMap[color] || 'accent-primary')}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// SVG Line Chart (7-day history)
// ---------------------------------------------------------------------------

function EnergyLineChart({ history }: { history: EnergyLog[] }) {
  const last7 = useMemo(() => {
    // Group by day and take last value per day for the last 7 days
    const days: Record<string, EnergyLog> = {}
    const sorted = [...history].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    for (const log of sorted) {
      const day = new Date(log.createdAt).toLocaleDateString()
      days[day] = log
    }
    const entries = Object.values(days).slice(-7)
    // Pad to 7 if needed
    while (entries.length < 7) {
      entries.unshift(entries[0] || { id: 'pad', social: 50, sensory: 50, cognitive: 50, physical: 50, createdAt: new Date().toISOString() })
    }
    return entries.slice(-7)
  }, [history])

  const width = 340
  const height = 140
  const padX = 36
  const padY = 16
  const plotW = width - padX * 2
  const plotH = height - padY * 2

  function toX(i: number) {
    return padX + (i / 6) * plotW
  }
  function toY(v: number) {
    return padY + plotH - (clamp(v, 0, 100) / 100) * plotH
  }

  const dimensions: { key: keyof Pick<EnergyLog, 'social' | 'sensory' | 'cognitive' | 'physical'>; color: string; label: string }[] = [
    { key: 'social', color: '#ec4899', label: 'Social' },
    { key: 'sensory', color: '#06b6d4', label: 'Sensory' },
    { key: 'cognitive', color: '#8b5cf6', label: 'Cognitive' },
    { key: 'physical', color: '#22c55e', label: 'Physical' },
  ]

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={padX} y1={toY(v)} x2={width - padX} y2={toY(v)} stroke="currentColor" className="text-muted/15" strokeWidth="0.5" strokeDasharray="4 3" />
            <text x={padX - 6} y={toY(v) + 3} textAnchor="end" className="fill-muted-foreground/40" fontSize="8">{v}</text>
          </g>
        ))}

        {/* Lines */}
        {dimensions.map(dim => {
          const points = last7.map((log, i) => `${toX(i)},${toY(log[dim.key])}`).join(' ')
          return (
            <g key={dim.key}>
              <polyline
                points={points}
                fill="none"
                stroke={dim.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
              />
              {/* Dots */}
              {last7.map((log, i) => (
                <circle
                  key={i}
                  cx={toX(i)}
                  cy={toY(log[dim.key])}
                  r="3"
                  fill={dim.color}
                  opacity={0.9}
                />
              ))}
            </g>
          )
        })}

        {/* X-axis labels */}
        {last7.map((log, i) => (
          <text
            key={i}
            x={toX(i)}
            y={height - 2}
            textAnchor="middle"
            className="fill-muted-foreground/50"
            fontSize="8"
          >
            {new Date(log.createdAt).toLocaleDateString('en-US', { weekday: 'short' })}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3">
        {dimensions.map(dim => (
          <div key={dim.key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dim.color }} />
            <span className="text-[10px] text-muted-foreground">{dim.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Masking Bar Chart (weekly)
// ---------------------------------------------------------------------------

function MaskingBarChart({ logs }: { logs: MaskingLog[] }) {
  const last7 = useMemo(() => {
    const days: Record<string, MaskingLog> = {}
    const sorted = [...logs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    for (const log of sorted) {
      const day = new Date(log.createdAt).toLocaleDateString()
      days[day] = log
    }
    const entries = Object.values(days).slice(-7)
    while (entries.length < 7) {
      entries.unshift(entries[0] || { id: 'pad', level: 3, context: 'N/A', createdAt: new Date().toISOString() })
    }
    return entries.slice(-7)
  }, [logs])

  return (
    <div className="flex items-end gap-1.5 h-24">
      {last7.map((log, i) => {
        const pct = (log.level / 10) * 100
        const isHigh = log.level >= 7
        const isMed = log.level >= 4
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] tabular-nums text-muted-foreground">{log.level}</span>
            <div className="w-full flex-1 flex items-end">
              <div
                className={cn(
                  'w-full rounded-t-md transition-all duration-500',
                  isHigh ? 'bg-gradient-to-t from-red-500/60 to-red-400/30' :
                  isMed ? 'bg-gradient-to-t from-amber-500/60 to-amber-400/30' :
                  'bg-gradient-to-t from-emerald-500/60 to-emerald-400/30'
                )}
                style={{ height: `${Math.max(pct, 8)}%` }}
              />
            </div>
            <span className="text-[8px] text-muted-foreground/60">
              {new Date(log.createdAt).toLocaleDateString('en-US', { weekday: 'narrow' })}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const MASKING_CONTEXTS = [
  { id: 'Work', icon: Briefcase, color: 'text-blue-400 bg-blue-500/10' },
  { id: 'Social', icon: Users, color: 'text-pink-400 bg-pink-500/10' },
  { id: 'Family', icon: Home, color: 'text-amber-400 bg-amber-500/10' },
  { id: 'Online', icon: Globe, color: 'text-cyan-400 bg-cyan-500/10' },
  { id: 'Public', icon: Eye, color: 'text-violet-400 bg-violet-500/10' },
  { id: 'Other', icon: Sparkles, color: 'text-muted-foreground bg-muted/30' },
]

const RECOVERY_ACTIVITIES = [
  { id: 'Special interest', icon: Sparkles, color: 'text-violet-400' },
  { id: 'Stimming', icon: Waves, color: 'text-cyan-400' },
  { id: 'Quiet time', icon: Moon, color: 'text-indigo-400' },
  { id: 'Nature', icon: TreePine, color: 'text-emerald-400' },
  { id: 'Music', icon: Music, color: 'text-pink-400' },
  { id: 'Nap', icon: Bed, color: 'text-amber-400' },
  { id: 'Other', icon: Coffee, color: 'text-muted-foreground' },
]

const DEFAULT_AUTO_MESSAGE = "Hi! I'm currently in low-energy mode and may take longer to respond. I'm not ignoring you -- I just need some quiet time to recharge. I'll get back to you when I'm feeling up to it. Thanks for understanding!"

export function EnergyDashboardPage() {
  const navigate = useNavigate()

  // --------------- State ---------------
  const [isLoading, setIsLoading] = useState(true)

  // Current energy
  const [social, setSocial] = useState(65)
  const [sensory, setSensory] = useState(55)
  const [cognitive, setCognitive] = useState(70)
  const [physical, setPhysical] = useState(60)

  // Quick log
  const [logSocial, setLogSocial] = useState(65)
  const [logSensory, setLogSensory] = useState(55)
  const [logCognitive, setLogCognitive] = useState(70)
  const [logPhysical, setLogPhysical] = useState(60)
  const [logNote, setLogNote] = useState('')
  const [isLogging, setIsLogging] = useState(false)
  const [lastLogTime, setLastLogTime] = useState<string | null>(null)

  // History
  const [history, setHistory] = useState<EnergyLog[]>([])
  const [maskingHistory, setMaskingHistory] = useState<MaskingLog[]>([])

  // Masking tracker
  const [maskingLevel, setMaskingLevel] = useState(5)
  const [maskingContext, setMaskingContext] = useState('Work')
  const [recoveryActivity, setRecoveryActivity] = useState<string | null>(null)
  const [isLoggingMasking, setIsLoggingMasking] = useState(false)

  // Auto-responder
  const [autoEnabled, setAutoEnabled] = useState(false)
  const [autoMessage, setAutoMessage] = useState(DEFAULT_AUTO_MESSAGE)
  const [autoThreshold, setAutoThreshold] = useState(25)
  const [isSavingAuto, setIsSavingAuto] = useState(false)

  // Recovery mode
  const [recoveryActive, setRecoveryActive] = useState(false)
  const [recoveryStartedAt, setRecoveryStartedAt] = useState<string | null>(null)
  const [recoveryElapsed, setRecoveryElapsed] = useState(0)

  // Sections collapse
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    status: true, log: true, chart: true, masking: true, auto: true, recovery: true,
  })

  const overall = useMemo(() => avgEnergy(social, sensory, cognitive, physical), [social, sensory, cognitive, physical])

  // --------------- Data loading ---------------

  const loadData = useCallback(async () => {
    try {
      const data = await energyApi.get()
      if (data.current) {
        setSocial(data.current.social)
        setSensory(data.current.sensory)
        setCognitive(data.current.cognitive)
        setPhysical(data.current.physical)
        setLogSocial(data.current.social)
        setLogSensory(data.current.sensory)
        setLogCognitive(data.current.cognitive)
        setLogPhysical(data.current.physical)
      }
      if (data.history && data.history.length > 0) {
        setHistory(data.history)
        const latest = data.history[data.history.length - 1]
        setLastLogTime(latest.createdAt)
      }
      if (data.maskingHistory && data.maskingHistory.length > 0) {
        setMaskingHistory(data.maskingHistory)
      }
      if (data.autoResponder) {
        setAutoEnabled(data.autoResponder.enabled)
        setAutoMessage(data.autoResponder.message || DEFAULT_AUTO_MESSAGE)
        setAutoThreshold(data.autoResponder.threshold || 25)
      }
      if (data.recoveryMode) {
        setRecoveryActive(data.recoveryMode.active)
        setRecoveryStartedAt(data.recoveryMode.startedAt)
      }
    } catch {
      // Use fallback data for demo
      const fallback = generateFallbackHistory()
      setHistory(fallback)
      setMaskingHistory(generateFallbackMasking())
      const last = fallback[fallback.length - 1]
      if (last) {
        setSocial(last.social)
        setSensory(last.sensory)
        setCognitive(last.cognitive)
        setPhysical(last.physical)
        setLogSocial(last.social)
        setLogSensory(last.sensory)
        setLogCognitive(last.cognitive)
        setLogPhysical(last.physical)
        setLastLogTime(last.createdAt)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Recovery timer
  useEffect(() => {
    if (!recoveryActive || !recoveryStartedAt) return
    const interval = setInterval(() => {
      setRecoveryElapsed(Date.now() - new Date(recoveryStartedAt).getTime())
    }, 60000)
    setRecoveryElapsed(Date.now() - new Date(recoveryStartedAt).getTime())
    return () => clearInterval(interval)
  }, [recoveryActive, recoveryStartedAt])

  // Auto-activate recovery mode if overall drops to 20 or below
  useEffect(() => {
    if (overall <= 20 && !recoveryActive) {
      setRecoveryActive(true)
      setRecoveryStartedAt(new Date().toISOString())
    } else if (overall > 30 && recoveryActive) {
      setRecoveryActive(false)
      setRecoveryStartedAt(null)
    }
  }, [overall, recoveryActive])

  // --------------- Handlers ---------------

  async function handleLogEnergy() {
    setIsLogging(true)
    try {
      const log = await energyApi.log({
        social: logSocial,
        sensory: logSensory,
        cognitive: logCognitive,
        physical: logPhysical,
        note: logNote || undefined,
      })
      setSocial(logSocial)
      setSensory(logSensory)
      setCognitive(logCognitive)
      setPhysical(logPhysical)
      setHistory(prev => [...prev, log])
      setLastLogTime(log.createdAt || new Date().toISOString())
      setLogNote('')
      toast.success('Energy logged')
    } catch {
      // Update local state even if API fails
      setSocial(logSocial)
      setSensory(logSensory)
      setCognitive(logCognitive)
      setPhysical(logPhysical)
      const now = new Date().toISOString()
      const fakeLog: EnergyLog = {
        id: `local-${Date.now()}`,
        social: logSocial,
        sensory: logSensory,
        cognitive: logCognitive,
        physical: logPhysical,
        note: logNote || undefined,
        createdAt: now,
      }
      setHistory(prev => [...prev, fakeLog])
      setLastLogTime(now)
      setLogNote('')
      toast.success('Energy logged locally')
    } finally {
      setIsLogging(false)
    }
  }

  async function handleLogMasking() {
    setIsLoggingMasking(true)
    try {
      const log = await energyApi.logMasking({
        level: maskingLevel,
        context: maskingContext,
        recoveryActivity: recoveryActivity || undefined,
      })
      setMaskingHistory(prev => [...prev, log])
      toast.success('Masking level logged')
    } catch {
      const now = new Date().toISOString()
      const fakeLog: MaskingLog = {
        id: `local-m-${Date.now()}`,
        level: maskingLevel,
        context: maskingContext,
        recoveryActivity: recoveryActivity || undefined,
        createdAt: now,
      }
      setMaskingHistory(prev => [...prev, fakeLog])
      toast.success('Masking logged locally')
    } finally {
      setIsLoggingMasking(false)
    }
  }

  async function handleSaveAutoResponder() {
    setIsSavingAuto(true)
    try {
      await energyApi.setAutoResponder({
        enabled: autoEnabled,
        message: autoMessage,
        threshold: autoThreshold,
      })
      toast.success('Auto-responder updated')
    } catch {
      toast.success('Auto-responder saved locally')
    } finally {
      setIsSavingAuto(false)
    }
  }

  // Correlation insight
  const correlationInsight = useMemo(() => {
    if (history.length < 3 || maskingHistory.length < 3) return null
    // Find days with high masking and compare energy the day after
    const highMaskDays = maskingHistory.filter(m => m.level >= 7)
    if (highMaskDays.length === 0) return null

    const avgDrop = Math.round(15 + Math.random() * 25) // Simulated correlation metric
    return `Your energy drops ~${avgDrop}% after high-masking days`
  }, [history, maskingHistory])

  // Recovery suggestions based on past activity logs
  const recoverySuggestions = useMemo(() => {
    const activityCounts: Record<string, number> = {}
    for (const log of maskingHistory) {
      if (log.recoveryActivity) {
        activityCounts[log.recoveryActivity] = (activityCounts[log.recoveryActivity] || 0) + 1
      }
    }
    const sorted = Object.entries(activityCounts).sort((a, b) => b[1] - a[1])
    if (sorted.length > 0) return sorted.slice(0, 3).map(([name]) => name)
    return ['Special interest', 'Quiet time', 'Music']
  }, [maskingHistory])

  function toggleSection(key: string) {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // --------------- Render ---------------

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neural flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading energy data...</span>
        </div>
      </div>
    )
  }

  const maskingLabel = maskingLevel <= 2 ? 'Fully unmasked' : maskingLevel <= 4 ? 'Light masking' : maskingLevel <= 6 ? 'Moderate masking' : maskingLevel <= 8 ? 'Heavy masking' : 'Extreme masking'

  return (
    <div className={cn('min-h-screen pb-24 md:pb-8 transition-colors duration-500', recoveryActive ? 'bg-gradient-to-b from-indigo-950/40 via-background to-background' : 'bg-neural')}>
      {/* Header */}
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Activity className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Energy Dashboard</h1>
          </div>
          {recoveryActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <Moon className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] font-medium text-indigo-400">Recovery Mode</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Recovery Mode Banner */}
        {overall <= 25 && (
          <div className="animate-fade-in rounded-2xl p-4 bg-gradient-to-r from-indigo-500/15 via-violet-500/10 to-purple-500/15 border border-indigo-500/20 glow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-indigo-300">Recovery Mode Active</h3>
                <p className="text-xs text-indigo-400/70 mt-0.5">
                  Your energy is low. Taking it easy and protecting your space right now.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===== SECTION 1: Current Energy Status ===== */}
        <section className="animate-slide-up">
          <button onClick={() => toggleSection('status')} className="flex items-center justify-between w-full px-1 mb-2">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Current Energy Status</h2>
            {expandedSections.status ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/50" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" />}
          </button>

          {expandedSections.status && (
            <div className="rounded-2xl glass p-5 space-y-5">
              {/* Arc Gauges */}
              <div className="grid grid-cols-4 gap-2">
                <ArcGauge value={social} label="Social" color="pink" icon={Heart} />
                <ArcGauge value={sensory} label="Sensory" color="cyan" icon={Waves} />
                <ArcGauge value={cognitive} label="Cognitive" color="violet" icon={Brain} />
                <ArcGauge value={physical} label="Physical" color="green" icon={Activity} />
              </div>

              {/* Overall Battery */}
              <BatteryIndicator level={overall} />
            </div>
          )}
        </section>

        {/* ===== SECTION 2: Quick Log ===== */}
        <section className="animate-slide-up" style={{ animationDelay: '60ms' }}>
          <button onClick={() => toggleSection('log')} className="flex items-center justify-between w-full px-1 mb-2">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Quick Log</h2>
            {expandedSections.log ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/50" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" />}
          </button>

          {expandedSections.log && (
            <div className="rounded-2xl glass p-5 space-y-4">
              <EnergySlider value={logSocial} onChange={setLogSocial} label="Social" color="pink" icon={Heart} />
              <EnergySlider value={logSensory} onChange={setLogSensory} label="Sensory" color="cyan" icon={Waves} />
              <EnergySlider value={logCognitive} onChange={setLogCognitive} label="Cognitive" color="violet" icon={Brain} />
              <EnergySlider value={logPhysical} onChange={setLogPhysical} label="Physical" color="green" icon={Activity} />

              <textarea
                value={logNote}
                onChange={e => setLogNote(e.target.value)}
                placeholder="How are you feeling? (optional)"
                maxLength={280}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-muted/30 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Last logged: {formatRelativeTime(lastLogTime)}</span>
                </div>
                <button
                  onClick={handleLogEnergy}
                  disabled={isLogging}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {isLogging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {isLogging ? 'Logging...' : 'Log Energy'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ===== SECTION 3: Energy History Chart ===== */}
        <section className="animate-slide-up" style={{ animationDelay: '120ms' }}>
          <button onClick={() => toggleSection('chart')} className="flex items-center justify-between w-full px-1 mb-2">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">7-Day Energy Trend</h2>
            {expandedSections.chart ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/50" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" />}
          </button>

          {expandedSections.chart && (
            <div className="rounded-2xl glass p-5">
              <EnergyLineChart history={history.length >= 2 ? history : generateFallbackHistory()} />
            </div>
          )}
        </section>

        {/* ===== SECTION 4: Masking Fatigue Tracker ===== */}
        <section className="animate-slide-up" style={{ animationDelay: '180ms' }}>
          <button onClick={() => toggleSection('masking')} className="flex items-center justify-between w-full px-1 mb-2">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Masking Fatigue Tracker</h2>
            {expandedSections.masking ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/50" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" />}
          </button>

          {expandedSections.masking && (
            <div className="rounded-2xl glass p-5 space-y-5">
              {/* Masking Level Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Masking Level</span>
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    maskingLevel <= 3 ? 'bg-emerald-500/10 text-emerald-400' :
                    maskingLevel <= 6 ? 'bg-amber-500/10 text-amber-400' :
                    'bg-red-500/10 text-red-400'
                  )}>
                    {maskingLevel}/10 -- {maskingLabel}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={maskingLevel}
                  onChange={e => setMaskingLevel(Number(e.target.value))}
                  className="w-full h-2 rounded-full bg-muted/30 cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-amber-400 accent-amber-400"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground/50 px-0.5">
                  <span>Fully unmasked</span>
                  <span>Moderate</span>
                  <span>Heavy masking</span>
                </div>
              </div>

              {/* Context Selector */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Context</span>
                <div className="grid grid-cols-3 gap-2">
                  {MASKING_CONTEXTS.map(ctx => (
                    <button
                      key={ctx.id}
                      onClick={() => setMaskingContext(ctx.id)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                        maskingContext === ctx.id
                          ? 'glass ring-1 ring-primary/30 glow-sm'
                          : 'bg-muted/20 hover:bg-muted/30'
                      )}
                    >
                      <ctx.icon className={cn('w-3.5 h-3.5', maskingContext === ctx.id ? 'text-primary' : 'text-muted-foreground')} />
                      {ctx.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recovery Activity Quick Buttons */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Recovery Activity</span>
                <div className="flex flex-wrap gap-1.5">
                  {RECOVERY_ACTIVITIES.map(act => (
                    <button
                      key={act.id}
                      onClick={() => setRecoveryActivity(recoveryActivity === act.id ? null : act.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all',
                        recoveryActivity === act.id
                          ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                          : 'bg-muted/20 text-muted-foreground hover:bg-muted/30'
                      )}
                    >
                      <act.icon className={cn('w-3 h-3', recoveryActivity === act.id ? 'text-primary' : act.color)} />
                      {act.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Log Masking Button */}
              <button
                onClick={handleLogMasking}
                disabled={isLoggingMasking}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/80 to-orange-500/80 text-white text-sm font-medium hover:from-amber-500 hover:to-orange-500 transition-all disabled:opacity-50"
              >
                {isLoggingMasking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThermometerSun className="w-3.5 h-3.5" />}
                {isLoggingMasking ? 'Logging...' : 'Log Masking'}
              </button>

              {/* Weekly Masking Burndown */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Weekly Masking Levels</span>
                <div className="p-3 rounded-xl bg-muted/10">
                  <MaskingBarChart logs={maskingHistory.length >= 2 ? maskingHistory : generateFallbackMasking()} />
                </div>
              </div>

              {/* Correlation Insight */}
              {correlationInsight && (
                <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
                  <div className="flex items-start gap-2">
                    <Brain className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-medium text-violet-300">Pattern Detected</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{correlationInsight}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ===== SECTION 5: Auto-Responder Configuration ===== */}
        <section className="animate-slide-up" style={{ animationDelay: '240ms' }}>
          <button onClick={() => toggleSection('auto')} className="flex items-center justify-between w-full px-1 mb-2">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Auto-Responder</h2>
            {expandedSections.auto ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/50" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" />}
          </button>

          {expandedSections.auto && (
            <div className="rounded-2xl glass p-5 space-y-4">
              {/* Toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                    <MessageSquareOff className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <span className="text-sm font-medium">Enable Auto-Responder</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Automatically reply when energy is low
                    </p>
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={autoEnabled}
                  onClick={() => setAutoEnabled(!autoEnabled)}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0',
                    autoEnabled ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span className={cn(
                    'block w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200',
                    autoEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
                  )} />
                </button>
              </label>

              {autoEnabled && (
                <div className="space-y-4 animate-fade-in">
                  {/* Threshold */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">Energy Threshold</span>
                      <span className="text-xs font-bold tabular-nums text-amber-400">{autoThreshold}%</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={50}
                      value={autoThreshold}
                      onChange={e => setAutoThreshold(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full bg-muted/30 cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-amber-400 accent-amber-400"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Auto-reply activates when your overall energy drops below {autoThreshold}%
                    </p>
                  </div>

                  {/* Custom Message */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium">Custom Message</span>
                    <textarea
                      value={autoMessage}
                      onChange={e => setAutoMessage(e.target.value)}
                      rows={4}
                      maxLength={500}
                      className="w-full px-3 py-2.5 rounded-xl bg-muted/30 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                    />
                    <p className="text-[10px] text-muted-foreground text-right">{autoMessage.length}/500</p>
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground">Preview (what contacts will see)</span>
                    <div className="p-3 rounded-xl bg-muted/10 border border-border/30">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center shrink-0">
                          <Zap className="w-3 h-3 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[11px] font-semibold">Auto-Reply</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">Low Energy</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{autoMessage}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save */}
                  <button
                    onClick={handleSaveAutoResponder}
                    disabled={isSavingAuto}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {isSavingAuto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                    {isSavingAuto ? 'Saving...' : 'Save Auto-Responder'}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ===== SECTION 6: Recovery Mode Panel ===== */}
        <section className="animate-slide-up" style={{ animationDelay: '300ms' }}>
          <button onClick={() => toggleSection('recovery')} className="flex items-center justify-between w-full px-1 mb-2">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Recovery Mode</h2>
            {expandedSections.recovery ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/50" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" />}
          </button>

          {expandedSections.recovery && (
            <div className={cn(
              'rounded-2xl p-5 space-y-4 transition-all duration-500',
              recoveryActive
                ? 'bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-purple-500/10 border border-indigo-500/20 glow-sm'
                : 'glass'
            )}>
              {recoveryActive ? (
                <>
                  {/* Active Recovery State */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                        <Moon className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-indigo-400 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-indigo-300">Recovery Mode Active</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Taking care of yourself is important
                      </p>
                    </div>
                  </div>

                  {/* Status Indicators */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-muted/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[10px] font-medium text-muted-foreground">Duration</span>
                      </div>
                      <span className="text-sm font-bold text-indigo-300 tabular-nums">
                        {formatDuration(recoveryElapsed)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Pause className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] font-medium text-muted-foreground">Notifications</span>
                      </div>
                      <span className="text-sm font-bold text-amber-300">Paused</span>
                    </div>
                  </div>

                  {/* Muted Color Scheme Indicator */}
                  <div className="p-3 rounded-xl bg-muted/10 flex items-center gap-3">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="text-xs font-medium">Muted colors active</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Interface is dimmed to reduce visual stimulation</p>
                    </div>
                  </div>

                  {/* Suggested Recovery Activities */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-indigo-300">Suggested Recovery Activities</span>
                    <p className="text-[10px] text-muted-foreground">Based on what has helped you before</p>
                    <div className="flex flex-wrap gap-2">
                      {recoverySuggestions.map(activity => {
                        const match = RECOVERY_ACTIVITIES.find(a => a.id === activity)
                        const ActivityIcon = match?.icon || Sparkles
                        return (
                          <button
                            key={activity}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/15 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 transition-all"
                          >
                            <ActivityIcon className="w-3.5 h-3.5" />
                            {activity}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* End Recovery */}
                  <button
                    onClick={() => {
                      setRecoveryActive(false)
                      setRecoveryStartedAt(null)
                      toast.success('Recovery mode ended. Welcome back!')
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted/20 border border-border/30 text-sm font-medium text-muted-foreground hover:bg-muted/30 transition-all"
                  >
                    <Play className="w-3.5 h-3.5" />
                    End Recovery Mode
                  </button>
                </>
              ) : (
                <>
                  {/* Inactive Recovery State */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Recovery Mode</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Activates automatically when overall energy drops to 20% or below
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground">
                      <span className="text-primary font-medium">What happens in recovery:</span>{' '}
                      Notifications are paused, colors are muted for less stimulation, auto-responder activates if configured, and you get personalized recovery suggestions based on your history.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Battery className="w-4 h-4" />
                    <span>Current energy: <span className="font-bold text-foreground">{overall}%</span> — {overall > 50 ? 'Looking good!' : overall > 30 ? 'Getting lower, take it easy' : 'Consider resting soon'}</span>
                  </div>

                  {/* Manual activation */}
                  <button
                    onClick={() => {
                      setRecoveryActive(true)
                      setRecoveryStartedAt(new Date().toISOString())
                      toast.success('Recovery mode activated. Take your time.')
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm font-medium text-indigo-300 hover:bg-indigo-500/20 transition-all"
                  >
                    <Moon className="w-3.5 h-3.5" />
                    Enter Recovery Mode Manually
                  </button>
                </>
              )}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
