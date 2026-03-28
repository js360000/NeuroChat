import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, MapPin, Calendar, Camera, MessageCircle,
  Shield, Sparkles, ChevronRight, ChevronLeft, Loader2,
  Brain, Zap, Volume2, Sun, Moon, Check,
} from 'lucide-react'
import { profileApi } from '@/lib/api/profile'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ═══════════════════════════════════════════
// Options data
// ═══════════════════════════════════════════

const STEPS = [
  { title: 'The essentials', required: true, icon: User },
  { title: 'About you', required: false, icon: Camera },
  { title: 'Your neurotype', required: false, icon: Brain },
  { title: 'Communication style', required: false, icon: MessageCircle },
  { title: 'Sensory profile', required: false, icon: Sparkles },
  { title: 'Safety & boundaries', required: false, icon: Shield },
]

const PRONOUN_OPTIONS = ['he/him', 'she/her', 'they/them', 'he/they', 'she/they', 'any pronouns', 'ask me']
const GENDER_OPTIONS = ['Man', 'Woman', 'Non-binary', 'Genderfluid', 'Agender', 'Prefer not to say']

const NEUROTYPE_OPTIONS = [
  'Autistic', 'ADHD', 'Dyslexic', 'Dyspraxic', 'Dyscalculic',
  'Tourette Syndrome', 'OCD', 'Bipolar', 'BPD', 'C-PTSD',
  'Anxiety Disorder', 'Depression', 'Sensory Processing Disorder',
  'Hyperlexia', 'Synesthesia', 'Self-diagnosing', 'Questioning',
]

const TRIGGER_OPTIONS = [
  'Sudden loud noises', 'Bright/flashing lights', 'Strong smells',
  'Crowded spaces', 'Unexpected touch', 'Eye contact pressure',
  'Ambiguous tone in text', 'Being rushed', 'Phone calls without warning',
  'Sarcasm without tone tags', 'Conflict or raised voices', 'Change of plans',
]

const ACCOMMODATION_OPTIONS = [
  'Extra processing time', 'Written over verbal', 'Tone tags on messages',
  'No surprise calls', 'Advance notice for plans', 'Low sensory environments',
  'Permission to stim', 'No pressure for eye contact', 'Quiet breaks during chat',
  'Content warnings', 'Direct communication', 'Patience with responses',
]

const INTEREST_OPTIONS = [
  'Art', 'Music', 'Gaming', 'Coding', 'Nature', 'Reading',
  'Cooking', 'Film', 'Fitness', 'Photography', 'Science', 'Travel',
  'Anime', 'Crafts', 'Pets', 'Writing', 'Psychology', 'Space',
  'History', 'Linguistics', 'Maths', 'Theatre', 'Fashion', 'Gardening',
]

const GOAL_OPTIONS = [
  'Friendship', 'Deep conversation', 'Accountability buddy',
  'Creative collaborator', 'Study partner', 'Gaming buddy',
  'Someone who gets it', 'Mutual support', 'Professional networking',
]

const PACE_OPTIONS = [
  { id: 'slow', label: 'Slow', desc: 'Take our time, no rush' },
  { id: 'balanced', label: 'Balanced', desc: 'Natural flow' },
  { id: 'fast', label: 'Fast', desc: 'Quick back-and-forth' },
]

const DIRECTNESS_OPTIONS = [
  { id: 'gentle', label: 'Gentle', desc: 'Soft, careful wording' },
  { id: 'direct', label: 'Direct', desc: 'Clear and to the point' },
]

// ═══════════════════════════════════════════
// Toggle chip component
// ═══════════════════════════════════════════

function ChipSelect({ options, selected, onToggle, allowCustom, customPlaceholder }: {
  options: string[]
  selected: string[]
  onToggle: (val: string) => void
  allowCustom?: boolean
  customPlaceholder?: string
}) {
  const [custom, setCustom] = useState('')

  function addCustom() {
    if (!custom.trim()) return
    if (!selected.includes(custom.trim())) onToggle(custom.trim())
    setCustom('')
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button key={opt} onClick={() => onToggle(opt)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
              selected.includes(opt)
                ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
            )}>
            {selected.includes(opt) && <Check className="w-3 h-3 inline mr-1" />}
            {opt}
          </button>
        ))}
        {/* Show custom values not in options */}
        {selected.filter(s => !options.includes(s)).map((s) => (
          <button key={s} onClick={() => onToggle(s)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-primary/10 text-primary ring-1 ring-primary/20">
            <Check className="w-3 h-3 inline mr-1" />{s}
          </button>
        ))}
      </div>
      {allowCustom && (
        <div className="flex gap-2">
          <input value={custom} onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            placeholder={customPlaceholder || 'Add your own...'}
            className="flex-1 px-3 py-1.5 rounded-xl bg-muted/30 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
          <button onClick={addCustom} className="px-3 py-1.5 rounded-xl bg-muted/30 text-xs text-muted-foreground hover:bg-muted/50">Add</button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Toggle switch
// ═══════════════════════════════════════════

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
  return (
    <label className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/20 cursor-pointer">
      <div><span className="text-sm font-medium">{label}</span><p className="text-xs text-muted-foreground mt-0.5">{desc}</p></div>
      <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cn('relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0', checked ? 'bg-primary' : 'bg-muted')}>
        <span className={cn('block w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200', checked ? 'translate-x-[22px]' : 'translate-x-[2px]')} />
      </button>
    </label>
  )
}

// ═══════════════════════════════════════════
// Main onboarding page
// ═══════════════════════════════════════════

export function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Step 1 — Essentials
  const [displayName, setDisplayName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [location, setLocation] = useState('')

  // Step 2 — About
  const [bio, setBio] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [gender, setGender] = useState('')

  // Step 3 — Neurotype
  const [neurotype, setNeurotype] = useState<string[]>([])
  const [triggers, setTriggers] = useState<string[]>([])
  const [accommodations, setAccommodations] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [goals, setGoals] = useState<string[]>([])

  // Step 4 — Communication
  const [commPrefs, setCommPrefs] = useState({
    toneTags: true, aiExplanations: true, voiceMessages: false,
    responsePace: 'balanced', directness: 'gentle',
  })

  // Step 5 — Sensory
  const [sensory, setSensory] = useState({ noise: 3, light: 3, crowds: 3, touch: 3, scents: 3 })

  // Step 6 — Safety
  const [safety, setSafety] = useState({ boundariesSet: false, filtersEnabled: false, resourcesViewed: false })

  const toggle = (val: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(val) ? list.filter(v => v !== val) : [...list, val])
  }

  const essentialsValid = displayName.trim().length >= 2 && dateOfBirth && location.trim().length >= 2

  function handleNext() {
    if (step === 0 && !essentialsValid) { toast.error('Please fill in all required fields'); return }
    if (step === 0 && dateOfBirth) {
      const age = Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / 31557600000)
      if (age < 16) { toast.error('You must be at least 16 to use NeuroChat'); return }
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  async function handleFinish() {
    setSaving(true)
    try {
      await profileApi.update({
        name: displayName.trim(),
        bio: bio.trim() || undefined,
        location: location.trim(),
        pronouns: pronouns || undefined,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
        interests,
        commStyle: commPrefs.directness,
        neurotype,
        triggers,
        accommodations,
        connectionGoals: goals,
        sensoryProfile: sensory,
        communicationPrefs: commPrefs,
        safetyChecklist: safety,
        onboardingCompleted: 1,
        onboardingCompletedAt: new Date().toISOString(),
      } as any)
      toast.success('Welcome to NeuroChat!')
      navigate('/messages')
    } catch { toast.error('Failed to save. Please try again.') }
    finally { setSaving(false) }
  }

  const progress = ((step + 1) / STEPS.length) * 100
  const isLast = step === STEPS.length - 1
  const StepIcon = STEPS[step].icon

  return (
    <div className="min-h-screen bg-neural">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Welcome to NeuroChat</h1>
            <p className="text-sm text-muted-foreground mt-1">Let's set up your space — go at your own pace.</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
            {step + 1} / {STEPS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted mb-2 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[11px] text-muted-foreground mb-6">
          <StepIcon className="w-3 h-3 inline mr-1" />
          {STEPS[step].title}{step > 0 ? ' (optional — skip anytime)' : ' (required)'}
        </p>

        {/* Step content */}
        <div className="rounded-2xl glass p-6 space-y-5 animate-fade-in">

          {/* STEP 1: Essentials */}
          {step === 0 && (
            <>
              <div className="flex items-center gap-2 mb-2"><User className="w-5 h-5 text-primary" /><h2 className="font-semibold">The essentials</h2></div>
              <p className="text-xs text-muted-foreground">We need a few things to get started. Everything else is optional.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Display name <span className="text-red-400">*</span></label>
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={30} placeholder="What should people call you?"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><Calendar className="w-3 h-3" /> Date of birth <span className="text-red-400">*</span></label>
                  <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
                  <p className="text-[10px] text-muted-foreground mt-1">Only your age is shown — never your birthday.</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><MapPin className="w-3 h-3" /> Location <span className="text-red-400">*</span></label>
                  <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. London, Manchester"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
                </div>
              </div>
            </>
          )}

          {/* STEP 2: About You */}
          {step === 1 && (
            <>
              <div className="flex items-center gap-2 mb-2"><Camera className="w-5 h-5 text-primary" /><h2 className="font-semibold">About you</h2></div>
              <p className="text-xs text-muted-foreground">Help people get to know the real you.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={500}
                    placeholder="Tell people about yourself... your vibe, what makes you tick."
                    className="w-full px-3 py-2.5 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none" />
                  <p className="text-[10px] text-muted-foreground text-right">{bio.length}/500</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Pronouns</label>
                    <select value={pronouns} onChange={e => setPronouns(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30">
                      <option value="">Select...</option>
                      {PRONOUN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Gender</label>
                    <select value={gender} onChange={e => setGender(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30">
                      <option value="">Select...</option>
                      {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 3: Neurotype & Identity */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-2 mb-2"><Brain className="w-5 h-5 text-primary" /><h2 className="font-semibold">Your neurotype</h2></div>
              <p className="text-xs text-muted-foreground">This helps us match you with people who understand. Select all that apply.</p>
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">Neurotype / diagnosis</span><span className="text-[10px] text-muted-foreground">{neurotype.length} selected</span></div>
                  <ChipSelect options={NEUROTYPE_OPTIONS} selected={neurotype} onToggle={v => toggle(v, neurotype, setNeurotype)} allowCustom customPlaceholder="Add your own..." />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">Known triggers</span><span className="text-[10px] text-muted-foreground">{triggers.length} selected</span></div>
                  <ChipSelect options={TRIGGER_OPTIONS} selected={triggers} onToggle={v => toggle(v, triggers, setTriggers)} allowCustom customPlaceholder="Add a trigger..." />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">Accommodations I need</span><span className="text-[10px] text-muted-foreground">{accommodations.length} selected</span></div>
                  <ChipSelect options={ACCOMMODATION_OPTIONS} selected={accommodations} onToggle={v => toggle(v, accommodations, setAccommodations)} allowCustom customPlaceholder="Add accommodation..." />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">Interests</span><span className="text-[10px] text-muted-foreground">{interests.length} selected</span></div>
                  <ChipSelect options={INTEREST_OPTIONS} selected={interests} onToggle={v => toggle(v, interests, setInterests)} allowCustom customPlaceholder="Add interest..." />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">Connection goals</span><span className="text-[10px] text-muted-foreground">{goals.length} selected</span></div>
                  <ChipSelect options={GOAL_OPTIONS} selected={goals} onToggle={v => toggle(v, goals, setGoals)} allowCustom customPlaceholder="Add goal..." />
                </div>
              </div>
            </>
          )}

          {/* STEP 4: Communication Style */}
          {step === 3 && (
            <>
              <div className="flex items-center gap-2 mb-2"><MessageCircle className="w-5 h-5 text-primary" /><h2 className="font-semibold">Communication style</h2></div>
              <p className="text-xs text-muted-foreground">Shape how people interact with you.</p>
              <div className="space-y-3">
                <Toggle checked={commPrefs.toneTags} onChange={v => setCommPrefs(p => ({ ...p, toneTags: v }))} label="Tone tags encouraged" desc="Show tone indicators on messages (/j, /gen, /srs)" />
                <Toggle checked={commPrefs.aiExplanations} onChange={v => setCommPrefs(p => ({ ...p, aiExplanations: v }))} label="AI explanations" desc="Offer to explain tone and social cues" />
                <Toggle checked={commPrefs.voiceMessages} onChange={v => setCommPrefs(p => ({ ...p, voiceMessages: v }))} label="Voice messages" desc="Allow voice clips in conversations" />
              </div>
              <div className="space-y-3 mt-4">
                <div>
                  <span className="text-sm font-medium block mb-2">Response pace</span>
                  <div className="grid grid-cols-3 gap-2">
                    {PACE_OPTIONS.map(p => (
                      <button key={p.id} onClick={() => setCommPrefs(prev => ({ ...prev, responsePace: p.id }))}
                        className={cn('p-3 rounded-xl text-left transition-all', commPrefs.responsePace === p.id ? 'glass glow-sm ring-1 ring-primary/30' : 'bg-muted/20 hover:bg-muted/30')}>
                        <span className="text-xs font-medium">{p.label}</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium block mb-2">Directness</span>
                  <div className="grid grid-cols-2 gap-2">
                    {DIRECTNESS_OPTIONS.map(d => (
                      <button key={d.id} onClick={() => setCommPrefs(prev => ({ ...prev, directness: d.id }))}
                        className={cn('p-3 rounded-xl text-left transition-all', commPrefs.directness === d.id ? 'glass glow-sm ring-1 ring-primary/30' : 'bg-muted/20 hover:bg-muted/30')}>
                        <span className="text-xs font-medium">{d.label}</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{d.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 5: Sensory Profile */}
          {step === 4 && (
            <>
              <div className="flex items-center gap-2 mb-2"><Sparkles className="w-5 h-5 text-primary" /><h2 className="font-semibold">Sensory profile</h2></div>
              <p className="text-xs text-muted-foreground">Rate your sensitivity (1 = low, 5 = high). This helps others understand your needs.</p>
              <div className="space-y-4">
                {[
                  { key: 'noise' as const, label: 'Noise sensitivity', icon: Volume2, emoji: '🔊' },
                  { key: 'light' as const, label: 'Light sensitivity', icon: Sun, emoji: '💡' },
                  { key: 'crowds' as const, label: 'Crowd tolerance', icon: Brain, emoji: '👥' },
                  { key: 'touch' as const, label: 'Touch sensitivity', icon: Zap, emoji: '✋' },
                  { key: 'scents' as const, label: 'Scent sensitivity', icon: Moon, emoji: '👃' },
                ].map(s => (
                  <div key={s.key} className="flex items-center gap-3">
                    <span className="text-sm w-32 shrink-0">{s.emoji} {s.label}</span>
                    <div className="flex-1 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setSensory(p => ({ ...p, [s.key]: n }))}
                          className={cn('flex-1 h-8 rounded-lg text-xs font-medium transition-all',
                            sensory[s.key] >= n
                              ? n <= 2 ? 'bg-emerald-500/20 text-emerald-400' : n <= 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                              : 'bg-muted/20 text-muted-foreground hover:bg-muted/30'
                          )}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* STEP 6: Safety & Boundaries */}
          {step === 5 && (
            <>
              <div className="flex items-center gap-2 mb-2"><Shield className="w-5 h-5 text-primary" /><h2 className="font-semibold">Safety & boundaries</h2></div>
              <p className="text-xs text-muted-foreground">Quick checks to make your experience safer from day one.</p>
              <div className="space-y-3">
                <Toggle checked={safety.boundariesSet} onChange={v => setSafety(p => ({ ...p, boundariesSet: v }))} label="I've set my boundaries" desc="Your triggers and accommodations above act as your boundaries" />
                <Toggle checked={safety.filtersEnabled} onChange={v => setSafety(p => ({ ...p, filtersEnabled: v }))} label="Content filters enabled" desc="Hide messages containing flagged keywords" />
                <Toggle checked={safety.resourcesViewed} onChange={v => setSafety(p => ({ ...p, resourcesViewed: v }))} label="I know where to find support" desc="Seen the safety page and community guidelines" />
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 mt-3">
                <p className="text-xs text-muted-foreground">
                  <span className="text-primary font-medium">You're in control.</span> All of these settings can be changed at any time in your profile. Nothing is permanent.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-xl glass text-sm font-medium disabled:opacity-30 hover:bg-muted/30 transition-all">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && !isLast && (
              <button onClick={() => setStep(s => s + 1)} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
                Skip <ChevronRight className="w-3.5 h-3.5 inline" />
              </button>
            )}
            {!isLast ? (
              <button onClick={handleNext}
                className="flex items-center gap-1 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium glow-primary hover:brightness-110 active:scale-95 transition-all">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleFinish} disabled={saving}
                className="flex items-center gap-1 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium glow-primary hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Finish & enter NeuroChat'}
              </button>
            )}
          </div>
        </div>

        {/* Skip all link */}
        <div className="text-center mt-4">
          <button onClick={() => navigate('/messages')} className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
            Skip onboarding entirely — I'll set up later
          </button>
        </div>
      </div>
    </div>
  )
}
