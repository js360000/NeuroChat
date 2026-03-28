import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Users, UserPlus, Shield, ShieldCheck, ShieldAlert, ShieldOff,
  ChevronDown, X, Check, Eye, AlertTriangle, Search,
  Trash2, Info, Battery, CheckCircle2, XCircle,
  HandHeart, Lock, Unlock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import { supportersApi } from '@/lib/api/supporters'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Supporter {
  id: string
  userId: string
  displayName: string
  avatar?: string
  safeguardingLevel: string
  addedAt: string
}

interface SupportedPerson {
  id: string
  userId: string
  displayName: string
  avatar?: string
  energy: { social: number; sensory: number; cognitive: number; physical: number }
  recoveryMode: boolean
  alertCount: number
}

/* ------------------------------------------------------------------ */
/*  Safeguarding level definitions                                     */
/* ------------------------------------------------------------------ */

const SAFEGUARDING_LEVELS = [
  {
    value: 'independent',
    label: 'Independent',
    description: 'No oversight — I manage my own safety',
    icon: ShieldOff,
    color: 'text-slate-400 bg-slate-500/10',
    permissions: {
      canSeeContacts: false,
      canReviewMessages: false,
      canApproveContacts: false,
      receivesAlerts: false,
    },
  },
  {
    value: 'guided',
    label: 'Guided',
    description: 'Light touch — notified of new contacts only',
    icon: Shield,
    color: 'text-blue-400 bg-blue-500/10',
    permissions: {
      canSeeContacts: true,
      canReviewMessages: false,
      canApproveContacts: false,
      receivesAlerts: true,
    },
  },
  {
    value: 'supported',
    label: 'Supported',
    description: 'Active support — can review messages and approve contacts',
    icon: ShieldCheck,
    color: 'text-emerald-400 bg-emerald-500/10',
    permissions: {
      canSeeContacts: true,
      canReviewMessages: true,
      canApproveContacts: true,
      receivesAlerts: true,
    },
  },
  {
    value: 'protected',
    label: 'Protected',
    description: 'Full support — pre-approved contacts, message oversight',
    icon: ShieldAlert,
    color: 'text-amber-400 bg-amber-500/10',
    permissions: {
      canSeeContacts: true,
      canReviewMessages: true,
      canApproveContacts: true,
      receivesAlerts: true,
    },
  },
]

function getLevelDef(level: string) {
  return SAFEGUARDING_LEVELS.find(l => l.value === level) ?? SAFEGUARDING_LEVELS[0]
}

/* ------------------------------------------------------------------ */
/*  Mini components                                                    */
/* ------------------------------------------------------------------ */

function Avatar({ name, src, size = 'md' }: { name: string; src?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-[10px]' : size === 'lg' ? 'w-14 h-14 text-base' : 'w-10 h-10 text-xs'
  if (src) return <img src={src} alt={name} className={cn(dim, 'rounded-full object-cover ring-2 ring-border/30')} />
  return (
    <div className={cn(dim, 'rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center ring-2 ring-border/30')}>
      {getInitials(name)}
    </div>
  )
}

function EnergyBar({ value, label }: { value: number; label: string }) {
  const color = value > 60 ? 'bg-emerald-400' : value > 30 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="w-5 h-12 rounded-full bg-muted/40 relative overflow-hidden">
        <div className={cn('absolute bottom-0 w-full rounded-full transition-all duration-500', color)} style={{ height: `${value}%` }} />
      </div>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  )
}

function PermissionRow({ allowed, label }: { allowed: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {allowed ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-red-400/60 shrink-0" />
      )}
      <span className={cn(allowed ? 'text-foreground' : 'text-muted-foreground/60')}>{label}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Consent dialog                                                     */
/* ------------------------------------------------------------------ */

function ConsentDialog({
  open,
  level,
  onConfirm,
  onCancel,
  onLearnMore,
}: {
  open: boolean
  level: string
  onConfirm: () => void
  onCancel: () => void
  onLearnMore: () => void
}) {
  if (!open) return null
  const def = getLevelDef(level)
  const LevelIcon = def.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl glass-heavy border border-border/50 p-6 space-y-5 animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', def.color)}>
            <LevelIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Change to {def.label}</h3>
            <p className="text-sm text-muted-foreground">{def.description}</p>
          </div>
        </div>

        {/* Permissions breakdown - Easy Read format */}
        <div className="rounded-xl bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            What your supporter will be able to do:
          </p>
          <div className="space-y-2">
            <PermissionRow allowed={def.permissions.canSeeContacts} label="See your contacts list" />
            <PermissionRow allowed={def.permissions.canReviewMessages} label="Review your messages" />
            <PermissionRow allowed={def.permissions.canApproveContacts} label="Approve or block new contacts" />
            <PermissionRow allowed={def.permissions.receivesAlerts} label="Receive safety alerts about you" />
          </div>
        </div>

        {/* Reassurance */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            You can change this level at any time. Your supporter cannot change it for you.
            <span className="font-medium text-foreground"> You are always in control.</span>
          </p>
        </div>

        {/* Actions - large, accessible buttons */}
        <div className="space-y-2">
          <button
            onClick={onConfirm}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            I understand and agree
          </button>
          <button
            onClick={onLearnMore}
            className="w-full py-3 rounded-xl bg-muted/30 text-muted-foreground font-medium text-sm hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
          >
            <Info className="w-4 h-4" />
            I want to learn more
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Remove confirmation dialog                                         */
/* ------------------------------------------------------------------ */

function RemoveDialog({
  open,
  name,
  onConfirm,
  onCancel,
}: {
  open: boolean
  name: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl glass-heavy border border-border/50 p-6 space-y-4 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-bold">Remove supporter?</h3>
            <p className="text-xs text-muted-foreground">This will remove {name} from your supporters</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          They will no longer be able to see your activity, receive safety alerts, or support your safeguarding.
          You can add them back at any time.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-muted/30 text-sm font-medium hover:bg-muted/50 transition-colors">
            Keep them
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors">
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Learn more dialog                                                  */
/* ------------------------------------------------------------------ */

function LearnMoreDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl glass-heavy border border-border/50 p-6 space-y-5 animate-slide-up">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <HandHeart className="w-5 h-5 text-primary" />
            About Safeguarding Levels
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Safeguarding levels let you choose how much support you receive from your trusted person.
          Everyone is different, and your needs may change over time. Here is what each level means:
        </p>

        <div className="space-y-3">
          {SAFEGUARDING_LEVELS.map(level => {
            const LevelIcon = level.icon
            return (
              <div key={level.value} className="rounded-xl bg-muted/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', level.color)}>
                    <LevelIcon className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sm">{level.label}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{level.description}</p>
                <div className="space-y-1">
                  <PermissionRow allowed={level.permissions.canSeeContacts} label="Can see contacts" />
                  <PermissionRow allowed={level.permissions.canReviewMessages} label="Can review messages" />
                  <PermissionRow allowed={level.permissions.canApproveContacts} label="Can approve contacts" />
                  <PermissionRow allowed={level.permissions.receivesAlerts} label="Receives safety alerts" />
                </div>
              </div>
            )
          })}
        </div>

        <button onClick={onClose} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
          Got it
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Privacy indicator                                                  */
/* ------------------------------------------------------------------ */

function PrivacyIndicator({ level }: { level: string }) {
  const def = getLevelDef(level)
  const LevelIcon = def.icon

  return (
    <div className="rounded-2xl glass p-4 space-y-3">
      <div className="flex items-center gap-2">
        <LevelIcon className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Current safeguarding level</span>
        <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full', def.color)}>
          {def.label}
        </span>
      </div>

      <div className="rounded-xl bg-muted/20 p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          Your supporter can currently see:
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <PermissionRow allowed={def.permissions.canSeeContacts} label="Your contacts" />
          <PermissionRow allowed={def.permissions.canReviewMessages} label="Your messages" />
          <PermissionRow allowed={def.permissions.canApproveContacts} label="Approve contacts" />
          <PermissionRow allowed={def.permissions.receivesAlerts} label="Safety alerts" />
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="w-3 h-3 shrink-0" />
        <span>Only you can change this. Your supporter cannot adjust your level.</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export function SupporterDashboardPage() {
  const navigate = useNavigate()

  /* State */
  const [supporters, setSupporters] = useState<Supporter[]>([])
  const [supporting, setSupporting] = useState<SupportedPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'mine' | 'theirs'>('mine')

  /* Add supporter */
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  /* Level change consent */
  const [consentTarget, setConsentTarget] = useState<{ supporterId: string; level: string } | null>(null)
  const [showLearnMore, setShowLearnMore] = useState(false)

  /* Remove confirmation */
  const [removeTarget, setRemoveTarget] = useState<Supporter | null>(null)

  /* Level dropdown */
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  /* Fetch data */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [supporterData, supportingData] = await Promise.all([
        supportersApi.list(),
        supportersApi.supporting(),
      ])
      setSupporters(supporterData.supporters ?? supporterData ?? [])
      setSupporting(supportingData.supporting ?? supportingData ?? [])
    } catch {
      toast.error('Failed to load supporter data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  /* Handlers */
  const handleAddSupporter = async () => {
    if (!searchQuery.trim()) return
    try {
      await supportersApi.add({ supporterId: searchQuery.trim(), safeguardingLevel: 'guided' })
      toast.success('Supporter added successfully')
      setSearchQuery('')
      setShowAddForm(false)
      fetchData()
    } catch {
      toast.error('Could not add supporter. Check the ID and try again.')
    }
  }

  const handleLevelChange = (supporterId: string, level: string) => {
    setOpenDropdown(null)
    setConsentTarget({ supporterId, level })
  }

  const confirmLevelChange = async () => {
    if (!consentTarget) return
    try {
      await supportersApi.update(consentTarget.supporterId, { safeguardingLevel: consentTarget.level })
      toast.success('Safeguarding level updated')
      setSupporters(prev => prev.map(s => s.id === consentTarget.supporterId ? { ...s, safeguardingLevel: consentTarget.level } : s))
    } catch {
      toast.error('Failed to update safeguarding level')
    } finally {
      setConsentTarget(null)
    }
  }

  const handleRemove = async () => {
    if (!removeTarget) return
    try {
      await supportersApi.remove(removeTarget.id)
      toast.success(`${removeTarget.displayName} removed`)
      setSupporters(prev => prev.filter(s => s.id !== removeTarget.id))
    } catch {
      toast.error('Failed to remove supporter')
    } finally {
      setRemoveTarget(null)
    }
  }

  const currentLevel = supporters.length > 0 ? supporters[0].safeguardingLevel : 'independent'

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <HandHeart className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">Trusted Supporters</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Privacy indicator - always visible */}
        <div className="animate-slide-up">
          <PrivacyIndicator level={currentLevel} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/30 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <button
            onClick={() => setActiveTab('mine')}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'mine' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Shield className="w-4 h-4" />
            My Supporters
          </button>
          <button
            onClick={() => setActiveTab('theirs')}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'theirs' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Users className="w-4 h-4" />
            People I Support
            {supporting.some(p => p.alertCount > 0) && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {supporting.reduce((n, p) => n + p.alertCount, 0)}
              </span>
            )}
          </button>
        </div>

        {/* ============ MY SUPPORTERS TAB ============ */}
        {activeTab === 'mine' && (
          <div className="space-y-4 animate-fade-in">
            {/* Add supporter button / form */}
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-3 rounded-2xl glass border-2 border-dashed border-border/50 text-sm font-medium text-muted-foreground hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Add a trusted supporter
              </button>
            ) : (
              <div className="rounded-2xl glass p-4 space-y-3 animate-slide-up">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-primary" />
                    Add supporter
                  </h3>
                  <button onClick={() => { setShowAddForm(false); setSearchQuery('') }} className="p-1 rounded-lg hover:bg-muted/50 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Enter supporter ID or search by name..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/50"
                      onKeyDown={e => e.key === 'Enter' && handleAddSupporter()}
                    />
                  </div>
                  <button
                    onClick={handleAddSupporter}
                    disabled={!searchQuery.trim()}
                    className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ask your supporter for their NeuroChat ID, or search by their display name.
                </p>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}

            {/* Empty state */}
            {!loading && supporters.length === 0 && (
              <div className="text-center py-12 space-y-3 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-muted/30 mx-auto flex items-center justify-center">
                  <HandHeart className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold">No supporters yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  A supporter is someone you trust who can help keep you safe while chatting.
                  This could be a family member, carer, or close friend.
                </p>
              </div>
            )}

            {/* Supporter cards */}
            {!loading && supporters.map((supporter, i) => {
              const levelDef = getLevelDef(supporter.safeguardingLevel)
              const LevelIcon = levelDef.icon
              const dropdownOpen = openDropdown === supporter.id

              return (
                <div
                  key={supporter.id}
                  className="rounded-2xl glass p-4 space-y-3 animate-slide-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Top row: avatar, name, badge */}
                  <div className="flex items-center gap-3">
                    <Avatar name={supporter.displayName} src={supporter.avatar} />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">{supporter.displayName}</h3>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(supporter.addedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', levelDef.color)}>
                      <LevelIcon className="w-3.5 h-3.5" />
                      {levelDef.label}
                    </div>
                  </div>

                  {/* Permissions summary */}
                  <div className="rounded-xl bg-muted/20 p-3 grid grid-cols-2 gap-1.5">
                    <PermissionRow allowed={levelDef.permissions.canSeeContacts} label="Sees contacts" />
                    <PermissionRow allowed={levelDef.permissions.canReviewMessages} label="Reviews messages" />
                    <PermissionRow allowed={levelDef.permissions.canApproveContacts} label="Approves contacts" />
                    <PermissionRow allowed={levelDef.permissions.receivesAlerts} label="Gets alerts" />
                  </div>

                  {/* Actions row */}
                  <div className="flex gap-2">
                    {/* Change Level dropdown */}
                    <div className="relative flex-1">
                      <button
                        onClick={() => setOpenDropdown(dropdownOpen ? null : supporter.id)}
                        className="w-full py-2 rounded-xl bg-muted/30 text-sm font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        Change Level
                        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', dropdownOpen && 'rotate-180')} />
                      </button>

                      {dropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl glass-heavy border border-border/50 overflow-hidden z-20 animate-slide-up shadow-lg">
                          {SAFEGUARDING_LEVELS.map(level => {
                            const ItemIcon = level.icon
                            const isActive = supporter.safeguardingLevel === level.value
                            return (
                              <button
                                key={level.value}
                                onClick={() => isActive ? setOpenDropdown(null) : handleLevelChange(supporter.id, level.value)}
                                className={cn(
                                  'w-full text-left p-3 hover:bg-muted/30 transition-colors flex items-start gap-2.5',
                                  isActive && 'bg-primary/5',
                                )}
                              >
                                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5', level.color)}>
                                  <ItemIcon className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{level.label}</span>
                                    {isActive && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Current</span>}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">{level.description}</p>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => setRemoveTarget(supporter)}
                      className="px-4 py-2 rounded-xl bg-red-500/5 text-red-400/70 text-sm font-medium hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ============ PEOPLE I SUPPORT TAB ============ */}
        {activeTab === 'theirs' && (
          <div className="space-y-4 animate-fade-in">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}

            {!loading && supporting.length === 0 && (
              <div className="text-center py-12 space-y-3 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-muted/30 mx-auto flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold">Not supporting anyone yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  When someone adds you as their trusted supporter, they will appear here.
                  You will be able to see their energy levels and safety alerts.
                </p>
              </div>
            )}

            {!loading && supporting.map((person, i) => (
              <button
                key={person.id}
                onClick={() => navigate(`/supporters/${person.userId}/alerts`)}
                className="w-full rounded-2xl glass p-4 text-left hover:bg-muted/10 transition-all group animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={person.displayName} src={person.avatar} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate">{person.displayName}</h3>
                      {person.recoveryMode && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 flex items-center gap-1">
                          <Battery className="w-3 h-3" />
                          Recovery
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {person.alertCount > 0
                        ? `${person.alertCount} unread alert${person.alertCount > 1 ? 's' : ''}`
                        : 'No active alerts'}
                    </p>
                  </div>

                  {/* Alert badge */}
                  {person.alertCount > 0 && (
                    <div className="w-7 h-7 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center glow-sm shadow-red-500/30">
                      {person.alertCount}
                    </div>
                  )}
                </div>

                {/* Energy bars */}
                <div className="flex items-center gap-4 mt-3 pl-13">
                  <div className="flex gap-3">
                    <EnergyBar value={person.energy.social} label="Soc" />
                    <EnergyBar value={person.energy.sensory} label="Sen" />
                    <EnergyBar value={person.energy.cognitive} label="Cog" />
                    <EnergyBar value={person.energy.physical} label="Phy" />
                  </div>
                  <div className="flex-1" />
                  <span className="text-xs text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                    View activity →
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ConsentDialog
        open={!!consentTarget}
        level={consentTarget?.level ?? 'independent'}
        onConfirm={confirmLevelChange}
        onCancel={() => setConsentTarget(null)}
        onLearnMore={() => { setConsentTarget(null); setShowLearnMore(true) }}
      />
      <RemoveDialog
        open={!!removeTarget}
        name={removeTarget?.displayName ?? ''}
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
      <LearnMoreDialog
        open={showLearnMore}
        onClose={() => setShowLearnMore(false)}
      />
    </div>
  )
}
