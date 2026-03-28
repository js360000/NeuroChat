import { useState, useMemo } from 'react'
import {
  MessageCircleHeart,
  Sparkles,
  BookOpen,
  Users,
  Eye,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  Search,
  Heart,
  HandHeart,
  MessageSquare,
  ShieldCheck,
  HelpCircle,
  ThumbsUp,
  CalendarOff,
  AlertCircle,
  SmilePlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

interface SocialCoachProps {
  message?: string
  conversationContext?: string[]
  onSuggestion?: (text: string) => void
  className?: string
}

type CoachTab = 'tone' | 'starters' | 'scripts' | 'perspective'

/* ─────────────────────────────────────────────
   Tone Analysis Engine (client-side heuristics)
   ───────────────────────────────────────────── */

type ToneType = 'direct' | 'warm' | 'blunt' | 'playful' | 'formal' | 'uncertain' | 'enthusiastic' | 'passive-aggressive' | 'neutral'

interface ToneResult {
  tone: ToneType
  confidence: number
  color: string
  bgColor: string
  explanation: string
  softerAlternative?: string
}

function analyzeTone(text: string): ToneResult | null {
  if (!text || text.trim().length < 3) return null

  const lower = text.toLowerCase().trim()
  const words = lower.split(/\s+/)
  const wordCount = words.length
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  const avgSentenceLength = wordCount / Math.max(sentences.length, 1)
  const exclamationCount = (text.match(/!/g) || []).length
  const questionCount = (text.match(/\?/g) || []).length
  const capsWords = words.filter((w) => w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w))
  const capsRatio = capsWords.length / Math.max(wordCount, 1)
  const ellipsisCount = (text.match(/\.\.\./g) || []).length

  // Condescending / passive-aggressive markers
  const condescendingWords = ['actually', 'obviously', 'clearly', 'honestly', 'literally', 'basically', 'simply', 'just saying']
  const condescendingHits = condescendingWords.filter((w) => lower.includes(w)).length

  const passiveAggressivePatterns = [
    /\bfine\b/,
    /\bwhatever\b/,
    /\bsure\b(?!\s+thing)/,
    /\bno worries\b.*\bbut\b/,
    /\bi guess\b/,
    /\bif you say so\b/,
    /\bper my last\b/,
    /\bas per\b/,
    /\bas i (already|previously) (said|mentioned)\b/,
    /\bwith all due respect\b/,
    /\bnot to be rude\b/,
    /\bno offense\b/,
    /\bjust so you know\b/,
    /\bi mean\b.*\bbut\b/,
  ]
  const paHits = passiveAggressivePatterns.filter((p) => p.test(lower)).length

  // Warm markers
  const warmWords = ['thank', 'thanks', 'appreciate', 'love', 'glad', 'happy', 'wonderful', 'amazing', 'great', 'awesome', 'kind', 'sweet', 'lovely', 'care', 'hope', 'wish', 'enjoy', 'welcome', 'pleased', 'delighted', 'grateful']
  const warmHits = warmWords.filter((w) => lower.includes(w)).length

  // Playful markers
  const playfulPatterns = [/haha/i, /lol/i, /lmao/i, /rofl/i, /😂|😄|😆|🤣|😜|😝|🎉|✨|💃|🕺/, /\bxd\b/i, /\bomg\b/i, /\byay\b/i, /\bwoo+\b/i]
  const playfulHits = playfulPatterns.filter((p) => p.test(text)).length

  // Formal markers
  const formalWords = ['regarding', 'furthermore', 'therefore', 'hence', 'consequently', 'nevertheless', 'accordingly', 'hereby', 'pursuant', 'aforementioned', 'whereas', 'shall', 'kindly', 'respectfully', 'cordially', 'henceforth']
  const formalHits = formalWords.filter((w) => lower.includes(w)).length

  // Uncertain markers
  const uncertainWords = ['maybe', 'perhaps', 'might', 'could', 'possibly', 'i think', 'not sure', "i don't know", 'idk', 'i guess', 'sort of', 'kind of', 'kinda', 'probably', 'hopefully', 'i suppose']
  const uncertainHits = uncertainWords.filter((w) => lower.includes(w)).length

  // Score each tone
  const scores: Record<ToneType, number> = {
    'direct': 0,
    'warm': 0,
    'blunt': 0,
    'playful': 0,
    'formal': 0,
    'uncertain': 0,
    'enthusiastic': 0,
    'passive-aggressive': 0,
    'neutral': 2,
  }

  // All caps = shouting / very direct
  if (capsRatio > 0.5 && wordCount > 2) {
    scores.blunt += 5
    scores.direct += 3
  }

  // Short blunt sentences
  if (avgSentenceLength <= 4 && sentences.length >= 1 && exclamationCount === 0 && questionCount === 0) {
    scores.blunt += 3
    scores.direct += 2
  }

  // Exclamation marks
  if (exclamationCount >= 3) {
    scores.enthusiastic += 4
    scores.playful += 1
  } else if (exclamationCount >= 1) {
    scores.enthusiastic += 1
    scores.warm += 1
  }

  // Question marks without context
  if (questionCount >= 2 && wordCount < 10 && !lower.includes('how') && !lower.includes('what') && !lower.includes('could')) {
    scores.direct += 2
  }

  // Condescending words
  if (condescendingHits >= 2) {
    scores['passive-aggressive'] += 4
  } else if (condescendingHits === 1) {
    scores['passive-aggressive'] += 1
    scores.direct += 1
  }

  // Passive-aggressive patterns
  scores['passive-aggressive'] += paHits * 2

  // Warm
  scores.warm += warmHits * 1.5

  // Playful
  scores.playful += playfulHits * 2

  // Formal
  scores.formal += formalHits * 2.5

  // Uncertain
  scores.uncertain += uncertainHits * 2
  if (ellipsisCount >= 2) scores.uncertain += 2

  // Direct indicators
  if (lower.startsWith('you need to') || lower.startsWith('you should') || lower.startsWith('you must') || lower.startsWith('do this') || lower.startsWith('stop')) {
    scores.direct += 3
    scores.blunt += 1
  }

  // Find highest scoring tone
  let bestTone: ToneType = 'neutral'
  let bestScore = 0
  for (const [tone, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestTone = tone as ToneType
    }
  }

  const toneConfig: Record<ToneType, Omit<ToneResult, 'tone' | 'confidence'>> = {
    direct: {
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      explanation: 'Your message gets straight to the point. Some people appreciate directness, but others might find it abrupt.',
      softerAlternative: undefined,
    },
    warm: {
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      explanation: 'This reads as friendly and caring. The warm language makes people feel comfortable and valued.',
    },
    blunt: {
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      explanation: 'This might come across as short or curt. Adding a greeting or softener could help.',
      softerAlternative: undefined,
    },
    playful: {
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      explanation: 'Your message has a fun, light-hearted energy. Great for casual conversations!',
    },
    formal: {
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      explanation: 'This reads as professional and formal. Good for serious topics, but might feel distant in casual chats.',
    },
    uncertain: {
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      explanation: 'Your message sounds a bit hesitant. This can be endearing, but might also seem unconfident.',
    },
    enthusiastic: {
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      explanation: 'Lots of energy here! Enthusiasm is contagious, but too many exclamation marks can feel overwhelming.',
    },
    'passive-aggressive': {
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      explanation: 'This might read as indirect or sarcastic. Consider stating your feelings directly to avoid misunderstanding.',
      softerAlternative: undefined,
    },
    neutral: {
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/30',
      explanation: 'This reads as neutral and straightforward. Clear communication!',
    },
  }

  const config = toneConfig[bestTone]
  const confidence = Math.min(1, bestScore / 6)

  // Generate softer alternative for blunt / direct / passive-aggressive tones
  if (bestTone === 'blunt' || bestTone === 'passive-aggressive') {
    config.softerAlternative = `Hey, I wanted to mention \u2014 ${lower.replace(/^(you need to|you should|you must)\s*/i, 'it might help to ').replace(/\b(obviously|actually|clearly)\b/gi, '').trim()}`
  } else if (bestTone === 'direct' && avgSentenceLength < 6) {
    config.softerAlternative = `Hey! ${text.trim().replace(/\.$/, '')} \u2014 let me know what you think!`
  }

  return {
    tone: bestTone,
    confidence,
    ...config,
  }
}

/* ─────────────────────────────────────────────
   Perspective Helper (heuristics on other person)
   ───────────────────────────────────────────── */

interface PerspectiveResult {
  emotion: string
  emotionColor: string
  interpretation: string
}

function analyzePerspective(messages: string[]): PerspectiveResult | null {
  if (!messages.length) return null
  const lastMsg = messages[messages.length - 1]
  if (!lastMsg || lastMsg.trim().length < 2) return null

  const lower = lastMsg.toLowerCase()

  // Emotion patterns
  const emotionPatterns: Array<{ patterns: RegExp[]; emotion: string; color: string; interp: string }> = [
    {
      patterns: [/\b(angry|furious|pissed|mad|annoyed|frustrated|irritated)\b/, /\b(hate|ugh|wtf)\b/, /!{2,}/],
      emotion: 'Frustrated or angry',
      color: 'text-red-400',
      interp: 'They seem upset about something. Acknowledging their feelings before responding may help.',
    },
    {
      patterns: [/\b(sad|upset|crying|hurt|lonely|depressed|down|miserable)\b/, /\b(miss|wish|if only)\b/, /😢|😭|💔/],
      emotion: 'Sad or hurting',
      color: 'text-blue-400',
      interp: 'They might be going through a tough time. A compassionate response would mean a lot right now.',
    },
    {
      patterns: [/\b(worried|anxious|nervous|scared|afraid|stressed|overwhelmed|panic)\b/, /\b(what if|can't stop thinking)\b/],
      emotion: 'Anxious or worried',
      color: 'text-amber-400',
      interp: 'They seem to be feeling anxious. Offering reassurance or just listening could help them feel safer.',
    },
    {
      patterns: [/\b(happy|excited|amazing|wonderful|fantastic|great|awesome|thrilled|overjoyed)\b/, /🎉|🥳|😊|😁|🎊|✨/, /!{1,2}$/],
      emotion: 'Happy or excited',
      color: 'text-emerald-400',
      interp: 'They seem to be in a good mood! Matching their energy and sharing in their excitement would feel great.',
    },
    {
      patterns: [/\b(confused|don't understand|what do you mean|lost|huh)\b/, /\?{2,}/, /\bwhat\b.*\?/],
      emotion: 'Confused',
      color: 'text-violet-400',
      interp: 'They might not fully understand something. Rephrasing or explaining more simply could help.',
    },
    {
      patterns: [/\b(sorry|apologize|my fault|my bad|forgive|i messed up)\b/],
      emotion: 'Apologetic',
      color: 'text-cyan-400',
      interp: 'They are trying to make amends. A gracious response acknowledging their effort to apologize can help repair things.',
    },
    {
      patterns: [/\b(tired|exhausted|burnt out|drained|wiped|done)\b/, /\b(need a break|so tired|can't anymore)\b/],
      emotion: 'Exhausted',
      color: 'text-orange-400',
      interp: 'They seem drained. Being understanding about their energy level and keeping things low-pressure would be kind.',
    },
    {
      patterns: [/\b(idk|whatever|fine|ok|k|sure)\b/, /^(ok|k|sure|fine|whatever|idk)\.?$/],
      emotion: 'Disengaged or withdrawn',
      color: 'text-muted-foreground',
      interp: 'Short responses can mean they are busy, upset, or not sure what to say. Checking in gently might help.',
    },
    {
      patterns: [/\b(thank|thanks|appreciate|grateful|means a lot)\b/],
      emotion: 'Grateful',
      color: 'text-emerald-400',
      interp: 'They are expressing appreciation. A warm acknowledgment would strengthen the connection.',
    },
    {
      patterns: [/\b(help|need|please|can you|would you|could you)\b/],
      emotion: 'Seeking support',
      color: 'text-blue-400',
      interp: 'They might be asking for help, even indirectly. Being available and responsive shows you care.',
    },
  ]

  for (const ep of emotionPatterns) {
    const matchCount = ep.patterns.filter((p) => p.test(lower)).length
    if (matchCount >= 1) {
      return {
        emotion: ep.emotion,
        emotionColor: ep.color,
        interpretation: ep.interp,
      }
    }
  }

  return {
    emotion: 'Neutral / conversational',
    emotionColor: 'text-muted-foreground',
    interpretation: 'Their tone seems calm and conversational. A natural, relaxed response should work well.',
  }
}

/* ─────────────────────────────────────────────
   Conversation Starters Data
   ───────────────────────────────────────────── */

type StarterCategory = 'getting-to-know' | 'sharing-interests' | 'deepening' | 'checking-in'

interface StarterGroup {
  id: StarterCategory
  label: string
  icon: typeof Heart
  starters: string[]
}

const STARTER_GROUPS: StarterGroup[] = [
  {
    id: 'getting-to-know',
    label: 'Getting to Know',
    icon: Users,
    starters: [
      "What's something you've been really into lately?",
      "If you could learn any skill overnight, what would it be?",
      "What's your comfort show or movie?",
      "Do you prefer mornings or late nights?",
      "What's the most interesting thing you've read or seen recently?",
      "Are you more of an indoors or outdoors person?",
      "What kind of music are you listening to right now?",
      "Do you have any pets? I'd love to hear about them!",
      "What's your favorite way to recharge after a long day?",
      "If you could travel anywhere tomorrow, where would you go?",
      "What's something most people don't know about you?",
      "Are you a planner or more spontaneous?",
      "What's a small thing that always makes your day better?",
      "Do you collect anything?",
      "What was the last thing that made you laugh out loud?",
    ],
  },
  {
    id: 'sharing-interests',
    label: 'Sharing Interests',
    icon: Heart,
    starters: [
      "I've been really into [topic] lately. Have you heard of it?",
      "Have you watched/read/played anything good recently?",
      "I think you'd really like [thing] \u2014 it reminds me of what you said about...",
      "What games/books/shows are you into right now?",
      "I just discovered this amazing [podcast/channel/artist]. Want me to share the link?",
      "Do you have a favorite genre? I'm always looking for recommendations!",
      "Have you ever tried [hobby]? I think it's so fun.",
      "What's something you're passionate about that you could talk about for hours?",
      "I love that you mentioned [thing]! I'm really into that too.",
      "Is there a topic you've been wanting to deep-dive into?",
      "What's your favorite way to be creative?",
      "Do you have a go-to comfort food?",
      "Have you ever had a hobby phase that you look back on fondly?",
      "What's the last thing you got really excited about?",
      "If you could master any art form, what would it be?",
    ],
  },
  {
    id: 'deepening',
    label: 'Going Deeper',
    icon: HandHeart,
    starters: [
      "How have you been feeling lately, really?",
      "Is there something on your mind you'd like to talk about?",
      "I really value our conversations. You always make me think.",
      "What's something you're proud of that you don't talk about much?",
      "Has anything been weighing on you recently?",
      "What's a life lesson that really stuck with you?",
      "Who has had the biggest positive impact on your life?",
      "What does a perfect day look like for you?",
      "Is there a dream you've been holding onto?",
      "What's something you've changed your mind about over time?",
    ],
  },
  {
    id: 'checking-in',
    label: 'Checking In',
    icon: MessageCircleHeart,
    starters: [
      "Hey! Just wanted to check in \u2014 how are you doing?",
      "I was thinking about you. How's everything going?",
      "No pressure to chat, just wanted you to know I'm here.",
      "How's your week been so far?",
      "I saw [thing] and it reminded me of you!",
      "Just popping in to say hi. Hope you're having a good day!",
      "Are you doing okay? You've been on my mind.",
      "I know things have been busy \u2014 just wanted to send some good vibes.",
      "Hey, I really enjoyed our last conversation. Want to pick up where we left off?",
      "How are your energy levels today? I'll match your vibe.",
    ],
  },
]

/* ─────────────────────────────────────────────
   Social Scripts Data
   ───────────────────────────────────────────── */

interface SocialScript {
  title: string
  icon: typeof ShieldCheck
  tone: string
  toneColor: string
  template: string
}

const SOCIAL_SCRIPTS: SocialScript[] = [
  {
    title: 'Setting a boundary',
    icon: ShieldCheck,
    tone: 'Firm but kind',
    toneColor: 'text-blue-400',
    template: "I appreciate you sharing this with me, but I need to set a boundary here. I'm not comfortable with [specific thing], and I'd love for us to [alternative]. I hope that's okay \u2014 it's important to me that we both feel good about how we interact.",
  },
  {
    title: 'Needing space / a break',
    icon: ShieldCheck,
    tone: 'Gentle',
    toneColor: 'text-emerald-400',
    template: "I've really enjoyed our conversation, but I'm feeling a bit drained and need to take a break to recharge. It's not about you at all \u2014 I just run out of social energy sometimes. Can we pick this up later?",
  },
  {
    title: 'Ending a conversation',
    icon: MessageSquare,
    tone: 'Warm',
    toneColor: 'text-emerald-400',
    template: "I've really enjoyed talking with you! I need to head off now, but I'd love to continue this conversation another time. Thanks for sharing \u2014 it meant a lot to me.",
  },
  {
    title: 'Expressing disagreement',
    icon: AlertCircle,
    tone: 'Respectful',
    toneColor: 'text-violet-400',
    template: "I see where you're coming from, and I appreciate your perspective. I actually think about it a little differently though \u2014 [your view]. What do you think? I'm curious to hear more about your reasoning.",
  },
  {
    title: 'Asking for clarification',
    icon: HelpCircle,
    tone: 'Curious',
    toneColor: 'text-cyan-400',
    template: "I want to make sure I understand what you mean. When you said [thing], did you mean [interpretation A] or more like [interpretation B]? I don't want to assume!",
  },
  {
    title: 'Responding to a compliment',
    icon: ThumbsUp,
    tone: 'Gracious',
    toneColor: 'text-pink-400',
    template: "Thank you so much, that really means a lot to me! I've been working on [thing] and it feels good to hear that you noticed. You're really kind for saying that.",
  },
  {
    title: 'Declining an invitation',
    icon: CalendarOff,
    tone: 'Kind',
    toneColor: 'text-amber-400',
    template: "Thank you so much for thinking of me \u2014 I really appreciate the invite! Unfortunately I can't make it this time [reason is optional]. I hope you all have a wonderful time, and I'd love to be included next time!",
  },
  {
    title: 'Apologizing sincerely',
    icon: HandHeart,
    tone: 'Sincere',
    toneColor: 'text-blue-400',
    template: "I want to apologize for [specific thing]. I realize that it might have made you feel [emotion], and that wasn't my intention. I value our connection and I'll [what you'll do differently]. I'm sorry.",
  },
  {
    title: 'Expressing you feel overwhelmed',
    icon: SmilePlus,
    tone: 'Vulnerable',
    toneColor: 'text-orange-400',
    template: "I want to be honest with you \u2014 I'm feeling a bit overwhelmed right now. It's hard for me to process everything at once. Could we slow down a little or take things one at a time? I really want to be present for our conversation.",
  },
  {
    title: 'Sharing excitement appropriately',
    icon: Sparkles,
    tone: 'Enthusiastic',
    toneColor: 'text-cyan-400',
    template: "I'm really excited about [thing] and I wanted to share it with you! I know it might not be everyone's thing, but it means a lot to me. Would you be up for hearing about it?",
  },
  {
    title: 'Checking if you overshared',
    icon: AlertCircle,
    tone: 'Self-aware',
    toneColor: 'text-amber-400',
    template: "Hey, I just wanted to check in \u2014 I feel like I might have shared a lot just now. I hope I didn't overwhelm you or make things awkward. Let me know if you'd rather talk about something lighter!",
  },
  {
    title: 'Responding when unsure what to say',
    icon: MessageSquare,
    tone: 'Honest',
    toneColor: 'text-muted-foreground',
    template: "I really appreciate you telling me that. I'm not sure exactly what to say right now, but I want you to know that I hear you and what you're feeling matters to me. Can I take a moment to think about it?",
  },
]

/* ─────────────────────────────────────────────
   Subcomponents
   ───────────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-muted/50 transition-colors"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-3 h-3 text-emerald-400" />
      ) : (
        <Copy className="w-3 h-3 text-muted-foreground" />
      )}
    </button>
  )
}

/* ─────────────────────────────────────────────
   Tone Analyzer Panel
   ───────────────────────────────────────────── */

function ToneAnalyzerPanel({
  message,
  onSuggestion,
}: {
  message?: string
  onSuggestion?: (text: string) => void
}) {
  const toneResult = useMemo(() => analyzeTone(message ?? ''), [message])

  if (!message || message.trim().length < 3) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Sparkles className="w-8 h-8 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Start typing a message to see tone analysis</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          I'll help you understand how your message might come across
        </p>
      </div>
    )
  }

  if (!toneResult) return null

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Tone badge */}
      <div className="flex items-center gap-3">
        <div className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold capitalize', toneResult.bgColor, toneResult.color)}>
          {toneResult.tone}
        </div>
        {/* Confidence bar */}
        <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', toneResult.bgColor.replace('/10', '/40'))}
            style={{ width: `${Math.max(toneResult.confidence * 100, 15)}%` }}
          />
        </div>
      </div>

      {/* Explanation */}
      <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
        <p className="text-xs font-medium text-foreground/90 mb-1">This might read as:</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{toneResult.explanation}</p>
      </div>

      {/* Softer alternative */}
      {toneResult.softerAlternative && onSuggestion && (
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
              Softer alternative
            </span>
          </div>
          <p className="text-xs text-foreground/80 mb-2">{toneResult.softerAlternative}</p>
          <button
            onClick={() => onSuggestion(toneResult.softerAlternative!)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 active:scale-95',
            )}
          >
            <ChevronRight className="w-3 h-3" />
            Use this instead
          </button>
        </div>
      )}

      {/* Quick tips based on tone */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Quick tips</p>
        {toneResult.tone === 'blunt' && (
          <>
            <Tip text='Adding "Hey!" or a greeting at the start warms things up' />
            <Tip text="Ending with a question invites dialogue instead of shutting it down" />
            <Tip text="Adding an emoji can soften the tone" />
          </>
        )}
        {toneResult.tone === 'passive-aggressive' && (
          <>
            <Tip text='Try replacing "actually" and "obviously" with neutral phrasing' />
            <Tip text="State your feelings directly rather than hinting" />
            <Tip text="Use I-statements: how something made YOU feel" />
          </>
        )}
        {toneResult.tone === 'uncertain' && (
          <>
            <Tip text="It's okay to be unsure! But if you want to sound more confident, drop some qualifiers" />
            <Tip text='Replace "I think maybe" with "I feel" or "I believe"' />
          </>
        )}
        {toneResult.tone === 'enthusiastic' && (
          <>
            <Tip text="Your energy is great! Just check if 3+ exclamation marks might overwhelm the reader" />
            <Tip text="Match the other person's energy level for best connection" />
          </>
        )}
        {(toneResult.tone === 'warm' || toneResult.tone === 'playful' || toneResult.tone === 'neutral') && (
          <Tip text="Your tone looks good! Keep being yourself." />
        )}
        {toneResult.tone === 'formal' && (
          <>
            <Tip text="If this is a casual chat, relaxing the language can feel more approachable" />
            <Tip text="Contractions (I'm, you'll, we'd) make text feel warmer" />
          </>
        )}
        {toneResult.tone === 'direct' && (
          <>
            <Tip text="Directness is great for clarity. Add a softener if the topic is sensitive" />
            <Tip text='Phrases like "What do you think?" turn statements into conversations' />
          </>
        )}
      </div>
    </div>
  )
}

function Tip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-muted/10">
      <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
      <span className="text-xs text-muted-foreground leading-relaxed">{text}</span>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Conversation Starters Panel
   ───────────────────────────────────────────── */

function ConversationStartersPanel({
  onSuggestion,
}: {
  onSuggestion?: (text: string) => void
}) {
  const [activeCategory, setActiveCategory] = useState<StarterCategory>('getting-to-know')
  const [searchQuery, setSearchQuery] = useState('')

  const activeGroup = STARTER_GROUPS.find((g) => g.id === activeCategory)!

  const filteredStarters = useMemo(() => {
    if (!searchQuery.trim()) return activeGroup.starters
    const q = searchQuery.toLowerCase()
    return activeGroup.starters.filter((s) => s.toLowerCase().includes(q))
  }, [activeGroup, searchQuery])

  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {STARTER_GROUPS.map((group) => {
          const Icon = group.icon
          return (
            <button
              key={group.id}
              onClick={() => {
                setActiveCategory(group.id)
                setSearchQuery('')
              }}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                activeCategory === group.id
                  ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                  : 'bg-muted/20 text-muted-foreground hover:bg-muted/40',
              )}
            >
              <Icon className="w-3 h-3" />
              {group.label}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search starters..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            'w-full pl-8 pr-3 py-2 rounded-lg text-xs',
            'bg-muted/20 border border-border/30',
            'placeholder:text-muted-foreground/50',
            'focus:outline-none focus:ring-1 focus:ring-primary/30',
          )}
        />
      </div>

      {/* Starters list */}
      <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
        {filteredStarters.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No starters match your search</p>
        ) : (
          filteredStarters.map((starter, i) => (
            <button
              key={i}
              onClick={() => onSuggestion?.(starter)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all group',
                'bg-muted/10 hover:bg-primary/10 hover:text-primary',
                'active:scale-[0.98]',
                'border border-transparent hover:border-primary/20',
              )}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="leading-relaxed">{starter}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Social Scripts Panel
   ───────────────────────────────────────────── */

function SocialScriptsPanel({
  onSuggestion,
}: {
  onSuggestion?: (text: string) => void
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredScripts = useMemo(() => {
    if (!searchQuery.trim()) return SOCIAL_SCRIPTS
    const q = searchQuery.toLowerCase()
    return SOCIAL_SCRIPTS.filter(
      (s) => s.title.toLowerCase().includes(q) || s.template.toLowerCase().includes(q) || s.tone.toLowerCase().includes(q),
    )
  }, [searchQuery])

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search scripts (boundary, apology, disagree...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            'w-full pl-8 pr-3 py-2 rounded-lg text-xs',
            'bg-muted/20 border border-border/30',
            'placeholder:text-muted-foreground/50',
            'focus:outline-none focus:ring-1 focus:ring-primary/30',
          )}
        />
      </div>

      {/* Scripts */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {filteredScripts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No scripts match your search</p>
        ) : (
          filteredScripts.map((script, i) => {
            const Icon = script.icon
            const isExpanded = expandedIndex === i
            return (
              <div
                key={i}
                className={cn(
                  'rounded-xl border transition-all overflow-hidden',
                  isExpanded ? 'border-primary/30 bg-primary/5' : 'border-border/30 bg-muted/10 hover:bg-muted/20',
                )}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : i)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                      isExpanded ? 'bg-primary/15' : 'bg-muted/30',
                    )}
                  >
                    <Icon className={cn('w-3.5 h-3.5', isExpanded ? 'text-primary' : 'text-muted-foreground')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs font-medium', isExpanded ? 'text-primary' : 'text-foreground')}>
                      {script.title}
                    </p>
                    <span className={cn('text-[10px]', script.toneColor)}>{script.tone}</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      'w-3.5 h-3.5 text-muted-foreground transition-transform duration-200',
                      isExpanded && 'rotate-90',
                    )}
                  />
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-3 pb-3 animate-fade-in">
                    <div className="p-3 rounded-lg bg-muted/20 border border-border/20 mb-2.5">
                      <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {script.template}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onSuggestion?.(script.template)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          'bg-primary/10 text-primary hover:bg-primary/20 active:scale-95',
                        )}
                      >
                        <ChevronRight className="w-3 h-3" />
                        Use this
                      </button>
                      <CopyButton text={script.template} />
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Perspective Helper Panel
   ───────────────────────────────────────────── */

function PerspectiveHelperPanel({
  conversationContext,
}: {
  conversationContext?: string[]
}) {
  const perspective = useMemo(
    () => analyzePerspective(conversationContext ?? []),
    [conversationContext],
  )

  if (!conversationContext || conversationContext.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Eye className="w-8 h-8 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No conversation context yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          When you're in a conversation, I'll help you understand the other person's perspective
        </p>
      </div>
    )
  }

  if (!perspective) return null

  // Show the last message from context
  const lastMessage = conversationContext[conversationContext.length - 1]

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Last message reference */}
      <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
          Their last message
        </p>
        <p className="text-xs text-foreground/80 italic leading-relaxed">"{lastMessage}"</p>
      </div>

      {/* Emotion inference */}
      <div className="p-3 rounded-xl bg-muted/10 border border-border/20">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            They might be feeling
          </span>
        </div>
        <span className={cn('text-sm font-semibold', perspective.emotionColor)}>
          {perspective.emotion}
        </span>
      </div>

      {/* Interpretation */}
      <div className="p-3 rounded-xl bg-primary/5 border border-primary/15">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            What this might mean
          </span>
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed">{perspective.interpretation}</p>
      </div>

      {/* Context timeline if multiple messages */}
      {conversationContext.length > 1 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Conversation flow
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {conversationContext.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-[11px] leading-relaxed truncate',
                  i === conversationContext.length - 1
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-muted/10 text-muted-foreground',
                )}
              >
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reminder */}
      <div className="px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
        <p className="text-[10px] text-amber-400/80 leading-relaxed">
          These are suggestions based on language patterns, not mind reading. Everyone communicates differently, and context matters a lot. When in doubt, ask them directly!
        </p>
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════
   Main SocialCoach Component
   ═════════════════════════════════════════════ */

const COACH_TABS: { id: CoachTab; label: string; icon: typeof Sparkles }[] = [
  { id: 'tone', label: 'Tone', icon: Sparkles },
  { id: 'starters', label: 'Starters', icon: MessageSquare },
  { id: 'scripts', label: 'Scripts', icon: BookOpen },
  { id: 'perspective', label: 'Perspective', icon: Eye },
]

export function SocialCoach({
  message,
  conversationContext,
  onSuggestion,
  className,
}: SocialCoachProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<CoachTab>('tone')

  return (
    <>
      {/* Toggle button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
            'glass hover:bg-primary/10 hover:text-primary active:scale-95',
            'text-muted-foreground',
            className,
          )}
          aria-label="Open Social Coach"
        >
          <MessageCircleHeart className="w-4 h-4" />
          <span className="hidden sm:inline">Social Coach</span>
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div
          className={cn(
            'fixed top-0 right-0 h-full w-[360px] max-w-[90vw] z-50',
            'glass-heavy shadow-glow-md',
            'flex flex-col',
            'animate-slide-in-right',
            className,
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageCircleHeart className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Social Coach</h3>
                <p className="text-[10px] text-muted-foreground">Communication support</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              aria-label="Close Social Coach"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border/30">
            {COACH_TABS.map((tab) => {
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all',
                    'text-[10px] font-medium',
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/20',
                  )}
                  aria-label={tab.label}
                  aria-selected={activeTab === tab.id}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'tone' && (
              <ToneAnalyzerPanel message={message} onSuggestion={onSuggestion} />
            )}
            {activeTab === 'starters' && (
              <ConversationStartersPanel onSuggestion={onSuggestion} />
            )}
            {activeTab === 'scripts' && (
              <SocialScriptsPanel onSuggestion={onSuggestion} />
            )}
            {activeTab === 'perspective' && (
              <PerspectiveHelperPanel conversationContext={conversationContext} />
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border/30">
            <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
              Social Coach uses text pattern analysis only. No data is sent to any server.
              All processing happens on your device.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
