import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, MessageCircle, Users, Volume2, Vibrate, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { requestNotificationPermission, getNotificationPermission } from '@/lib/notifications'
import { toast } from 'sonner'

function Toggle({ checked, onChange, label, description, icon: Icon }: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
  icon?: typeof Bell
}) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <div>
          <span className="text-sm font-medium">{label}</span>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0',
          checked ? 'bg-primary' : 'bg-muted'
        )}
      >
        <span className={cn(
          'block w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
        )} />
      </button>
    </label>
  )
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const [permissionState, setPermissionState] = useState<string>(getNotificationPermission())
  const [pushEnabled, setPushEnabled] = useState(getNotificationPermission() === 'granted')

  useEffect(() => { setPermissionState(getNotificationPermission()) }, [pushEnabled])

  async function handleTogglePush(value: boolean) {
    if (value) {
      const granted = await requestNotificationPermission()
      setPushEnabled(granted)
      setPermissionState(getNotificationPermission())
      if (!granted) toast.error('Notification permission denied. Enable in browser settings.')
      else toast.success('Push notifications enabled!')
    } else {
      setPushEnabled(false)
      toast('Push notifications paused for this session')
    }
  }
  const [messageNotifs, setMessageNotifs] = useState(true)
  const [mentionNotifs, setMentionNotifs] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [vibration, setVibration] = useState(true)
  const [quietMode, setQuietMode] = useState(false)
  const [quietStart, setQuietStart] = useState('22:00')
  const [quietEnd, setQuietEnd] = useState('08:00')

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/settings')} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Bell className="w-5 h-5 text-orange-400" />
          <h1 className="text-lg font-semibold">Notifications</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* General */}
        <section className="animate-slide-up">
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            General
          </h2>
          <div className="rounded-2xl glass p-4 divide-y divide-border/30">
            <Toggle
              checked={pushEnabled}
              onChange={handleTogglePush}
              label="Push notifications"
              description={permissionState === 'denied' ? 'Blocked — enable in browser settings' : 'Receive notifications on this device'}
              icon={Bell}
            />
            <Toggle
              checked={messageNotifs}
              onChange={setMessageNotifs}
              label="New messages"
              description="Get notified when someone messages you"
              icon={MessageCircle}
            />
            <Toggle
              checked={mentionNotifs}
              onChange={setMentionNotifs}
              label="Mentions & replies"
              description="When someone mentions or replies to you"
              icon={Users}
            />
          </div>
        </section>

        {/* Sounds & Haptics */}
        <section className="animate-slide-up" style={{ animationDelay: '80ms' }}>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            Sounds & Haptics
          </h2>
          <div className="rounded-2xl glass p-4 divide-y divide-border/30">
            <Toggle
              checked={soundEnabled}
              onChange={setSoundEnabled}
              label="Notification sounds"
              description="Play a sound for new notifications"
              icon={Volume2}
            />
            <Toggle
              checked={vibration}
              onChange={setVibration}
              label="Vibration"
              description="Vibrate for notifications"
              icon={Vibrate}
            />
          </div>
        </section>

        {/* Quiet Hours */}
        <section className="animate-slide-up" style={{ animationDelay: '160ms' }}>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            Quiet Hours
          </h2>
          <div className="rounded-2xl glass p-4 space-y-4">
            <Toggle
              checked={quietMode}
              onChange={setQuietMode}
              label="Do Not Disturb"
              description="Silence all notifications during quiet hours"
              icon={Moon}
            />
            {quietMode && (
              <div className="flex gap-4 pt-2 animate-fade-in">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">From</label>
                  <input
                    type="time"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Until</label>
                  <input
                    type="time"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>
            )}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground">
                <span className="text-primary font-medium">Tip:</span> Setting quiet hours helps protect your social energy.
                You'll still receive messages — they just won't buzz or chime.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
