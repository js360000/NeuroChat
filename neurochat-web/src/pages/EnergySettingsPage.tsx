import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Zap, Moon, Clock, BatteryCharging } from 'lucide-react'
import { useEnergyStore } from '@/stores/energyStore'
import { useChatStore } from '@/stores/chatStore'
import { EnergyMeter } from '@/components/EnergyMeter'
import { cn } from '@/lib/utils'

function Toggle({ checked, onChange, label, description, icon: Icon }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; icon?: typeof Zap
}) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <div className="flex items-center gap-3">
        {Icon && <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-muted-foreground" /></div>}
        <div><span className="text-sm font-medium">{label}</span>{description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}</div>
      </div>
      <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cn('relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0', checked ? 'bg-primary' : 'bg-muted')}>
        <span className={cn('block w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200', checked ? 'translate-x-[22px]' : 'translate-x-[2px]')} />
      </button>
    </label>
  )
}

const BREAK_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
]

export function EnergySettingsPage() {
  const navigate = useNavigate()
  const { autoReminders, setAutoReminders, quietHoursStart, quietHoursEnd, setQuietHours } = useEnergyStore()
  const { sensoryBreakInterval, setSensoryBreakInterval } = useChatStore()

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/settings')} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <Zap className="w-5 h-5 text-emerald-400" />
          <h1 className="text-lg font-semibold">Energy & Boundaries</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Current energy */}
        <section className="animate-slide-up">
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Current Energy</h2>
          <div className="rounded-2xl glass p-4">
            <EnergyMeter />
            <p className="text-xs text-muted-foreground mt-3">Tap to quickly update how you're feeling. This is visible to your contacts so they know when to reach out.</p>
          </div>
        </section>

        {/* Break reminders */}
        <section className="animate-slide-up" style={{ animationDelay: '80ms' }}>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Sensory Breaks</h2>
          <div className="rounded-2xl glass p-4 space-y-4">
            <Toggle checked={autoReminders} onChange={setAutoReminders} label="Break reminders" description="Get gentle nudges to take a breather while chatting" icon={BatteryCharging} />
            {autoReminders && (
              <div className="animate-fade-in">
                <p className="text-xs text-muted-foreground mb-2">Remind me every:</p>
                <div className="flex gap-1.5 flex-wrap">
                  {BREAK_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setSensoryBreakInterval(opt.value)}
                      className={cn('px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                        sensoryBreakInterval === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                      )}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground"><span className="text-primary font-medium">Why breaks matter:</span> Regular breaks help prevent social burnout and keep your energy levels healthy. We'll offer a quick breathing exercise when it's time.</p>
            </div>
          </div>
        </section>

        {/* Quiet hours */}
        <section className="animate-slide-up" style={{ animationDelay: '160ms' }}>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Quiet Hours</h2>
          <div className="rounded-2xl glass p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center"><Moon className="w-4 h-4 text-muted-foreground" /></div>
              <div><p className="text-sm font-medium">Scheduled downtime</p><p className="text-xs text-muted-foreground">Notifications are silenced during these hours</p></div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">From</label>
                <input type="time" value={quietHoursStart} onChange={e => setQuietHours(e.target.value, quietHoursEnd)}
                  className="w-full px-3 py-2 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Until</label>
                <input type="time" value={quietHoursEnd} onChange={e => setQuietHours(quietHoursStart, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <p>Messages will still be delivered — they just won't buzz or chime. You'll see them when you're ready.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
