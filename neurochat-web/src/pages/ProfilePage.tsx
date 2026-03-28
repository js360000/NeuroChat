import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Camera, Pencil, MapPin,
  Sparkles, Heart, Brain, Check, X, Loader2,
  Shield, Zap, Volume2, Sun, AlertTriangle, MessageCircle,
} from 'lucide-react'
import { profileApi } from '@/lib/api/profile'
import { MoodRing } from '@/components/MoodRing'
import { EnergyMeter } from '@/components/EnergyMeter'
import { cn, getInitials } from '@/lib/utils'
import { COMMUNICATION_STYLES, INTERESTS_LIST } from '@/types'
import { toast } from 'sonner'

// Chip select for multi-value fields
function ChipSelect({ options, selected, onToggle, editable, allowCustom }: {
  options: string[]; selected: string[]; onToggle: (v: string) => void; editable: boolean; allowCustom?: boolean
}) {
  const [custom, setCustom] = useState('')
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button key={opt} onClick={() => editable && onToggle(opt)} disabled={!editable}
            className={cn('px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all',
              selected.includes(opt) ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'bg-muted/30 text-muted-foreground',
              editable && !selected.includes(opt) && 'hover:bg-muted/50', !editable && 'cursor-default'
            )}>
            {selected.includes(opt) && <Check className="w-2.5 h-2.5 inline mr-0.5" />}{opt}
          </button>
        ))}
        {selected.filter(s => !options.includes(s)).map(s => (
          <button key={s} onClick={() => editable && onToggle(s)} disabled={!editable}
            className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-primary/10 text-primary ring-1 ring-primary/20">
            <Check className="w-2.5 h-2.5 inline mr-0.5" />{s}
            {editable && <X className="w-2.5 h-2.5 inline ml-0.5" />}
          </button>
        ))}
      </div>
      {editable && allowCustom && (
        <div className="flex gap-2">
          <input value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && custom.trim()) { onToggle(custom.trim()); setCustom('') } }}
            placeholder="Add your own..." className="flex-1 px-2.5 py-1 rounded-xl bg-muted/30 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/30" />
          <button onClick={() => { if (custom.trim()) { onToggle(custom.trim()); setCustom('') } }} className="px-2 py-1 rounded-xl bg-muted/30 text-[10px] text-muted-foreground hover:bg-muted/50">Add</button>
        </div>
      )}
    </div>
  )
}

const NEUROTYPE_OPTIONS = ['Autistic', 'ADHD', 'Dyslexic', 'Dyspraxic', 'OCD', 'Anxiety Disorder', 'C-PTSD', 'Bipolar', 'BPD', 'Sensory Processing Disorder', 'Questioning']
const TRIGGER_OPTIONS = ['Sudden loud noises', 'Bright lights', 'Strong smells', 'Crowded spaces', 'Unexpected touch', 'Ambiguous tone', 'Being rushed', 'Surprise calls', 'Sarcasm without tags', 'Conflict', 'Change of plans']
const ACCOMMODATION_OPTIONS = ['Extra processing time', 'Written over verbal', 'Tone tags', 'No surprise calls', 'Advance notice', 'Quiet breaks', 'Permission to stim', 'Content warnings', 'Direct communication', 'Patience with responses']
const GOAL_OPTIONS = ['Friendship', 'Deep conversation', 'Accountability buddy', 'Creative collaborator', 'Study partner', 'Gaming buddy', 'Someone who gets it', 'Mutual support']

export function ProfilePage() {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Basic
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [commStyle, setCommStyle] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [pronouns, setPronouns] = useState('')

  // Onboarding / extended
  const [neurotype, setNeurotype] = useState<string[]>([])
  const [triggers, setTriggers] = useState<string[]>([])
  const [accommodations, setAccommodations] = useState<string[]>([])
  const [goals, setGoals] = useState<string[]>([])
  const [sensory, setSensory] = useState<Record<string, number>>({ noise: 3, light: 3, crowds: 3, touch: 3, scents: 3 })

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    try {
      const data = await profileApi.getCurrent()
      const p = data.profile as any
      setName(p.name || '')
      setBio(p.bio || '')
      setLocation(p.location || '')
      setCommStyle(p.commStyle || '')
      setSelectedInterests(p.interests || [])
      setPronouns(p.pronouns || '')
      setNeurotype(p.neurotype || [])
      setTriggers(p.triggers || [])
      setAccommodations(p.accommodations || [])
      setGoals(p.connectionGoals || [])
      if (p.sensoryProfile && typeof p.sensoryProfile === 'object' && Object.keys(p.sensoryProfile).length > 0) {
        setSensory(p.sensoryProfile)
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function saveProfile() {
    setIsSaving(true)
    try {
      await profileApi.update({
        name, bio, location, commStyle, interests: selectedInterests, pronouns,
        neurotype, triggers, accommodations, connectionGoals: goals, sensoryProfile: sensory,
      } as any)
      setIsEditing(false)
      toast.success('Profile saved')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  function toggle(val: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(val) ? list.filter(v => v !== val) : [...list, val])
  }

  if (isLoading) {
    return <div className="min-h-screen bg-neural flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  }

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-lg font-semibold">Profile</h1>
          </div>
          <button onClick={() => isEditing ? saveProfile() : setIsEditing(true)} disabled={isSaving}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all', isEditing ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:text-foreground')}>
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isEditing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
            {isSaving ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center text-center animate-slide-up">
          <div className="relative mb-4">
            <MoodRing mood="positive" size="lg">
              <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-semibold">{getInitials(name)}</div>
            </MoodRing>
            {isEditing && (
              <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"><Camera className="w-3.5 h-3.5" /></button>
            )}
          </div>
          {isEditing ? (
            <input value={name} onChange={e => setName(e.target.value)} className="text-xl font-bold text-center bg-transparent border-b-2 border-primary/30 focus:border-primary outline-none pb-1 mb-1 w-48" />
          ) : <h2 className="text-xl font-bold">{name}</h2>}
          {isEditing ? (
            <input value={pronouns} onChange={e => setPronouns(e.target.value)} className="text-sm text-muted-foreground text-center bg-transparent border-b border-border/50 focus:border-primary/30 outline-none pb-0.5 w-24 mt-1" placeholder="pronouns" />
          ) : pronouns && <span className="text-sm text-muted-foreground">{pronouns}</span>}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <MapPin className="w-3 h-3" />
            {isEditing ? <input value={location} onChange={e => setLocation(e.target.value)} className="bg-transparent border-b border-border/50 focus:border-primary/30 outline-none text-xs" /> : <span>{location}</span>}
          </div>
        </div>

        {/* Energy */}
        <div className="rounded-2xl glass p-4 animate-slide-up" style={{ animationDelay: '40ms' }}>
          <div className="flex items-center gap-2 mb-3"><Heart className="w-4 h-4 text-primary" /><span className="text-sm font-medium">Social Energy</span></div>
          <EnergyMeter />
        </div>

        {/* Bio */}
        <div className="rounded-2xl glass p-4 animate-slide-up" style={{ animationDelay: '80ms' }}>
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">About me</h3>
          {isEditing ? <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={500} className="w-full text-sm bg-muted/30 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none" />
           : <p className="text-sm text-foreground/80 leading-relaxed">{bio || <span className="text-muted-foreground/50 italic">No bio yet</span>}</p>}
          {isEditing && <p className="text-[10px] text-muted-foreground mt-1 text-right">{bio.length}/500</p>}
        </div>

        {/* Neurotype */}
        <div className="rounded-2xl glass p-4 animate-slide-up" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center gap-2 mb-3"><Brain className="w-4 h-4 text-violet-400" /><h3 className="text-sm font-medium">Neurotype</h3></div>
          {neurotype.length === 0 && !isEditing ? <p className="text-xs text-muted-foreground/50 italic">Not set — edit to add</p>
           : <ChipSelect options={NEUROTYPE_OPTIONS} selected={neurotype} onToggle={v => toggle(v, neurotype, setNeurotype)} editable={isEditing} allowCustom />}
        </div>

        {/* Triggers */}
        <div className="rounded-2xl glass p-4 animate-slide-up" style={{ animationDelay: '160ms' }}>
          <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-amber-400" /><h3 className="text-sm font-medium">Known Triggers</h3></div>
          <p className="text-xs text-muted-foreground mb-2">Things that are hard for you — shared with contacts so they understand</p>
          {triggers.length === 0 && !isEditing ? <p className="text-xs text-muted-foreground/50 italic">None set</p>
           : <ChipSelect options={TRIGGER_OPTIONS} selected={triggers} onToggle={v => toggle(v, triggers, setTriggers)} editable={isEditing} allowCustom />}
        </div>

        {/* Accommodations */}
        <div className="rounded-2xl glass p-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2 mb-3"><Shield className="w-4 h-4 text-emerald-400" /><h3 className="text-sm font-medium">Accommodations I Need</h3></div>
          <p className="text-xs text-muted-foreground mb-2">What helps you communicate better</p>
          {accommodations.length === 0 && !isEditing ? <p className="text-xs text-muted-foreground/50 italic">None set</p>
           : <ChipSelect options={ACCOMMODATION_OPTIONS} selected={accommodations} onToggle={v => toggle(v, accommodations, setAccommodations)} editable={isEditing} allowCustom />}
        </div>

        {/* Sensory Profile */}
        <div className="rounded-2xl glass p-4 animate-slide-up" style={{ animationDelay: '240ms' }}>
          <div className="flex items-center gap-2 mb-3"><Zap className="w-4 h-4 text-cyan-400" /><h3 className="text-sm font-medium">Sensory Profile</h3></div>
          <p className="text-xs text-muted-foreground mb-3">1 = low sensitivity, 5 = high sensitivity</p>
          <div className="space-y-3">
            {[
              { key: 'noise', label: 'Noise', icon: Volume2, emoji: '🔊' },
              { key: 'light', label: 'Light', icon: Sun, emoji: '💡' },
              { key: 'crowds', label: 'Crowds', icon: Heart, emoji: '👥' },
              { key: 'touch', label: 'Touch', icon: Zap, emoji: '✋' },
              { key: 'scents', label: 'Scents', icon: Sparkles, emoji: '👃' },
            ].map(s => (
              <div key={s.key} className="flex items-center gap-3">
                <span className="text-xs w-20 shrink-0">{s.emoji} {s.label}</span>
                <div className="flex-1 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => isEditing && setSensory(p => ({ ...p, [s.key]: n }))} disabled={!isEditing}
                      className={cn('flex-1 h-7 rounded-lg text-[10px] font-medium transition-all',
                        (sensory[s.key] || 3) >= n
                          ? n <= 2 ? 'bg-emerald-500/20 text-emerald-400' : n <= 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                          : 'bg-muted/20 text-muted-foreground',
                        isEditing && 'hover:ring-1 hover:ring-primary/20',
                        !isEditing && 'cursor-default'
                      )}>{n}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connection Goals */}
        <div className="rounded-2xl glass p-4 animate-slide-up" style={{ animationDelay: '280ms' }}>
          <div className="flex items-center gap-2 mb-3"><MessageCircle className="w-4 h-4 text-pink-400" /><h3 className="text-sm font-medium">Connection Goals</h3></div>
          {goals.length === 0 && !isEditing ? <p className="text-xs text-muted-foreground/50 italic">Not set</p>
           : <ChipSelect options={GOAL_OPTIONS} selected={goals} onToggle={v => toggle(v, goals, setGoals)} editable={isEditing} allowCustom />}
        </div>

        {/* Communication Style */}
        <div className="rounded-2xl glass p-4 animate-slide-up" style={{ animationDelay: '320ms' }}>
          <div className="flex items-center gap-2 mb-3"><Brain className="w-4 h-4 text-secondary" /><h3 className="text-sm font-medium">Communication Style</h3></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {COMMUNICATION_STYLES.map(style => (
              <button key={style.id} onClick={() => isEditing && setCommStyle(style.id)} disabled={!isEditing}
                className={cn('p-3 rounded-xl text-left transition-all',
                  commStyle === style.id ? 'glass glow-sm ring-1 ring-primary/30' : 'bg-muted/20 hover:bg-muted/30',
                  !isEditing && 'cursor-default'
                )}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{style.emoji}</span><span className="text-xs font-medium">{style.label}</span>
                  {commStyle === style.id && <Check className="w-3 h-3 text-primary ml-auto" />}
                </div>
                <p className="text-[10px] text-muted-foreground">{style.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div className="rounded-2xl glass p-4 animate-slide-up" style={{ animationDelay: '360ms' }}>
          <div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-accent" /><h3 className="text-sm font-medium">Interests</h3></div>
          <ChipSelect options={INTERESTS_LIST} selected={selectedInterests} onToggle={v => toggle(v, selectedInterests, setSelectedInterests)} editable={isEditing} allowCustom />
        </div>
      </div>
    </div>
  )
}
