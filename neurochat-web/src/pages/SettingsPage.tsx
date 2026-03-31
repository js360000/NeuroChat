import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Accessibility, Shield, Bell, User,
  MessageSquare, Brain, Zap, ChevronRight, LogOut, Heart, Sparkles,
  Clock, Grid3X3, MapPin, Users, ShieldAlert, Battery,
} from 'lucide-react'
import { EnergyMeter } from '@/components/EnergyMeter'
import { cn } from '@/lib/utils'

interface SettingItem {
  icon: typeof Shield
  label: string
  description: string
  path: string
  color: string
  badge?: string
}

const SETTINGS_SECTIONS: { title: string; items: SettingItem[] }[] = [
  {
    title: 'You',
    items: [
      { icon: User, label: 'Profile', description: 'Name, neurotype, triggers, accommodations, and more', path: '/profile', color: 'text-blue-400 bg-blue-500/10' },
      { icon: Zap, label: 'Energy & Boundaries', description: 'Social energy and quiet hours', path: '/settings/energy', color: 'text-emerald-400 bg-emerald-500/10' },
    ],
  },
  {
    title: 'Experience',
    items: [
      { icon: Accessibility, label: 'Accessibility', description: 'Theme, text size, and display', path: '/accessibility', color: 'text-violet-400 bg-violet-500/10' },
      { icon: MessageSquare, label: 'Chat Preferences', description: 'Tone tags, smart replies, and more', path: '/settings/chat', color: 'text-cyan-400 bg-cyan-500/10' },
      { icon: Clock, label: 'Async Messaging', description: 'Read receipts, pacing, respond-later queue', path: '/settings/async', color: 'text-teal-400 bg-teal-500/10', badge: 'New' },
      { icon: Grid3X3, label: 'AAC Mode', description: 'Symbol grids, phrase banks, and TTS', path: '/settings/aac', color: 'text-indigo-400 bg-indigo-500/10', badge: 'New' },
      { icon: Brain, label: 'AI Features', description: 'Explain, rephrase, and suggestions', path: '/settings/ai', color: 'text-pink-400 bg-pink-500/10' },
    ],
  },
  {
    title: 'Wellbeing',
    items: [
      { icon: Battery, label: 'Energy Dashboard', description: 'Track social, sensory, cognitive energy', path: '/energy', color: 'text-emerald-400 bg-emerald-500/10', badge: 'New' },
      { icon: MapPin, label: 'Sensory Venues', description: 'Crowdsourced venue sensory reviews', path: '/venues', color: 'text-sky-400 bg-sky-500/10', badge: 'New' },
      { icon: Users, label: 'Together Rooms', description: 'Parallel play — be together without talking', path: '/together', color: 'text-rose-400 bg-rose-500/10', badge: 'New' },
      { icon: Sparkles, label: 'Special Interest Rooms', description: 'Infodump freely — share your passions', path: '/interest-rooms', color: 'text-pink-400 bg-pink-500/10', badge: 'New' },
      { icon: Battery, label: 'Spoon Budget', description: 'Weekly energy forecast and planning', path: '/spoon-budget', color: 'text-amber-400 bg-amber-500/10', badge: 'New' },
    ],
  },
  {
    title: 'Safety',
    items: [
      { icon: ShieldAlert, label: 'Guardian Angel', description: 'Manipulation detection and safety alerts', path: '/guardian-angel', color: 'text-red-400 bg-red-500/10', badge: 'New' },
      { icon: Users, label: 'Trusted Supporters', description: 'Add supporters and manage safeguarding', path: '/supporters', color: 'text-green-400 bg-green-500/10', badge: 'New' },
      { icon: Shield, label: 'Privacy & Safety', description: 'Blocking, visibility, and data', path: '/privacy', color: 'text-amber-400 bg-amber-500/10' },
      { icon: Bell, label: 'Notifications', description: 'Alerts, sounds, and quiet mode', path: '/notifications', color: 'text-orange-400 bg-orange-500/10' },
    ],
  },
]

// Admin section shown separately (only for admin users — but we always show it for now since auth is simulated)
const ADMIN_ITEM: SettingItem = {
  icon: Shield, label: 'Admin Panel', description: 'User management, moderation, AI config', path: '/admin', color: 'text-red-400 bg-red-500/10', badge: 'Admin',
}

export function SettingsPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Energy meter card */}
        <div className="p-4 rounded-2xl glass glow-sm animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Social Energy</span>
          </div>
          <EnergyMeter />
        </div>

        {/* Settings sections */}
        {SETTINGS_SECTIONS.map((section, si) => (
          <div key={section.title} className="animate-slide-up" style={{ animationDelay: `${si * 80}ms` }}>
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
              {section.title}
            </h2>
            <div className="rounded-2xl glass overflow-hidden divide-y divide-border/30">
              {section.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 transition-all text-left group"
                >
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', item.color)}>
                    <item.icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Admin */}
        <div className="animate-slide-up" style={{ animationDelay: '240ms' }}>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Administration</h2>
          <div className="rounded-2xl glass overflow-hidden">
            <button
              onClick={() => navigate(ADMIN_ITEM.path)}
              className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 transition-all text-left group"
            >
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', ADMIN_ITEM.color)}>
                <ADMIN_ITEM.icon className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{ADMIN_ITEM.label}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400">Admin</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{ADMIN_ITEM.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

        {/* App info */}
        <div className="text-center space-y-2 pt-4 animate-fade-in">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm">NeuroChat</span>
          </div>
          <p className="text-[11px] text-muted-foreground">v1.0.0 — A calmer way to connect</p>
          <button className="text-xs text-destructive/70 hover:text-destructive transition-colors flex items-center gap-1.5 mx-auto mt-4">
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
