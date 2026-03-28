import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Brain, Heart, Users, Shield, Sparkles } from 'lucide-react'

export function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-neural pb-16">
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">About NeuroChat</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold">A calmer way to connect</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            NeuroChat was created by neurodivergent people, for neurodivergent people. We believe communication tools should adapt to you — not the other way around.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { icon: Heart, title: 'Why we exist', content: "Traditional messaging apps and social media weren't built with neurodivergent users in mind. Sarcasm gets misread. Tone is ambiguous. Social energy gets drained without warning. NeuroChat is our answer to all of that.", color: 'text-pink-400 bg-pink-500/10' },
            { icon: Sparkles, title: 'What makes us different', content: 'Every feature in NeuroChat serves a purpose: tone tags remove ambiguity, AI explanations decode social cues, energy meters protect your boundaries, and content warnings keep you safe. No engagement tricks, no algorithms, no data harvesting.', color: 'text-primary bg-primary/10' },
            { icon: Users, title: 'Our community', content: "We're building a space where being direct isn't rude, asking for clarification isn't awkward, and taking a break isn't lazy. Our community guidelines prioritise kindness, clarity, and mutual respect above all.", color: 'text-emerald-400 bg-emerald-500/10' },
            { icon: Shield, title: 'Our commitment', content: "We will never sell your data. We will never add algorithmic timelines. We will never gamify engagement. We will always prioritise your wellbeing over our growth metrics. That's a promise.", color: 'text-amber-400 bg-amber-500/10' },
          ].map((section, i) => (
            <div key={section.title} className="rounded-2xl glass p-5 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${section.color}`}>
                  <section.icon className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-semibold">{section.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
