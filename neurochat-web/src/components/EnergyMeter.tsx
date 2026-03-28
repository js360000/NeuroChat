import { useState } from 'react'
import { Battery, BatteryLow, BatteryMedium, BatteryFull, BatteryCharging, ChevronDown } from 'lucide-react'
import { useEnergyStore, type EnergyLevel } from '@/stores/energyStore'
import { cn } from '@/lib/utils'

const ENERGY_CONFIG: Record<EnergyLevel, { icon: typeof Battery; color: string; label: string; bg: string }> = {
  full:     { icon: BatteryFull,     color: 'text-emerald-400', label: 'Fully charged',    bg: 'bg-emerald-500/20' },
  high:     { icon: BatteryFull,     color: 'text-emerald-400', label: 'Good energy',      bg: 'bg-emerald-500/20' },
  medium:   { icon: BatteryMedium,   color: 'text-amber-400',   label: 'Getting there',    bg: 'bg-amber-500/20' },
  low:      { icon: BatteryLow,      color: 'text-orange-400',  label: 'Running low',      bg: 'bg-orange-500/20' },
  depleted: { icon: BatteryCharging, color: 'text-red-400',     label: 'Need to recharge', bg: 'bg-red-500/20' },
}

const QUICK_LEVELS = [
  { level: 100, emoji: '⚡', label: 'Full' },
  { level: 75,  emoji: '😊', label: 'Good' },
  { level: 50,  emoji: '😐', label: 'Okay' },
  { level: 25,  emoji: '😴', label: 'Low' },
  { level: 5,   emoji: '🔋', label: 'Depleted' },
]

interface EnergyMeterProps {
  compact?: boolean
  className?: string
}

export function EnergyMeter({ compact = false, className }: EnergyMeterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { level, status, setLevel } = useEnergyStore()
  const config = ENERGY_CONFIG[status]
  const Icon = config.icon

  if (compact) {
    return (
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all',
          'hover:bg-muted/50',
          config.color,
          className
        )}
        title={`Energy: ${level}% — ${config.label}`}
      >
        <Icon className="w-4 h-4" />
        <div className="w-8 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700', {
              'bg-emerald-400': level >= 60,
              'bg-amber-400': level >= 30 && level < 60,
              'bg-red-400': level < 30,
            })}
            style={{ width: `${level}%` }}
          />
        </div>
      </button>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl transition-all w-full',
          'glass hover:bg-muted/30',
          config.color
        )}
      >
        <Icon className="w-5 h-5" />
        <div className="flex-1 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">{config.label}</span>
            <span className="text-xs text-muted-foreground">{level}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-muted/50 mt-1 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700', {
                'bg-gradient-to-r from-emerald-500 to-emerald-400': level >= 60,
                'bg-gradient-to-r from-amber-500 to-amber-400': level >= 30 && level < 60,
                'bg-gradient-to-r from-red-500 to-orange-400': level < 30,
              })}
              style={{ width: `${level}%` }}
            />
          </div>
        </div>
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 p-3 rounded-xl glass-heavy shadow-lg z-50 animate-scale-in">
          <p className="text-xs text-muted-foreground mb-2">How's your social energy?</p>
          <div className="flex gap-1">
            {QUICK_LEVELS.map((q) => (
              <button
                key={q.level}
                onClick={() => { setLevel(q.level); setIsOpen(false) }}
                className={cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg transition-all',
                  'hover:bg-primary/10',
                  level === q.level && 'bg-primary/10 ring-1 ring-primary/30'
                )}
              >
                <span className="text-base">{q.emoji}</span>
                <span className="text-[10px] text-muted-foreground">{q.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
