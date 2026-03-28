import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Heart, AlertTriangle, Ban, Flag, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

const GUIDELINES = [
  { icon: Heart, title: 'Be kind, always', desc: "Assume good intent. If someone's tone is unclear, ask — don't assume the worst. Use tone tags to help others understand you.", color: 'text-pink-400 bg-pink-500/10' },
  { icon: AlertTriangle, title: 'Use content warnings', desc: 'If your post discusses sensitive topics (mental health, trauma, spoilers), add a CW. This lets people choose when they engage.', color: 'text-amber-400 bg-amber-500/10' },
  { icon: Eye, title: 'Respect boundaries', desc: "If someone says they're low on energy or sets a boundary, honour it. No means no. Later means later. Silence means space.", color: 'text-cyan-400 bg-cyan-500/10' },
  { icon: Ban, title: 'Zero tolerance for hate', desc: 'Racism, sexism, ableism, homophobia, transphobia, and any form of bigotry will result in immediate removal. No warnings, no second chances.', color: 'text-red-400 bg-red-500/10' },
  { icon: Flag, title: 'Report, dont engage', desc: 'If you see something harmful, use the report button. Don\'t engage with trolls or bad actors — it only amplifies them.', color: 'text-violet-400 bg-violet-500/10' },
  { icon: Shield, title: 'Protect yourself', desc: 'Use energy meters, quiet hours, and content warnings. Take breaks. Block freely. Your wellbeing is more important than any conversation.', color: 'text-emerald-400 bg-emerald-500/10' },
]

export function SafetyPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-neural pb-16">
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Shield className="w-5 h-5 text-emerald-400" />
          <h1 className="text-lg font-semibold">Safety & Guidelines</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center animate-slide-up">
          <h2 className="text-xl font-bold">Community Guidelines</h2>
          <p className="text-sm text-muted-foreground mt-2">
            NeuroChat is a safe space. These guidelines exist to keep it that way.
          </p>
        </div>

        <div className="space-y-3">
          {GUIDELINES.map((g, i) => (
            <div
              key={g.title}
              className="rounded-2xl glass p-4 animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', g.color)}>
                  <g.icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{g.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">{g.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl glass p-5 text-center animate-fade-in">
          <p className="text-sm text-muted-foreground">
            Violating these guidelines may result in content removal, temporary suspension, or permanent ban.
            If you see something, <span className="text-primary font-medium">report it</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
