import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Users, Brain, Settings, BarChart3, AlertTriangle,
  Ban, Check, X, Search, Loader2, Key, Eye,
  RefreshCw, Plus, Zap,
} from 'lucide-react'
import { adminApi } from '@/lib/api/admin'
import { cn, formatTime } from '@/lib/utils'
import { toast } from 'sonner'

type Tab = 'overview' | 'users' | 'moderation' | 'ai' | 'config' | 'audit'

const TABS: { id: Tab; label: string; icon: typeof Shield }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'moderation', label: 'Moderation', icon: Shield },
  { id: 'ai', label: 'AI Config', icon: Brain },
  { id: 'config', label: 'Site Config', icon: Settings },
  { id: 'audit', label: 'Audit Log', icon: Eye },
]

// ═══════════════════════════════════════════
// Overview tab
// ═══════════════════════════════════════════

function OverviewTab() {
  const [stats, setStats] = useState<Record<string, number> | null>(null)

  useEffect(() => { adminApi.getStats().then(d => setStats(d.stats)).catch(() => {}) }, [])

  if (!stats) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400 bg-blue-500/10' },
    { label: 'Online Now', value: stats.onlineUsers, icon: Zap, color: 'text-emerald-400 bg-emerald-500/10' },
    { label: 'Messages Today', value: stats.messagesToday, icon: BarChart3, color: 'text-cyan-400 bg-cyan-500/10' },
    { label: 'Posts Today', value: stats.postsToday, icon: BarChart3, color: 'text-violet-400 bg-violet-500/10' },
    { label: 'Active Bans', value: stats.activeBans, icon: Ban, color: 'text-red-400 bg-red-500/10' },
    { label: 'Violations (24h)', value: stats.violationsLast24h, icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10' },
    { label: 'Total Messages', value: stats.totalMessages, icon: BarChart3, color: 'text-muted-foreground bg-muted/50' },
    { label: 'Total Posts', value: stats.totalPosts, icon: BarChart3, color: 'text-muted-foreground bg-muted/50' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <div key={c.label} className="rounded-xl glass p-4 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
          <div className="flex items-center gap-2 mb-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', c.color)}>
              <c.icon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold tabular-nums">{c.value}</p>
          <p className="text-[11px] text-muted-foreground">{c.label}</p>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════
// Users tab
// ═══════════════════════════════════════════

function UsersTab() {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [banModal, setBanModal] = useState<{ userId: string; name: string } | null>(null)
  const [banType, setBanType] = useState<'temporary' | 'permanent'>('temporary')
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState(48)

  async function loadUsers() {
    setIsLoading(true)
    try {
      const data = await adminApi.getUsers({ q: search || undefined })
      setUsers(data.users)
    } catch { toast.error('Failed to load users') }
    finally { setIsLoading(false) }
  }

  useEffect(() => { loadUsers() }, [])
  useEffect(() => { const t = setTimeout(loadUsers, 300); return () => clearTimeout(t) }, [search])

  async function handleBan() {
    if (!banModal) return
    try {
      await adminApi.banUser(banModal.userId, { type: banType, reason: banReason || undefined, durationHours: banType === 'temporary' ? banDuration : undefined })
      toast.success(`${banModal.name} has been banned`)
      setBanModal(null); setBanReason(''); loadUsers()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Ban failed') }
  }

  async function handleUnban(userId: string, name: string) {
    try {
      await adminApi.unbanUser(userId)
      toast.success(`${name} has been unbanned`)
      loadUsers()
    } catch { toast.error('Unban failed') }
  }

  async function toggleVerify(userId: string, current: boolean) {
    try {
      await adminApi.updateUser(userId, { verified: !current })
      loadUsers()
    } catch { toast.error('Update failed') }
  }

  async function setRole(userId: string, role: string) {
    try {
      await adminApi.updateUser(userId, { role })
      toast.success('Role updated')
      loadUsers()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Update failed') }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users by name or ID..."
          className="w-full pl-9 pr-4 py-2.5 bg-muted/40 glass rounded-xl text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-1">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl glass hover:bg-muted/20 transition-all">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/70 to-secondary/70 flex items-center justify-center text-white text-xs font-medium shrink-0">
                {u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">{u.name}</span>
                  {u.verified && <Check className="w-3 h-3 text-primary" />}
                  {u.role === 'admin' && <span className="text-[9px] px-1 py-0.5 rounded bg-primary/10 text-primary font-bold">ADMIN</span>}
                  {u.banStatus && <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/10 text-red-400 font-bold">{u.banStatus.toUpperCase()}</span>}
                </div>
                <p className="text-[10px] text-muted-foreground">{u.id} · {u.pronouns} · Joined {formatTime(u.joinedAt)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleVerify(u.id, u.verified)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors" title={u.verified ? 'Remove verification' : 'Verify'}>
                  <Check className={cn('w-3.5 h-3.5', u.verified ? 'text-primary' : 'text-muted-foreground/50')} />
                </button>
                <select value={u.role} onChange={e => setRole(u.id, e.target.value)}
                  className="text-[10px] bg-muted/30 rounded-lg px-1.5 py-1 focus:outline-none border-none">
                  <option value="user">User</option>
                  <option value="moderator">Mod</option>
                  <option value="admin">Admin</option>
                </select>
                {u.banStatus ? (
                  <button onClick={() => handleUnban(u.id, u.name)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors text-emerald-400" title="Unban">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                ) : u.role !== 'admin' ? (
                  <button onClick={() => setBanModal({ userId: u.id, name: u.name })} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-red-400/70 hover:text-red-400" title="Ban">
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ban modal */}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setBanModal(null)}>
          <div className="glass-heavy rounded-2xl p-6 max-w-sm w-full space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><Ban className="w-4 h-4 text-red-400" /> Ban {banModal.name}</h3>
              <button onClick={() => setBanModal(null)} className="p-1 rounded-lg hover:bg-muted/50"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex gap-2">
              {(['temporary', 'permanent'] as const).map(t => (
                <button key={t} onClick={() => setBanType(t)}
                  className={cn('flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all capitalize',
                    banType === t ? (t === 'permanent' ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20' : 'bg-primary/10 text-primary ring-1 ring-primary/20') : 'bg-muted/30 text-muted-foreground'
                  )}>
                  {t}
                </button>
              ))}
            </div>
            {banType === 'temporary' && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Duration (hours)</label>
                <input type="number" value={banDuration} onChange={e => setBanDuration(Number(e.target.value))} min={1} max={8760}
                  className="w-full px-3 py-2 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Reason (optional)</label>
              <textarea value={banReason} onChange={e => setBanReason(e.target.value)} rows={2}
                className="w-full px-3 py-2 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none" placeholder="Reason for ban..." />
            </div>
            <button onClick={handleBan}
              className="w-full px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all">
              Confirm Ban
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Moderation tab — keywords + violations
// ═══════════════════════════════════════════

function ModerationTab() {
  const [keywords, setKeywords] = useState<any[]>([])
  const [violations, setViolations] = useState<any[]>([])
  const [newKeyword, setNewKeyword] = useState('')
  const [newSeverity, setNewSeverity] = useState<'warn' | 'mute' | 'ban'>('warn')
  const [isLoading, setIsLoading] = useState(true)

  async function load() {
    setIsLoading(true)
    try {
      const [kw, viol] = await Promise.all([adminApi.getKeywords(), adminApi.getViolations()])
      setKeywords(kw.keywords); setViolations(viol.violations)
    } catch { toast.error('Failed to load moderation data') }
    finally { setIsLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function addKeyword() {
    if (!newKeyword.trim()) return
    try {
      await adminApi.addKeyword(newKeyword, newSeverity)
      setNewKeyword(''); toast.success('Keyword added'); load()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to add keyword') }
  }

  async function removeKeyword(id: string) {
    try { await adminApi.removeKeyword(id); toast.success('Keyword removed'); load() }
    catch { toast.error('Failed to remove') }
  }

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6">
      {/* Add keyword */}
      <div className="rounded-xl glass p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Flagged Keywords</h3>
        <div className="flex gap-2">
          <input value={newKeyword} onChange={e => setNewKeyword(e.target.value)} placeholder="Add keyword..."
            className="flex-1 px-3 py-2 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
            onKeyDown={e => e.key === 'Enter' && addKeyword()} />
          <select value={newSeverity} onChange={e => setNewSeverity(e.target.value as any)}
            className="px-2 py-2 rounded-xl bg-muted/40 glass text-xs focus:outline-none">
            <option value="warn">Warn</option>
            <option value="mute">Mute</option>
            <option value="ban">Auto-ban</option>
          </select>
          <button onClick={addKeyword} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {keywords.map(kw => (
            <span key={kw.id} className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium',
              kw.severity === 'ban' ? 'bg-red-500/10 text-red-400' : kw.severity === 'mute' ? 'bg-amber-500/10 text-amber-400' : 'bg-muted/50 text-muted-foreground'
            )}>
              {kw.keyword}
              <span className="text-[9px] opacity-60">({kw.severity})</span>
              <button onClick={() => removeKeyword(kw.id)} className="ml-0.5 hover:text-red-400"><X className="w-3 h-3" /></button>
            </span>
          ))}
          {keywords.length === 0 && <p className="text-xs text-muted-foreground">No keywords configured</p>}
        </div>
      </div>

      {/* Recent violations */}
      <div className="rounded-xl glass p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Eye className="w-4 h-4 text-violet-400" /> Recent Violations</h3>
        {violations.length === 0 ? (
          <p className="text-xs text-muted-foreground">No violations recorded</p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {violations.map(v => (
              <div key={v.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/20 text-xs">
                <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{v.userName}</span>
                  <span className="text-muted-foreground"> used </span>
                  <span className="font-mono text-red-400">"{v.keyword}"</span>
                  <span className="text-muted-foreground"> in {v.source}</span>
                  <p className="text-muted-foreground/60 truncate mt-0.5">{v.contentSnippet}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(v.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// AI Config tab
// ═══════════════════════════════════════════

function AIConfigTab() {
  const [config, setConfig] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    adminApi.getConfig().then(d => { setConfig(d.config); setIsLoading(false) }).catch(() => setIsLoading(false))
  }, [])

  async function save(updates: Record<string, any>) {
    setIsSaving(true)
    try {
      const data = await adminApi.updateConfig(updates)
      setConfig(data.config)
      toast.success('AI config saved')
    } catch { toast.error('Failed to save config') }
    finally { setIsSaving(false) }
  }

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>

  const provider = config['ai.provider'] || 'heuristic'
  const apiKey = config['ai.openai_api_key'] || ''
  const model = config['ai.model'] || 'gpt-5.4-mini'
  const enabled = config['ai.enabled'] !== false

  return (
    <div className="space-y-6">
      <div className="rounded-xl glass p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Brain className="w-4 h-4 text-pink-400" /> AI Provider</h3>
          {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
        </div>

        {/* Enable/disable */}
        <label className="flex items-center justify-between cursor-pointer">
          <div><span className="text-sm font-medium">AI Features Enabled</span><p className="text-xs text-muted-foreground">Turn off to disable all AI features site-wide</p></div>
          <button role="switch" aria-checked={enabled} onClick={() => save({ 'ai.enabled': !enabled })}
            className={cn('relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0', enabled ? 'bg-primary' : 'bg-muted')}>
            <span className={cn('block w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200', enabled ? 'translate-x-[22px]' : 'translate-x-[2px]')} />
          </button>
        </label>

        {/* Provider select */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Provider</label>
          <div className="flex gap-2">
            {[
              { id: 'heuristic', label: 'Heuristic (Built-in)', desc: 'Rule-based, no API key needed' },
              { id: 'openai', label: 'OpenAI GPT 5.4 Mini', desc: 'Requires API key' },
            ].map(p => (
              <button key={p.id} onClick={() => save({ 'ai.provider': p.id })}
                className={cn('flex-1 p-3 rounded-xl text-left transition-all',
                  provider === p.id ? 'glass glow-sm ring-1 ring-primary/30' : 'bg-muted/20 hover:bg-muted/30'
                )}>
                <span className="text-xs font-medium">{p.label}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* OpenAI settings */}
        {provider === 'openai' && (
          <div className="space-y-3 animate-fade-in">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">OpenAI API Key</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                <input type="password" value={apiKey}
                  onChange={e => setConfig(prev => ({ ...prev, 'ai.openai_api_key': e.target.value }))}
                  onBlur={() => save({ 'ai.openai_api_key': config['ai.openai_api_key'] })}
                  placeholder="sk-..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/40 glass text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Your key is stored in the database and used server-side only.</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Model</label>
              <select value={model} onChange={e => save({ 'ai.model': e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30">
                <option value="gpt-5.4-mini">GPT 5.4 Mini (recommended)</option>
                <option value="gpt-5.4-mini-2026-03-17">GPT 5.4 Mini (2026-03-17 snapshot)</option>
                <option value="gpt-5.4">GPT 5.4 (more capable, higher cost)</option>
              </select>
            </div>
          </div>
        )}

        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary font-medium">Fallback:</span> If OpenAI is selected but the API call fails (network error, invalid key, rate limit), all AI features automatically fall back to the built-in heuristic engine. Users won't see errors — they'll get heuristic responses instead.
          </p>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Site Config tab
// ═══════════════════════════════════════════

function SiteConfigTab() {
  const [config, setConfig] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    adminApi.getConfig().then(d => { setConfig(d.config); setIsLoading(false) }).catch(() => setIsLoading(false))
  }, [])

  async function save(updates: Record<string, any>) {
    try {
      const data = await adminApi.updateConfig(updates)
      setConfig(data.config)
      toast.success('Config saved')
    } catch { toast.error('Failed to save') }
  }

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>

  function Toggle({ configKey, label, description }: { configKey: string; label: string; description: string }) {
    const checked = config[configKey] !== false
    return (
      <label className="flex items-center justify-between py-3 cursor-pointer">
        <div><span className="text-sm font-medium">{label}</span><p className="text-xs text-muted-foreground mt-0.5">{description}</p></div>
        <button role="switch" aria-checked={checked} onClick={() => save({ [configKey]: !checked })}
          className={cn('relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0', checked ? 'bg-primary' : 'bg-muted')}>
          <span className={cn('block w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200', checked ? 'translate-x-[22px]' : 'translate-x-[2px]')} />
        </button>
      </label>
    )
  }

  return (
    <div className="space-y-6">
      {/* Site settings */}
      <div className="rounded-xl glass p-4 space-y-4">
        <h3 className="text-sm font-semibold">Site Settings</h3>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Site Name</label>
          <input value={config['site.name'] || 'NeuroChat'}
            onChange={e => setConfig(prev => ({ ...prev, 'site.name': e.target.value }))}
            onBlur={() => save({ 'site.name': config['site.name'] })}
            className="w-full px-3 py-2 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tagline</label>
          <input value={config['site.tagline'] || ''}
            onChange={e => setConfig(prev => ({ ...prev, 'site.tagline': e.target.value }))}
            onBlur={() => save({ 'site.tagline': config['site.tagline'] })}
            className="w-full px-3 py-2 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
        </div>
        <div className="divide-y divide-border/30">
          <Toggle configKey="site.maintenance_mode" label="Maintenance Mode" description="Show maintenance page to non-admin users" />
          <Toggle configKey="site.registration_open" label="Registration Open" description="Allow new user registrations" />
        </div>
      </div>

      {/* Auto-moderation */}
      <div className="rounded-xl glass p-4 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-amber-400" /> Auto-Moderation</h3>
        <Toggle configKey="moderation.auto_ban_enabled" label="Auto-ban Enabled" description="Automatically ban users who exceed the keyword violation threshold" />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Threshold</label>
            <input type="number" value={config['moderation.auto_ban_threshold'] || 5}
              onChange={e => save({ 'moderation.auto_ban_threshold': Number(e.target.value) })}
              className="w-full px-2 py-1.5 rounded-lg bg-muted/40 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Window (hrs)</label>
            <input type="number" value={config['moderation.auto_ban_window_hours'] || 24}
              onChange={e => save({ 'moderation.auto_ban_window_hours': Number(e.target.value) })}
              className="w-full px-2 py-1.5 rounded-lg bg-muted/40 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Ban duration (hrs)</label>
            <input type="number" value={config['moderation.auto_ban_duration_hours'] || 48}
              onChange={e => save({ 'moderation.auto_ban_duration_hours': Number(e.target.value) })}
              className="w-full px-2 py-1.5 rounded-lg bg-muted/40 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">When a user triggers {config['moderation.auto_ban_threshold'] || 5}+ keyword violations within {config['moderation.auto_ban_window_hours'] || 24} hours, they're automatically banned for {config['moderation.auto_ban_duration_hours'] || 48} hours.</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Audit Log tab
// ═══════════════════════════════════════════

function AuditLogTab() {
  const [entries, setEntries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    adminApi.getAuditLog(100).then(d => { setEntries(d.entries); setIsLoading(false) }).catch(() => setIsLoading(false))
  }, [])

  function refresh() {
    setIsLoading(true)
    adminApi.getAuditLog(100).then(d => { setEntries(d.entries); setIsLoading(false) })
  }

  const actionColors: Record<string, string> = {
    'user.ban': 'text-red-400 bg-red-500/10',
    'user.unban': 'text-emerald-400 bg-emerald-500/10',
    'user.autoban': 'text-orange-400 bg-orange-500/10',
    'user.update': 'text-blue-400 bg-blue-500/10',
    'config.update': 'text-violet-400 bg-violet-500/10',
    'keyword.add': 'text-amber-400 bg-amber-500/10',
    'keyword.remove': 'text-muted-foreground bg-muted/50',
    'post.delete': 'text-red-400 bg-red-500/10',
    'message.delete': 'text-red-400 bg-red-500/10',
  }

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Recent Activity</h3>
        <button onClick={refresh} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"><RefreshCw className="w-3.5 h-3.5 text-muted-foreground" /></button>
      </div>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">No audit entries yet</p>
      ) : (
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {entries.map(e => (
            <div key={e.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/10 text-xs">
              <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0', actionColors[e.action] || 'bg-muted/50 text-muted-foreground')}>
                {e.action}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground">by </span>
                <span className="font-medium">{e.adminName || e.adminUserId}</span>
                {e.targetUserId && <><span className="text-muted-foreground"> → </span><span className="font-mono text-primary/70">{e.targetUserId}</span></>}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(e.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Main Admin Page
// ═══════════════════════════════════════════

export function AdminPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Admin Panel</h1>
                <p className="text-[10px] text-muted-foreground">NeuroChat Management</p>
              </div>
            </div>
            <button onClick={() => navigate('/settings')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Back to Settings</button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0',
                  tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                )}>
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'moderation' && <ModerationTab />}
        {tab === 'ai' && <AIConfigTab />}
        {tab === 'config' && <SiteConfigTab />}
        {tab === 'audit' && <AuditLogTab />}
      </div>
    </div>
  )
}
