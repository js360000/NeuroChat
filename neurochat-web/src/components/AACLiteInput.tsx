import { useState, useMemo } from 'react'
import {
  Zap, Heart, MessageCircle, Battery,
  ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  AAC Lite — communication scaffolding for higher-functioning users  */
/*  who are at low capacity or have unique communication styles        */
/* ------------------------------------------------------------------ */

interface AACLiteInputProps {
  onSend: (message: string) => void
  onInsert: (text: string) => void
  currentDraft: string
  className?: string
}

/* ── Quick response chips ── */
const QUICK_RESPONSES = [
  { emoji: '👍', text: 'Sounds good!', category: 'agree' },
  { emoji: '👎', text: "I'd rather not", category: 'disagree' },
  { emoji: '🤔', text: 'Let me think about that', category: 'pause' },
  { emoji: '❤️', text: 'I appreciate you', category: 'warmth' },
  { emoji: '😊', text: "That made me smile", category: 'warmth' },
  { emoji: '🙏', text: 'Thank you so much', category: 'warmth' },
  { emoji: '⏰', text: "I'll get back to you later", category: 'pause' },
  { emoji: '💤', text: "I'm low on energy right now", category: 'boundary' },
  { emoji: '🔋', text: 'Need to recharge — talk soon', category: 'boundary' },
  { emoji: '🤗', text: 'Sending you a virtual hug', category: 'warmth' },
  { emoji: '😅', text: "Sorry, I'm struggling to find words right now", category: 'struggle' },
  { emoji: '🧠', text: 'Brain fog — bear with me', category: 'struggle' },
  { emoji: '🫠', text: 'Overwhelmed but still here', category: 'struggle' },
  { emoji: '✅', text: 'Yes!', category: 'agree' },
  { emoji: '❌', text: 'No, thanks', category: 'disagree' },
  { emoji: '💬', text: "Can we talk about something else?", category: 'redirect' },
]

/* ── Sentence starters ── */
const SENTENCE_STARTERS = [
  'I feel like...',
  'What I need right now is...',
  "I'm finding it hard to...",
  'Could you help me with...',
  "I'd love to talk about...",
  'Something that would help is...',
  "I'm not sure how to say this, but...",
  'Can I be honest? I...',
  'My brain is telling me...',
  "I don't have the words, but...",
  "What I'm trying to say is...",
  'It would mean a lot if...',
]

/* ── Feeling check-in ── */
const FEELINGS = [
  { emoji: '😊', label: 'Good', color: 'text-emerald-400 bg-emerald-500/10' },
  { emoji: '😐', label: 'Okay', color: 'text-amber-400 bg-amber-500/10' },
  { emoji: '😔', label: 'Low', color: 'text-blue-400 bg-blue-500/10' },
  { emoji: '😰', label: 'Anxious', color: 'text-violet-400 bg-violet-500/10' },
  { emoji: '😤', label: 'Frustrated', color: 'text-red-400 bg-red-500/10' },
  { emoji: '😴', label: 'Exhausted', color: 'text-cyan-400 bg-cyan-500/10' },
  { emoji: '🤯', label: 'Overwhelmed', color: 'text-pink-400 bg-pink-500/10' },
  { emoji: '🥰', label: 'Content', color: 'text-rose-400 bg-rose-500/10' },
]

/* ── Energy-aware suggestions ── */
function getEnergySuggestions(): string[] {
  try {
    const user = JSON.parse(localStorage.getItem('neurochat_user') || '{}')
    const energy = typeof user.energyStatus === 'string' ? JSON.parse(user.energyStatus) : user.energyStatus
    if (!energy) return []
    const avg = ((energy.social || 50) + (energy.sensory || 50) + (energy.cognitive || 50) + (energy.physical || 50)) / 4
    if (avg < 25) return [
      "I'm really low on energy right now",
      "Can we keep this short? I'm struggling",
      "I care about this conversation but need to rest soon",
    ]
    if (avg < 50) return [
      "I'm a bit tired, so I might be slow to reply",
      "Low spoons today — being direct to save energy",
    ]
    return []
  } catch { return [] }
}

type Tab = 'quick' | 'starters' | 'feelings'

export function AACLiteInput({ onSend, onInsert, className }: AACLiteInputProps) {
  const [activeTab, setActiveTab] = useState<Tab>('quick')
  const [expanded, setExpanded] = useState(true)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)

  const energySuggestions = useMemo(getEnergySuggestions, [])

  const filteredQuickResponses = useMemo(() => {
    if (!filterCategory) return QUICK_RESPONSES
    return QUICK_RESPONSES.filter(r => r.category === filterCategory)
  }, [filterCategory])

  const categories = [...new Set(QUICK_RESPONSES.map(r => r.category))]

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-primary/60" />
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Communication Assist</span>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="p-1 rounded text-muted-foreground hover:text-foreground">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <>
          {/* Tab bar */}
          <div className="flex gap-1">
            {([
              { id: 'quick' as Tab, icon: <Zap className="w-3 h-3" />, label: 'Quick Replies' },
              { id: 'starters' as Tab, icon: <MessageCircle className="w-3 h-3" />, label: 'Starters' },
              { id: 'feelings' as Tab, icon: <Heart className="w-3 h-3" />, label: 'How I Feel' },
            ]).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all',
                  activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:text-foreground')}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Energy suggestions banner */}
          {energySuggestions.length > 0 && (
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-2 space-y-1">
              <p className="text-[9px] text-amber-400 font-medium flex items-center gap-1"><Battery className="w-3 h-3" /> Low energy — try these:</p>
              <div className="flex flex-wrap gap-1">
                {energySuggestions.map((s, i) => (
                  <button key={i} onClick={() => onSend(s)}
                    className="px-2 py-1 rounded-lg bg-amber-500/10 text-[10px] text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Replies tab */}
          {activeTab === 'quick' && (
            <div className="space-y-2 animate-fade-in">
              {/* Category filters */}
              <div className="flex gap-1 flex-wrap">
                <button onClick={() => setFilterCategory(null)}
                  className={cn('px-2 py-0.5 rounded text-[9px] font-medium transition-all',
                    !filterCategory ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}>All</button>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                    className={cn('px-2 py-0.5 rounded text-[9px] font-medium capitalize transition-all',
                      filterCategory === cat ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}>{cat}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filteredQuickResponses.map((r, i) => (
                  <button key={i} onClick={() => onSend(r.text)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl glass text-xs hover:glow-sm active:scale-95 transition-all">
                    <span>{r.emoji}</span>
                    <span className="text-foreground/80">{r.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sentence Starters tab */}
          {activeTab === 'starters' && (
            <div className="space-y-1 animate-fade-in">
              <p className="text-[10px] text-muted-foreground">Tap to insert into your message:</p>
              <div className="flex flex-wrap gap-1.5">
                {SENTENCE_STARTERS.map((s, i) => (
                  <button key={i} onClick={() => onInsert(s)}
                    className="px-2.5 py-1.5 rounded-xl glass text-[11px] text-foreground/80 hover:glow-sm active:scale-95 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feelings tab */}
          {activeTab === 'feelings' && (
            <div className="space-y-2 animate-fade-in">
              <p className="text-[10px] text-muted-foreground">Share how you're feeling right now:</p>
              <div className="grid grid-cols-4 gap-1.5">
                {FEELINGS.map(f => (
                  <button key={f.label} onClick={() => onSend(`I'm feeling ${f.label.toLowerCase()} ${f.emoji}`)}
                    className={cn('flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95', f.color)}>
                    <span className="text-lg">{f.emoji}</span>
                    <span className="text-[10px] font-medium">{f.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground/60 text-center">You don't have to explain why. Just sharing is enough.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
