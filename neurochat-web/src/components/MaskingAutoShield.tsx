import { useState, useEffect } from 'react'
import { Shield, ShieldCheck, Volume2, Zap, Moon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/* ------------------------------------------------------------------ */
/*  Shield state — persisted in localStorage                           */
/* ------------------------------------------------------------------ */

interface ShieldState {
  active: boolean
  activatedAt?: string
  autoResponderMessage: string
  suppressSounds: boolean
  simplifyMessages: boolean
  suggestParallelPlay: boolean
}

const SHIELD_KEY = 'neurochat_auto_shield'

function loadShield(): ShieldState {
  try {
    return JSON.parse(localStorage.getItem(SHIELD_KEY) || 'null') || defaultShield()
  } catch { return defaultShield() }
}

function defaultShield(): ShieldState {
  return {
    active: false,
    autoResponderMessage: "I'm recharging right now. I'll reply when I have the energy. No rush needed.",
    suppressSounds: true,
    simplifyMessages: true,
    suggestParallelPlay: true,
  }
}

function saveShield(state: ShieldState) {
  localStorage.setItem(SHIELD_KEY, JSON.stringify(state))
}

/* ------------------------------------------------------------------ */
/*  Auto-detection: check energy levels                                */
/* ------------------------------------------------------------------ */

function checkShouldActivate(): { shouldActivate: boolean; reason?: string } {
  try {
    const user = JSON.parse(localStorage.getItem('neurochat_user') || '{}')
    if (!user.energyStatus) return { shouldActivate: false }

    const energy = typeof user.energyStatus === 'string' ? JSON.parse(user.energyStatus) : user.energyStatus
    const avg = ((energy.social || 50) + (energy.sensory || 50) + (energy.cognitive || 50) + (energy.physical || 50)) / 4

    if (avg <= 20) return { shouldActivate: true, reason: 'Your energy is critically low' }
    if ((energy.social || 50) <= 15) return { shouldActivate: true, reason: 'Your social energy is very low' }
    return { shouldActivate: false }
  } catch { return { shouldActivate: false } }
}

/* ------------------------------------------------------------------ */
/*  Shield Banner (shown when active)                                  */
/* ------------------------------------------------------------------ */

export function ShieldBanner({ onDismiss }: { onDismiss?: () => void }) {
  const [shield, setShield] = useState(loadShield)

  if (!shield.active) return null

  function deactivate() {
    const updated = { ...shield, active: false }
    setShield(updated)
    saveShield(updated)
    toast.success('Shield deactivated — welcome back!')
    onDismiss?.()
  }

  return (
    <div className="mx-4 mb-2 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 animate-fade-in">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-violet-300">Auto-Shield Active</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
            {shield.suppressSounds && 'Sounds muted. '}
            {shield.simplifyMessages && 'Messages simplified. '}
            Auto-responding to new messages.
          </p>
        </div>
        <button onClick={deactivate} className="p-1 rounded-lg hover:bg-violet-500/20 shrink-0">
          <X className="w-3.5 h-3.5 text-violet-400" />
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Shield Settings Panel                                              */
/* ------------------------------------------------------------------ */

export function ShieldSettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [shield, setShield] = useState(loadShield)

  useEffect(() => { if (open) setShield(loadShield()) }, [open])

  function update(patch: Partial<ShieldState>) {
    const updated = { ...shield, ...patch }
    setShield(updated)
    saveShield(updated)
  }

  function toggleShield() {
    const newActive = !shield.active
    update({ active: newActive, activatedAt: newActive ? new Date().toISOString() : undefined })
    toast.success(newActive ? 'Auto-Shield activated — take care of yourself' : 'Shield deactivated')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-heavy rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-400" />
            <h2 className="font-semibold text-sm">Masking Auto-Shield</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Explanation */}
          <div className="rounded-xl bg-violet-500/5 border border-violet-500/10 p-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              When your energy drops critically low, Auto-Shield protects you by simplifying incoming messages, muting sounds, and auto-responding so you can recharge without guilt.
            </p>
          </div>

          {/* Main toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={cn('w-4 h-4', shield.active ? 'text-violet-400' : 'text-muted-foreground')} />
              <span className="text-sm font-medium">{shield.active ? 'Shield is ON' : 'Shield is OFF'}</span>
            </div>
            <button onClick={toggleShield}
              className={cn('relative w-11 h-6 rounded-full transition-colors', shield.active ? 'bg-violet-500' : 'bg-muted')}>
              <span className={cn('block w-5 h-5 rounded-full bg-white shadow-md transition-transform', shield.active ? 'translate-x-[22px]' : 'translate-x-[2px]')} />
            </button>
          </div>

          {/* Settings */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">When shield activates</h3>

            {([
              { key: 'suppressSounds' as const, icon: <Volume2 className="w-3.5 h-3.5" />, label: 'Mute notification sounds' },
              { key: 'simplifyMessages' as const, icon: <Moon className="w-3.5 h-3.5" />, label: 'Simplify incoming messages' },
              { key: 'suggestParallelPlay' as const, icon: <ShieldCheck className="w-3.5 h-3.5" />, label: 'Suggest Together Rooms instead' },
            ]).map(({ key, icon, label }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{icon}</span>
                  <span className="text-xs">{label}</span>
                </div>
                <button onClick={() => update({ [key]: !shield[key] })}
                  className={cn('relative w-9 h-5 rounded-full transition-colors', shield[key] ? 'bg-primary' : 'bg-muted')}>
                  <span className={cn('block w-4 h-4 rounded-full bg-white shadow transition-transform', shield[key] ? 'translate-x-[18px]' : 'translate-x-[2px]')} />
                </button>
              </div>
            ))}
          </div>

          {/* Auto-responder message */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Auto-response message</label>
            <textarea value={shield.autoResponderMessage} onChange={e => update({ autoResponderMessage: e.target.value })}
              rows={3} maxLength={200}
              className="w-full px-3 py-2 rounded-xl bg-muted/30 text-xs resize-none placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-400/30" />
            <p className="text-[10px] text-muted-foreground mt-1">{shield.autoResponderMessage.length}/200</p>
          </div>

          {/* Auto-activation info */}
          <div className="rounded-xl bg-muted/20 p-3 flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Shield auto-activates when your overall energy drops below 20%, or your social energy drops below 15%. You can also activate it manually anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Hook: returns whether shield should auto-activate */
export function useAutoShield() {
  const [shieldActive, setShieldActive] = useState(() => loadShield().active)

  useEffect(() => {
    const interval = setInterval(() => {
      const shield = loadShield()
      if (shield.active) { setShieldActive(true); return }
      const { shouldActivate, reason } = checkShouldActivate()
      if (shouldActivate && !shield.active) {
        const updated = { ...shield, active: true, activatedAt: new Date().toISOString() }
        saveShield(updated)
        setShieldActive(true)
        toast('Auto-Shield activated: ' + (reason || 'Energy critically low'), { icon: '🛡️' })
      }
    }, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return shieldActive
}
