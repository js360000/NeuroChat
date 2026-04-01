import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Calendar, Plus, Trash2, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlannedEvent { id: string; day: number; label: string; spoonCost: number; icon: string; category: string }

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const EVENT_TEMPLATES = [
  { label: 'Social chat', spoonCost: 2, icon: '💬', category: 'social' },
  { label: 'Phone/video call', spoonCost: 4, icon: '📞', category: 'social' },
  { label: 'In-person meetup', spoonCost: 5, icon: '🤝', category: 'social' },
  { label: 'Party or event', spoonCost: 7, icon: '🎉', category: 'social' },
  { label: 'Family visit', spoonCost: 5, icon: '👨‍👩‍👧', category: 'social' },
  { label: 'Work/school', spoonCost: 4, icon: '💼', category: 'routine' },
  { label: 'Appointment', spoonCost: 4, icon: '🏥', category: 'routine' },
  { label: 'Shopping trip', spoonCost: 3, icon: '🛒', category: 'routine' },
  { label: 'Exercise', spoonCost: 3, icon: '💪', category: 'self-care' },
  { label: 'Cooking', spoonCost: 2, icon: '🍳', category: 'routine' },
  { label: 'Cleaning', spoonCost: 3, icon: '🧹', category: 'routine' },
  { label: 'Rest day', spoonCost: -2, icon: '😴', category: 'recovery' },
  { label: 'Special interest time', spoonCost: -1, icon: '⭐', category: 'recovery' },
  { label: 'Quiet time', spoonCost: -1, icon: '🔇', category: 'recovery' },
]

const CAT_COLORS: Record<string, string> = {
  social: 'text-pink-400 bg-pink-500/10', routine: 'text-blue-400 bg-blue-500/10',
  'self-care': 'text-emerald-400 bg-emerald-500/10', recovery: 'text-violet-400 bg-violet-500/10', custom: 'text-amber-400 bg-amber-500/10',
}

const BUDGET_KEY = 'neurochat_spoon_budget'
function loadBudget(): { events: PlannedEvent[]; dailySpoons: number } {
  try { return JSON.parse(localStorage.getItem(BUDGET_KEY) || 'null') || { events: [], dailySpoons: 10 } } catch { return { events: [], dailySpoons: 10 } }
}
function saveBudget(events: PlannedEvent[], dailySpoons: number) { localStorage.setItem(BUDGET_KEY, JSON.stringify({ events, dailySpoons })) }

function getEnergy(): number {
  try { const u = JSON.parse(localStorage.getItem('neurochat_user') || '{}'); const e = typeof u.energyStatus === 'string' ? JSON.parse(u.energyStatus) : u.energyStatus; return e ? Math.round(((e.social||50)+(e.sensory||50)+(e.cognitive||50)+(e.physical||50))/4) : 50 } catch { return 50 }
}

export function SpoonBudgetPage() {
  const navigate = useNavigate()
  const [budget] = useState(loadBudget)
  const [events, setEvents] = useState<PlannedEvent[]>(budget.events)
  const [dailySpoons, setDailySpoons] = useState(budget.dailySpoons)
  const [showAddDay, setShowAddDay] = useState<number | null>(null)
  const [customLabel, setCustomLabel] = useState('')
  const [customCost, setCustomCost] = useState(3)
  const currentEnergy = getEnergy()

  function save(evts: PlannedEvent[], spoons: number) { setEvents(evts); setDailySpoons(spoons); saveBudget(evts, spoons) }
  function addEvent(day: number, t: typeof EVENT_TEMPLATES[0]) { save([...events, { id: `e-${Date.now()}-${Math.random()}`, day, ...t }], dailySpoons); setShowAddDay(null) }
  function addCustom(day: number) { if (!customLabel.trim()) return; save([...events, { id: `e-${Date.now()}`, day, label: customLabel.trim(), spoonCost: customCost, icon: '📌', category: 'custom' }], dailySpoons); setCustomLabel(''); setCustomCost(3); setShowAddDay(null) }
  function removeEvent(id: string) { save(events.filter(e => e.id !== id), dailySpoons) }

  const dayAnalysis = useMemo(() => DAYS.map((_, i) => {
    const dayEvents = events.filter(e => e.day === i)
    const totalCost = dayEvents.reduce((s, e) => s + e.spoonCost, 0)
    const remaining = dailySpoons - totalCost
    return { dayEvents, totalCost, remaining, status: remaining >= dailySpoons * 0.5 ? 'good' as const : remaining >= 0 ? 'tight' as const : 'over' as const }
  }), [events, dailySpoons])

  const weeklyTotal = dayAnalysis.reduce((s, d) => s + d.totalCost, 0)
  const crashDays = dayAnalysis.filter(d => d.status === 'over').length
  const heaviestDay = dayAnalysis.reduce((max, d, i) => d.totalCost > (dayAnalysis[max]?.totalCost || 0) ? i : max, 0)

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted/50"><ArrowLeft className="w-5 h-5" /></button>
          <Calendar className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">Spoon Budget Planner</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Energy + budget */}
        <div className="rounded-2xl glass p-4 space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground">Current energy</p><p className="text-2xl font-bold">{currentEnergy}%</p></div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Daily spoon budget</p>
              <div className="flex items-center gap-2">
                <input type="range" min={5} max={20} value={dailySpoons} onChange={e => save(events, parseInt(e.target.value))} className="w-20 accent-primary" />
                <span className="text-2xl font-bold">{dailySpoons}</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">Spoons = units of energy. Higher-cost activities drain more. Adjust your budget to match how you typically feel.</p>
        </div>

        {/* Warning */}
        {crashDays > 0 && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-300">{crashDays} day{crashDays > 1 ? 's' : ''} over budget this week</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Consider rescheduling {DAYS[heaviestDay]} or adding recovery time.</p>
            </div>
          </div>
        )}

        {/* Weekly bar chart */}
        <div className="rounded-2xl glass p-4 space-y-2 animate-slide-up" style={{ animationDelay: '40ms' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Weekly overview</span>
            <span className="text-xs text-muted-foreground">{weeklyTotal} / {dailySpoons * 7} spoons</span>
          </div>
          <div className="flex gap-1">
            {dayAnalysis.map((day, i) => (
              <div key={i} className="flex-1 text-center">
                <div className="h-16 rounded-lg bg-muted/20 relative overflow-hidden mb-1">
                  <div className={cn('absolute bottom-0 left-0 right-0 rounded-lg transition-all',
                    day.status === 'good' ? 'bg-emerald-500/30' : day.status === 'tight' ? 'bg-amber-500/30' : 'bg-red-500/30'
                  )} style={{ height: `${Math.min(100, Math.max(5, (day.totalCost / dailySpoons) * 100))}%` }} />
                  {day.status === 'over' && <div className="absolute inset-0 flex items-center justify-center"><AlertTriangle className="w-3 h-3 text-red-400" /></div>}
                </div>
                <span className="text-[9px] text-muted-foreground">{SHORT_DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Day-by-day */}
        {DAYS.map((day, dayIdx) => {
          const a = dayAnalysis[dayIdx]
          return (
            <div key={dayIdx} className="rounded-2xl glass p-4 space-y-2 animate-slide-up" style={{ animationDelay: `${(dayIdx + 2) * 30}ms` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{day}</h3>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                    a.status === 'good' ? 'text-emerald-400 bg-emerald-500/10' : a.status === 'tight' ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10')}>
                    {a.remaining >= 0 ? `${a.remaining} left` : `${Math.abs(a.remaining)} over`}
                  </span>
                </div>
                <button onClick={() => setShowAddDay(showAddDay === dayIdx ? null : dayIdx)} className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"><Plus className="w-4 h-4" /></button>
              </div>
              {a.dayEvents.length === 0 ? <p className="text-[11px] text-muted-foreground/50 italic">Nothing planned</p> : (
                <div className="space-y-1">
                  {a.dayEvents.map(evt => (
                    <div key={evt.id} className="flex items-center gap-2 py-1">
                      <span className="text-sm">{evt.icon}</span>
                      <span className="flex-1 text-xs">{evt.label}</span>
                      <span className={cn('text-[10px] font-medium', evt.spoonCost > 0 ? 'text-red-400' : 'text-emerald-400')}>{evt.spoonCost > 0 ? `-${evt.spoonCost}` : `+${Math.abs(evt.spoonCost)}`} 🥄</span>
                      <button onClick={() => removeEvent(evt.id)} className="p-0.5 text-muted-foreground/40 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              {showAddDay === dayIdx && (
                <div className="pt-2 border-t border-border/20 space-y-2 animate-fade-in">
                  <div className="flex flex-wrap gap-1">
                    {EVENT_TEMPLATES.map((t, i) => (
                      <button key={i} onClick={() => addEvent(dayIdx, t)}
                        className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium active:scale-95', CAT_COLORS[t.category])}>
                        <span>{t.icon}</span> {t.label} <span className="opacity-60">({t.spoonCost > 0 ? `-${t.spoonCost}` : `+${Math.abs(t.spoonCost)}`})</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={customLabel} onChange={e => setCustomLabel(e.target.value)} placeholder="Custom activity..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-muted/20 text-[11px] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    <input type="number" min={-5} max={10} value={customCost} onChange={e => setCustomCost(parseInt(e.target.value) || 0)}
                      className="w-12 px-1.5 py-1.5 rounded-lg bg-muted/20 text-[11px] text-center focus:outline-none" />
                    <button onClick={() => addCustom(dayIdx)} disabled={!customLabel.trim()} className="px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium disabled:opacity-50">Add</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Tips */}
        <div className="rounded-2xl glass p-4 space-y-2 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><h3 className="text-sm font-semibold">Budgeting tips</h3></div>
          <ul className="space-y-1.5 text-[11px] text-muted-foreground">
            <li className="flex items-start gap-1.5"><span className="text-emerald-400 mt-0.5">•</span> Spread social events across the week — back-to-back drains faster</li>
            <li className="flex items-start gap-1.5"><span className="text-emerald-400 mt-0.5">•</span> Plan recovery time after high-cost days</li>
            <li className="flex items-start gap-1.5"><span className="text-emerald-400 mt-0.5">•</span> It's okay to cancel plans when your budget runs low</li>
            <li className="flex items-start gap-1.5"><span className="text-emerald-400 mt-0.5">•</span> Special interest time restores spoons — schedule it deliberately</li>
            <li className="flex items-start gap-1.5"><span className="text-emerald-400 mt-0.5">•</span> If you're consistently over budget, lower your daily spoons — be honest with yourself</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
