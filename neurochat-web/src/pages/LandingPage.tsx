import { useNavigate } from 'react-router-dom'
import {
  Brain, Shield, Sparkles, Heart, Accessibility, MessageCircle,
  Users, Zap, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const FEATURES = [
  { icon: Brain, title: 'AI-Powered Understanding', desc: 'Get real-time explanations of tone, intent, and social cues in every message. Never misread a conversation again.', color: 'text-primary bg-primary/10' },
  { icon: Shield, title: 'Safe by Design', desc: 'Content warnings, tone tags, and community guidelines built in from day one. Your wellbeing comes first.', color: 'text-emerald-400 bg-emerald-500/10' },
  { icon: Sparkles, title: 'Tone Tags', desc: 'Mark your messages as /j (joking), /gen (genuine), /srs (serious) and more. Remove the guesswork from text-based communication.', color: 'text-violet-400 bg-violet-500/10' },
  { icon: Heart, title: 'Energy Awareness', desc: "Track your social energy and set boundaries. We'll remind you to take breaks and respect your limits.", color: 'text-pink-400 bg-pink-500/10' },
  { icon: Accessibility, title: 'Accessibility First', desc: 'High contrast, dyslexia-friendly fonts, reduced motion, adjustable text — your experience, your way.', color: 'text-cyan-400 bg-cyan-500/10' },
  { icon: Users, title: 'Inclusive Community', desc: 'A chronological, algorithm-free feed. No engagement farming, no follower counts, no toxic incentives.', color: 'text-amber-400 bg-amber-500/10' },
]

const VALUES = [
  { emoji: '🤝', title: 'No algorithms', desc: 'Chronological feed. Your timeline is yours.' },
  { emoji: '🚫', title: 'No engagement metrics', desc: 'No follower counts. No viral incentives.' },
  { emoji: '💜', title: 'Neurodivergent-first', desc: 'Built by and for neurodivergent people.' },
  { emoji: '🛡️', title: 'Content warnings', desc: 'CW support and tone tags on every post.' },
  { emoji: '♿', title: 'Accessible always', desc: 'WCAG compliant. Customisable to your needs.' },
  { emoji: '🌱', title: 'No data selling', desc: 'Your data is yours. Always.' },
]

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-heavy border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm">NeuroChat</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/about')} className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block">About</button>
            <button onClick={() => navigate('/safety')} className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Safety</button>
            <button
              onClick={() => navigate('/messages')}
              className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:brightness-110 active:scale-95 transition-all"
            >
              Open App
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 bg-mesh">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6 animate-fade-in">
            <Sparkles className="w-3 h-3" />
            A calmer way to connect
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight animate-slide-up">
            Messaging designed for{' '}
            <span className="text-gradient">neurodivergent</span>{' '}
            minds
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
            NeuroChat gives you AI-powered social cue explanations, tone tags, energy tracking, and a safe community — all in a calm, accessible interface.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <button
              onClick={() => navigate('/messages')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium glow-primary hover:brightness-110 active:scale-95 transition-all"
            >
              Get started <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/about')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass text-sm font-medium hover:bg-muted/30 transition-all"
            >
              Learn more
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold">Built different, on purpose</h2>
            <p className="text-sm text-muted-foreground mt-2">Every feature designed to reduce cognitive load and increase understanding.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="p-5 rounded-2xl glass hover:glow-sm transition-all animate-slide-up group"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', f.color)}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Anti-X.com values */}
      <section className="py-16 px-4 bg-mesh">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold">The opposite of everything wrong with social media</h2>
            <p className="text-sm text-muted-foreground mt-2">We built NeuroChat to be the platform we wished existed.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {VALUES.map((v, i) => (
              <div
                key={v.title}
                className="flex items-start gap-3 p-4 rounded-xl glass animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="text-xl shrink-0">{v.emoji}</span>
                <div>
                  <h3 className="font-semibold text-sm">{v.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 animate-float">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Ready for a calmer internet?</h2>
          <p className="text-sm text-muted-foreground mt-2">Join a community that values clarity, kindness, and accessibility above all else.</p>
          <button
            onClick={() => navigate('/messages')}
            className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium glow-primary hover:brightness-110 active:scale-95 transition-all mx-auto"
          >
            <Zap className="w-4 h-4" />
            Start chatting
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Brain className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">NeuroChat — A calmer way to connect</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/about')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">About</button>
            <button onClick={() => navigate('/safety')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Safety</button>
            <button onClick={() => navigate('/accessibility')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Accessibility</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
