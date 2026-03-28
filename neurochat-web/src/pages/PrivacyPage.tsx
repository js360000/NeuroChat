import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Eye, EyeOff, UserX, MapPin, Clock, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
  icon?: typeof Shield
}

function Toggle({ checked, onChange, label, description, icon: Icon }: ToggleProps) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer group">
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
        <span
          className={cn(
            'block w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200',
            checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
          )}
        />
      </button>
    </label>
  )
}

export function PrivacyPage() {
  const navigate = useNavigate()
  const [showOnlineStatus, setShowOnlineStatus] = useState(true)
  const [showReadReceipts, setShowReadReceipts] = useState(true)
  const [showLastSeen, setShowLastSeen] = useState(true)
  const [showLocation, setShowLocation] = useState(false)
  const [profileVisible, setProfileVisible] = useState(true)
  const [allowStrangerMessages, setAllowStrangerMessages] = useState(false)

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/settings')} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Shield className="w-5 h-5 text-amber-400" />
          <h1 className="text-lg font-semibold">Privacy & Safety</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Visibility */}
        <section className="animate-slide-up">
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            Visibility
          </h2>
          <div className="rounded-2xl glass p-4 divide-y divide-border/30">
            <Toggle
              checked={showOnlineStatus}
              onChange={setShowOnlineStatus}
              label="Show online status"
              description="Let others see when you're active"
              icon={Eye}
            />
            <Toggle
              checked={showReadReceipts}
              onChange={setShowReadReceipts}
              label="Read receipts"
              description="Let senders know you've read their message"
              icon={Eye}
            />
            <Toggle
              checked={showLastSeen}
              onChange={setShowLastSeen}
              label="Last seen"
              description="Show when you were last active"
              icon={Clock}
            />
            <Toggle
              checked={showLocation}
              onChange={setShowLocation}
              label="Share general location"
              description="Show your city/region on your profile"
              icon={MapPin}
            />
          </div>
        </section>

        {/* Profile */}
        <section className="animate-slide-up" style={{ animationDelay: '80ms' }}>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            Profile
          </h2>
          <div className="rounded-2xl glass p-4 divide-y divide-border/30">
            <Toggle
              checked={profileVisible}
              onChange={setProfileVisible}
              label="Discoverable profile"
              description="Allow others to find you in discovery"
              icon={profileVisible ? Eye : EyeOff}
            />
            <Toggle
              checked={allowStrangerMessages}
              onChange={setAllowStrangerMessages}
              label="Messages from non-contacts"
              description="Allow people you haven't connected with to message you"
              icon={UserX}
            />
          </div>
        </section>

        {/* Data & Security */}
        <section className="animate-slide-up" style={{ animationDelay: '160ms' }}>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            Data & Security
          </h2>
          <div className="rounded-2xl glass overflow-hidden divide-y divide-border/30">
            <button className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 transition-all text-left">
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">Blocked users</span>
                <p className="text-xs text-muted-foreground mt-0.5">Manage your block list</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 transition-all text-left">
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">Download my data</span>
                <p className="text-xs text-muted-foreground mt-0.5">Request a copy of your data</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 transition-all text-left group">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <UserX className="w-4 h-4 text-destructive/70" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-destructive/80">Delete account</span>
                <p className="text-xs text-muted-foreground mt-0.5">Permanently delete your account and data</p>
              </div>
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
