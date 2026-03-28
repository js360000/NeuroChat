import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Brain, Lightbulb, Wand2, FileText, Sparkles } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { cn } from '@/lib/utils'

function Toggle({ checked, onChange, label, description, icon: Icon }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; icon?: typeof Brain
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

const AI_FEATURES = [
  { icon: Lightbulb, title: 'Message Explain', desc: 'Get AI-powered analysis of tone, intent, and social cues in messages. Tap the "Explain" button under any received message.', color: 'text-amber-400 bg-amber-500/10' },
  { icon: Wand2, title: 'Rephrase', desc: 'Get gentle and direct alternatives for your message before sending. Tap the wand icon next to the input field.', color: 'text-violet-400 bg-violet-500/10' },
  { icon: Sparkles, title: 'Smart Replies', desc: "AI-suggested quick reply chips that appear after receiving a message. Save mental energy when you're not sure how to respond.", color: 'text-cyan-400 bg-cyan-500/10' },
  { icon: FileText, title: 'Conversation Summary', desc: 'Get an AI summary of the conversation so far. Useful for catching up after a break. Find it in the chat header.', color: 'text-emerald-400 bg-emerald-500/10' },
]

export function AISettingsPage() {
  const navigate = useNavigate()
  const { autoExplain, setAutoExplain, smartReplies, setSmartReplies } = useChatStore()

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/settings')} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <Brain className="w-5 h-5 text-pink-400" />
          <h1 className="text-lg font-semibold">AI Features</h1>
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">New</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* How AI helps */}
        <section className="animate-slide-up">
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">How AI Helps</h2>
          <div className="space-y-3">
            {AI_FEATURES.map((f, i) => (
              <div key={f.title} className="rounded-2xl glass p-4 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-start gap-3">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', f.color)}>
                    <f.icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Toggles */}
        <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Settings</h2>
          <div className="rounded-2xl glass p-4 divide-y divide-border/30">
            <Toggle checked={smartReplies} onChange={setSmartReplies} label="Smart reply suggestions" description="Show AI-generated quick reply chips" icon={Sparkles} />
            <Toggle checked={autoExplain} onChange={setAutoExplain} label="Auto-explain" description="Automatically analyse incoming messages (uses more data)" icon={Lightbulb} />
          </div>
        </section>

        {/* Privacy note */}
        <div className="rounded-2xl glass p-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-primary/50 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-medium">About your privacy</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                AI features process your messages to provide analysis and suggestions. Message content is not stored by the AI service and is never used for training.
                All processing happens on-demand when you actively use a feature.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
