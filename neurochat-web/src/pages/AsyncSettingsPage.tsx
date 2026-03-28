import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Clock, Eye, EyeOff, MessageSquare, Send, Pause,
  Timer, BellOff, Moon, CheckCircle, Loader2, Mail, Shield,
} from 'lucide-react'
import { profileApi } from '@/lib/api/profile'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function Toggle({ checked, onChange, label, desc, icon: Icon }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; desc: string; icon?: any
}) {
  return (
    <label className="flex items-center justify-between py-3.5 px-4 rounded-xl glass cursor-pointer group hover:ring-1 hover:ring-primary/10 transition-all">
      <div className="flex items-center gap-3">
        {Icon && <Icon className={cn('w-4 h-4 shrink-0', checked ? 'text-primary' : 'text-muted-foreground')} />}
        <div>
          <span className="text-sm font-medium">{label}</span>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{desc}</p>
        </div>
      </div>
      <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cn('relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ml-3',
          checked ? 'bg-primary' : 'bg-muted')}>
        <span className={cn('block w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]')} />
      </button>
    </label>
  )
}

function RangeSlider({ value, onChange, min, max, step, label, desc, suffix, icon: Icon }: {
  value: number; onChange: (v: number) => void; min: number; max: number; step: number
  label: string; desc: string; suffix?: string; icon?: any
}) {
  return (
    <div className="py-3.5 px-4 rounded-xl glass space-y-3">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-4 h-4 text-primary shrink-0" />}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs text-primary font-medium tabular-nums">{value === 0 && suffix === '/hr' ? 'Unlimited' : `${value}${suffix || ''}`}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full bg-muted appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer" />
    </div>
  )
}

export function AsyncSettingsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Async preferences
  const [readReceipts, setReadReceipts] = useState(false)
  const [typingIndicator, setTypingIndicator] = useState(false)
  const [maxMessages, setMaxMessages] = useState(0)
  const [draftAndHold, setDraftAndHold] = useState(false)
  const [scheduledSend, setScheduledSend] = useState(false)
  const [respondLaterEnabled, setRespondLaterEnabled] = useState(true)
  const [lowBatteryAutoReply, setLowBatteryAutoReply] = useState(false)
  const [autoReplyMessage, setAutoReplyMessage] = useState("I'm resting right now — I'll reply when my energy is back up.")
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false)
  const [quietStart, setQuietStart] = useState('22:00')
  const [quietEnd, setQuietEnd] = useState('09:00')

  useEffect(() => {
    loadPrefs()
  }, [])

  async function loadPrefs() {
    try {
      const data = await profileApi.getCurrent()
      const p = data.profile as any
      const prefs = p.asyncPrefs || {}
      setReadReceipts(prefs.readReceipts ?? false)
      setTypingIndicator(prefs.typingIndicator ?? false)
      setMaxMessages(prefs.maxMessagesPerHour ?? 0)
      setDraftAndHold(prefs.draftAndHold ?? false)
      setScheduledSend(prefs.scheduledSend ?? false)
      setRespondLaterEnabled(prefs.respondLater ?? true)
      setLowBatteryAutoReply(prefs.lowBatteryAutoReply ?? false)
      setAutoReplyMessage(prefs.autoReplyMessage || "I'm resting right now — I'll reply when my energy is back up.")
      setQuietHoursEnabled(prefs.quietHours ?? false)
      setQuietStart(prefs.quietStart || '22:00')
      setQuietEnd(prefs.quietEnd || '09:00')
    } catch { /* use defaults */ }
    finally { setLoading(false) }
  }

  async function save() {
    setSaving(true)
    try {
      await profileApi.update({
        asyncPrefs: {
          readReceipts, typingIndicator, maxMessagesPerHour: maxMessages,
          draftAndHold, scheduledSend, respondLater: respondLaterEnabled,
          lowBatteryAutoReply, autoReplyMessage,
          quietHours: quietHoursEnabled, quietStart, quietEnd,
        }
      } as any)
      toast.success('Async preferences saved')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="min-h-screen bg-neural flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-lg font-semibold">Async Messaging</h1>
              <p className="text-[11px] text-muted-foreground">Go at your own pace — no pressure</p>
            </div>
          </div>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Privacy section */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <EyeOff className="w-3.5 h-3.5" /> Pressure Reduction
          </h2>
          <p className="text-xs text-muted-foreground mb-3">Remove signals that create urgency or guilt around response times.</p>
          <div className="space-y-2">
            <Toggle checked={!readReceipts} onChange={v => setReadReceipts(!v)} label="Hide read receipts" desc="Others won't see when you've read their messages" icon={Eye} />
            <Toggle checked={!typingIndicator} onChange={v => setTypingIndicator(!v)} label="Hide typing indicator" desc="Others won't see when you're composing a reply" icon={MessageSquare} />
          </div>
        </div>

        {/* Pacing section */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Timer className="w-3.5 h-3.5" /> Conversation Pacing
          </h2>
          <p className="text-xs text-muted-foreground mb-3">Control the flow of conversations to prevent overwhelm.</p>
          <div className="space-y-2">
            <RangeSlider value={maxMessages} onChange={setMaxMessages} min={0} max={60} step={5}
              label="Max incoming messages per hour" desc="0 = unlimited. When exceeded, senders see 'responding at their own pace'" suffix="/hr" icon={Pause} />

            <Toggle checked={draftAndHold} onChange={setDraftAndHold}
              label="Draft & hold mode" desc="Compose replies that are held until you explicitly release them — no accidental sends" icon={Mail} />

            <Toggle checked={scheduledSend} onChange={setScheduledSend}
              label="Scheduled send" desc="Choose when messages are delivered — align with your energy patterns" icon={Clock} />
          </div>
        </div>

        {/* Respond Later section */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Respond Later
          </h2>
          <p className="text-xs text-muted-foreground mb-3">Flag messages for when you have the energy. No guilt, no 'seen' markers.</p>
          <div className="space-y-2">
            <Toggle checked={respondLaterEnabled} onChange={setRespondLaterEnabled}
              label="Enable respond-later queue" desc="Swipe or long-press messages to add them to your queue" icon={Send} />
          </div>
        </div>

        {/* Auto-responder section */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <BellOff className="w-3.5 h-3.5" /> Low Energy Auto-Responder
          </h2>
          <p className="text-xs text-muted-foreground mb-3">Automatically tell contacts you're resting when your energy is low.</p>
          <div className="space-y-2">
            <Toggle checked={lowBatteryAutoReply} onChange={setLowBatteryAutoReply}
              label="Enable auto-responder" desc="Activates when your energy drops below threshold" icon={Shield} />

            {lowBatteryAutoReply && (
              <div className="ml-7 space-y-3 animate-fade-in">
                <div className="py-3 px-4 rounded-xl glass space-y-2">
                  <label className="text-xs text-muted-foreground block">Auto-reply message</label>
                  <textarea value={autoReplyMessage} onChange={e => setAutoReplyMessage(e.target.value)}
                    rows={2} maxLength={200}
                    className="w-full text-sm bg-muted/30 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none" />
                  <p className="text-[10px] text-muted-foreground text-right">{autoReplyMessage.length}/200</p>
                </div>

                {/* Preview */}
                <div className="py-3 px-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Preview — what contacts see:</p>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted/30 flex items-center justify-center shrink-0">
                      <Moon className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div className="glass rounded-xl rounded-tl-none px-3 py-2">
                      <p className="text-xs text-muted-foreground italic">{autoReplyMessage}</p>
                      <p className="text-[9px] text-muted-foreground/50 mt-1">Auto-reply — they're resting</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Moon className="w-3.5 h-3.5" /> Quiet Hours
          </h2>
          <p className="text-xs text-muted-foreground mb-3">Silence all notifications during set times.</p>
          <div className="space-y-2">
            <Toggle checked={quietHoursEnabled} onChange={setQuietHoursEnabled}
              label="Enable quiet hours" desc="No notifications during your rest period" icon={Moon} />

            {quietHoursEnabled && (
              <div className="ml-7 animate-fade-in">
                <div className="py-3 px-4 rounded-xl glass">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Start</label>
                      <input type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-muted/30 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">End</label>
                      <input type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-muted/30 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {quietStart} to {quietEnd} — messages still arrive, but silently
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info footer */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-primary font-medium">You're in control.</span> These settings exist because your energy and pace matter.
            There is no "right" speed to reply. Contacts who message you when auto-responder is active will see your
            custom message and know you'll get back to them when you're ready.
          </p>
        </div>
      </div>
    </div>
  )
}
