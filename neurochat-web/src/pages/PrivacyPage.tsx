import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Shield, Eye, EyeOff, UserX, MapPin, Clock, Lock,
  Download, Trash2, AlertTriangle, Loader2, FileText,
  Brain, Zap, Phone, ChevronDown, ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api/client'
import { toast } from 'sonner'

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
      <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cn('relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0', checked ? 'bg-primary' : 'bg-muted')}>
        <span className={cn('block w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200', checked ? 'translate-x-[22px]' : 'translate-x-[2px]')} />
      </button>
    </label>
  )
}

interface ConsentItem {
  key: string
  label: string
  icon: typeof Brain
  given: boolean
  basis: string
  withdrawable: boolean
  description: string
}

export function PrivacyPage() {
  const navigate = useNavigate()
  const [showOnlineStatus, setShowOnlineStatus] = useState(true)
  const [showReadReceipts, setShowReadReceipts] = useState(false)
  const [showLastSeen, setShowLastSeen] = useState(true)
  const [showLocation, setShowLocation] = useState(false)
  const [profileVisible, setProfileVisible] = useState(true)
  const [allowStrangerMessages, setAllowStrangerMessages] = useState(false)

  // GDPR state
  const [consents, setConsents] = useState<ConsentItem[]>([])
  const [consentsLoading, setConsentsLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showConsents, setShowConsents] = useState(false)
  const [withdrawing, setWithdrawing] = useState<string | null>(null)

  useEffect(() => {
    api.get('/user/consent').then(r => {
      const c = r.data.consents
      const items: ConsentItem[] = [
        { key: 'specialCategoryData', label: 'Neurotype & Health Data', icon: Brain, ...c.specialCategoryData },
        { key: 'energyTracking', label: 'Energy & Masking Tracking', icon: Zap, ...c.energyTracking },
        { key: 'phoneNumber', label: 'Phone Number', icon: Phone, ...c.phoneNumber },
        { key: 'safetyScanning', label: 'Safety Scanning', icon: Shield, ...c.safetyScanning },
      ]
      setConsents(items)
    }).catch(() => {}).finally(() => setConsentsLoading(false))
  }, [])

  async function handleExport() {
    setExporting(true)
    try {
      const res = await api.get('/user/data-export')
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `neurochat-data-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Data export downloaded!')
    } catch {
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteInput !== 'DELETE') return
    setDeleting(true)
    try {
      await api.delete('/user/account')
      localStorage.clear()
      toast.success('Account deleted. Goodbye.')
      setTimeout(() => { window.location.href = '/' }, 1500)
    } catch {
      toast.error('Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  async function handleWithdrawConsent(category: string) {
    setWithdrawing(category)
    try {
      await api.patch('/user/consent/withdraw', { category })
      setConsents(prev => prev.map(c => c.key === category ? { ...c, given: false } : c))
      toast.success('Consent withdrawn. Associated data cleared.')
    } catch {
      toast.error('Failed to withdraw consent')
    } finally {
      setWithdrawing(null)
    }
  }

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/settings')} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Shield className="w-5 h-5 text-amber-400" />
          <h1 className="text-lg font-semibold">Privacy & Data</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Visibility */}
        <section className="animate-slide-up">
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Visibility</h2>
          <div className="rounded-2xl glass p-4 divide-y divide-border/30">
            <Toggle checked={showOnlineStatus} onChange={setShowOnlineStatus} label="Show online status" description="Let others see when you're active" icon={Eye} />
            <Toggle checked={showReadReceipts} onChange={setShowReadReceipts} label="Read receipts" description="Let senders know you've read their message" icon={showReadReceipts ? Eye : EyeOff} />
            <Toggle checked={showLastSeen} onChange={setShowLastSeen} label="Last seen" description="Show when you were last active" icon={Clock} />
            <Toggle checked={showLocation} onChange={setShowLocation} label="Share general location" description="Show your city/region on your profile" icon={MapPin} />
          </div>
        </section>

        {/* Profile */}
        <section className="animate-slide-up" style={{ animationDelay: '60ms' }}>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Profile</h2>
          <div className="rounded-2xl glass p-4 divide-y divide-border/30">
            <Toggle checked={profileVisible} onChange={setProfileVisible} label="Discoverable profile" description="Allow others to find you in discovery" icon={profileVisible ? Eye : EyeOff} />
            <Toggle checked={allowStrangerMessages} onChange={setAllowStrangerMessages} label="Messages from non-contacts" description="Allow people you haven't connected with to message you" icon={UserX} />
          </div>
        </section>

        {/* Consent Management */}
        <section className="animate-slide-up" style={{ animationDelay: '120ms' }}>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Your Consent</h2>
          <div className="rounded-2xl glass overflow-hidden">
            <button onClick={() => setShowConsents(!showConsents)} className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="w-4 h-4 text-primary" /></div>
                <div className="text-left">
                  <span className="text-sm font-medium">Manage data consent</span>
                  <p className="text-xs text-muted-foreground">View and withdraw consent for optional data processing</p>
                </div>
              </div>
              {showConsents ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {showConsents && (
              <div className="border-t border-border/30 p-4 space-y-3 animate-fade-in">
                {consentsLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
                ) : consents.map(c => (
                  <div key={c.key} className="rounded-xl glass p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <c.icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-semibold">{c.label}</span>
                      </div>
                      <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full',
                        c.given ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted/30 text-muted-foreground')}>
                        {c.given ? 'Active' : 'Not given'}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{c.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground/60">Basis: {c.basis.replace(/_/g, ' ')}</span>
                      {c.withdrawable && c.given ? (
                        <button onClick={() => handleWithdrawConsent(c.key)} disabled={withdrawing === c.key}
                          className="text-[10px] text-red-400 hover:text-red-300 font-medium disabled:opacity-50">
                          {withdrawing === c.key ? 'Withdrawing...' : 'Withdraw consent'}
                        </button>
                      ) : !c.withdrawable ? (
                        <span className="text-[9px] text-muted-foreground/40">Required for service / safeguarding</span>
                      ) : null}
                    </div>
                  </div>
                ))}
                <p className="text-[9px] text-muted-foreground/50 text-center pt-1">
                  Withdrawing consent clears all associated data immediately and cannot be undone.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Data Rights */}
        <section className="animate-slide-up" style={{ animationDelay: '180ms' }}>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Your Data Rights</h2>
          <div className="rounded-2xl glass overflow-hidden divide-y divide-border/30">
            {/* Data export */}
            <button onClick={handleExport} disabled={exporting} className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 transition-all text-left disabled:opacity-50">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                {exporting ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin" /> : <Download className="w-4 h-4 text-blue-400" />}
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">Download my data</span>
                <p className="text-xs text-muted-foreground mt-0.5">Get a JSON export of all your personal data (Art. 15 & 20 GDPR)</p>
              </div>
            </button>

            {/* Blocked users */}
            <button className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 transition-all text-left">
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center"><Lock className="w-4 h-4 text-muted-foreground" /></div>
              <div className="flex-1">
                <span className="text-sm font-medium">Blocked users</span>
                <p className="text-xs text-muted-foreground mt-0.5">Manage your block list</p>
              </div>
            </button>

            {/* Delete account */}
            <button onClick={() => setShowDeleteConfirm(!showDeleteConfirm)} className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 transition-all text-left group">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center"><Trash2 className="w-4 h-4 text-destructive/70" /></div>
              <div className="flex-1">
                <span className="text-sm font-medium text-destructive/80">Delete account</span>
                <p className="text-xs text-muted-foreground mt-0.5">Permanently delete your account and all data (Art. 17 GDPR)</p>
              </div>
            </button>
          </div>

          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <div className="mt-3 rounded-2xl bg-destructive/5 border border-destructive/20 p-4 space-y-3 animate-fade-in">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-destructive">This cannot be undone</p>
                  <p className="text-xs text-muted-foreground mt-1">Deleting your account will permanently remove:</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-0.5 list-disc list-inside">
                    <li>Your profile, messages, and community posts</li>
                    <li>Energy logs, masking data, and feedback</li>
                    <li>Safety alerts, supporter connections, and contracts</li>
                    <li>All conversations you are part of</li>
                  </ul>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Type <strong>DELETE</strong> to confirm:</label>
                <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="DELETE"
                  className="w-full px-3 py-2 rounded-xl bg-muted/30 text-sm font-mono placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-destructive/30" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                  className="flex-1 py-2 rounded-xl glass text-xs font-medium hover:bg-muted/40 transition-all">Cancel</button>
                <button onClick={handleDeleteAccount} disabled={deleteInput !== 'DELETE' || deleting}
                  className="flex-1 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-medium disabled:opacity-30 transition-all flex items-center justify-center gap-1">
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Delete permanently
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Legal info */}
        <section className="animate-slide-up" style={{ animationDelay: '240ms' }}>
          <div className="rounded-2xl glass p-4 space-y-2">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              NeuroChat processes your data in accordance with the UK GDPR and EU GDPR. Special category data (neurotype, health-related information) is processed under explicit consent (Article 9(2)(a)). Safety scanning operates under legitimate interest for safeguarding vulnerable users (Article 6(1)(f)).
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              You have the right to access, rectify, erase, restrict processing, data portability, and object to processing. To exercise any right, use the controls above or contact our Data Protection Officer.
            </p>
            <p className="text-[10px] text-primary/60 font-medium">
              DPO contact: dpo@neurochat.app (to be configured)
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
