// ═══════════════════════════════════════════
// Core entities
// ═══════════════════════════════════════════

export interface User {
  id: string
  name: string
  avatar?: string
  isOnline?: boolean
  pronouns?: string
  bio?: string
  location?: string
  commStyle?: string
  interests?: string[]
  joinedAt?: string
  verified?: boolean
  phoneNumber?: string
}

export interface AACSymbol {
  emoji: string
  label: string
}

export interface Message {
  id: string
  content: string
  toneTag?: string
  aacSymbols?: AACSymbol[]
  sender: User
  createdAt: string
  isMe: boolean
}

export interface Conversation {
  id: string
  user: User
  lastMessage?: Message
  unreadCount: number
  updatedAt: string
}

// ═══════════════════════════════════════════
// Community / Feed
// ═══════════════════════════════════════════

export type ReactionType = 'heart' | 'solidarity' | 'lightbulb' | 'sparkle' | 'hug'

export interface Reaction {
  type: ReactionType
  count: number
  reacted: boolean
}

export interface CommunityPost {
  id: string
  author: User
  content: string
  toneTag?: string
  contentWarning?: string
  createdAt: string
  reactions: Reaction[]
  replyCount: number
  parentId?: string // thread support
  tags?: string[]
  pinned?: boolean
}

// ═══════════════════════════════════════════
// AI features
// ═══════════════════════════════════════════

export interface AIExplanation {
  tone: string
  confidence: number
  hiddenMeanings: string[]
  suggestions: string[]
  socialCues: string[]
}

export interface AISummary {
  summary: string
  highlights: string[]
}

export interface AIRephrase {
  gentle: string
  direct: string
}

// ═══════════════════════════════════════════
// Preferences
// ═══════════════════════════════════════════

export interface NotificationPreferences {
  pushEnabled: boolean
  messageNotifs: boolean
  mentionNotifs: boolean
  communityNotifs: boolean
  soundEnabled: boolean
  vibration: boolean
  quietMode: boolean
  quietStart: string
  quietEnd: string
}

export interface PrivacyPreferences {
  showOnlineStatus: boolean
  showReadReceipts: boolean
  showLastSeen: boolean
  showLocation: boolean
  profileVisible: boolean
  allowStrangerMessages: boolean
}

// ═══════════════════════════════════════════
// Discovery
// ═══════════════════════════════════════════

export interface DiscoverProfile extends User {
  compatibility: number
}

// ═══════════════════════════════════════════
// Config constants
// ═══════════════════════════════════════════

export interface ToneTag {
  tag: string
  label: string
  emoji: string
  color: string
}

export interface CommunicationStyle {
  id: string
  label: string
  emoji: string
  desc: string
}

export const TONE_TAGS: ToneTag[] = [
  { tag: '/j',    label: 'Joking',    emoji: '😄', color: 'text-amber-400 bg-amber-500/10' },
  { tag: '/srs',  label: 'Serious',   emoji: '🎯', color: 'text-blue-400 bg-blue-500/10' },
  { tag: '/gen',  label: 'Genuine',   emoji: '💚', color: 'text-emerald-400 bg-emerald-500/10' },
  { tag: '/info', label: 'Info',      emoji: '💡', color: 'text-cyan-400 bg-cyan-500/10' },
  { tag: '/nm',   label: 'Not mad',   emoji: '😌', color: 'text-violet-400 bg-violet-500/10' },
  { tag: '/pos',  label: 'Positive',  emoji: '✨', color: 'text-pink-400 bg-pink-500/10' },
]

export const COMMUNICATION_STYLES: CommunicationStyle[] = [
  { id: 'direct',    label: 'Direct',     emoji: '🎯', desc: 'I say what I mean clearly' },
  { id: 'gentle',    label: 'Gentle',     emoji: '🌸', desc: 'I prefer soft, careful wording' },
  { id: 'playful',   label: 'Playful',    emoji: '✨', desc: 'I use humour and lightness' },
  { id: 'formal',    label: 'Formal',     emoji: '📋', desc: 'I keep things structured' },
  { id: 'emotional', label: 'Expressive', emoji: '💖', desc: 'I share feelings openly' },
]

export const INTERESTS_LIST = [
  'Art', 'Music', 'Gaming', 'Coding', 'Nature', 'Reading',
  'Cooking', 'Film', 'Fitness', 'Photography', 'Science', 'Travel',
  'Anime', 'Crafts', 'Pets', 'Writing', 'Psychology', 'Space',
]

export const REACTION_CONFIG: Record<ReactionType, { emoji: string; label: string }> = {
  heart:      { emoji: '💖', label: 'Love' },
  solidarity: { emoji: '🤝', label: 'Solidarity' },
  lightbulb:  { emoji: '💡', label: 'Insightful' },
  sparkle:    { emoji: '✨', label: 'Uplifting' },
  hug:        { emoji: '🫂', label: 'Hug' },
}
