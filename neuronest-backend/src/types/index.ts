export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  neurodivergentTraits: string[];
  specialInterests: string[];
  communicationPreferences: {
    preferredToneTags: string[];
    responseTime: 'immediate' | 'flexible' | 'async';
    directnessLevel: 'direct' | 'gentle' | 'balanced';
  };
  subscription: {
    tier: 'free' | 'premium' | 'professional';
    expiresAt?: string;
  };
  verification: {
    email: boolean;
    phone: boolean;
    identity: boolean;
  };
}

export interface Match {
  id: string;
  userId1: string;
  userId2: string;
  compatibilityScore: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  toneTag?: string;
  createdAt: string;
  readAt?: string;
}

export interface Conversation {
  id: string;
  userId1: string;
  userId2: string;
  createdAt: string;
  updatedAt: string;
}
