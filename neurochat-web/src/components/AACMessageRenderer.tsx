import { useMemo, useCallback } from 'react'
import { Volume2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AACSymbol } from '@/types'

/* ------------------------------------------------------------------ */
/*  AAC Preferences (stored in localStorage)                           */
/* ------------------------------------------------------------------ */

export interface AACDisplayPrefs {
  symbolSize: 'small' | 'medium' | 'large'
  showLabels: boolean
  autoRead: boolean
  translationStyle: 'symbols-only' | 'symbols-text' | 'text-symbols'
  customMappings: Record<string, { emoji: string; label: string }>
}

const DEFAULT_PREFS: AACDisplayPrefs = {
  symbolSize: 'medium',
  showLabels: true,
  autoRead: false,
  translationStyle: 'symbols-text',
  customMappings: {},
}

export function getAACPrefs(): AACDisplayPrefs {
  try {
    const stored = localStorage.getItem('neurochat_aac_prefs')
    return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS
  } catch { return DEFAULT_PREFS }
}

export function saveAACPrefs(prefs: AACDisplayPrefs) {
  localStorage.setItem('neurochat_aac_prefs', JSON.stringify(prefs))
}

/* ------------------------------------------------------------------ */
/*  Symbol vocabulary (mirrored from AACInput for translation)         */
/* ------------------------------------------------------------------ */

const SYMBOL_MAP: { emoji: string; label: string; keywords: string[] }[] = [
  // Greetings
  { emoji: '👋', label: 'Hello', keywords: ['hello', 'hi', 'hey', 'hiya'] },
  { emoji: '😊', label: 'Good morning', keywords: ['good morning', 'morning'] },
  { emoji: '🌙', label: 'Good night', keywords: ['good night', 'goodnight', 'night'] },
  { emoji: '🌟', label: 'Good afternoon', keywords: ['good afternoon', 'afternoon'] },
  { emoji: '🫡', label: 'Goodbye', keywords: ['goodbye', 'bye', 'see you', 'later'] },
  { emoji: '🙏', label: 'Thank you', keywords: ['thank you', 'thanks', 'cheers', 'ta'] },
  { emoji: '💐', label: 'Welcome', keywords: ['welcome', 'you\'re welcome'] },
  { emoji: '🎉', label: 'Congratulations', keywords: ['congratulations', 'congrats', 'well done'] },
  // Feelings
  { emoji: '😊', label: 'Happy', keywords: ['happy', 'glad', 'pleased', 'cheerful', 'joyful'] },
  { emoji: '😢', label: 'Sad', keywords: ['sad', 'upset', 'unhappy', 'down', 'crying'] },
  { emoji: '😠', label: 'Angry', keywords: ['angry', 'mad', 'furious', 'annoyed'] },
  { emoji: '😰', label: 'Anxious', keywords: ['anxious', 'nervous', 'worried', 'stress'] },
  { emoji: '😴', label: 'Tired', keywords: ['tired', 'sleepy', 'exhausted', 'fatigue'] },
  { emoji: '🤩', label: 'Excited', keywords: ['excited', 'thrilled', 'pumped'] },
  { emoji: '😐', label: 'Okay', keywords: ['okay', 'ok', 'alright', 'fine'] },
  { emoji: '🥰', label: 'Loved', keywords: ['loved', 'love', 'adore', 'care'] },
  { emoji: '😤', label: 'Frustrated', keywords: ['frustrated', 'annoyed', 'ugh'] },
  { emoji: '😌', label: 'Calm', keywords: ['calm', 'peaceful', 'relaxed', 'chill'] },
  { emoji: '🤔', label: 'Confused', keywords: ['confused', 'unsure', 'don\'t understand'] },
  { emoji: '😨', label: 'Scared', keywords: ['scared', 'afraid', 'frightened', 'fear'] },
  // Needs
  { emoji: '💧', label: 'Water', keywords: ['water', 'drink', 'thirsty'] },
  { emoji: '🍽️', label: 'Food', keywords: ['food', 'eat', 'hungry', 'meal', 'snack', 'lunch', 'dinner', 'breakfast'] },
  { emoji: '🚻', label: 'Bathroom', keywords: ['bathroom', 'toilet', 'loo', 'wee'] },
  { emoji: '💊', label: 'Medicine', keywords: ['medicine', 'medication', 'pills', 'meds'] },
  { emoji: '🛏️', label: 'Rest', keywords: ['rest', 'nap', 'lie down', 'bed'] },
  { emoji: '🤗', label: 'Hug', keywords: ['hug', 'cuddle', 'comfort'] },
  { emoji: '⏰', label: 'Break', keywords: ['break', 'pause', 'stop', 'timeout'] },
  { emoji: '🔇', label: 'Quiet', keywords: ['quiet', 'silence', 'shh', 'loud'] },
  { emoji: '🌡️', label: 'Too hot', keywords: ['hot', 'warm', 'boiling', 'sweating'] },
  { emoji: '🧊', label: 'Too cold', keywords: ['cold', 'freezing', 'chilly'] },
  // Responses
  { emoji: '✅', label: 'Yes', keywords: ['yes', 'yeah', 'yep', 'sure', 'absolutely'] },
  { emoji: '❌', label: 'No', keywords: ['no', 'nope', 'nah', 'don\'t'] },
  { emoji: '🤷', label: 'Maybe', keywords: ['maybe', 'perhaps', 'possibly', 'might'] },
  { emoji: '👍', label: 'I agree', keywords: ['agree', 'right', 'correct', 'exactly'] },
  { emoji: '👎', label: 'I disagree', keywords: ['disagree', 'wrong', 'incorrect'] },
  { emoji: '🔄', label: 'Please repeat', keywords: ['repeat', 'again', 'what', 'pardon'] },
  { emoji: '⏳', label: 'Wait', keywords: ['wait', 'moment', 'hold on', 'sec'] },
  { emoji: '💡', label: 'I have an idea', keywords: ['idea', 'thought', 'suggestion'] },
  { emoji: '🙅', label: 'Stop', keywords: ['stop', 'enough', 'no more'] },
  // Questions
  { emoji: '❓', label: 'What', keywords: ['what'] },
  { emoji: '📍', label: 'Where', keywords: ['where'] },
  { emoji: '🕐', label: 'When', keywords: ['when'] },
  { emoji: '🤔', label: 'Why', keywords: ['why'] },
  { emoji: '🛠️', label: 'How', keywords: ['how'] },
  { emoji: '👤', label: 'Who', keywords: ['who'] },
  // Actions
  { emoji: '🚶', label: 'Go', keywords: ['go', 'going', 'went', 'leave'] },
  { emoji: '👀', label: 'Look', keywords: ['look', 'see', 'watch'] },
  { emoji: '👂', label: 'Listen', keywords: ['listen', 'hear'] },
  { emoji: '🎮', label: 'Play', keywords: ['play', 'game', 'fun'] },
  { emoji: '🍴', label: 'Eat', keywords: ['eat', 'eating'] },
  { emoji: '💤', label: 'Sleep', keywords: ['sleep', 'sleeping', 'asleep'] },
  { emoji: '🗣️', label: 'Talk', keywords: ['talk', 'chat', 'speak', 'tell'] },
  { emoji: '📞', label: 'Call', keywords: ['call', 'ring', 'phone'] },
  // People
  { emoji: '👨', label: 'Dad', keywords: ['dad', 'daddy', 'father', 'papa'] },
  { emoji: '👩', label: 'Mum', keywords: ['mum', 'mom', 'mummy', 'mother', 'mama'] },
  { emoji: '👦', label: 'Brother', keywords: ['brother', 'bro'] },
  { emoji: '👧', label: 'Sister', keywords: ['sister', 'sis'] },
  { emoji: '👴', label: 'Grandpa', keywords: ['grandpa', 'grandfather', 'grandad'] },
  { emoji: '👵', label: 'Grandma', keywords: ['grandma', 'grandmother', 'nan', 'nana'] },
  { emoji: '👩‍⚕️', label: 'Doctor', keywords: ['doctor', 'dr', 'gp'] },
  { emoji: '👩‍🏫', label: 'Teacher', keywords: ['teacher', 'miss', 'sir'] },
  { emoji: '🧑‍🤝‍🧑', label: 'Friend', keywords: ['friend', 'mate', 'pal', 'buddy'] },
  // Safety
  { emoji: '🆘', label: 'Help me', keywords: ['help', 'need help', 'emergency'] },
  { emoji: '🤕', label: 'I am hurt', keywords: ['hurt', 'pain', 'ow', 'ouch', 'injured'] },
  { emoji: '😷', label: 'I feel sick', keywords: ['sick', 'ill', 'unwell', 'nauseous'] },
  { emoji: '🚨', label: 'Emergency', keywords: ['emergency', 'urgent', '999', '911'] },
  { emoji: '🏥', label: 'Hospital', keywords: ['hospital', 'a&e'] },
  { emoji: '📍', label: 'I am lost', keywords: ['lost', 'don\'t know where'] },
]

// Filler words to skip during translation
const FILLER_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'am', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'can', 'may', 'might', 'shall', 'must', 'to', 'of', 'in', 'for', 'on', 'with',
  'at', 'by', 'from', 'it', 'its', 'i', 'me', 'my', 'we', 'our', 'and', 'but',
  'or', 'so', 'if', 'just', 'very', 'really', 'quite', 'that', 'this', 'than',
])

/* ------------------------------------------------------------------ */
/*  Text-to-Symbol translation engine                                  */
/* ------------------------------------------------------------------ */

export function translateTextToSymbols(
  text: string,
  customMappings?: Record<string, { emoji: string; label: string }>
): { emoji: string; label: string; isText?: boolean }[] {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean)
  const result: { emoji: string; label: string; isText?: boolean }[] = []
  let i = 0

  while (i < words.length) {
    // Check custom mappings first
    const word = words[i]
    if (customMappings?.[word]) {
      result.push(customMappings[word])
      i++
      continue
    }

    // Try 3-word phrase match
    if (i + 2 < words.length) {
      const phrase3 = `${words[i]} ${words[i + 1]} ${words[i + 2]}`
      const match3 = SYMBOL_MAP.find(s => s.keywords.includes(phrase3))
      if (match3) { result.push({ emoji: match3.emoji, label: match3.label }); i += 3; continue }
    }

    // Try 2-word phrase match
    if (i + 1 < words.length) {
      const phrase2 = `${words[i]} ${words[i + 1]}`
      const match2 = SYMBOL_MAP.find(s => s.keywords.includes(phrase2))
      if (match2) { result.push({ emoji: match2.emoji, label: match2.label }); i += 2; continue }
    }

    // Skip filler words
    if (FILLER_WORDS.has(word)) { i++; continue }

    // Single word match
    const match1 = SYMBOL_MAP.find(s => s.keywords.includes(word))
    if (match1) {
      result.push({ emoji: match1.emoji, label: match1.label })
    } else {
      // No match — show as text chip
      result.push({ emoji: '', label: word, isText: true })
    }
    i++
  }

  return result
}

/* ------------------------------------------------------------------ */
/*  TTS helper                                                         */
/* ------------------------------------------------------------------ */

function speak(text: string) {
  if (!('speechSynthesis' in window) || !text.trim()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.85
  utterance.pitch = 1
  window.speechSynthesis.speak(utterance)
}

/* ------------------------------------------------------------------ */
/*  Renderer props                                                     */
/* ------------------------------------------------------------------ */

interface AACMessageRendererProps {
  content: string
  aacSymbols?: AACSymbol[]
  viewerHasAAC: boolean
  prefs?: AACDisplayPrefs
  isMe?: boolean
}

/* ------------------------------------------------------------------ */
/*  Symbol Card                                                        */
/* ------------------------------------------------------------------ */

function SymbolCard({
  emoji,
  label,
  isText,
  size,
  showLabel,
}: {
  emoji: string
  label: string
  isText?: boolean
  size: 'small' | 'medium' | 'large'
  showLabel: boolean
}) {
  const sizeClasses = {
    small: 'min-w-[40px] min-h-[40px] text-lg',
    medium: 'min-w-[56px] min-h-[56px] text-2xl',
    large: 'min-w-[72px] min-h-[72px] text-3xl',
  }

  if (isText) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-muted/30 text-xs text-muted-foreground">
        {label}
      </span>
    )
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-0.5 rounded-xl',
      'bg-white/5 border border-white/10',
      'transition-all hover:bg-primary/10 hover:border-primary/20',
      sizeClasses[size],
      'p-1.5'
    )}>
      <span role="img" aria-label={label}>{emoji}</span>
      {showLabel && <span className="text-[9px] font-medium text-muted-foreground leading-tight text-center">{label}</span>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Renderer                                                      */
/* ------------------------------------------------------------------ */

export function AACMessageRenderer({
  content,
  aacSymbols,
  viewerHasAAC,
  prefs: prefsProp,
  isMe,
}: AACMessageRendererProps) {
  const prefs = prefsProp || getAACPrefs()
  const hasSymbols = aacSymbols && aacSymbols.length > 0

  // Text-to-Symbol: incoming text message, viewer has AAC
  const translatedSymbols = useMemo(() => {
    if (!viewerHasAAC || hasSymbols) return null
    return translateTextToSymbols(content, prefs.customMappings)
  }, [content, viewerHasAAC, hasSymbols, prefs.customMappings])

  const handleSpeak = useCallback(() => {
    speak(content)
  }, [content])

  // Mode A: Symbol-to-Text (message has symbols, viewer doesn't have AAC)
  if (hasSymbols && !viewerHasAAC) {
    return (
      <div className="space-y-1.5">
        <p className="text-sm leading-relaxed">{content}</p>
        <div className="flex items-center gap-1 pt-1 border-t border-white/10">
          <Sparkles className="w-3 h-3 text-primary/50" />
          <span className="text-[10px] text-primary/60 font-medium">Sent via AAC</span>
          <div className="flex gap-0.5 ml-1">
            {aacSymbols.slice(0, 8).map((s, i) => (
              <span key={i} className="text-sm" title={s.label}>{s.emoji}</span>
            ))}
            {aacSymbols.length > 8 && <span className="text-[10px] text-muted-foreground">+{aacSymbols.length - 8}</span>}
          </div>
        </div>
      </div>
    )
  }

  // Mode B: Text-to-Symbol (text message, viewer has AAC)
  if (translatedSymbols && translatedSymbols.length > 0) {
    const style = prefs.translationStyle
    return (
      <div className="space-y-2">
        {(style === 'text-symbols') && (
          <p className={cn('text-sm leading-relaxed', isMe ? 'text-primary-foreground/80' : 'text-foreground/80')}>{content}</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {translatedSymbols.map((sym, i) => (
            <SymbolCard
              key={`${sym.label}-${i}`}
              emoji={sym.emoji}
              label={sym.label}
              isText={sym.isText}
              size={prefs.symbolSize}
              showLabel={prefs.showLabels}
            />
          ))}
        </div>

        {(style === 'symbols-text') && (
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">{content}</p>
        )}

        <button
          onClick={handleSpeak}
          className="flex items-center gap-1 text-[10px] text-primary/60 hover:text-primary transition-colors"
        >
          <Volume2 className="w-3 h-3" /> Read aloud
        </button>
      </div>
    )
  }

  // Mode C: Symbol-to-Symbol (message has symbols, viewer has AAC)
  if (hasSymbols && viewerHasAAC) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {aacSymbols.map((sym, i) => (
            <SymbolCard
              key={`${sym.label}-${i}`}
              emoji={sym.emoji}
              label={sym.label}
              size={prefs.symbolSize}
              showLabel={prefs.showLabels}
            />
          ))}
        </div>

        <button
          onClick={handleSpeak}
          className="flex items-center gap-1 text-[10px] text-primary/60 hover:text-primary transition-colors"
        >
          <Volume2 className="w-3 h-3" /> Read aloud
        </button>
      </div>
    )
  }

  // Default: plain text (no AAC involvement)
  return <p className="text-sm leading-relaxed">{content}</p>
}
