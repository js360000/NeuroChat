import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Hash, Sparkles, Clock, Eye, Send, Minimize2 } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { cn } from '@/lib/utils'

function Toggle({ checked, onChange, label, description, icon: Icon }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; icon?: typeof Hash
}) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <div className="flex items-center gap-3">
        {Icon && <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-muted-foreground" /></div>}
        <div><span className="text-sm font-medium">{label}</span>{description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}</div>
      </div>
      <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cn('relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0', checked ? 'bg-primary' : 'bg-muted')}>
        <span className={cn('block w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200', checked ? 'translate-x-[22px]' : 'translate-x-[2px]')} />
      </button>
    </label>
  )
}

export function ChatPrefsPage() {
  const navigate = useNavigate()
  const store = useChatStore()

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/settings')} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <h1 className="text-lg font-semibold">Chat Preferences</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Communication */}
        <section className="animate-slide-up">
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Communication</h2>
          <div className="rounded-2xl glass p-4 divide-y divide-border/30">
            <Toggle checked={store.showToneTags} onChange={store.setShowToneTags} label="Show tone tags" description="Display tone indicators on messages (/j, /gen, /srs)" icon={Hash} />
            <Toggle checked={store.smartReplies} onChange={store.setSmartReplies} label="Smart replies" description="AI-suggested quick reply options below messages" icon={Sparkles} />
            <Toggle checked={store.showTimestamps} onChange={store.setShowTimestamps} label="Timestamps" description="Show time on each message" icon={Clock} />
            <Toggle checked={store.showReadReceipts} onChange={store.setShowReadReceipts} label="Read receipts" description="Let senders know when you've read their message" icon={Eye} />
          </div>
        </section>

        {/* Input */}
        <section className="animate-slide-up" style={{ animationDelay: '80ms' }}>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Input</h2>
          <div className="rounded-2xl glass p-4 divide-y divide-border/30">
            <Toggle checked={store.sendWithEnter} onChange={store.setSendWithEnter} label="Send with Enter" description="Press Enter to send, Shift+Enter for new line" icon={Send} />
          </div>
        </section>

        {/* Display */}
        <section className="animate-slide-up" style={{ animationDelay: '160ms' }}>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Display</h2>
          <div className="rounded-2xl glass p-4 divide-y divide-border/30">
            <Toggle checked={store.messageAnimations} onChange={store.setMessageAnimations} label="Message animations" description="Smooth pop-in when new messages arrive" icon={Sparkles} />
            <Toggle checked={store.compactMode} onChange={store.setCompactMode} label="Compact mode" description="Reduce spacing between messages" icon={Minimize2} />
            <Toggle checked={store.showMoodIndicators} onChange={store.setShowMoodIndicators} label="Mood indicators" description="Coloured rings around avatars showing conversation mood" icon={Eye} />
          </div>
        </section>
      </div>
    </div>
  )
}
