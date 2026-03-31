import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Battery, BatteryLow, BatteryWarning, TrendingDown, TrendingUp,
  AlertTriangle, MessageCircle, Shield, Loader2, RefreshCw, Sparkles, Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { energyApi } from '@/lib/api/energy'
import { toast } from 'sonner'

interface Budget {
  spoonsPerDay: number
  spoonsThisWeek: number
  spoonsUsedEstimate: number
  avgEnergy: number
  crashRisk: 'low' | 'moderate' | 'high'
  activeConversations: number
  dailyAverages: { date: string; social: number; sensory: number; cognitive: number; physical: number }[]
  recommendations: string[]
  lowDays: number
  daysTracked: number
}

const RISK_COLORS = { low: 'text-emerald-400 bg-emerald-500/10', moderate: 'text-amber-400 bg-amber-500/10', high: 'text-red-400 bg-red-500/10' }
const RISK_ICONS = { low: <TrendingUp className="w-4 h-4" />, moderate: <BatteryWarning className="w-4 h-4" />, high: <TrendingDown className="w-4 h-4" /> }

export function SpoonBudgetPage() {
  const navigate = useNavigate()
  const [budget, setBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadBudget() }, [])

  async function loadBudget() {
    setLoading(true)
    try {
      const data = await energyApi.getBudget()
      setBudget(data.budget)
    } catch {
      toast.error('Could not load budget')
    } finally { setLoading(false) }
  }

  if (loading) {
    return <div className="min-h-screen bg-neural flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  }

  if (!budget) {
    return (
      <div className="min-h-screen bg-neural flex items-center justify-center p-8 text-center">
        <div className="space-y-3">
          <BatteryLow className="w-10 h-10 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">No energy data yet. Log some energy levels first.</p>
          <button onClick={() => navigate('/energy')} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm">Go to Energy Dashboard</button>
        </div>
      </div>
    )
  }

  const spoonsRemaining = Math.max(0, budget.spoonsThisWeek - budget.spoonsUsedEstimate)
  const spoonsPercent = budget.spoonsThisWeek > 0 ? Math.round((spoonsRemaining / budget.spoonsThisWeek) * 100) : 0

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted/50"><ArrowLeft className="w-5 h-5" /></button>
            <Battery className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-semibold">Spoon Budget</h1>
          </div>
          <button onClick={loadBudget} className="p-2 rounded-xl hover:bg-muted/50"><RefreshCw className="w-4 h-4 text-muted-foreground" /></button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Main spoon budget card */}
        <div className="rounded-2xl glass-heavy p-5 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">This Week's Budget</h2>
            <span className="text-[10px] text-muted-foreground">{budget.daysTracked} days tracked</span>
          </div>

          {/* Spoon gauge */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none"
                  stroke={spoonsPercent > 50 ? '#34d399' : spoonsPercent > 25 ? '#fbbf24' : '#f87171'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${spoonsPercent * 2.64} 264`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold">{spoonsRemaining}</span>
                <span className="text-[8px] text-muted-foreground">spoons left</span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Daily capacity</span>
                <span className="font-medium">{budget.spoonsPerDay} spoons/day</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Weekly total</span>
                <span className="font-medium">{budget.spoonsThisWeek} spoons</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Used (estimated)</span>
                <span className="font-medium">{budget.spoonsUsedEstimate} spoons</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Active conversations</span>
                <span className="font-medium">{budget.activeConversations}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Crash risk */}
        <div className={cn('rounded-2xl p-4 flex items-center gap-3 animate-slide-up', RISK_COLORS[budget.crashRisk])} style={{ animationDelay: '60ms' }}>
          {RISK_ICONS[budget.crashRisk]}
          <div className="flex-1">
            <p className="text-sm font-semibold capitalize">{budget.crashRisk} crash risk</p>
            <p className="text-[11px] opacity-80">
              {budget.crashRisk === 'low' ? 'Your energy has been stable this week.'
                : budget.crashRisk === 'moderate' ? `You dipped below 30% on ${budget.lowDays} day${budget.lowDays > 1 ? 's' : ''} this week.`
                : `You crashed on ${budget.lowDays} days this week. Consider reducing commitments.`}
            </p>
          </div>
        </div>

        {/* Energy trend chart */}
        {budget.dailyAverages.length > 1 && (
          <div className="rounded-2xl glass p-4 space-y-3 animate-slide-up" style={{ animationDelay: '120ms' }}>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Energy Trend</h3>
            </div>
            <div className="h-32">
              <svg viewBox={`0 0 ${Math.max(budget.dailyAverages.length * 50, 200)} 120`} className="w-full h-full" preserveAspectRatio="none">
                {/* Grid lines */}
                {[25, 50, 75].map(y => (
                  <line key={y} x1="0" y1={120 - y * 1.1} x2={budget.dailyAverages.length * 50} y2={120 - y * 1.1} stroke="currentColor" className="text-muted/10" strokeWidth="0.5" />
                ))}
                {/* Lines per dimension */}
                {(['social', 'sensory', 'cognitive', 'physical'] as const).map((dim, di) => {
                  const colors = ['#f472b6', '#22d3ee', '#a78bfa', '#34d399']
                  const points = budget.dailyAverages.map((d, i) => `${i * 50 + 25},${120 - d[dim] * 1.1}`).join(' ')
                  return <polyline key={dim} points={points} fill="none" stroke={colors[di]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                })}
                {/* Dots */}
                {budget.dailyAverages.map((d, i) => {
                  const avg = (d.social + d.sensory + d.cognitive + d.physical) / 4
                  return <circle key={i} cx={i * 50 + 25} cy={120 - avg * 1.1} r="3" fill={avg < 30 ? '#f87171' : avg < 50 ? '#fbbf24' : '#34d399'} />
                })}
              </svg>
            </div>
            <div className="flex gap-3 justify-center">
              {[{ label: 'Social', color: 'bg-pink-400' }, { label: 'Sensory', color: 'bg-cyan-400' }, { label: 'Cognitive', color: 'bg-violet-400' }, { label: 'Physical', color: 'bg-emerald-400' }].map(l => (
                <span key={l.label} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <span className={cn('w-2 h-2 rounded-full', l.color)} /> {l.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {budget.recommendations.length > 0 && (
          <div className="rounded-2xl glass p-4 space-y-3 animate-slide-up" style={{ animationDelay: '180ms' }}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Recommendations</h3>
            </div>
            <div className="space-y-2">
              {budget.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
                  <AlertTriangle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="rounded-2xl glass p-4 space-y-3 animate-slide-up" style={{ animationDelay: '240ms' }}>
          <h3 className="text-sm font-semibold">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => navigate('/energy')}
              className="p-3 rounded-xl glass hover:glow-sm text-left transition-all">
              <Battery className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-xs font-medium block">Log Energy</span>
              <span className="text-[10px] text-muted-foreground">Update your levels</span>
            </button>
            <button onClick={() => navigate('/together')}
              className="p-3 rounded-xl glass hover:glow-sm text-left transition-all">
              <MessageCircle className="w-4 h-4 text-blue-400 mb-1" />
              <span className="text-xs font-medium block">Together Room</span>
              <span className="text-[10px] text-muted-foreground">Low-pressure presence</span>
            </button>
            <button onClick={() => navigate('/settings/async')}
              className="p-3 rounded-xl glass hover:glow-sm text-left transition-all">
              <Shield className="w-4 h-4 text-violet-400 mb-1" />
              <span className="text-xs font-medium block">Auto-Responder</span>
              <span className="text-[10px] text-muted-foreground">Set up boundaries</span>
            </button>
            <button onClick={() => navigate('/interest-rooms')}
              className="p-3 rounded-xl glass hover:glow-sm text-left transition-all">
              <Sparkles className="w-4 h-4 text-pink-400 mb-1" />
              <span className="text-xs font-medium block">Interest Room</span>
              <span className="text-[10px] text-muted-foreground">Recharge with a passion</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
