import { useState, useEffect } from 'react'
import { FileText, Check, Plus, Trash2, X, Handshake, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { contractsApi, type ContractRule, type CommunicationContract } from '@/lib/api/contracts'
import { toast } from 'sonner'

/* ------------------------------------------------------------------ */
/*  Preset rules — suggestions users can pick from                     */
/* ------------------------------------------------------------------ */

const PRESET_RULES: { text: string; icon: string }[] = [
  { text: 'Always use tone tags so we know how messages are meant', icon: '🏷️' },
  { text: "Don't expect replies within 2 hours — that's okay", icon: '⏰' },
  { text: "It's okay to end conversations abruptly without saying bye", icon: '👋' },
  { text: 'Please use simple/short sentences', icon: '📝' },
  { text: 'Let me know if you need a break — no explanation needed', icon: '⏸️' },
  { text: 'No voice messages unless I say I can receive them', icon: '🔇' },
  { text: 'Ask before sending images', icon: '📷' },
  { text: "Don't use sarcasm without a tone tag", icon: '🎭' },
  { text: 'Be direct — I prefer honesty over politeness', icon: '💬' },
  { text: 'Be gentle — I prefer soft language', icon: '🌸' },
  { text: "If I'm not replying, don't send multiple follow-ups", icon: '🔁' },
  { text: "It's okay to infodump — I welcome it", icon: '📚' },
  { text: 'Please warn me before changing topics', icon: '🔄' },
  { text: 'Emojis help me understand your tone', icon: '😊' },
  { text: 'No pressure to socialise when my energy is low', icon: '🔋' },
  { text: "I may take days to reply — it doesn't mean I don't care", icon: '💛' },
]

/* ------------------------------------------------------------------ */
/*  Contract Panel                                                     */
/* ------------------------------------------------------------------ */

interface ContractPanelProps {
  open: boolean
  onClose: () => void
  conversationId: string
  myUserId: string
  otherUserName: string
}

export function ContractPanel({ open, onClose, conversationId, myUserId, otherUserName }: ContractPanelProps) {
  const [contract, setContract] = useState<CommunicationContract | null>(null)
  const [rules, setRules] = useState<ContractRule[]>([])
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customText, setCustomText] = useState('')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    contractsApi.get(conversationId).then(d => {
      setContract(d.contract)
      setRules(d.contract?.rules || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [open, conversationId])

  function addPreset(preset: typeof PRESET_RULES[0]) {
    if (rules.some(r => r.text === preset.text)) return
    setRules(prev => [...prev, { id: `r-${Date.now()}-${Math.random()}`, text: preset.text, icon: preset.icon, enabled: true }])
  }

  function addCustom() {
    if (!customText.trim()) return
    setRules(prev => [...prev, { id: `r-${Date.now()}`, text: customText.trim(), icon: '📌', enabled: true }])
    setCustomText('')
  }

  function removeRule(id: string) {
    setRules(prev => prev.filter(r => r.id !== id))
  }

  function toggleRule(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  async function save() {
    setSaving(true)
    try {
      await contractsApi.save(conversationId, rules)
      toast.success('Communication contract saved!')
      setEditing(false)
      // Refresh
      const d = await contractsApi.get(conversationId)
      setContract(d.contract)
    } catch {
      toast.error('Failed to save contract')
    } finally {
      setSaving(false)
    }
  }

  async function accept() {
    if (!contract) return
    try {
      await contractsApi.accept(contract.id)
      toast.success('Contract accepted!')
      const d = await contractsApi.get(conversationId)
      setContract(d.contract)
      setRules(d.contract?.rules || [])
    } catch {
      toast.error('Failed to accept contract')
    }
  }

  if (!open) return null

  const iAccepted = contract?.acceptedBy?.includes(myUserId)
  const bothAccepted = contract && contract.acceptedBy.length >= 2
  const hasContract = contract && contract.rules.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-heavy rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-sm">Communication Contract</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : editing || !hasContract ? (
            /* ─── Editor ─── */
            <>
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  A communication contract is a mutual agreement between you and <strong className="text-foreground">{otherUserName}</strong> about how you'd like to communicate. Both of you can see and edit it.
                </p>
              </div>

              {/* Active rules */}
              {rules.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Our rules ({rules.length})</h3>
                  {rules.map(rule => (
                    <div key={rule.id} className="flex items-center gap-2 p-2 rounded-xl glass animate-fade-in">
                      <span className="text-sm">{rule.icon}</span>
                      <span className={cn('flex-1 text-xs', !rule.enabled && 'line-through text-muted-foreground/50')}>{rule.text}</span>
                      <button onClick={() => toggleRule(rule.id)} className={cn('w-5 h-5 rounded flex items-center justify-center transition-colors',
                        rule.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted/30 text-muted-foreground')}>
                        <Check className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeRule(rule.id)} className="w-5 h-5 rounded flex items-center justify-center bg-muted/30 text-muted-foreground hover:text-red-400 hover:bg-red-500/10">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Custom rule input */}
              <div className="flex gap-2">
                <input value={customText} onChange={e => setCustomText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustom()}
                  placeholder="Write your own rule..."
                  className="flex-1 px-3 py-2 rounded-xl bg-muted/30 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                <button onClick={addCustom} disabled={!customText.trim()}
                  className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Preset suggestions */}
              <div>
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Suggestions</h3>
                <div className="space-y-1">
                  {PRESET_RULES.filter(p => !rules.some(r => r.text === p.text)).map((preset, i) => (
                    <button key={i} onClick={() => addPreset(preset)}
                      className="w-full flex items-center gap-2 p-2 rounded-xl bg-muted/10 hover:bg-muted/30 text-left transition-colors">
                      <span className="text-sm">{preset.icon}</span>
                      <span className="flex-1 text-xs text-muted-foreground">{preset.text}</span>
                      <Plus className="w-3 h-3 text-primary/50" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Save */}
              <button onClick={save} disabled={saving || rules.length === 0}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium glow-sm hover:brightness-110 disabled:opacity-50 transition-all">
                {saving ? 'Saving...' : contract ? 'Update Contract' : 'Create Contract'}
              </button>
            </>
          ) : (
            /* ─── Viewer ─── */
            <>
              {/* Status */}
              <div className={cn('rounded-xl p-3 flex items-center gap-2',
                bothAccepted ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20')}>
                {bothAccepted ? <Check className="w-4 h-4 text-emerald-400" /> : <FileText className="w-4 h-4 text-amber-400" />}
                <p className="text-xs">
                  {bothAccepted ? 'Both parties have agreed to this contract'
                    : iAccepted ? `Waiting for ${otherUserName} to accept`
                    : 'You haven\'t accepted this contract yet'}
                </p>
              </div>

              {/* Rules display */}
              <div className="space-y-1.5">
                {rules.filter(r => r.enabled).map(rule => (
                  <div key={rule.id} className="flex items-center gap-2.5 p-2.5 rounded-xl glass">
                    <span className="text-sm">{rule.icon}</span>
                    <span className="flex-1 text-xs">{rule.text}</span>
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {!iAccepted && (
                  <button onClick={accept}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-all">
                    <Check className="w-3.5 h-3.5 inline mr-1" /> I agree
                  </button>
                )}
                <button onClick={() => setEditing(true)}
                  className="flex-1 py-2.5 rounded-xl glass text-xs font-medium hover:bg-muted/40 transition-all">
                  <Edit3 className="w-3.5 h-3.5 inline mr-1" /> Edit rules
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Compact badge for chat header */
export function ContractBadge({ conversationId }: { conversationId: string }) {
  const [hasContract, setHasContract] = useState(false)

  useEffect(() => {
    contractsApi.get(conversationId).then(d => setHasContract(!!d.contract && d.contract.rules.length > 0)).catch(() => {})
  }, [conversationId])

  if (!hasContract) return null

  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium text-emerald-400 bg-emerald-500/10" title="Communication contract active">
      <Handshake className="w-3 h-3" /> Contract
    </span>
  )
}
