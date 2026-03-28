import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MessageSquare, Grid3X3, Type, Keyboard,
  Volume2, CheckCircle, Loader2, Shield, Accessibility,
  AlertTriangle, Info,
} from 'lucide-react'
import { profileApi } from '@/lib/api/profile'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const AAC_LEVELS = [
  {
    id: 'symbol' as const,
    label: 'Symbol-only',
    icon: Grid3X3,
    desc: 'Communicate using symbol grids organised by category. Ideal for users who prefer visual communication.',
    features: ['Large symbol buttons', 'Category navigation', 'Phrase banks', 'Text-to-speech preview', 'One-tap distress button'],
    touchSize: 'Extra large (72px+)',
    best: 'Pre-literate users or those who prefer visual-first communication',
  },
  {
    id: 'hybrid' as const,
    label: 'Hybrid',
    icon: Type,
    desc: 'Symbol grid plus a simplified keyboard with word prediction. The best of both worlds.',
    features: ['Symbol grid + keyboard toggle', 'Word prediction (6 suggestions)', 'Quick phrase banks', 'TTS preview', 'Simplified layout'],
    touchSize: 'Large (56px+)',
    best: 'Users with some literacy who benefit from visual support',
  },
  {
    id: 'text-assisted' as const,
    label: 'Text-assisted',
    icon: Keyboard,
    desc: 'Full keyboard with aggressive word prediction, quick replies, and tone tag suggestions.',
    features: ['Full keyboard', 'Smart word prediction (8 suggestions)', 'Context-aware quick replies', 'Tone tag hints', 'Speech-to-text option'],
    touchSize: 'Standard (44px+)',
    best: 'Literate users who type slowly or need scaffolding',
  },
]

export function AACSettingsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aacMode, setAacMode] = useState<'off' | 'on'>('off')
  const [aacLevel, setAacLevel] = useState<'symbol' | 'hybrid' | 'text-assisted'>('hybrid')
  const [ttsVoice, setTtsVoice] = useState('')
  const [ttsRate, setTtsRate] = useState(0.9)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    loadProfile()
    // Load TTS voices
    function loadVoices() {
      const voices = speechSynthesis.getVoices()
      if (voices.length) setAvailableVoices(voices)
    }
    loadVoices()
    speechSynthesis.onvoiceschanged = loadVoices
  }, [])

  async function loadProfile() {
    try {
      const data = await profileApi.getCurrent()
      const p = data.profile as any
      setAacMode(p.aacMode === 'on' ? 'on' : 'off')
      setAacLevel(p.aacLevel || 'hybrid')
    } catch { /* defaults */ }
    finally { setLoading(false) }
  }

  async function save() {
    setSaving(true)
    try {
      await profileApi.update({ aacMode, aacLevel } as any)
      toast.success('AAC settings saved')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  function testTTS() {
    const utterance = new SpeechSynthesisUtterance('Hello, I am using AAC mode in NeuroChat.')
    utterance.rate = ttsRate
    if (ttsVoice) {
      const voice = availableVoices.find(v => v.name === ttsVoice)
      if (voice) utterance.voice = voice
    }
    speechSynthesis.cancel()
    speechSynthesis.speak(utterance)
  }

  if (loading) return <div className="min-h-screen bg-neural flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <Accessibility className="w-5 h-5 text-primary" />
                AAC Mode
              </h1>
              <p className="text-[11px] text-muted-foreground">Augmentative & Alternative Communication</p>
            </div>
          </div>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Info banner */}
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-primary">Communication accessibility</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              AAC mode replaces the standard text input with symbol grids, phrase banks, and
              word prediction — making it easier to communicate at your own pace. You can switch
              between modes at any time.
            </p>
          </div>
        </div>

        {/* Enable/disable */}
        <div className="rounded-2xl glass p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-primary" />
              <div>
                <span className="text-sm font-semibold">Enable AAC Mode</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">Replace standard keyboard with accessible communication tools</p>
              </div>
            </div>
            <button role="switch" aria-checked={aacMode === 'on'} onClick={() => setAacMode(aacMode === 'on' ? 'off' : 'on')}
              className={cn('relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0',
                aacMode === 'on' ? 'bg-primary' : 'bg-muted')}>
              <span className={cn('block w-5.5 h-5.5 rounded-full bg-white shadow-md transition-transform duration-200',
                aacMode === 'on' ? 'translate-x-[24px]' : 'translate-x-[3px]',
                'w-[22px] h-[22px] mt-[2.5px]')} />
            </button>
          </div>
        </div>

        {/* Level selection */}
        {aacMode === 'on' && (
          <div className="space-y-3 animate-fade-in">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Communication Level</h2>
            <p className="text-xs text-muted-foreground">Choose the level that works best for you. You can change this at any time.</p>

            <div className="space-y-3">
              {AAC_LEVELS.map(level => {
                const Icon = level.icon
                const selected = aacLevel === level.id
                return (
                  <button key={level.id} onClick={() => setAacLevel(level.id)}
                    className={cn('w-full text-left rounded-2xl p-4 transition-all',
                      selected ? 'glass glow-sm ring-1 ring-primary/30' : 'glass hover:ring-1 hover:ring-primary/10')}>
                    <div className="flex items-start gap-3">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        selected ? 'bg-primary/20' : 'bg-muted/30')}>
                        <Icon className={cn('w-5 h-5', selected ? 'text-primary' : 'text-muted-foreground')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{level.label}</span>
                          {selected && <CheckCircle className="w-4 h-4 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{level.desc}</p>

                        {selected && (
                          <div className="mt-3 space-y-2 animate-fade-in">
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className="px-1.5 py-0.5 rounded bg-muted/30">Touch targets: {level.touchSize}</span>
                              <span className="px-1.5 py-0.5 rounded bg-muted/30">Best for: {level.best}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {level.features.map(f => (
                                <span key={f} className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-medium">
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* TTS settings */}
            <div className="rounded-2xl glass p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Text-to-Speech</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Voice</label>
                  <select value={ttsVoice} onChange={e => setTtsVoice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted/30 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30">
                    <option value="">System default</option>
                    {availableVoices.filter(v => v.lang.startsWith('en')).map(v => (
                      <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground">Speed</label>
                    <span className="text-xs text-primary font-medium tabular-nums">{ttsRate}x</span>
                  </div>
                  <input type="range" min={0.3} max={1.5} step={0.1} value={ttsRate} onChange={e => setTtsRate(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full bg-muted appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg" />
                  <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                    <span>Slower</span><span>Faster</span>
                  </div>
                </div>

                <button onClick={testTTS}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 hover:bg-muted/50 text-sm transition-colors">
                  <Volume2 className="w-4 h-4" />
                  Test voice
                </button>
              </div>
            </div>

            {/* Safety features */}
            <div className="rounded-2xl glass p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold">Safety Features (always on)</h3>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'One-tap distress button', desc: 'Always visible — alerts your trusted supporter' },
                  { label: 'Safety vocabulary', desc: '"Stop", "No", "Help", "Hurt", "Scared" — always accessible and never restricted' },
                  { label: 'Simplified reporting', desc: 'Report concerns with one tap using clear symbols' },
                  { label: 'Message read-aloud', desc: 'Hear incoming messages spoken aloud to aid comprehension' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-2 py-2 px-3 rounded-xl bg-emerald-500/5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-medium">{item.label}</span>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Important note */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-400">Important</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  AAC mode is designed to support communication, not restrict it. Safety vocabulary
                  (words to describe harm, set boundaries, and ask for help) is <strong>always available</strong> and
                  can never be removed. This is a safety feature, not a risk.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
