import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { initPersistence as initPersistenceStore, persistDbSnapshot, type PersistenceDb } from './persistence.js';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  bio?: string;
  avatar?: string;
  role: 'user' | 'admin';
  neurodivergentTraits: string[];
  specialInterests: string[];
  communicationPreferences: {
    preferredToneTags: boolean;
    aiExplanations: boolean;
    voiceMessages: boolean;
    responsePace?: 'slow' | 'balanced' | 'fast';
    directness?: 'direct' | 'gentle';
  };
  experiencePreferences: {
    calmMode: number;
    density: 'cozy' | 'balanced' | 'compact';
    reduceMotion: boolean;
    reduceSaturation: boolean;
    moodTheme?: 'calm' | 'warm' | 'crisp';
  };
  connectionGoals: string[];
  matchPreferences: {
    similarityWeight: number;
    complementWeight: number;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  boundaries: string[];
  safetyChecklist: {
    boundariesSet: boolean;
    filtersSet: boolean;
    resourcesViewed: boolean;
    completed: boolean;
  };
  accessibilityPreset?: {
    theme: 'light' | 'dark';
    highContrast: boolean;
    largeText: boolean;
    dyslexicFont: boolean;
    underlineLinks: boolean;
    reduceMotion: boolean;
    focusRing: boolean;
  };
  subscription: {
    plan: 'free' | 'premium' | 'pro';
    status: 'active' | 'inactive' | 'cancelled' | 'past_due';
    expiresAt?: string;
  };
  verification: {
    email: boolean;
    photo: boolean;
    id: boolean;
    self?: boolean;
    peer?: boolean;
    admin?: boolean;
  };
  isOnline: boolean;
  isSuspended: boolean;
  isPaused?: boolean;
  socialEnergy: {
    level: number;
    label: 'full' | 'medium' | 'low' | 'recharging';
    showOnProfile: boolean;
    autoPauseThreshold: number;
    updatedAt?: Date;
  };
  guardianSensitivity: 'off' | 'subtle' | 'active';
  communicationPassport: CommunicationPassportItem[];
  boundaryPresets: UserBoundaryPreset[];
  sensoryProfile: {
    noise: number;
    light: number;
    foodTexture: number;
    crowds: number;
    touch: number;
    scents: number;
  };
  selfieVerification: {
    status: 'none' | 'pending' | 'verified' | 'rejected';
    authenticityScore?: number;
    selfieDataUrl?: string;
    submittedAt?: Date;
    verifiedAt?: Date;
    reviewedBy?: string;
    reviewNotes?: string;
  };
  stimPreferences: {
    hapticIntensity: 'off' | 'light' | 'medium' | 'strong';
    doodleMode: boolean;
    fidgetReactions: boolean;
    voiceToText: boolean;
  };
  nameChanges: Date[];
  blockNsfwImages: boolean;
  rechargeReminder: boolean;
  onboarding: {
    completed: boolean;
    completedAt?: Date;
    step?: number;
  };
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  userId1: string;
  userId2: string;
  matchedAt: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'matched' | 'unmatched';
}

export interface Conversation {
  id: string;
  participants: string[];
  tags?: string[];
  trustLevel: number;
  trustOverride?: number | null;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  toneTag?: string;
  imageUrl?: string;
  isNsfw?: boolean;
  nsfwBlocked?: boolean;
  reactions?: MessageReaction[];
  createdAt: Date;
  readAt?: Date;
}

export interface BlogContentBlock {
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'callout' | 'statGrid' | 'steps' | 'checklist' | 'image' | 'divider' | 'cta' | 'resourceGrid';
  text?: string;
  level?: 2 | 3 | 4;
  style?: 'bullet' | 'number';
  items?: Array<{ text?: string; checked?: boolean; label?: string; value?: string; note?: string; title?: string; description?: string; href?: string }>;
  steps?: Array<{ title: string; body?: string }>;
  author?: string;
  tone?: 'info' | 'gentle' | 'note' | 'warning';
  title?: string;
  body?: string;
  buttonLabel?: string;
  buttonHref?: string;
  src?: string;
  alt?: string;
  caption?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  contentBlocks?: BlogContentBlock[];
  tags: string[];
  coverImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  status: 'draft' | 'published';
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface BlogComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityPost {
  id: string;
  type?: 'ask' | 'share' | 'resource' | 'event';
  title?: string;
  content: string;
  tags: string[];
  toneTag?: string;
  contentWarning?: string;
  hidden?: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityReaction {
  id: string;
  postId: string;
  userId: string;
  type: 'like' | 'support' | 'insightful';
  createdAt: Date;
}

export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  isSuper?: boolean;
  createdAt: Date;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: Date;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'user' | 'community_post' | 'message';
  targetId: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetType: 'user' | 'community_post' | 'report' | 'system' | 'integration' | 'changelog';
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface SocialScheduleEntry {
  id: string;
  channel: string;
  title: string;
  caption?: string;
  description?: string;
  mediaUrl?: string;
  scheduledAt?: string;
  status: 'queued' | 'sent' | 'failed';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface N8nWorkflowHook {
  workflowId: string;
  webhookUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface N8nWorkflowRun {
  id: string;
  workflowId: string;
  webhookUrl: string;
  status: 'success' | 'failed';
  responseStatus?: number;
  error?: string;
  triggeredAt: Date;
  triggeredBy: string;
}

export interface SitePage {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunicationPassportItem {
  id: string;
  text: string;
  category: 'literal' | 'processing' | 'tone' | 'pacing' | 'sensory' | 'custom';
  isPreset: boolean;
  endorsements: number;
}

export interface UserBoundaryPreset {
  id: string;
  text: string;
  visibility: 'all' | 'matches' | 'private';
  isPreset: boolean;
  active: boolean;
}

export interface PassportEndorsement {
  id: string;
  passportItemId: string;
  targetUserId: string;
  endorserId: string;
  endorserName: string;
  createdAt: Date;
}

export interface MessageFlag {
  id: string;
  messageId: string;
  conversationId: string;
  recipientId: string;
  patternType: 'love-bombing' | 'gaslighting' | 'negging' | 'coercion' | 'pressure' | 'manipulation';
  confidence: number;
  snippet: string;
  dismissed: boolean;
  createdAt: Date;
}

export interface MaskingLog {
  id: string;
  userId: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  context: 'conversation' | 'date' | 'social' | 'work' | 'other';
  contextRef?: string;
  energyBefore: number;
  energyAfter: number;
  notes?: string;
  tags: string[];
  createdAt: Date;
}

export interface RescueCall {
  id: string;
  userId: string;
  datePlanId?: string;
  scheduledAt: string;
  message: string;
  status: 'scheduled' | 'fired' | 'cancelled';
  createdAt: Date;
}

export interface Doodle {
  id: string;
  conversationId: string;
  senderId: string;
  dataUrl: string;
  createdAt: Date;
}

export interface TrustedContact {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  relationship: string;
  createdAt: Date;
}

export interface DatePlan {
  id: string;
  userId: string;
  matchName: string;
  location: string;
  scheduledAt: string;
  durationMinutes: number;
  trustedContactIds: string[];
  status: 'upcoming' | 'active' | 'checked-in' | 'alert-sent' | 'completed' | 'cancelled';
  checkInBy?: string;
  checkedInAt?: string;
  moodCheckIn?: 'great' | 'okay' | 'not-great' | 'need-support';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SosEvent {
  id: string;
  userId: string;
  location?: string;
  datePlanId?: string;
  message?: string;
  contactsNotified: string[];
  createdAt: Date;
}

export interface CookieConsentLog {
  id: string;
  analytics: boolean;
  marketing: boolean;
  userAgent: string;
  ip: string;
  createdAt: Date;
}

export interface CommunityRoom {
  id: string;
  name: string;
  description: string;
  tags: string[];
  resources: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BuddyThread {
  id: string;
  title: string;
  description: string;
  cadence: 'weekly' | 'biweekly' | 'monthly';
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SharedRoutine {
  id: string;
  title: string;
  description?: string;
  scheduledAt?: string;
  participants: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DigestQueueEntry {
  id: string;
  scheduledFor: string;
  status: 'queued' | 'sent';
  createdAt: Date;
}

export interface ContentCalendarEntry {
  id: string;
  channel: 'blog' | 'community';
  title: string;
  notes?: string;
  scheduledFor: string;
  status: 'planned' | 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role?: string;
  avatar?: string;
  micro?: string;
  featured: boolean;
  status: 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_SOCIAL_ENERGY = {
  level: 75,
  label: 'medium' as const,
  showOnProfile: false,
  autoPauseThreshold: 15
};

const DEFAULT_P1_FIELDS = {
  socialEnergy: { ...DEFAULT_SOCIAL_ENERGY },
  guardianSensitivity: 'subtle' as const,
  communicationPassport: [] as CommunicationPassportItem[],
  boundaryPresets: [] as UserBoundaryPreset[],
  sensoryProfile: { noise: 50, light: 50, foodTexture: 50, crowds: 50, touch: 50, scents: 50 },
  selfieVerification: { status: 'none' as const },
  stimPreferences: { hapticIntensity: 'off' as const, doodleMode: false, fidgetReactions: false, voiceToText: false },
  nameChanges: [] as Date[],
  blockNsfwImages: true,
  rechargeReminder: false
};

const hashedPassword = bcrypt.hashSync('password123', 10);
const adminPassword = bcrypt.hashSync('changethis!', 10);

const seedUsers: User[] = [
  {
    id: '00000000-0000-4000-a000-000000000001',
    email: 'joseph2x16@gmail.com',
    password: adminPassword,
    name: 'Joseph Admin',
    bio: 'Platform administrator.',
    role: 'admin',
    neurodivergentTraits: [],
    specialInterests: ['Product', 'Community'],
    communicationPreferences: {
      preferredToneTags: true,
      aiExplanations: true,
      voiceMessages: false,
      responsePace: 'balanced',
      directness: 'direct',
    },
    experiencePreferences: {
      calmMode: 25,
      density: 'balanced',
      reduceMotion: false,
      reduceSaturation: false,
      moodTheme: 'calm',
    },
    connectionGoals: ['Leadership', 'Community'],
    matchPreferences: { similarityWeight: 0.7, complementWeight: 0.3 },
    quietHours: { enabled: true, start: '22:00', end: '08:00' },
    boundaries: ['Slow pace preferred', 'No sudden calls'],
    safetyChecklist: { boundariesSet: true, filtersSet: true, resourcesViewed: true, completed: true },
    accessibilityPreset: {
      theme: 'light',
      highContrast: false,
      largeText: false,
      dyslexicFont: false,
      underlineLinks: false,
      reduceMotion: false,
      focusRing: true
    },
    subscription: { plan: 'pro', status: 'active' },
    verification: { email: true, photo: true, id: true, self: true, peer: true, admin: true },
    isOnline: false,
    isSuspended: false,
    isPaused: false,
    ...DEFAULT_P1_FIELDS,
    onboarding: { completed: true, completedAt: new Date() },
    lastActive: new Date(),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: '00000000-0000-4000-a000-000000000002',
    email: 'alex.chen@email.com',
    password: hashedPassword,
    name: 'Alex Chen',
    bio: 'Software developer who loves building things and playing strategy games.',
    role: 'user',
    neurodivergentTraits: ['ADHD', 'Autism'],
    specialInterests: ['Technology', 'Gaming', 'Science'],
    communicationPreferences: {
      preferredToneTags: true,
      aiExplanations: true,
      voiceMessages: false,
      responsePace: 'fast',
      directness: 'direct',
    },
    experiencePreferences: {
      calmMode: 15,
      density: 'compact',
      reduceMotion: false,
      reduceSaturation: false,
      moodTheme: 'crisp',
    },
    connectionGoals: ['Friendship', 'Collaboration'],
    matchPreferences: { similarityWeight: 0.8, complementWeight: 0.2 },
    quietHours: { enabled: false, start: '22:00', end: '08:00' },
    boundaries: ['Direct communication preferred'],
    safetyChecklist: { boundariesSet: true, filtersSet: true, resourcesViewed: false, completed: false },
    accessibilityPreset: {
      theme: 'light',
      highContrast: false,
      largeText: false,
      dyslexicFont: false,
      underlineLinks: false,
      reduceMotion: false,
      focusRing: false
    },
    subscription: { plan: 'premium', status: 'active' },
    verification: { email: true, photo: true, id: false, self: true },
    isOnline: true,
    isSuspended: false,
    isPaused: false,
    ...DEFAULT_P1_FIELDS,
    onboarding: { completed: true, completedAt: new Date() },
    lastActive: new Date(),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: '00000000-0000-4000-a000-000000000003',
    email: 'maya.johnson@email.com',
    password: hashedPassword,
    name: 'Maya Johnson',
    bio: 'Artist and nature enthusiast. I love painting landscapes and hiking.',
    role: 'user',
    neurodivergentTraits: ['Dyslexia', 'Anxiety'],
    specialInterests: ['Art', 'Nature', 'Music'],
    communicationPreferences: {
      preferredToneTags: true,
      aiExplanations: false,
      voiceMessages: true,
      responsePace: 'slow',
      directness: 'gentle',
    },
    experiencePreferences: {
      calmMode: 40,
      density: 'cozy',
      reduceMotion: true,
      reduceSaturation: false,
      moodTheme: 'warm',
    },
    connectionGoals: ['Friendship', 'Creative collaborators'],
    matchPreferences: { similarityWeight: 0.6, complementWeight: 0.4 },
    quietHours: { enabled: true, start: '21:00', end: '09:00' },
    boundaries: ['Gentle tone appreciated'],
    safetyChecklist: { boundariesSet: true, filtersSet: false, resourcesViewed: false, completed: false },
    accessibilityPreset: {
      theme: 'light',
      highContrast: false,
      largeText: true,
      dyslexicFont: false,
      underlineLinks: true,
      reduceMotion: true,
      focusRing: true
    },
    subscription: { plan: 'free', status: 'active' },
    verification: { email: true, photo: false, id: false, self: true },
    isOnline: false,
    isSuspended: false,
    isPaused: false,
    ...DEFAULT_P1_FIELDS,
    onboarding: { completed: true, completedAt: new Date() },
    lastActive: new Date(Date.now() - 3600000),
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date(),
  },
  {
    id: '00000000-0000-4000-a000-000000000004',
    email: 'sam.williams@email.com',
    password: hashedPassword,
    name: 'Sam Williams',
    bio: 'Music producer and anime fan. Always looking for new sounds and shows.',
    role: 'user',
    neurodivergentTraits: ['Autism', 'OCD'],
    specialInterests: ['Music', 'Anime', 'Technology'],
    communicationPreferences: {
      preferredToneTags: false,
      aiExplanations: true,
      voiceMessages: true,
      responsePace: 'balanced',
      directness: 'direct',
    },
    experiencePreferences: {
      calmMode: 20,
      density: 'balanced',
      reduceMotion: false,
      reduceSaturation: false,
      moodTheme: 'crisp',
    },
    connectionGoals: ['Dating', 'Friendship'],
    matchPreferences: { similarityWeight: 0.5, complementWeight: 0.5 },
    quietHours: { enabled: false, start: '22:00', end: '08:00' },
    boundaries: ['Clear expectations'],
    safetyChecklist: { boundariesSet: true, filtersSet: true, resourcesViewed: true, completed: true },
    accessibilityPreset: {
      theme: 'dark',
      highContrast: false,
      largeText: false,
      dyslexicFont: false,
      underlineLinks: false,
      reduceMotion: false,
      focusRing: true
    },
    subscription: { plan: 'pro', status: 'active' },
    verification: { email: true, photo: true, id: true, self: true, peer: true },
    isOnline: true,
    isSuspended: false,
    isPaused: false,
    ...DEFAULT_P1_FIELDS,
    onboarding: { completed: true, completedAt: new Date() },
    lastActive: new Date(),
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date(),
  },
  {
    id: '00000000-0000-4000-a000-000000000005',
    email: 'jordan.taylor@email.com',
    password: hashedPassword,
    name: 'Jordan Taylor',
    bio: 'Gamer and science nerd. I love discussing theories and playing RPGs.',
    role: 'user',
    neurodivergentTraits: ['ADHD', 'Dyscalculia'],
    specialInterests: ['Gaming', 'Science', 'Reading'],
    communicationPreferences: {
      preferredToneTags: true,
      aiExplanations: true,
      voiceMessages: false,
      responsePace: 'balanced',
      directness: 'gentle',
    },
    experiencePreferences: {
      calmMode: 30,
      density: 'cozy',
      reduceMotion: false,
      reduceSaturation: true,
      moodTheme: 'warm',
    },
    connectionGoals: ['Friendship', 'Study buddies'],
    matchPreferences: { similarityWeight: 0.7, complementWeight: 0.3 },
    quietHours: { enabled: true, start: '23:00', end: '08:30' },
    boundaries: ['Quiet mornings'],
    safetyChecklist: { boundariesSet: true, filtersSet: false, resourcesViewed: false, completed: false },
    accessibilityPreset: {
      theme: 'light',
      highContrast: false,
      largeText: false,
      dyslexicFont: true,
      underlineLinks: true,
      reduceMotion: false,
      focusRing: true
    },
    subscription: { plan: 'premium', status: 'active' },
    verification: { email: true, photo: true, id: false, self: true },
    isOnline: false,
    isSuspended: false,
    isPaused: false,
    ...DEFAULT_P1_FIELDS,
    onboarding: { completed: true, completedAt: new Date() },
    lastActive: new Date(Date.now() - 7200000),
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date(),
  },
  {
    id: '00000000-0000-4000-a000-000000000006',
    email: 'riley.parker@email.com',
    password: hashedPassword,
    name: 'Riley Parker',
    bio: 'Cat lover and aspiring writer. I enjoy cozy games and fantasy novels.',
    role: 'user',
    neurodivergentTraits: ['Anxiety', 'Autism', 'Dyspraxia'],
    specialInterests: ['Reading', 'Gaming', 'Animals'],
    communicationPreferences: {
      preferredToneTags: true,
      aiExplanations: false,
      voiceMessages: false,
      responsePace: 'slow',
      directness: 'gentle',
    },
    experiencePreferences: {
      calmMode: 35,
      density: 'cozy',
      reduceMotion: true,
      reduceSaturation: true,
      moodTheme: 'calm',
    },
    connectionGoals: ['Friendship', 'Community events'],
    matchPreferences: { similarityWeight: 0.65, complementWeight: 0.35 },
    quietHours: { enabled: true, start: '22:30', end: '09:00' },
    boundaries: ['No surprise calls'],
    safetyChecklist: { boundariesSet: true, filtersSet: true, resourcesViewed: true, completed: true },
    accessibilityPreset: {
      theme: 'light',
      highContrast: false,
      largeText: true,
      dyslexicFont: true,
      underlineLinks: true,
      reduceMotion: true,
      focusRing: true
    },
    subscription: { plan: 'free', status: 'active' },
    verification: { email: true, photo: false, id: false, self: true },
    isOnline: true,
    isSuspended: false,
    isPaused: false,
    ...DEFAULT_P1_FIELDS,
    onboarding: { completed: true, completedAt: new Date() },
    lastActive: new Date(),
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date(),
  },
];

const now = new Date();
const day = 86400000;
const seedBlogPosts: BlogPost[] = [
  {
    id: uuidv4(),
    slug: 'welcome-to-neuronest',
    title: 'Welcome to NeuroNest: Calm, clear, and consent-first',
    excerpt: 'Why we built a calmer, clearer social space for neurodivergent connection.',
    content:
      'NeuroNest is built to reduce ambiguity, lower social friction, and create a safer space for connection. We focus on clarity tools like tone tags, pacing, and preferences so people can meet with less stress and more trust.',
    contentBlocks: [
      { type: 'paragraph', text: 'NeuroNest is built to reduce ambiguity, lower social friction, and create a safer space for connection. We focus on clarity tools like tone tags, pacing, and preferences so people can meet with less stress and more trust.' },
      { type: 'heading', level: 2, text: 'What we optimize for' },
      {
        type: 'list',
        style: 'bullet',
        items: [
          { text: 'Signal clarity over speed.' },
          { text: 'Consent before escalation.' },
          { text: 'Predictability without losing warmth.' }
        ]
      },
      {
        type: 'callout',
        tone: 'gentle',
        title: 'Design principle',
        text: 'Calm is a feature. If a flow creates pressure, we slow it down or make it optional.'
      },
      {
        type: 'statGrid',
        items: [
          { label: 'Tone clarity', value: '3x', note: 'Fewer misunderstandings in early chats.' },
          { label: 'Pacing control', value: 'Flexible', note: 'You decide how fast things move.' },
          { label: 'Boundary respect', value: 'Built in', note: 'Preferences are visible and actionable.' }
        ]
      },
      { type: 'divider' },
      { type: 'heading', level: 2, text: 'How it feels' },
      { type: 'paragraph', text: 'Less guessing. Fewer surprises. More room to be yourself. That is the core promise of NeuroNest.' },
      {
        type: 'cta',
        title: 'Start with a low pressure hello',
        body: 'Set your pace, choose your tone defaults, and see how much easier it gets to connect.',
        buttonLabel: 'Explore the community',
        buttonHref: '/community'
      }
    ],
    tags: ['Product', 'Community', 'Design'],
    coverImage: '/blog_header_neural_pathways_1770055085954.png',
    seoTitle: 'NeuroNest blog: Calm, clear, consent-first connection',
    seoDescription: 'Learn how NeuroNest designs for low friction connection using pacing, tone tags, and clear preferences.',
    seoKeywords: ['neurodivergent dating', 'consent-first design', 'tone tags', 'calm social app'],
    ogImage: '/blog_header_neural_pathways_1770055085954.png',
    status: 'published',
    authorId: seedUsers[0].id,
    createdAt: new Date(Date.now() - 6 * day),
    updatedAt: now,
    publishedAt: new Date(Date.now() - 6 * day)
  },
  {
    id: uuidv4(),
    slug: 'tone-tags-clarity-guide',
    title: 'Tone tags and clarity: a practical guide',
    excerpt: 'Tone tags reduce ambiguity. Here is when to use them, and how to keep them lightweight.',
    content:
      'Tone tags make intent explicit. They reduce misunderstandings in text-based communication and can make conversations feel safer. This guide shows when to use them and how to keep them simple.',
    contentBlocks: [
      { type: 'paragraph', text: 'Tone tags make intent explicit. They reduce misunderstandings in text-based communication and can make conversations feel safer. This guide shows when to use them and how to keep them simple.' },
      { type: 'heading', level: 2, text: 'Use tone tags when' },
      {
        type: 'list',
        style: 'bullet',
        items: [
          { text: 'Your message could be read in multiple ways.' },
          { text: 'You are using sarcasm, teasing, or irony.' },
          { text: 'You are setting a boundary or asking for clarity.' }
        ]
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Keep it simple',
        text: 'You do not need a long list. Start with 3 or 4 tags that feel natural for you.'
      },
      { type: 'heading', level: 3, text: 'A starter set' },
      {
        type: 'checklist',
        items: [
          { text: '/srs for serious', checked: true },
          { text: '/j for joking', checked: true },
          { text: '/nm for not mad', checked: true },
          { text: '/gen for genuine question', checked: true }
        ]
      },
      { type: 'divider' },
      { type: 'paragraph', text: 'Tone tags are optional, not a rule. The goal is clarity, not perfection.' }
    ],
    tags: ['Guides', 'Accessibility', 'Communication'],
    coverImage: '/tone_tags_illustration_1770055069365.png',
    seoTitle: 'Tone tags guide: reduce ambiguity in ND conversations',
    seoDescription: 'A practical guide to tone tags for clearer, calmer text conversations.',
    seoKeywords: ['tone tags', 'neurodivergent communication', 'text clarity'],
    ogImage: '/tone_tags_illustration_1770055069365.png',
    status: 'published',
    authorId: seedUsers[1].id,
    createdAt: new Date(Date.now() - 5 * day),
    updatedAt: now,
    publishedAt: new Date(Date.now() - 5 * day)
  },
  {
    id: uuidv4(),
    slug: 'sensory-friendly-first-dates',
    title: 'Sensory friendly first dates: plan for comfort',
    excerpt: 'A low pressure plan for first dates with less sensory load and more autonomy.',
    content:
      'First dates can be noisy and unpredictable. This guide offers a low pressure plan that prioritizes sensory comfort, consent, and clear exit ramps.',
    contentBlocks: [
      { type: 'paragraph', text: 'First dates can be noisy and unpredictable. This guide offers a low pressure plan that prioritizes sensory comfort, consent, and clear exit ramps.' },
      { type: 'heading', level: 2, text: 'A gentle plan you can reuse' },
      {
        type: 'steps',
        steps: [
          { title: 'Pick a predictable place', body: 'Quiet cafes, parks, or calm museum hours are reliable.' },
          { title: 'Share your preferences early', body: 'Lighting, volume, and duration can be negotiated.' },
          { title: 'Set an easy exit', body: 'Plan a 60 to 90 minute cap with an optional extension.' }
        ]
      },
      {
        type: 'callout',
        tone: 'note',
        title: 'Consent-first pacing',
        text: 'You can be warm and clear at the same time. A simple heads up makes the whole date feel safer.'
      },
      { type: 'heading', level: 3, text: 'Comfort checklist' },
      {
        type: 'checklist',
        items: [
          { text: 'Bring a grounding item', checked: true },
          { text: 'Choose low scent spaces', checked: true },
          { text: 'Share quiet hour preferences', checked: true },
          { text: 'Have a reset plan after', checked: true }
        ]
      },
      { type: 'image', src: '/safe_verified_illustration_1770055050348.png', alt: 'Safety and trust illustration', caption: 'Safety is a shared responsibility, not a secret rule.' }
    ],
    tags: ['Guides', 'Dating', 'Sensory'],
    coverImage: '/safe_verified_illustration_1770055050348.png',
    seoTitle: 'Sensory friendly first dates for neurodivergent adults',
    seoDescription: 'Plan first dates that respect sensory needs with clear pacing, consent, and exit ramps.',
    seoKeywords: ['sensory friendly', 'first dates', 'neurodivergent dating'],
    ogImage: '/safe_verified_illustration_1770055050348.png',
    status: 'published',
    authorId: seedUsers[2].id,
    createdAt: new Date(Date.now() - 4 * day),
    updatedAt: now,
    publishedAt: new Date(Date.now() - 4 * day)
  },
  {
    id: uuidv4(),
    slug: 'ai-explain-without-losing-your-voice',
    title: 'AI Explain: clarity without losing your voice',
    excerpt: 'Use AI Explain to summarize intent while keeping your tone and boundaries intact.',
    content:
      'AI Explain helps clarify what was said without rewriting who you are. Here is how to use it to reduce guesswork while staying authentic.',
    contentBlocks: [
      { type: 'paragraph', text: 'AI Explain helps clarify what was said without rewriting who you are. Here is how to use it to reduce guesswork while staying authentic.' },
      { type: 'heading', level: 2, text: 'When AI Explain helps most' },
      {
        type: 'list',
        style: 'bullet',
        items: [
          { text: 'Messages with mixed signals or vague intent.' },
          { text: 'High stakes conversations where clarity matters.' },
          { text: 'After a misunderstanding when you want a calmer reset.' }
        ]
      },
      {
        type: 'statGrid',
        items: [
          { label: 'Clarity gain', value: 'High', note: 'Short summaries focus on intent.' },
          { label: 'Tone preserved', value: 'Yes', note: 'We do not overwrite your voice.' },
          { label: 'Control', value: 'Always', note: 'You decide what to send.' }
        ]
      },
      { type: 'heading', level: 3, text: 'A simple flow' },
      {
        type: 'steps',
        steps: [
          { title: 'Run Explain on a confusing message', body: 'You get a short, neutral summary.' },
          { title: 'Choose a response template', body: 'Pick clear, kind options or write your own.' },
          { title: 'Send with a tone tag', body: 'If it helps, add /srs or /gen.' }
        ]
      },
      { type: 'image', src: '/ai_analysis_feature_illustration_1770055034329.png', alt: 'AI clarity illustration', caption: 'AI Explain reduces ambiguity without replacing your voice.' }
    ],
    tags: ['AI', 'Product', 'Communication'],
    coverImage: '/ai_analysis_feature_illustration_1770055034329.png',
    seoTitle: 'AI Explain: clarify intent without losing your voice',
    seoDescription: 'How to use AI Explain for calmer, clearer conversations while staying authentic.',
    seoKeywords: ['ai explain', 'communication tools', 'neurodivergent messaging'],
    ogImage: '/ai_analysis_feature_illustration_1770055034329.png',
    status: 'published',
    authorId: seedUsers[0].id,
    createdAt: new Date(Date.now() - 3 * day),
    updatedAt: now,
    publishedAt: new Date(Date.now() - 3 * day)
  },
  {
    id: uuidv4(),
    slug: 'repairing-misunderstandings-kindly',
    title: 'Repairing misunderstandings kindly',
    excerpt: 'A calm, consent-first repair script for when conversations go sideways.',
    content:
      'Misunderstandings happen. A gentle repair keeps connection intact and lowers pressure for everyone involved.',
    contentBlocks: [
      { type: 'paragraph', text: 'Misunderstandings happen. A gentle repair keeps connection intact and lowers pressure for everyone involved.' },
      { type: 'heading', level: 2, text: 'A three step repair script' },
      {
        type: 'steps',
        steps: [
          { title: 'Name what happened', body: 'Use neutral language and keep it short.' },
          { title: 'Share your intent', body: 'Clarify what you meant without defending.' },
          { title: 'Offer a next step', body: 'Ask what would feel safe or clear now.' }
        ]
      },
      {
        type: 'quote',
        text: 'Thanks for telling me. I want to reset this kindly and clearly.',
        author: 'NeuroNest community norm'
      },
      {
        type: 'resourceGrid',
        items: [
          { title: 'Boundary templates', description: 'Short scripts for asking for clarity.', href: '/help' },
          { title: 'Community support', description: 'Peer spaces for gentle repair practice.', href: '/community' },
          { title: 'Your preferences', description: 'Update pacing and tone defaults.', href: '/settings' }
        ]
      },
      {
        type: 'cta',
        title: 'Need a reset? Try the calm chat tools',
        body: 'Use tone tags, pacing, and AI Explain to bring clarity back to the conversation.',
        buttonLabel: 'Open messages',
        buttonHref: '/messages'
      }
    ],
    tags: ['Community', 'Conflict repair', 'Guides'],
    coverImage: '/landing_hero_neurodivergent_connection_1770055018741.png',
    seoTitle: 'Repair misunderstandings kindly: a calm script',
    seoDescription: 'A three step repair script for neurodivergent friendly conversations.',
    seoKeywords: ['repair script', 'conflict repair', 'neurodivergent communication'],
    ogImage: '/landing_hero_neurodivergent_connection_1770055018741.png',
    status: 'published',
    authorId: seedUsers[3].id,
    createdAt: new Date(Date.now() - 2 * day),
    updatedAt: now,
    publishedAt: new Date(Date.now() - 2 * day)
  }
];

const seedCommunityPosts: CommunityPost[] = [
  {
    id: uuidv4(),
    type: 'share',
    title: 'Favorite ways to decompress after social time?',
    content: 'After a long day of socializing, I like quiet music and a short walk. What helps you reset?',
    tags: ['Self-care', 'Routines'],
    authorId: seedUsers[2].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: uuidv4(),
    type: 'ask',
    title: 'Looking for book recommendations',
    content: 'Anyone have cozy sci-fi or fantasy recs?',
    tags: ['Books', 'SpecialInterests'],
    authorId: seedUsers[4].id,
    createdAt: now,
    updatedAt: now
  }
];

const seedTestimonials: Testimonial[] = [
  {
    id: uuidv4(),
    quote: 'The AI Explain feature is a game-changer! I no longer worry about misreading messages.',
    author: 'Alex M.',
    role: 'Autistic & ADHD',
    avatar: '/user_headshot_1_alex_1770055210671.png',
    micro: 'Less guessing, more clarity.',
    featured: true,
    status: 'published',
    createdAt: now,
    updatedAt: now
  },
  {
    id: uuidv4(),
    quote: 'Tone tags have made communication so much easier. No more awkward misunderstandings!',
    author: 'Jordan K.',
    role: 'Autistic',
    avatar: '/user_headshot_2_jordan_1770055223957.png',
    micro: 'Tone tags = calm chats.',
    featured: true,
    status: 'published',
    createdAt: now,
    updatedAt: now
  },
  {
    id: uuidv4(),
    quote: "I've made more genuine friends on NeuroNest in 3 months than in my entire life.",
    author: 'Sam T.',
    role: 'ADHD',
    avatar: '/user_headshot_3_sam_1770055235874.png',
    micro: 'Real bonds, real fast.',
    featured: true,
    status: 'published',
    createdAt: now,
    updatedAt: now
  }
];

const seedCommunityRooms: CommunityRoom[] = [
  {
    id: uuidv4(),
    name: 'Cozy Creatives',
    description: 'A low-pressure space for artists, writers, and makers.',
    tags: ['Art', 'Writing', 'Crafts'],
    resources: ['https://www.autisticadvocacy.org/', 'https://neurodivergentinsights.com/'],
    createdAt: now,
    updatedAt: now
  },
  {
    id: uuidv4(),
    name: 'Study & Focus',
    description: 'Body doubling and study buddies for gentle accountability.',
    tags: ['Study', 'Co-working', 'Productivity'],
    resources: ['https://www.adhdawarenessmonth.org/'],
    createdAt: now,
    updatedAt: now
  }
];

const seedBuddyThreads: BuddyThread[] = [
  {
    id: uuidv4(),
    title: 'Weekly decompression circle',
    description: 'A weekly check-in to share what worked and what was hard.',
    cadence: 'weekly',
    members: [],
    createdAt: now,
    updatedAt: now
  }
];

const seedSharedRoutines: SharedRoutine[] = [
  {
    id: uuidv4(),
    title: 'Sunday low-spoons co-working',
    description: 'Bring a warm drink and do 45 minutes of low-pressure tasks together.',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    participants: [],
    createdBy: seedUsers[0].id,
    createdAt: now,
    updatedAt: now
  }
];

const seedDigestQueue: DigestQueueEntry[] = [
  {
    id: uuidv4(),
    scheduledFor: new Date(Date.now() + 604800000).toISOString(),
    status: 'queued',
    createdAt: now
  }
];

const seedContentCalendar: ContentCalendarEntry[] = [
  {
    id: uuidv4(),
    channel: 'blog',
    title: 'Tone tag primer',
    notes: 'Short guide with examples',
    scheduledFor: new Date(Date.now() + 259200000).toISOString(),
    status: 'planned',
    createdAt: now,
    updatedAt: now
  },
  {
    id: uuidv4(),
    channel: 'community',
    title: 'Weekly prompt: Your comfort rituals',
    notes: 'Prompt with CW guidance',
    scheduledFor: new Date(Date.now() + 172800000).toISOString(),
    status: 'planned',
    createdAt: now,
    updatedAt: now
  }
];

const seedSitePages: SitePage[] = [
  {
    id: uuidv4(),
    slug: 'about',
    title: 'About NeuroNest',
    summary: 'A calmer social space built with neurodivergent needs in mind.',
    body: `NeuroNest exists to make social connection feel safer, clearer, and more joyful for neurodivergent adults.\n\nWe focus on clear communication tools, slower pacing, and supportive community features that reduce ambiguity and social strain.\n\nOur team is committed to listening, iterating with our community, and building features that support real life friendships, dating, and belonging.`,
    createdAt: now,
    updatedAt: now
  },
  {
    id: uuidv4(),
    slug: 'contact',
    title: 'Contact Us',
    summary: 'Questions, support, or partnership ideas? We are here to help.',
    body: `Support email: support@neuronest.app\n\nPartnerships: partnerships@neuronest.app\n\nIf you need help with your account, include your email address and a short description of the issue.`,
    createdAt: now,
    updatedAt: now
  },
  {
    id: uuidv4(),
    slug: 'terms',
    title: 'Terms of Use',
    summary: 'Please review the terms that govern your use of NeuroNest.',
    body: `By using NeuroNest, you agree to follow our community guidelines and respect other members.\n\nYou must be at least 18 years old to use the platform.\n\nWe reserve the right to suspend accounts that violate safety policies, abuse other users, or attempt fraud.\n\nThese terms may be updated as the platform evolves.`,
    createdAt: now,
    updatedAt: now
  },
  {
    id: uuidv4(),
    slug: 'privacy',
    title: 'Privacy Policy',
    summary: 'How we handle your data, and what you can control.',
    body: `We collect only the data needed to operate NeuroNest and improve safety.\n\nYou control your profile visibility, and you can request deletion of your account at any time.\n\nWe do not sell personal data. Data is used to provide services, ensure safety, and improve the product.`,
    createdAt: now,
    updatedAt: now
  }
];

export interface Feedback {
  id: string;
  userId?: string;
  userName?: string;
  anonymous: boolean;
  area: string;
  rating: number;
  message: string;
  status: 'new' | 'reviewed' | 'actioned';
  adminNotes?: string;
  createdAt: Date;
}

export interface ChangelogEntry {
  id: string;
  title: string;
  description: string;
  category: 'feature' | 'improvement' | 'fix' | 'feedback-driven';
  feedbackId?: string;
  feedbackQuote?: string;
  version?: string;
  publishedAt: Date;
  createdAt: Date;
}

export const db = {
  users: [...seedUsers],
  matches: [] as Match[],
  conversations: [] as Conversation[],
  messages: [] as Message[],
  blogPosts: [...seedBlogPosts],
  blogComments: [] as BlogComment[],
  communityPosts: [...seedCommunityPosts],
  communityComments: [] as CommunityComment[],
  communityReactions: [] as CommunityReaction[],
  likes: [] as Like[],
  blocks: [] as Block[],
  reports: [] as Report[],
  auditLogs: [] as AuditLog[],
  socialSchedules: [] as SocialScheduleEntry[],
  n8nWorkflowHooks: [] as N8nWorkflowHook[],
  n8nWorkflowRuns: [] as N8nWorkflowRun[],
  sitePages: [...seedSitePages],
  cookieConsents: [] as CookieConsentLog[],
  testimonials: [...seedTestimonials],
  communityRooms: [...seedCommunityRooms],
  buddyThreads: [...seedBuddyThreads],
  sharedRoutines: [...seedSharedRoutines],
  digestQueue: [...seedDigestQueue],
  contentCalendar: [...seedContentCalendar],
  trustedContacts: [] as TrustedContact[],
  datePlans: [] as DatePlan[],
  sosEvents: [] as SosEvent[],
  messageFlags: [] as MessageFlag[],
  passportEndorsements: [] as PassportEndorsement[],
  maskingLogs: [] as MaskingLog[],
  rescueCalls: [] as RescueCall[],
  doodles: [] as Doodle[],
  feedback: [] as Feedback[],
  changelog: [] as ChangelogEntry[],
} as PersistenceDb & {
  users: User[];
  matches: Match[];
  conversations: Conversation[];
  messages: Message[];
  blogPosts: BlogPost[];
  blogComments: BlogComment[];
  communityPosts: CommunityPost[];
  communityComments: CommunityComment[];
  communityReactions: CommunityReaction[];
  likes: Like[];
  blocks: Block[];
  reports: Report[];
  auditLogs: AuditLog[];
  testimonials: Testimonial[];
  communityRooms: CommunityRoom[];
  buddyThreads: BuddyThread[];
  sharedRoutines: SharedRoutine[];
  digestQueue: DigestQueueEntry[];
  contentCalendar: ContentCalendarEntry[];
  trustedContacts: TrustedContact[];
  datePlans: DatePlan[];
  sosEvents: SosEvent[];
  messageFlags: MessageFlag[];
  passportEndorsements: PassportEndorsement[];
  maskingLogs: MaskingLog[];
  rescueCalls: RescueCall[];
  doodles: Doodle[];
  feedback: Feedback[];
  changelog: ChangelogEntry[];
};

export function findUserByEmail(email: string): User | undefined {
  return db.users.find((user) => user.email === email);
}

export function findUserById(id: string): User | undefined {
  return db.users.find((user) => user.id === id);
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  neurodivergentTraits?: string[];
  specialInterests?: string[];
}

export function createUser(data: CreateUserInput): User {
  const now = new Date();
  const user: User = {
    id: uuidv4(),
    email: data.email,
    password: data.password,
    name: data.name,
    role: 'user',
    neurodivergentTraits: data.neurodivergentTraits || [],
    specialInterests: data.specialInterests || [],
    communicationPreferences: {
      preferredToneTags: true,
      aiExplanations: true,
      voiceMessages: false,
      responsePace: 'balanced',
      directness: 'gentle'
    },
    experiencePreferences: {
      calmMode: 20,
      density: 'balanced',
      reduceMotion: false,
      reduceSaturation: false,
      moodTheme: 'calm'
    },
    connectionGoals: [],
    matchPreferences: {
      similarityWeight: 0.7,
      complementWeight: 0.3
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    boundaries: [],
    safetyChecklist: {
      boundariesSet: false,
      filtersSet: false,
      resourcesViewed: false,
      completed: false
    },
    accessibilityPreset: {
      theme: 'light',
      highContrast: false,
      largeText: false,
      dyslexicFont: false,
      underlineLinks: false,
      reduceMotion: false,
      focusRing: false
    },
    subscription: {
      plan: 'free',
      status: 'active'
    },
    verification: {
      email: false,
      photo: false,
      id: false,
      self: true
    },
    isOnline: true,
    isSuspended: false,
    isPaused: false,
    ...DEFAULT_P1_FIELDS,
    onboarding: {
      completed: false,
      step: 1
    },
    lastActive: now,
    createdAt: now,
    updatedAt: now
  };
  db.users.push(user);
  return user;
}

export function getMatchesForUser(userId: string): Match[] {
  return db.matches.filter(
    (match) => match.userId1 === userId || match.userId2 === userId
  );
}

export function getConversationsForUser(userId: string): Conversation[] {
  return db.conversations.filter((conversation) =>
    conversation.participants.includes(userId)
  );
}

export function updateUser(id: string, updates: Partial<User>): User | undefined {
  const user = findUserById(id);
  if (!user) return undefined;
  Object.assign(user, updates, { updatedAt: new Date() });
  return user;
}

export function findSitePageBySlug(slug: string): SitePage | undefined {
  return db.sitePages.find((page) => page.slug === slug);
}

export async function initPersistence() {
  await initPersistenceStore(db);
}

export function persistDb() {
  void persistDbSnapshot(db);
}



