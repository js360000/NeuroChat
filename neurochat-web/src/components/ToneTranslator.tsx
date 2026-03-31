import { useState, useMemo } from 'react'
import { Repeat, ChevronDown, X, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Tone rewrite engine — client-side heuristic transformations        */
/* ------------------------------------------------------------------ */

type ToneStyle = 'gentle' | 'direct' | 'playful' | 'formal' | 'simple'

const TONE_LABELS: Record<ToneStyle, { label: string; emoji: string; description: string }> = {
  gentle: { label: 'Gentle', emoji: '🌸', description: 'Soft, warm, reassuring' },
  direct: { label: 'Direct', emoji: '🎯', description: 'Clear, concise, no filler' },
  playful: { label: 'Playful', emoji: '😄', description: 'Light, fun, emoji-friendly' },
  formal: { label: 'Formal', emoji: '📋', description: 'Professional, polite' },
  simple: { label: 'Simple', emoji: '📝', description: 'Short words, easy sentences' },
}

// Pattern-based tone transformations
const GENTLE_TRANSFORMS: [RegExp, string][] = [
  [/\byou need to\b/gi, 'it might help to'],
  [/\byou should\b/gi, 'you could maybe'],
  [/\byou must\b/gi, 'it would be good to'],
  [/\bno\b(?=\s|[.,!])/gi, "I'm not sure about that"],
  [/\bwhy did you\b/gi, 'I was wondering why'],
  [/\bstop\b/gi, 'could you pause'],
  [/\bthat's wrong\b/gi, "I see it a bit differently"],
  [/\byou forgot\b/gi, 'I think we may have missed'],
  [/\bwhatever\b/gi, "I'm flexible about that"],
  [/!{2,}/g, '!'],
  [/\bdon't\b/gi, "it's okay not to"],
]

const DIRECT_TRANSFORMS: [RegExp, string][] = [
  [/\bI was just wondering if maybe you could possibly\b/gi, 'Can you'],
  [/\bif that's okay with you\b/gi, ''],
  [/\bno worries if not\b/gi, ''],
  [/\bsorry to bother you but\b/gi, ''],
  [/\bI think maybe\b/gi, 'I think'],
  [/\bjust\b/gi, ''],
  [/\bkind of\b/gi, ''],
  [/\bsort of\b/gi, ''],
  [/\ba little bit\b/gi, ''],
  [/\bperhaps\b/gi, ''],
  [/\bmaybe\b/gi, ''],
]

const PLAYFUL_TRANSFORMS: [RegExp, string][] = [
  [/\bhello\b/gi, 'heyyy'],
  [/\bhi\b/gi, 'hii!'],
  [/\bgood\b/gi, 'awesome'],
  [/\bnice\b/gi, 'amazing'],
  [/\byes\b/gi, 'yesss!'],
  [/\bokay\b/gi, 'okie!'],
  [/\bthank you\b/gi, 'thank youuu'],
  [/\bthanks\b/gi, 'tyy!'],
  [/\.$/g, '! ✨'],
]

const FORMAL_TRANSFORMS: [RegExp, string][] = [
  [/\bhey\b/gi, 'Hello'],
  [/\bhi\b/gi, 'Hello'],
  [/\byeah\b/gi, 'Yes'],
  [/\bnah\b/gi, 'No'],
  [/\bthanks\b/gi, 'Thank you'],
  [/\bgonna\b/gi, 'going to'],
  [/\bwanna\b/gi, 'want to'],
  [/\bgotta\b/gi, 'have to'],
  [/\bkinda\b/gi, 'somewhat'],
  [/\bcool\b/gi, 'great'],
  [/\bawesome\b/gi, 'excellent'],
]

const SIMPLE_TRANSFORMS: [RegExp, string][] = [
  [/\bnevertheless\b/gi, 'but'],
  [/\bfurthermore\b/gi, 'also'],
  [/\bhowever\b/gi, 'but'],
  [/\btherefore\b/gi, 'so'],
  [/\bconsequently\b/gi, 'so'],
  [/\badditionally\b/gi, 'also'],
  [/\bregarding\b/gi, 'about'],
  [/\butilize\b/gi, 'use'],
  [/\bdemonstrate\b/gi, 'show'],
  [/\bapproximate(ly)?\b/gi, 'about'],
  [/\bsignificant\b/gi, 'big'],
  [/\binsufficient\b/gi, 'not enough'],
]

const TRANSFORM_MAP: Record<ToneStyle, [RegExp, string][]> = {
  gentle: GENTLE_TRANSFORMS,
  direct: DIRECT_TRANSFORMS,
  playful: PLAYFUL_TRANSFORMS,
  formal: FORMAL_TRANSFORMS,
  simple: SIMPLE_TRANSFORMS,
}

function translateTone(text: string, targetStyle: ToneStyle): string {
  let result = text
  for (const [pattern, replacement] of TRANSFORM_MAP[targetStyle]) {
    result = result.replace(pattern, replacement)
  }
  // Clean up double spaces
  result = result.replace(/\s{2,}/g, ' ').trim()
  return result
}

/* ------------------------------------------------------------------ */
/*  Tone Translator component — sits above the message input          */
/* ------------------------------------------------------------------ */

interface ToneTranslatorProps {
  message: string
  recipientStyle?: string // 'gentle' | 'direct' | 'playful' | etc from their profile
  onUseTranslation: (text: string) => void
  className?: string
}

export function ToneTranslator({ message, recipientStyle, onUseTranslation, className }: ToneTranslatorProps) {
  const [selectedTone, setSelectedTone] = useState<ToneStyle | null>(
    recipientStyle && recipientStyle in TONE_LABELS ? recipientStyle as ToneStyle : null
  )
  const [showPicker, setShowPicker] = useState(false)

  const translated = useMemo(() => {
    if (!selectedTone || !message.trim()) return null
    const result = translateTone(message, selectedTone)
    return result !== message ? result : null // Only show if something changed
  }, [message, selectedTone])

  if (!message.trim() || message.length < 5) return null

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Tone picker bar */}
      <div className="flex items-center gap-1.5">
        <button onClick={() => setShowPicker(!showPicker)}
          className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all',
            selectedTone ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30')}>
          <Repeat className="w-3 h-3" />
          {selectedTone ? `Translating to ${TONE_LABELS[selectedTone].label}` : 'Translate tone'}
          <ChevronDown className={cn('w-3 h-3 transition-transform', showPicker && 'rotate-180')} />
        </button>
        {selectedTone && (
          <button onClick={() => { setSelectedTone(null); setShowPicker(false) }}
            className="p-0.5 rounded text-muted-foreground/50 hover:text-foreground">
            <X className="w-3 h-3" />
          </button>
        )}
        {recipientStyle && recipientStyle in TONE_LABELS && !selectedTone && (
          <span className="text-[9px] text-muted-foreground/60">
            {(TONE_LABELS[recipientStyle as ToneStyle]?.emoji)} {recipientStyle} preferred
          </span>
        )}
      </div>

      {/* Tone options */}
      {showPicker && (
        <div className="flex gap-1 flex-wrap animate-fade-in">
          {(Object.entries(TONE_LABELS) as [ToneStyle, typeof TONE_LABELS[ToneStyle]][]).map(([key, config]) => (
            <button key={key} onClick={() => { setSelectedTone(key); setShowPicker(false) }}
              className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all',
                selectedTone === key ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:text-foreground')}>
              <span>{config.emoji}</span>
              <span>{config.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Translation preview */}
      {translated && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/10 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-primary/70 font-medium mb-1">
              How this sounds in {TONE_LABELS[selectedTone!].label.toLowerCase()} tone:
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed">{translated}</p>
          </div>
          <button onClick={() => onUseTranslation(translated)}
            className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium hover:brightness-110 active:scale-95 transition-all">
            Use <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}
