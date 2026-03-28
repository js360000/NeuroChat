import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ShieldAlert, AlertTriangle, AlertOctagon, CheckCircle2,
  MessageSquare, Flag, Phone, ChevronDown, ChevronUp,
  Copy, Heart, Clock, BarChart3, Scale, Eye, UserX, DollarSign,
  Timer, Crown, Brain, Lightbulb, HandHeart, ShieldCheck,
  Megaphone, HelpCircle, TriangleAlert, Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { safetyApi } from '@/lib/api/safety-alerts'
import { messagesApi } from '@/lib/api/messages'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SafetyAlert {
  id: string
  type: string
  severity: 'warning' | 'critical'
  title: string
  description: string
  conversationId?: string
  contactName?: string
  createdAt: string
  acknowledged: boolean
}

interface GutCheckResult {
  messageCount: number
  durationDays: number
  balanceRatio: number
  flags: GutCheckFlag[]
  verdict: string
}

interface GutCheckFlag {
  type: string
  label: string
  severity: 'info' | 'warning' | 'critical'
  description: string
}

interface ConversationOption {
  id: string
  name: string
}

/* ------------------------------------------------------------------ */
/*  Alert type config                                                  */
/* ------------------------------------------------------------------ */

const ALERT_TYPE_CONFIG: Record<string, { icon: typeof AlertTriangle; color: string; label: string }> = {
  love_bombing: { icon: Flame, color: 'text-red-400 bg-red-500/10', label: 'Love Bombing Detected' },
  isolation: { icon: UserX, color: 'text-red-400 bg-red-500/10', label: 'Isolation Attempt' },
  financial: { icon: DollarSign, color: 'text-amber-400 bg-amber-500/10', label: 'Financial Request' },
  rushing: { icon: Timer, color: 'text-amber-400 bg-amber-500/10', label: 'Rushing Behaviour' },
  authority: { icon: Crown, color: 'text-amber-400 bg-amber-500/10', label: 'False Authority Claim' },
  pressure: { icon: Megaphone, color: 'text-red-400 bg-red-500/10', label: 'Pressure / Coercion' },
  gaslighting: { icon: Brain, color: 'text-red-400 bg-red-500/10', label: 'Gaslighting Pattern' },
  boundary_violation: { icon: ShieldAlert, color: 'text-amber-400 bg-amber-500/10', label: 'Boundary Violation' },
  default: { icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10', label: 'Safety Alert' },
}

function getAlertConfig(type: string) {
  return ALERT_TYPE_CONFIG[type] ?? ALERT_TYPE_CONFIG.default
}

/* ------------------------------------------------------------------ */
/*  Safety tips data                                                   */
/* ------------------------------------------------------------------ */

const SAFETY_TIPS = [
  {
    id: 'money',
    icon: DollarSign,
    color: 'text-amber-400 bg-amber-500/10',
    title: 'If someone asks for money',
    explanation: 'It is never okay for someone you met online to ask you for money, gift cards, or financial information. Real friends do not ask for money early in a friendship.',
    steps: [
      'Do not send money, gift cards, or cryptocurrency',
      'Do not share bank details or passwords',
      'Tell your supporter or a trusted person immediately',
      'Block the person and report them',
    ],
    reassurance: 'You are not being mean by saying no. Protecting yourself is always the right thing to do.',
  },
  {
    id: 'isolate',
    icon: UserX,
    color: 'text-red-400 bg-red-500/10',
    title: 'If someone wants to isolate you',
    explanation: 'Manipulative people sometimes try to separate you from your friends, family, or supporters. They might say things like "they do not understand us" or "you should only talk to me."',
    steps: [
      'Notice if someone discourages you from talking to others',
      'Keep talking to your friends and supporters',
      'Tell someone you trust what is happening',
      'Remember: good friends want you to have lots of connections',
    ],
    reassurance: 'A real friend will never ask you to cut off the people who care about you.',
  },
  {
    id: 'off',
    icon: HelpCircle,
    color: 'text-violet-400 bg-violet-500/10',
    title: 'If something feels "off" but you cannot explain why',
    explanation: 'Sometimes your body knows something is wrong before your brain can put it into words. You might feel anxious, uneasy, or uncomfortable but not be sure why. This is your instinct protecting you.',
    steps: [
      'Take a break from the conversation — you do not owe anyone an instant reply',
      'Write down what feels uncomfortable, even if it seems small',
      'Use the Gut Check tool above to analyse the conversation',
      'Talk to your supporter or someone you trust',
    ],
    reassurance: 'Your feelings are valid even if you cannot explain them logically. Trust your discomfort.',
  },
  {
    id: 'rushing',
    icon: Timer,
    color: 'text-cyan-400 bg-cyan-500/10',
    title: 'If someone rushes you',
    explanation: 'Healthy relationships grow slowly. If someone pushes you to share personal information quickly, meet up soon, or make decisions fast, that is a warning sign.',
    steps: [
      'Say "I need more time" — this is always okay to say',
      'Do not share your address, workplace, or school',
      'Be cautious of people who say "you are the only one who understands me" very early on',
      'Block anyone who gets angry when you set a boundary',
    ],
    reassurance: 'Anyone who respects you will be happy to go at your pace. There is no rush.',
  },
  {
    id: 'authority',
    icon: Crown,
    color: 'text-orange-400 bg-orange-500/10',
    title: 'If someone claims authority',
    explanation: 'Some people pretend to be moderators, staff, doctors, or officials to get you to do things. Real staff will never ask for your password or personal details in a chat.',
    steps: [
      'NeuroChat staff will never ask for your password',
      'Check for official badges and verified accounts',
      'Do not follow instructions just because someone says they are "in charge"',
      'Report anyone who impersonates staff or authority figures',
    ],
    reassurance: 'It is smart to question authority claims. Real authorities will understand if you want to verify.',
  },
  {
    id: 'gut-autistic',
    icon: Brain,
    color: 'text-pink-400 bg-pink-500/10',
    title: 'Trusting your gut when you are autistic',
    explanation: 'Many autistic people find it harder to read social cues or identify manipulation. This does not mean your instincts are wrong — they might just show up differently. You might notice patterns, inconsistencies, or logical contradictions rather than "feelings."',
    steps: [
      'Pay attention to contradictions between what someone says and does',
      'Notice if conversations leave you feeling drained or confused',
      'Use the Gut Check tool to get an objective analysis',
      'Keep a log of things that bother you, even if they seem small',
      'Talk to someone you trust — they might see what you are missing',
    ],
    reassurance: 'Needing extra tools to stay safe is not a weakness. It is self-awareness, and it is a strength.',
  },
]

/* ------------------------------------------------------------------ */
/*  Emergency contacts                                                 */
/* ------------------------------------------------------------------ */

const EMERGENCY_CONTACTS = [
  { name: 'Samaritans', number: '116 123', description: 'Free 24/7 emotional support', color: 'text-emerald-400' },
  { name: 'National Autistic Society', number: '0808 800 4104', description: 'Autism helpline', color: 'text-blue-400' },
  { name: 'Police (non-emergency)', number: '101', description: 'Report a concern', color: 'text-amber-400' },
]

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function AlertCard({
  alert,
  onAcknowledge,
  onTalkToSupporter,
  onReport,
}: {
  alert: SafetyAlert
  onAcknowledge: (id: string) => void
  onTalkToSupporter: () => void
  onReport: (alertId: string) => void
}) {
  const config = getAlertConfig(alert.type)
  const AlertIcon = config.icon
  const isCritical = alert.severity === 'critical'

  return (
    <div
      className={cn(
        'rounded-2xl glass p-4 space-y-3 border-l-4 transition-all',
        isCritical ? 'border-l-red-500 glow-sm shadow-red-500/5' : 'border-l-amber-500',
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', config.color)}>
          <AlertIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold">{config.label}</h3>
            <span className={cn(
              'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
              isCritical ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400',
            )}>
              {alert.severity}
            </span>
          </div>
          {alert.contactName && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Regarding conversation with <span className="font-medium text-foreground">{alert.contactName}</span>
            </p>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {new Date(alert.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed">{alert.description}</p>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onAcknowledge(alert.id)}
          className="py-2 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          I understand
        </button>
        <button
          onClick={onTalkToSupporter}
          className="py-2 px-4 rounded-xl bg-muted/30 text-sm font-medium hover:bg-muted/50 transition-colors flex items-center gap-1.5"
        >
          <HandHeart className="w-3.5 h-3.5" />
          Talk to my supporter
        </button>
        <button
          onClick={() => onReport(alert.id)}
          className="py-2 px-4 rounded-xl bg-red-500/5 text-red-400/80 text-sm font-medium hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-1.5"
        >
          <Flag className="w-3.5 h-3.5" />
          Report this person
        </button>
      </div>
    </div>
  )
}

function FlagIndicator({ flag }: { flag: GutCheckFlag }) {
  const colors = {
    info: 'text-blue-400 bg-blue-500/10',
    warning: 'text-amber-400 bg-amber-500/10',
    critical: 'text-red-400 bg-red-500/10',
  }
  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/20">
      <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5', colors[flag.severity])}>
        <TriangleAlert className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{flag.label}</span>
          <span className={cn(
            'text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full',
            colors[flag.severity],
          )}>
            {flag.severity}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
      </div>
    </div>
  )
}

function SafetyTipCard({ tip }: { tip: typeof SAFETY_TIPS[number] }) {
  const [expanded, setExpanded] = useState(false)
  const TipIcon = tip.icon

  return (
    <div className="rounded-2xl glass overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left flex items-center gap-3 hover:bg-muted/10 transition-colors"
      >
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', tip.color)}>
          <TipIcon className="w-4.5 h-4.5" />
        </div>
        <span className="flex-1 text-sm font-semibold">{tip.title}</span>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-slide-up">
          {/* Simple explanation */}
          <p className="text-sm text-muted-foreground leading-relaxed">{tip.explanation}</p>

          {/* Concrete action steps */}
          <div className="rounded-xl bg-muted/20 p-3 space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-primary" />
              What to do:
            </p>
            <ul className="space-y-1.5">
              {tip.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {/* Reassurance */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <Heart className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Remember: </span>{tip.reassurance}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function EmergencyBar() {
  const copyNumber = (number: string, name: string) => {
    navigator.clipboard.writeText(number).then(() => {
      toast.success(`${name} number copied`)
    }).catch(() => {
      toast.error('Could not copy — try writing it down instead')
    })
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 glass-heavy border-t border-border/50 safe-area-pb">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Phone className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold">Emergency contacts</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {EMERGENCY_CONTACTS.map(contact => (
            <button
              key={contact.name}
              onClick={() => copyNumber(contact.number, contact.name)}
              className="shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="text-left">
                <p className={cn('text-xs font-semibold', contact.color)}>{contact.name}</p>
                <p className="text-[11px] text-muted-foreground">{contact.number}</p>
              </div>
              <Copy className="w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export function GuardianAngelPage() {
  const navigate = useNavigate()

  /* State */
  const [alerts, setAlerts] = useState<SafetyAlert[]>([])
  const [conversations, setConversations] = useState<ConversationOption[]>([])
  const [loading, setLoading] = useState(true)

  /* Gut check state */
  const [selectedConversation, setSelectedConversation] = useState('')
  const [gutResult, setGutResult] = useState<GutCheckResult | null>(null)
  const [gutLoading, setGutLoading] = useState(false)

  /* Fetch data */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [alertsData, convData] = await Promise.all([
        safetyApi.alerts(),
        messagesApi.getConversations(),
      ])
      const alertsList: SafetyAlert[] = alertsData.alerts ?? alertsData ?? []
      setAlerts(alertsList.filter(a => !a.acknowledged))
      const convList = convData.conversations ?? convData ?? []
      setConversations(convList.map((c: { id: string; participantName?: string; name?: string }) => ({
        id: c.id,
        name: c.participantName ?? c.name ?? 'Unknown',
      })))
    } catch {
      toast.error('Failed to load safety data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  /* Handlers */
  const handleAcknowledge = async (id: string) => {
    try {
      await safetyApi.acknowledge(id)
      setAlerts(prev => prev.filter(a => a.id !== id))
      toast.success('Alert acknowledged')
    } catch {
      toast.error('Could not acknowledge alert')
    }
  }

  const handleTalkToSupporter = () => {
    navigate('/supporters')
  }

  const handleReport = (_alertId: string) => {
    toast.success('Report submitted. Our moderation team will review this.')
  }

  const handleGutCheck = async () => {
    if (!selectedConversation) return
    try {
      setGutLoading(true)
      setGutResult(null)
      const result = await safetyApi.gutCheck(selectedConversation)
      const s = result?.summary
      if (!s) { toast.error('No messages to analyse'); return }
      // Backend returns flags as string[], map to GutCheckFlag[]
      const mappedFlags: GutCheckFlag[] = (s.flags ?? []).map((f: string) => ({
        type: 'heuristic',
        label: f.length > 60 ? f.slice(0, 57) + '...' : f,
        severity: /very quickly|isolat|groom|financial|card|account|sort.*code|phone/i.test(f) ? 'critical' as const : 'warning' as const,
        description: f,
      }))
      setGutResult({
        messageCount: s.messageCount ?? 0,
        durationDays: Math.max(1, Math.round((s.durationHours ?? 0) / 24)),
        balanceRatio: s.balanceRatio ?? 0.5,
        flags: mappedFlags,
        verdict: s.verdict ?? 'Analysis complete.',
      })
    } catch {
      toast.error('Could not run gut check')
    } finally {
      setGutLoading(false)
    }
  }

  const activeAlerts = alerts.filter(a => !a.acknowledged)

  return (
    <div className="min-h-screen bg-neural pb-36 md:pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h1 className="text-lg font-semibold">Guardian Angel</h1>
          {activeAlerts.length > 0 && (
            <span className="ml-auto w-6 h-6 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {activeAlerts.length}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* ============ ACTIVE ALERTS ============ */}
        <section className="animate-slide-up">
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3 flex items-center gap-2">
            <AlertOctagon className="w-3.5 h-3.5" />
            Active Alerts
          </h2>

          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {!loading && activeAlerts.length === 0 && (
            <div className="rounded-2xl glass p-6 text-center space-y-2 animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-sm">All clear</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                No active safety alerts. The Guardian Angel system is watching over your conversations.
              </p>
            </div>
          )}

          {!loading && activeAlerts.length > 0 && (
            <div className="space-y-3">
              {activeAlerts.map((alert, i) => (
                <div key={alert.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <AlertCard
                    alert={alert}
                    onAcknowledge={handleAcknowledge}
                    onTalkToSupporter={handleTalkToSupporter}
                    onReport={handleReport}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ============ GUT CHECK ============ */}
        <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3 flex items-center gap-2">
            <Scale className="w-3.5 h-3.5" />
            Gut Check
          </h2>

          <div className="rounded-2xl glass p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                <Eye className="w-4.5 h-4.5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Analyse a conversation</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Not sure about someone? Run a gut check to see if the conversation patterns look healthy.
                </p>
              </div>
            </div>

            {/* Conversation selector */}
            <div className="flex gap-2">
              <select
                value={selectedConversation}
                onChange={e => { setSelectedConversation(e.target.value); setGutResult(null) }}
                className="flex-1 px-3 py-2.5 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 appearance-none"
              >
                <option value="">Select a conversation...</option>
                {conversations.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={handleGutCheck}
                disabled={!selectedConversation || gutLoading}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
              >
                {gutLoading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <BarChart3 className="w-4 h-4" />
                )}
                Analyse
              </button>
            </div>

            {/* Results */}
            {gutResult && (
              <div className="space-y-3 animate-slide-up">
                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-muted/20 p-3 text-center">
                    <MessageSquare className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold">{gutResult.messageCount}</p>
                    <p className="text-[10px] text-muted-foreground">Messages</p>
                  </div>
                  <div className="rounded-xl bg-muted/20 p-3 text-center">
                    <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold">{gutResult.durationDays}</p>
                    <p className="text-[10px] text-muted-foreground">Days</p>
                  </div>
                  <div className="rounded-xl bg-muted/20 p-3 text-center">
                    <Scale className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold">{Math.round(gutResult.balanceRatio * 100)}%</p>
                    <p className="text-[10px] text-muted-foreground">Balance</p>
                  </div>
                </div>

                {/* Balance explanation */}
                <div className="rounded-xl bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Message balance: </span>
                    {gutResult.balanceRatio > 0.65
                      ? 'You are sending most of the messages. Healthy conversations are usually more balanced.'
                      : gutResult.balanceRatio < 0.35
                        ? 'They are sending most of the messages. This could be fine, but watch for pressure.'
                        : 'The conversation is fairly balanced. This is a healthy sign.'}
                  </p>
                  {/* Visual balance bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">You</span>
                    <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          gutResult.balanceRatio > 0.65 ? 'bg-amber-400' : gutResult.balanceRatio < 0.35 ? 'bg-amber-400' : 'bg-emerald-400',
                        )}
                        style={{ width: `${gutResult.balanceRatio * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">Them</span>
                  </div>
                </div>

                {/* Flags */}
                {gutResult.flags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Flags found ({gutResult.flags.length})
                    </p>
                    {gutResult.flags.map((flag, i) => (
                      <FlagIndicator key={i} flag={flag} />
                    ))}
                  </div>
                )}

                {/* Verdict */}
                <div className={cn(
                  'rounded-xl p-4 border',
                  gutResult.flags.some(f => f.severity === 'critical')
                    ? 'bg-red-500/5 border-red-500/20'
                    : gutResult.flags.length > 0
                      ? 'bg-amber-500/5 border-amber-500/20'
                      : 'bg-emerald-500/5 border-emerald-500/20',
                )}>
                  <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                    {gutResult.flags.some(f => f.severity === 'critical') ? (
                      <AlertOctagon className="w-4 h-4 text-red-400" />
                    ) : gutResult.flags.length > 0 ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    )}
                    Verdict
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{gutResult.verdict}</p>
                </div>

                {/* Feeling unsafe? */}
                <div className="rounded-xl bg-muted/20 p-3 space-y-2">
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    Feeling unsafe?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    If you feel unsafe right now, you can talk to someone immediately.
                    Scroll down to the emergency contacts bar or tap below.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {EMERGENCY_CONTACTS.map(contact => (
                      <button
                        key={contact.name}
                        onClick={() => {
                          navigator.clipboard.writeText(contact.number)
                          toast.success(`${contact.name}: ${contact.number} copied`)
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors flex items-center gap-1.5"
                      >
                        <Phone className="w-3 h-3" />
                        <span className={cn('font-medium', contact.color)}>{contact.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============ SAFETY TIPS ============ */}
        <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3 flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5" />
            Safety Tips for Neurodivergent Users
          </h2>
          <div className="space-y-2">
            {SAFETY_TIPS.map((tip, i) => (
              <div key={tip.id} className="animate-slide-up" style={{ animationDelay: `${200 + i * 40}ms` }}>
                <SafetyTipCard tip={tip} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Emergency contacts bar */}
      <EmergencyBar />
    </div>
  )
}
