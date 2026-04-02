import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ThumbsUp, ThumbsDown, Send, Check, Sparkles,
  MessageCircle, Shield, Zap, Heart, Users, Brain, Palette,
  Accessibility, BookOpen, Map, Gamepad2, Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api/client'
import { toast } from 'sonner'

/* ── Aspect categories ── */
const ASPECTS = [
  { id: 'messaging', label: 'Messaging', icon: <MessageCircle className="w-4 h-4" />, color: 'text-blue-400 bg-blue-500/10' },
  { id: 'community', label: 'Community', icon: <Users className="w-4 h-4" />, color: 'text-violet-400 bg-violet-500/10' },
  { id: 'safety', label: 'Safety Features', icon: <Shield className="w-4 h-4" />, color: 'text-red-400 bg-red-500/10' },
  { id: 'energy', label: 'Energy Tracking', icon: <Zap className="w-4 h-4" />, color: 'text-amber-400 bg-amber-500/10' },
  { id: 'aac', label: 'AAC / Communication Assist', icon: <Accessibility className="w-4 h-4" />, color: 'text-emerald-400 bg-emerald-500/10' },
  { id: 'social-stories', label: 'Social Stories', icon: <BookOpen className="w-4 h-4" />, color: 'text-cyan-400 bg-cyan-500/10' },
  { id: 'social-coach', label: 'Social Coach', icon: <Brain className="w-4 h-4" />, color: 'text-pink-400 bg-pink-500/10' },
  { id: 'tone-translation', label: 'Tone Translation', icon: <Heart className="w-4 h-4" />, color: 'text-rose-400 bg-rose-500/10' },
  { id: 'discovery', label: 'Discover & Matching', icon: <Sparkles className="w-4 h-4" />, color: 'text-indigo-400 bg-indigo-500/10' },
  { id: 'together-rooms', label: 'Together Rooms', icon: <Users className="w-4 h-4" />, color: 'text-teal-400 bg-teal-500/10' },
  { id: 'venues', label: 'Sensory Venues', icon: <Map className="w-4 h-4" />, color: 'text-lime-400 bg-lime-500/10' },
  { id: 'stim-tools', label: 'Stim Tools', icon: <Gamepad2 className="w-4 h-4" />, color: 'text-orange-400 bg-orange-500/10' },
  { id: 'design', label: 'Look & Feel', icon: <Palette className="w-4 h-4" />, color: 'text-fuchsia-400 bg-fuchsia-500/10' },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, color: 'text-sky-400 bg-sky-500/10' },
  { id: 'onboarding', label: 'Onboarding', icon: <Sparkles className="w-4 h-4" />, color: 'text-yellow-400 bg-yellow-500/10' },
  { id: 'other', label: 'Something Else', icon: <MessageCircle className="w-4 h-4" />, color: 'text-muted-foreground bg-muted/50' },
]

type Step = 'aspect' | 'sentiment' | 'comment' | 'done'

export function FeedbackPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('aspect')
  const [selectedAspect, setSelectedAspect] = useState<string | null>(null)
  const [customAspect, setCustomAspect] = useState('')
  const [sentiment, setSentiment] = useState<'good' | 'better' | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function selectAspect(id: string) {
    setSelectedAspect(id)
    setStep('sentiment')
  }

  function selectSentiment(s: 'good' | 'better') {
    setSentiment(s)
    setStep('comment')
  }

  async function submit() {
    const aspect = selectedAspect === 'other' && customAspect.trim() ? customAspect.trim() : selectedAspect
    if (!aspect || !sentiment) return
    setSubmitting(true)
    try {
      await api.post('/feedback', { aspect, sentiment, comment: comment.trim() || null })
      setStep('done')
      toast.success('Thank you for your feedback!')
    } catch {
      toast.error('Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setStep('aspect')
    setSelectedAspect(null)
    setCustomAspect('')
    setSentiment(null)
    setComment('')
  }

  const aspectConfig = ASPECTS.find(a => a.id === selectedAspect)

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Heart className="w-5 h-5 text-pink-400" />
          <h1 className="text-lg font-semibold">Give Feedback</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Step 1: Pick an aspect */}
        {step === 'aspect' && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-base font-semibold">What would you like to give feedback on?</h2>
              <p className="text-xs text-muted-foreground mt-1">Pick the part of NeuroChat you'd like to talk about</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ASPECTS.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => selectAspect(a.id)}
                  className="flex items-center gap-2.5 p-3 rounded-xl glass hover:glow-sm transition-all text-left animate-slide-up active:scale-[0.98]"
                  style={{ animationDelay: `${i * 25}ms` }}
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', a.color)}>
                    {a.icon}
                  </div>
                  <span className="text-xs font-medium">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Good or could be better */}
        {step === 'sentiment' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3', aspectConfig?.color)}>
                {aspectConfig?.icon}
              </div>
              <h2 className="text-base font-semibold">{aspectConfig?.label}</h2>
              <p className="text-xs text-muted-foreground mt-1">How do you feel about this?</p>
            </div>

            {selectedAspect === 'other' && (
              <input value={customAspect} onChange={e => setCustomAspect(e.target.value)}
                placeholder="What aspect? e.g. Profile editing, Dark mode..."
                className="w-full px-4 py-3 rounded-xl bg-muted/30 glass text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30" />
            )}

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => selectSentiment('good')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl glass hover:glow-sm transition-all active:scale-[0.98] group">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ThumbsUp className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">This is good</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">I like how this works</p>
                </div>
              </button>
              <button onClick={() => selectSentiment('better')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl glass hover:glow-sm transition-all active:scale-[0.98] group">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ThumbsDown className="w-8 h-8 text-amber-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">Could be better</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">I have suggestions</p>
                </div>
              </button>
            </div>

            <button onClick={() => setStep('aspect')} className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-3 h-3 inline mr-1" /> Choose a different aspect
            </button>
          </div>
        )}

        {/* Step 3: Optional comment */}
        {step === 'comment' && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2',
                sentiment === 'good' ? 'bg-emerald-500/10' : 'bg-amber-500/10')}>
                {sentiment === 'good' ? <ThumbsUp className="w-5 h-5 text-emerald-400" /> : <ThumbsDown className="w-5 h-5 text-amber-400" />}
              </div>
              <h2 className="text-base font-semibold">
                {sentiment === 'good' ? 'What do you like about it?' : 'How could we improve it?'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Optional — skip if you prefer</p>
            </div>

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={sentiment === 'good'
                ? "Tell us what works well... (optional)"
                : "Tell us what could be better... (optional)"}
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl bg-muted/30 glass text-sm resize-none placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <p className="text-[10px] text-muted-foreground text-right">{comment.length}/500</p>

            <div className="flex gap-3">
              <button onClick={() => setStep('sentiment')}
                className="flex-1 py-3 rounded-xl glass text-sm font-medium hover:bg-muted/40 transition-all">
                Back
              </button>
              <button onClick={submit} disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium glow-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  : <><Send className="w-4 h-4" /> Submit</>}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Thank you */}
        {step === 'done' && (
          <div className="text-center py-12 space-y-4 animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold">Thank you!</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Your feedback helps us make NeuroChat better for everyone. We read every piece of feedback.
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <button onClick={reset}
                className="px-4 py-2 rounded-xl glass text-xs font-medium hover:bg-muted/40 transition-all">
                Give more feedback
              </button>
              <button onClick={() => navigate('/settings')}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:brightness-110 transition-all">
                Back to settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
