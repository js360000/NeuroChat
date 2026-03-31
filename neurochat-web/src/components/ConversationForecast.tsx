import { useState, useEffect } from 'react'
import { CloudSun, Sun, Cloud, CloudRain, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { messagesApi } from '@/lib/api/messages'

const ICONS = {
  calm: <Sun className="w-3.5 h-3.5 text-emerald-400" />,
  moderate: <CloudSun className="w-3.5 h-3.5 text-amber-400" />,
  active: <Cloud className="w-3.5 h-3.5 text-orange-400" />,
  intense: <Zap className="w-3.5 h-3.5 text-red-400" />,
}
const LABELS = { calm: 'Calm', moderate: 'Moderate', active: 'Active', intense: 'Intense' }
const COLORS = {
  calm: 'text-emerald-400 bg-emerald-500/10',
  moderate: 'text-amber-400 bg-amber-500/10',
  active: 'text-orange-400 bg-orange-500/10',
  intense: 'text-red-400 bg-red-500/10',
}

interface Forecast {
  intensity: 'calm' | 'moderate' | 'active' | 'intense'
  score: number
  factors: string[]
  energyWarning?: boolean
}

/** Compact badge for conversation list */
export function ForecastBadge({ conversationId }: { conversationId: string }) {
  const [forecast, setForecast] = useState<Forecast | null>(null)

  useEffect(() => {
    messagesApi.getForecast(conversationId).then(d => setForecast(d.forecast)).catch(() => {})
  }, [conversationId])

  if (!forecast || forecast.intensity === 'calm') return null

  return (
    <span className={cn('inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium', COLORS[forecast.intensity])}
      title={forecast.factors.join('. ')}>
      {ICONS[forecast.intensity]}
      {LABELS[forecast.intensity]}
    </span>
  )
}

/** Expanded forecast card for chat header */
export function ForecastCard({ conversationId }: { conversationId: string }) {
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    messagesApi.getForecast(conversationId).then(d => setForecast(d.forecast)).catch(() => {})
  }, [conversationId])

  if (!forecast) return null

  return (
    <button onClick={() => setExpanded(!expanded)} className="relative">
      <span className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all', COLORS[forecast.intensity])}>
        {ICONS[forecast.intensity]} {LABELS[forecast.intensity]}
      </span>
      {expanded && (
        <div className="absolute top-full right-0 mt-1 w-56 glass-heavy rounded-xl p-3 space-y-2 z-20 animate-scale-in shadow-lg" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Conversation forecast</span>
            <span className={cn('text-[10px] font-bold', COLORS[forecast.intensity])}>{forecast.score}/100</span>
          </div>
          {/* Bar */}
          <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
            <div className={cn('h-full rounded-full transition-all',
              forecast.intensity === 'calm' ? 'bg-emerald-400' :
              forecast.intensity === 'moderate' ? 'bg-amber-400' :
              forecast.intensity === 'active' ? 'bg-orange-400' : 'bg-red-400'
            )} style={{ width: `${forecast.score}%` }} />
          </div>
          {/* Factors */}
          {forecast.factors.length > 0 && (
            <div className="space-y-1">
              {forecast.factors.map((f, i) => (
                <p key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                  <span className="text-muted-foreground/50 mt-0.5">•</span> {f}
                </p>
              ))}
            </div>
          )}
          {forecast.energyWarning && (
            <p className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
              <CloudRain className="w-3 h-3" /> Consider waiting until your energy recovers
            </p>
          )}
        </div>
      )}
    </button>
  )
}
