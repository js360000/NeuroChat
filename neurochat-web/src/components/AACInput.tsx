import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  Send,
  Volume2,
  Trash2,
  AlertTriangle,
  Smile,
  Heart,
  Hand,
  MessageCircle,
  HelpCircle,
  Zap,
  Users,
  ShieldAlert,
  Target,
  ChevronLeft,
  Keyboard,
  Grid3X3,
  Type,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AACSymbolData {
  emoji: string
  label: string
}

interface AACInputProps {
  level: 'symbol' | 'hybrid' | 'text-assisted'
  onSend: (message: string, symbols?: AACSymbolData[]) => void
  className?: string
}

interface Symbol {
  emoji: string
  label: string
}

type CategoryId =
  | 'intent'
  | 'greetings'
  | 'feelings'
  | 'needs'
  | 'responses'
  | 'questions'
  | 'actions'
  | 'people'
  | 'safety'

interface Category {
  id: CategoryId
  label: string
  icon: React.ReactNode
  symbols: Symbol[]
}

/* ------------------------------------------------------------------ */
/*  Symbol data  (8-12 per category, 75 total)                        */
/* ------------------------------------------------------------------ */

const CATEGORIES: Category[] = [
  {
    id: 'intent',
    label: 'I want...',
    icon: <Target className="w-5 h-5" />,
    symbols: [
      { emoji: '🙋', label: 'I want' },
      { emoji: '🚫', label: "I don't want" },
      { emoji: '❤️', label: 'I like' },
      { emoji: '💔', label: "I don't like" },
      { emoji: '🙏', label: 'I need' },
      { emoji: '✋', label: "I don't need" },
      { emoji: '✅', label: 'I have' },
      { emoji: '❌', label: "I don't have" },
      { emoji: '💪', label: 'I can' },
      { emoji: '🤷', label: "I can't" },
      { emoji: '🎯', label: 'I will' },
      { emoji: '🔜', label: 'I am going to' },
      { emoji: '⭐', label: 'My favourite' },
      { emoji: '😣', label: "I don't feel good" },
    ],
  },
  {
    id: 'greetings',
    label: 'Greetings',
    icon: <Smile className="w-5 h-5" />,
    symbols: [
      { emoji: '👋', label: 'Hello' },
      { emoji: '🤝', label: 'Nice to meet you' },
      { emoji: '😊', label: 'Good morning' },
      { emoji: '🌙', label: 'Good night' },
      { emoji: '👍', label: 'How are you' },
      { emoji: '🫡', label: 'Goodbye' },
      { emoji: '🙏', label: 'Thank you' },
      { emoji: '💐', label: 'Welcome' },
      { emoji: '🎉', label: 'Congratulations' },
      { emoji: '🌟', label: 'Good afternoon' },
    ],
  },
  {
    id: 'feelings',
    label: 'Feelings',
    icon: <Heart className="w-5 h-5" />,
    symbols: [
      { emoji: '😊', label: 'Happy' },
      { emoji: '😢', label: 'Sad' },
      { emoji: '😠', label: 'Angry' },
      { emoji: '😰', label: 'Anxious' },
      { emoji: '😴', label: 'Tired' },
      { emoji: '🤩', label: 'Excited' },
      { emoji: '😐', label: 'Okay' },
      { emoji: '🥰', label: 'Loved' },
      { emoji: '😤', label: 'Frustrated' },
      { emoji: '😌', label: 'Calm' },
      { emoji: '🤔', label: 'Confused' },
      { emoji: '😨', label: 'Scared' },
    ],
  },
  {
    id: 'needs',
    label: 'Needs',
    icon: <Hand className="w-5 h-5" />,
    symbols: [
      { emoji: '💧', label: 'Water' },
      { emoji: '🍽️', label: 'Food' },
      { emoji: '🚻', label: 'Bathroom' },
      { emoji: '💊', label: 'Medicine' },
      { emoji: '🛏️', label: 'Rest' },
      { emoji: '🤗', label: 'Hug' },
      { emoji: '⏰', label: 'Break' },
      { emoji: '🔇', label: 'Quiet' },
      { emoji: '🌡️', label: 'Too hot' },
      { emoji: '🧊', label: 'Too cold' },
      { emoji: '👓', label: 'Can\'t see' },
      { emoji: '👂', label: 'Can\'t hear' },
    ],
  },
  {
    id: 'responses',
    label: 'Responses',
    icon: <MessageCircle className="w-5 h-5" />,
    symbols: [
      { emoji: '✅', label: 'Yes' },
      { emoji: '❌', label: 'No' },
      { emoji: '🤷', label: 'Maybe' },
      { emoji: '👍', label: 'I agree' },
      { emoji: '👎', label: 'I disagree' },
      { emoji: '🔄', label: 'Please repeat' },
      { emoji: '⏳', label: 'Wait' },
      { emoji: '🤝', label: 'Okay' },
      { emoji: '💡', label: 'I have an idea' },
      { emoji: '🙅', label: 'Stop' },
    ],
  },
  {
    id: 'questions',
    label: 'Questions',
    icon: <HelpCircle className="w-5 h-5" />,
    symbols: [
      { emoji: '❓', label: 'What' },
      { emoji: '📍', label: 'Where' },
      { emoji: '🕐', label: 'When' },
      { emoji: '🤔', label: 'Why' },
      { emoji: '🛠️', label: 'How' },
      { emoji: '👤', label: 'Who' },
      { emoji: '🔢', label: 'How many' },
      { emoji: '💰', label: 'How much' },
      { emoji: '📋', label: 'What happened' },
      { emoji: '🗺️', label: 'Where is it' },
    ],
  },
  {
    id: 'actions',
    label: 'Actions',
    icon: <Zap className="w-5 h-5" />,
    symbols: [
      { emoji: '🚶', label: 'Go' },
      { emoji: '🛑', label: 'Stop' },
      { emoji: '👀', label: 'Look' },
      { emoji: '👂', label: 'Listen' },
      { emoji: '✍️', label: 'Write' },
      { emoji: '📖', label: 'Read' },
      { emoji: '🎮', label: 'Play' },
      { emoji: '🍴', label: 'Eat' },
      { emoji: '💤', label: 'Sleep' },
      { emoji: '🗣️', label: 'Talk' },
      { emoji: '📞', label: 'Call' },
      { emoji: '🏃', label: 'Run' },
    ],
  },
  {
    id: 'people',
    label: 'People',
    icon: <Users className="w-5 h-5" />,
    symbols: [
      { emoji: '👨', label: 'Dad' },
      { emoji: '👩', label: 'Mom' },
      { emoji: '👦', label: 'Brother' },
      { emoji: '👧', label: 'Sister' },
      { emoji: '👴', label: 'Grandpa' },
      { emoji: '👵', label: 'Grandma' },
      { emoji: '👩‍⚕️', label: 'Doctor' },
      { emoji: '👩‍🏫', label: 'Teacher' },
      { emoji: '🧑‍🤝‍🧑', label: 'Friend' },
      { emoji: '👶', label: 'Baby' },
    ],
  },
  {
    id: 'safety',
    label: 'Safety',
    icon: <ShieldAlert className="w-5 h-5" />,
    symbols: [
      { emoji: '🆘', label: 'Help me' },
      { emoji: '🤕', label: 'I am hurt' },
      { emoji: '😷', label: 'I feel sick' },
      { emoji: '🚨', label: 'Emergency' },
      { emoji: '🏥', label: 'Hospital' },
      { emoji: '💊', label: 'I need medicine' },
      { emoji: '🚫', label: 'Please stop' },
      { emoji: '😰', label: 'I am scared' },
      { emoji: '📍', label: 'I am lost' },
      { emoji: '☎️', label: 'Call for help' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/*  Vocabulary for word prediction (200+ words)                        */
/* ------------------------------------------------------------------ */

const VOCABULARY: string[] = [
  // Pronouns & determiners
  'I', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'my', 'your',
  'his', 'her', 'our', 'their', 'this', 'that', 'the', 'a', 'an',
  // Verbs
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may',
  'want', 'need', 'like', 'love', 'feel', 'think', 'know', 'see', 'go',
  'come', 'get', 'make', 'take', 'give', 'tell', 'say', 'help', 'try',
  'use', 'find', 'call', 'ask', 'work', 'play', 'run', 'eat', 'drink',
  'sleep', 'read', 'write', 'talk', 'listen', 'look', 'wait', 'stop',
  'start', 'open', 'close', 'turn', 'bring', 'show', 'leave', 'keep',
  'let', 'put', 'sit', 'stand', 'walk', 'meet', 'learn', 'change',
  'move', 'live', 'believe', 'happen', 'remember', 'understand',
  // Adjectives
  'good', 'bad', 'big', 'small', 'new', 'old', 'long', 'short',
  'great', 'little', 'different', 'important', 'same', 'happy', 'sad',
  'tired', 'hungry', 'thirsty', 'sick', 'better', 'best', 'nice',
  'kind', 'funny', 'beautiful', 'free', 'full', 'easy', 'hard',
  'ready', 'sure', 'safe', 'sorry', 'okay', 'fine', 'wonderful',
  'amazing', 'terrible', 'awful', 'excited', 'worried', 'scared',
  'angry', 'calm', 'quiet', 'loud', 'warm', 'cold', 'hot',
  // Nouns
  'time', 'day', 'night', 'morning', 'afternoon', 'evening', 'today',
  'tomorrow', 'yesterday', 'home', 'school', 'work', 'place', 'room',
  'house', 'food', 'water', 'people', 'family', 'friend', 'mother',
  'father', 'brother', 'sister', 'doctor', 'teacher', 'phone', 'name',
  'thing', 'world', 'life', 'hand', 'head', 'body', 'heart', 'mind',
  'eye', 'face', 'door', 'car', 'book', 'music', 'money', 'game',
  // Adverbs & prepositions
  'not', 'very', 'much', 'more', 'also', 'just', 'now', 'then',
  'here', 'there', 'when', 'where', 'how', 'why', 'what', 'who',
  'all', 'each', 'every', 'both', 'few', 'some', 'any', 'many',
  'well', 'still', 'already', 'always', 'never', 'sometimes', 'often',
  'again', 'too', 'really', 'maybe', 'please', 'thanks',
  'in', 'on', 'at', 'to', 'for', 'with', 'from', 'about', 'up',
  'out', 'off', 'over', 'after', 'before', 'between', 'through',
  // Conjunctions & others
  'and', 'but', 'or', 'if', 'because', 'so', 'than', 'while',
  'yes', 'no', 'hello', 'goodbye', 'sorry', 'excuse',
]

/* ------------------------------------------------------------------ */
/*  Quick-reply phrase banks (30+)                                     */
/* ------------------------------------------------------------------ */

interface PhraseBank {
  label: string
  phrases: string[]
}

const PHRASE_BANKS: PhraseBank[] = [
  {
    label: 'Greetings',
    phrases: [
      'Hi, how are you?',
      'Good morning!',
      'Hey, what\'s up?',
      'Nice to see you!',
      'Hope you\'re doing well.',
    ],
  },
  {
    label: 'Feelings',
    phrases: [
      'I\'m doing great, thanks!',
      'I\'m feeling a bit tired today.',
      'I\'m really happy right now.',
      'I\'m not feeling well.',
      'I\'m a little anxious.',
    ],
  },
  {
    label: 'Conversation',
    phrases: [
      'That sounds interesting!',
      'Tell me more about that.',
      'I agree with you.',
      'I see what you mean.',
      'That\'s a great idea!',
      'I hadn\'t thought of that.',
    ],
  },
  {
    label: 'Requests',
    phrases: [
      'Can you help me with something?',
      'Could you repeat that, please?',
      'I need a moment to think.',
      'Can we talk about something else?',
      'Please speak more slowly.',
    ],
  },
  {
    label: 'Closing',
    phrases: [
      'Thanks for chatting!',
      'I have to go now.',
      'Talk to you later!',
      'It was nice talking to you.',
      'Goodbye, take care!',
    ],
  },
  {
    label: 'Support',
    phrases: [
      'I\'m here for you.',
      'That must be really hard.',
      'You\'re doing great.',
      'Take your time, no rush.',
      'I understand how you feel.',
    ],
  },
]

const TONE_TAGS = [
  { label: '/friendly', value: ' [friendly tone]' },
  { label: '/serious', value: ' [serious tone]' },
  { label: '/joking', value: ' [joking]' },
  { label: '/sincere', value: ' [sincere]' },
  { label: '/casual', value: ' [casual]' },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function predictWords(input: string, count: number): string[] {
  const trimmed = input.trimEnd()
  const lastWord = trimmed.split(/\s+/).pop()?.toLowerCase() ?? ''
  if (!lastWord) return []

  const matches = VOCABULARY.filter((w) =>
    w.toLowerCase().startsWith(lastWord) && w.toLowerCase() !== lastWord
  )

  // Sort shorter matches first (more likely intended), then alphabetically
  matches.sort((a, b) => a.length - b.length || a.localeCompare(b))
  return matches.slice(0, count)
}

function speakText(text: string) {
  if (!('speechSynthesis' in window) || !text.trim()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.9
  utterance.pitch = 1
  window.speechSynthesis.speak(utterance)
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function CompositionBar({
  message,
  onClear,
  onSpeak,
  onSend,
}: {
  message: string
  onClear: () => void
  onSpeak: () => void
  onSend: () => void
}) {
  return (
    <div className="flex items-center gap-2 p-3 glass rounded-xl border border-white/10">
      {/* Message display */}
      <div
        className={cn(
          'flex-1 min-h-[44px] flex items-center px-3 py-2 rounded-lg',
          'bg-muted/30 text-sm',
          !message && 'text-muted-foreground'
        )}
      >
        {message || 'Tap symbols to build your message...'}
      </div>

      {/* Action buttons */}
      <button
        onClick={onClear}
        disabled={!message}
        className={cn(
          'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl',
          'glass transition-all duration-200',
          'hover:bg-red-500/10 hover:text-red-400',
          'active:scale-95 disabled:opacity-30 disabled:pointer-events-none'
        )}
        aria-label="Clear message"
      >
        <Trash2 className="w-5 h-5" />
      </button>
      <button
        onClick={onSpeak}
        disabled={!message}
        className={cn(
          'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl',
          'glass transition-all duration-200',
          'hover:bg-blue-500/10 hover:text-blue-400',
          'active:scale-95 disabled:opacity-30 disabled:pointer-events-none'
        )}
        aria-label="Speak message"
      >
        <Volume2 className="w-5 h-5" />
      </button>
      <button
        onClick={onSend}
        disabled={!message}
        className={cn(
          'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl',
          'bg-primary text-primary-foreground transition-all duration-200',
          'hover:opacity-90 glow-sm',
          'active:scale-95 disabled:opacity-30 disabled:pointer-events-none'
        )}
        aria-label="Send message"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  )
}

function DistressButton({ onTap }: { onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className={cn(
        'w-full min-h-[52px] flex items-center justify-center gap-2 rounded-xl',
        'bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-base',
        'transition-all duration-200',
        'hover:bg-red-500/30 hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]',
        'active:scale-[0.98]'
      )}
      aria-label="I need help - distress button"
    >
      <AlertTriangle className="w-6 h-6" />
      I NEED HELP
    </button>
  )
}

function CategoryTabs({
  categories,
  activeId,
  onSelect,
}: {
  categories: Category[]
  activeId: CategoryId
  onSelect: (id: CategoryId) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
    >
      {categories.map((cat) => {
        const isActive = cat.id === activeId
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              'flex flex-col items-center gap-1 min-w-[72px] min-h-[60px]',
              'px-3 py-2 rounded-xl transition-all duration-200 shrink-0',
              isActive
                ? 'bg-primary/20 text-primary border border-primary/40 shadow-[0_0_12px_rgba(var(--primary-rgb,99,102,241),0.25)]'
                : 'glass text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-transparent'
            )}
            aria-pressed={isActive}
          >
            {cat.icon}
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              {cat.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function SymbolGrid({
  symbols,
  onSelect,
}: {
  symbols: Symbol[]
  onSelect: (label: string) => void
}) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
      {symbols.map((sym, i) => (
        <button
          key={`${sym.label}-${i}`}
          onClick={() => onSelect(sym.label)}
          className={cn(
            'flex flex-col items-center justify-center gap-1',
            'min-h-[72px] min-w-[44px] p-2 rounded-xl',
            'glass border border-white/5',
            'transition-all duration-200',
            'hover:bg-primary/10 hover:border-primary/30 hover:shadow-[0_0_10px_rgba(var(--primary-rgb,99,102,241),0.15)]',
            'active:scale-90'
          )}
          style={{ animationDelay: `${i * 20}ms` }}
        >
          <span className="text-2xl leading-none" role="img" aria-hidden="true">
            {sym.emoji}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center line-clamp-2">
            {sym.label}
          </span>
        </button>
      ))}
    </div>
  )
}

function WordPredictionBar({
  predictions,
  onSelect,
}: {
  predictions: string[]
  onSelect: (word: string) => void
}) {
  if (!predictions.length) return null
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      {predictions.map((word) => (
        <button
          key={word}
          onClick={() => onSelect(word)}
          className={cn(
            'px-3 min-h-[36px] rounded-lg shrink-0',
            'glass text-sm font-medium',
            'transition-all duration-150',
            'hover:bg-primary/15 hover:text-primary',
            'active:scale-95'
          )}
        >
          {word}
        </button>
      ))}
    </div>
  )
}

function SimpleKeyboard({
  onKey,
  onBackspace,
  onSpace,
}: {
  onKey: (char: string) => void
  onBackspace: () => void
  onSpace: () => void
}) {
  const rows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ]

  return (
    <div className="flex flex-col gap-1.5 items-center">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.map((char) => (
            <button
              key={char}
              onClick={() => onKey(char)}
              className={cn(
                'min-w-[32px] min-h-[44px] flex items-center justify-center rounded-lg',
                'glass text-sm font-medium',
                'transition-all duration-100',
                'hover:bg-primary/15 hover:text-primary',
                'active:scale-90 active:bg-primary/25'
              )}
            >
              {char}
            </button>
          ))}
          {ri === 2 && (
            <button
              onClick={onBackspace}
              className={cn(
                'min-w-[52px] min-h-[44px] flex items-center justify-center rounded-lg',
                'glass text-sm font-medium',
                'transition-all duration-100',
                'hover:bg-red-500/15 hover:text-red-400',
                'active:scale-90'
              )}
              aria-label="Backspace"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={onSpace}
        className={cn(
          'min-w-[200px] min-h-[44px] flex items-center justify-center rounded-lg',
          'glass text-sm font-medium text-muted-foreground',
          'transition-all duration-100',
          'hover:bg-muted/40',
          'active:scale-[0.98]'
        )}
      >
        space
      </button>
    </div>
  )
}

function PhraseBankPanel({
  banks,
  onSelect,
}: {
  banks: PhraseBank[]
  onSelect: (phrase: string) => void
}) {
  const [activeBankIdx, setActiveBankIdx] = useState(0)

  return (
    <div className="flex flex-col gap-2">
      {/* Bank tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {banks.map((bank, i) => (
          <button
            key={bank.label}
            onClick={() => setActiveBankIdx(i)}
            className={cn(
              'px-3 min-h-[32px] rounded-lg text-xs font-medium shrink-0 transition-all duration-200',
              i === activeBankIdx
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'glass text-muted-foreground hover:text-foreground'
            )}
          >
            {bank.label}
          </button>
        ))}
      </div>

      {/* Phrases */}
      <div className="flex flex-wrap gap-1.5">
        {banks[activeBankIdx].phrases.map((phrase) => (
          <button
            key={phrase}
            onClick={() => onSelect(phrase)}
            className={cn(
              'px-3 py-2 rounded-xl text-xs font-medium',
              'glass border border-white/5',
              'transition-all duration-150',
              'hover:bg-primary/10 hover:border-primary/20',
              'active:scale-95'
            )}
          >
            {phrase}
          </button>
        ))}
      </div>
    </div>
  )
}

function ToneTagBar({
  onSelect,
}: {
  onSelect: (value: string) => void
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center shrink-0 mr-1">
        Tone:
      </span>
      {TONE_TAGS.map((tag) => (
        <button
          key={tag.label}
          onClick={() => onSelect(tag.value)}
          className={cn(
            'px-2 py-1 rounded-md text-[11px] font-medium shrink-0',
            'bg-violet-500/10 text-violet-400 border border-violet-500/20',
            'transition-all duration-150',
            'hover:bg-violet-500/20 hover:border-violet-500/40',
            'active:scale-95'
          )}
        >
          {tag.label}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Mode indicators                                                    */
/* ------------------------------------------------------------------ */

function ModeIndicator({ level }: { level: AACInputProps['level'] }) {
  const config = {
    symbol: { icon: <Grid3X3 className="w-3.5 h-3.5" />, label: 'Symbol Mode' },
    hybrid: { icon: <Keyboard className="w-3.5 h-3.5" />, label: 'Hybrid Mode' },
    'text-assisted': { icon: <Type className="w-3.5 h-3.5" />, label: 'Text Assisted' },
  }[level]

  return (
    <div className="flex items-center gap-1.5 px-1">
      <Sparkles className="w-3 h-3 text-primary/60" />
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
        {config.icon} {config.label}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main AACInput component                                            */
/* ------------------------------------------------------------------ */

export function AACInput({ level, onSend, className }: AACInputProps) {
  const [message, setMessage] = useState('')
  const [symbolSequence, setSymbolSequence] = useState<AACSymbolData[]>([])
  const [activeCategory, setActiveCategory] = useState<CategoryId>('intent')
  const [textInput, setTextInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Build predictions based on current text input
  const predictions = useMemo(() => {
    if (level === 'hybrid') return predictWords(textInput, 6)
    if (level === 'text-assisted') return predictWords(textInput, 8)
    return []
  }, [textInput, level])

  const activeSymbols = useMemo(
    () => CATEGORIES.find((c) => c.id === activeCategory)?.symbols ?? [],
    [activeCategory]
  )

  const appendToMessage = useCallback((text: string) => {
    setMessage((prev) => {
      if (!prev) return text
      return prev + ' ' + text
    })
  }, [])

  const handleSymbolSelect = useCallback(
    (label: string) => {
      appendToMessage(label)
      // Find the matching symbol to track its emoji
      const allSymbols = CATEGORIES.flatMap(c => c.symbols)
      const match = allSymbols.find(s => s.label === label)
      if (match) {
        setSymbolSequence(prev => [...prev, { emoji: match.emoji, label: match.label }])
      }
    },
    [appendToMessage]
  )

  const handlePhraseSelect = useCallback(
    (phrase: string) => {
      setMessage(phrase)
    },
    []
  )

  const handleToneSelect = useCallback((value: string) => {
    setMessage((prev) => prev + value)
  }, [])

  const handleSend = useCallback(() => {
    const trimmed = message.trim()
    if (!trimmed) return
    onSend(trimmed, symbolSequence.length > 0 ? symbolSequence : undefined)
    setMessage('')
    setTextInput('')
    setSymbolSequence([])
  }, [message, symbolSequence, onSend])

  const handleClear = useCallback(() => {
    setMessage('')
    setTextInput('')
    setSymbolSequence([])
  }, [])

  const handleSpeak = useCallback(() => {
    speakText(message)
  }, [message])

  const handleDistress = useCallback(() => {
    const distressMessage = 'I need help right now'
    const distressSymbols: AACSymbolData[] = [{ emoji: '🆘', label: 'Help me' }]
    setMessage(distressMessage)
    speakText(distressMessage)
    onSend(distressMessage, distressSymbols)
    setMessage('')
    setSymbolSequence([])
  }, [onSend])

  // Keyboard handlers for hybrid mode
  const handleKeyboardKey = useCallback((char: string) => {
    setTextInput((prev) => prev + char)
  }, [])

  const handleKeyboardBackspace = useCallback(() => {
    setTextInput((prev) => prev.slice(0, -1))
  }, [])

  const handleKeyboardSpace = useCallback(() => {
    setTextInput((prev) => prev + ' ')
  }, [])

  const handlePredictionSelect = useCallback(
    (word: string) => {
      setTextInput((prev) => {
        const parts = prev.trimEnd().split(/\s+/)
        parts[parts.length - 1] = word
        return parts.join(' ') + ' '
      })
    },
    []
  )

  const handleTextInputCommit = useCallback(() => {
    const trimmed = textInput.trim()
    if (trimmed) {
      appendToMessage(trimmed)
      setTextInput('')
    }
  }, [textInput, appendToMessage])

  // For text-assisted: real text input with word prediction
  const handleRealInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTextInput(e.target.value)
    },
    []
  )

  const handleRealInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleTextInputCommit()
      }
    },
    [handleTextInputCommit]
  )

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  return (
    <div className={cn('flex flex-col gap-3 p-3', className)}>
      {/* Mode indicator */}
      <ModeIndicator level={level} />

      {/* Composition bar — always visible */}
      <CompositionBar
        message={message}
        onClear={handleClear}
        onSpeak={handleSpeak}
        onSend={handleSend}
      />

      {/* Distress button — always visible */}
      <DistressButton onTap={handleDistress} />

      {/* ============ SYMBOL-ONLY MODE ============ */}
      {level === 'symbol' && (
        <div className="flex flex-col gap-3">
          <CategoryTabs
            categories={CATEGORIES}
            activeId={activeCategory}
            onSelect={setActiveCategory}
          />
          <SymbolGrid
            symbols={activeSymbols}
            onSelect={handleSymbolSelect}
          />
        </div>
      )}

      {/* ============ HYBRID MODE ============ */}
      {level === 'hybrid' && (
        <div className="flex flex-col gap-3">
          {/* Category tabs + symbol grid */}
          <CategoryTabs
            categories={CATEGORIES}
            activeId={activeCategory}
            onSelect={setActiveCategory}
          />
          <SymbolGrid
            symbols={activeSymbols}
            onSelect={handleSymbolSelect}
          />

          {/* Divider */}
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              or type
            </span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          {/* Typing text preview */}
          {textInput && (
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-lg bg-muted/30 text-sm min-h-[36px] flex items-center">
                {textInput}
                <span className="animate-pulse ml-0.5 text-primary">|</span>
              </div>
              <button
                onClick={handleTextInputCommit}
                disabled={!textInput.trim()}
                className={cn(
                  'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl',
                  'bg-primary/20 text-primary transition-all duration-150',
                  'hover:bg-primary/30 active:scale-95',
                  'disabled:opacity-30 disabled:pointer-events-none'
                )}
                aria-label="Add typed text to message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Word predictions */}
          <WordPredictionBar
            predictions={predictions}
            onSelect={handlePredictionSelect}
          />

          {/* Simplified keyboard */}
          <SimpleKeyboard
            onKey={handleKeyboardKey}
            onBackspace={handleKeyboardBackspace}
            onSpace={handleKeyboardSpace}
          />
        </div>
      )}

      {/* ============ TEXT-ASSISTED MODE ============ */}
      {level === 'text-assisted' && (
        <div className="flex flex-col gap-3">
          {/* Real text input */}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={textInput}
              onChange={handleRealInputChange}
              onKeyDown={handleRealInputKeyDown}
              placeholder="Type your message..."
              className={cn(
                'flex-1 min-h-[48px] px-4 py-2 rounded-xl text-sm',
                'bg-muted/30 border border-white/10',
                'placeholder:text-muted-foreground/50',
                'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40',
                'transition-all duration-200'
              )}
            />
            <button
              onClick={handleTextInputCommit}
              disabled={!textInput.trim()}
              className={cn(
                'min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl',
                'bg-primary/20 text-primary transition-all duration-150',
                'hover:bg-primary/30 active:scale-95',
                'disabled:opacity-30 disabled:pointer-events-none'
              )}
              aria-label="Add to message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Aggressive word predictions */}
          <WordPredictionBar
            predictions={predictions}
            onSelect={(word) => {
              setTextInput((prev) => {
                const parts = prev.trimEnd().split(/\s+/)
                parts[parts.length - 1] = word
                return parts.join(' ') + ' '
              })
              inputRef.current?.focus()
            }}
          />

          {/* Tone tags */}
          <ToneTagBar onSelect={handleToneSelect} />

          {/* Quick-reply phrase banks */}
          <div className="flex items-center gap-1.5 px-1 pt-1">
            <Sparkles className="w-3 h-3 text-primary/60" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Quick replies
            </span>
          </div>
          <PhraseBankPanel
            banks={PHRASE_BANKS}
            onSelect={handlePhraseSelect}
          />

          {/* Divider */}
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              symbols
            </span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          {/* Symbol grid (also available) */}
          <CategoryTabs
            categories={CATEGORIES}
            activeId={activeCategory}
            onSelect={setActiveCategory}
          />
          <SymbolGrid
            symbols={activeSymbols}
            onSelect={handleSymbolSelect}
          />
        </div>
      )}
    </div>
  )
}
