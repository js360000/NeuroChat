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
  };
  isOnline: boolean;
  isSuspended: boolean;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  toneTag?: string;
  createdAt: Date;
  readAt?: Date;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  coverImage?: string;
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
  targetType: 'user' | 'community_post' | 'report' | 'system' | 'integration';
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

export interface CookieConsentLog {
  id: string;
  analytics: boolean;
  marketing: boolean;
  userAgent: string;
  ip: string;
  createdAt: Date;
}

const hashedPassword = bcrypt.hashSync('password123', 10);
const adminPassword = bcrypt.hashSync('changethis!', 10);

const seedUsers: User[] = [
  {
    id: uuidv4(),
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
    },
    subscription: { plan: 'pro', status: 'active' },
    verification: { email: true, photo: true, id: true },
    isOnline: false,
    isSuspended: false,
    lastActive: new Date(),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
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
    },
    subscription: { plan: 'premium', status: 'active' },
    verification: { email: true, photo: true, id: false },
    isOnline: true,
    isSuspended: false,
    lastActive: new Date(),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
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
    },
    subscription: { plan: 'free', status: 'active' },
    verification: { email: true, photo: false, id: false },
    isOnline: false,
    isSuspended: false,
    lastActive: new Date(Date.now() - 3600000),
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
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
    },
    subscription: { plan: 'pro', status: 'active' },
    verification: { email: true, photo: true, id: true },
    isOnline: true,
    isSuspended: false,
    lastActive: new Date(),
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
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
    },
    subscription: { plan: 'premium', status: 'active' },
    verification: { email: true, photo: true, id: false },
    isOnline: false,
    isSuspended: false,
    lastActive: new Date(Date.now() - 7200000),
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
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
    },
    subscription: { plan: 'free', status: 'active' },
    verification: { email: true, photo: false, id: false },
    isOnline: true,
    isSuspended: false,
    lastActive: new Date(),
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date(),
  },
];

const now = new Date();
const seedBlogPosts: BlogPost[] = [
  {
    id: uuidv4(),
    slug: 'welcome-to-neuronest',
    title: 'Welcome to NeuroNest',
    excerpt: 'Why we built a calmer, clearer social space for neurodivergent connection.',
    content: `NeuroNest is built to reduce ambiguity, lower social friction, and create a safer space for connection.\n\nWe focus on clear communication tools like tone tags, gentle pacing, and transparent preferences so people can meet with less stress and more clarity.`,
    tags: ['Product', 'Community'],
    status: 'published',
    authorId: seedUsers[0].id,
    createdAt: now,
    updatedAt: now,
    publishedAt: now
  },
  {
    id: uuidv4(),
    slug: 'how-tone-tags-help',
    title: 'How Tone Tags Help Conversations',
    excerpt: 'A quick guide on tone tags and when to use them.',
    content: `Tone tags make intent explicit. They help reduce misunderstandings in text-based communication and can make conversations feel safer.\n\nExamples include /j for joking, /srs for serious, and /nm for not mad.`,
    tags: ['Guides', 'Accessibility'],
    status: 'published',
    authorId: seedUsers[1].id,
    createdAt: now,
    updatedAt: now,
    publishedAt: now
  }
];

const seedCommunityPosts: CommunityPost[] = [
  {
    id: uuidv4(),
    title: 'Favorite ways to decompress after social time?',
    content: 'After a long day of socializing, I like quiet music and a short walk. What helps you reset?',
    tags: ['Self-care', 'Routines'],
    authorId: seedUsers[2].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: uuidv4(),
    title: 'Looking for book recommendations',
    content: 'Anyone have cozy sci-fi or fantasy recs?',
    tags: ['Books', 'SpecialInterests'],
    authorId: seedUsers[4].id,
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
      voiceMessages: false
    },
    subscription: {
      plan: 'free',
      status: 'active'
    },
    verification: {
      email: false,
      photo: false,
      id: false
    },
    isOnline: true,
    isSuspended: false,
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
