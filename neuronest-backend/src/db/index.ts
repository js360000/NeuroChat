import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  bio?: string;
  avatar?: string;
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
  reportedId: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
}

const hashedPassword = bcrypt.hashSync('password123', 10);

const seedUsers: User[] = [
  {
    id: uuidv4(),
    email: 'alex.chen@email.com',
    password: hashedPassword,
    name: 'Alex Chen',
    bio: 'Software developer who loves building things and playing strategy games.',
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

export const db = {
  users: [...seedUsers],
  matches: [] as Match[],
  conversations: [] as Conversation[],
  messages: [] as Message[],
  likes: [] as Like[],
  blocks: [] as Block[],
  reports: [] as Report[],
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
