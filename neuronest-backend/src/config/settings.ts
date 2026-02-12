export interface AdminSettings {
  siteName: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxMatchesPerDay: number;
  aiExplanationsEnabled: boolean;
}

export interface ExperimentSettings {
  landingHeroVariant: 'default' | 'calm' | 'bold';
  onboardingToneVariant: 'gentle' | 'direct';
  discoveryIntentVariant: 'cards' | 'list';
  compassCtaVariant: 'standard' | 'mentor';
}

export interface N8nConfig {
  baseUrl: string;
  apiKey: string;
  apiVersion: number;
  webhookUrl: string;
  enabled: boolean;
}

export interface PricingPlan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  cta: string;
  featured: boolean;
}

export interface CrisisResource {
  name: string;
  description: string;
  contact: string;
}

export interface BoundaryPresetTemplate {
  id: string;
  text: string;
  category: 'pacing' | 'communication' | 'physical' | 'emotional' | 'sensory';
}

export interface PassportPresetTemplate {
  id: string;
  text: string;
  category: 'literal' | 'processing' | 'tone' | 'pacing' | 'sensory' | 'custom';
}

export interface ManipulationPattern {
  type: 'love-bombing' | 'gaslighting' | 'negging' | 'coercion' | 'pressure' | 'manipulation';
  keywords: string[];
  description: string;
  learnMoreUrl: string;
}

export interface ExitTemplate {
  id: string;
  label: string;
  message: string;
  category: 'emergency' | 'polite' | 'boundary' | 'custom';
}

export interface AdSlot {
  id: string;
  label: string;
  area: string;        // e.g. 'dashboard', 'messages', 'community', 'blog', 'games', 'landing'
  format: 'banner' | 'sidebar' | 'in-feed';
  adSlotId: string;    // AdSense ad-slot ID (data-ad-slot)
  enabled: boolean;
}

export interface AdConfig {
  adsenseClientId: string;  // e.g. 'ca-pub-XXXXXXXXXXXXXXXX'
  globalEnabled: boolean;   // master kill-switch
  showToFreeOnly: boolean;  // only show to free-plan users (default true)
  slots: AdSlot[];
}

export interface AppConfig {
  traitOptions: string[];
  interestOptions: string[];
  goalOptions: string[];
  paceOptions: string[];
  directnessOptions: string[];
  pricingPlans: PricingPlan[];
  crisisResources: Record<string, CrisisResource[]>;
  boundaryPresets: BoundaryPresetTemplate[];
  passportPresets: PassportPresetTemplate[];
  manipulationPatterns: ManipulationPattern[];
  exitTemplates: ExitTemplate[];
}

let appConfig: AppConfig = {
  traitOptions: [
    'Autism', 'ADHD', 'Dyslexia', 'Dyspraxia', 'Dyscalculia',
    'OCD', 'Anxiety', 'CPTSD', 'Tourette', 'Bipolar',
    'Executive dysfunction', 'Sensory sensitivity', 'Sensory Processing'
  ],
  interestOptions: [
    'Gaming', 'Art', 'Music', 'Science', 'Books',
    'Nature', 'Technology', 'Anime', 'Design', 'Cooking',
    'Writing', 'Photography', 'Fitness', 'Film', 'History'
  ],
  goalOptions: [
    'Friendship', 'Dating', 'Creative collaborators', 'Study buddies',
    'Accountability partners', 'Community events', 'Co-working', 'Local meetups'
  ],
  paceOptions: ['slow', 'balanced', 'fast'],
  directnessOptions: ['gentle', 'direct'],
  pricingPlans: [
    {
      name: 'Basic',
      description: 'Perfect for getting started',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: ['Create a full profile', 'Browse and match (10 likes/day)', 'Basic messaging', 'Community access', 'Safety features', 'Connection queue (3 slots)'],
      cta: 'Current Plan',
      featured: false
    },
    {
      name: 'Premium',
      description: 'Best for active daters',
      monthlyPrice: 12,
      yearlyPrice: 8,
      features: [
        'Everything in Basic', '50 likes per day', '3 Super Likes per day',
        'See who liked you', 'Rewind last swipe', 'Advanced filters',
        'Priority inbox', 'AI Message Explanations', 'Tone Tags',
        'Connection queue (10 slots)', 'Profile boosts (2/month)'
      ],
      cta: 'Upgrade to Premium',
      featured: true
    },
    {
      name: 'Pro',
      description: 'For serious connections',
      monthlyPrice: 24,
      yearlyPrice: 18,
      features: [
        'Everything in Premium', 'Unlimited likes', '10 Super Likes per day',
        'Incognito mode', 'Connection queue (25 slots)',
        'Profile boosts (4/month)', 'Profile consultation',
        'Video messaging', 'Exclusive events'
      ],
      cta: 'Go Pro',
      featured: false
    }
  ],
  boundaryPresets: [
    { id: 'b1', text: 'I prefer slow-paced conversations', category: 'pacing' },
    { id: 'b2', text: 'Please no phone or video calls without asking first', category: 'communication' },
    { id: 'b3', text: 'I need time to process before replying', category: 'pacing' },
    { id: 'b4', text: 'I prefer text over voice messages', category: 'communication' },
    { id: 'b5', text: 'Please avoid sarcasm — I may take things literally', category: 'communication' },
    { id: 'b6', text: 'I may need to end conversations abruptly — it is not personal', category: 'emotional' },
    { id: 'b7', text: 'Loud or crowded places are hard for me', category: 'sensory' },
    { id: 'b8', text: 'Physical touch is something I need to warm up to', category: 'physical' },
    { id: 'b9', text: 'I appreciate advance notice before meeting in person', category: 'pacing' },
    { id: 'b10', text: 'Please do not pressure me for personal details early on', category: 'emotional' },
    { id: 'b11', text: 'I may go quiet — it does not mean I lost interest', category: 'emotional' },
    { id: 'b12', text: 'Strong scents and perfumes are overwhelming for me', category: 'sensory' },
  ],
  passportPresets: [
    { id: 'pp1', text: 'I take things literally', category: 'literal' },
    { id: 'pp2', text: 'I need extra processing time', category: 'processing' },
    { id: 'pp3', text: 'Please don\'t use sarcasm with me', category: 'tone' },
    { id: 'pp4', text: 'I prefer direct communication', category: 'tone' },
    { id: 'pp5', text: 'I may not pick up on hints — please be explicit', category: 'literal' },
    { id: 'pp6', text: 'I sometimes hyperfocus and lose track of time', category: 'processing' },
    { id: 'pp7', text: 'Loud environments make it hard for me to think', category: 'sensory' },
    { id: 'pp8', text: 'I communicate better in writing than speaking', category: 'tone' },
    { id: 'pp9', text: 'My tone in text may seem flat — I promise I care', category: 'tone' },
    { id: 'pp10', text: 'I need breaks during long conversations', category: 'pacing' },
    { id: 'pp11', text: 'I may repeat myself — it helps me process', category: 'processing' },
    { id: 'pp12', text: 'Eye contact is hard for me but I am still listening', category: 'sensory' },
  ],
  manipulationPatterns: [
    {
      type: 'love-bombing',
      keywords: ['soulmate', 'never felt this way', 'you complete me', 'move in together', 'meant to be', 'can\'t live without', 'obsessed with you', 'perfect for each other'],
      description: 'Excessive flattery or declarations of love very early in a relationship to gain control.',
      learnMoreUrl: '/help#love-bombing'
    },
    {
      type: 'gaslighting',
      keywords: ['you\'re imagining', 'that never happened', 'you\'re too sensitive', 'you\'re crazy', 'no one else thinks that', 'you\'re overreacting', 'I never said that'],
      description: 'Making you doubt your own perception, memory, or sanity.',
      learnMoreUrl: '/help#gaslighting'
    },
    {
      type: 'negging',
      keywords: ['for someone like you', 'you\'d be prettier if', 'no offense but', 'just being honest', 'most people wouldn\'t', 'you\'re lucky I'],
      description: 'Backhanded compliments or subtle insults designed to undermine confidence.',
      learnMoreUrl: '/help#negging'
    },
    {
      type: 'coercion',
      keywords: ['if you loved me', 'prove it', 'everyone else does', 'you owe me', 'after everything I did', 'don\'t you trust me'],
      description: 'Using guilt, obligation, or emotional leverage to pressure compliance.',
      learnMoreUrl: '/help#coercion'
    },
    {
      type: 'pressure',
      keywords: ['just this once', 'come on', 'don\'t be like that', 'loosen up', 'stop overthinking', 'why won\'t you', 'just do it'],
      description: 'Persistent attempts to override your boundaries or comfort level.',
      learnMoreUrl: '/help#pressure'
    },
    {
      type: 'manipulation',
      keywords: ['I\'ll hurt myself if', 'you\'re the only one', 'no one else will', 'silent treatment', 'fine whatever', 'I guess I\'m just not good enough'],
      description: 'Using emotional threats or withdrawal to control your behaviour.',
      learnMoreUrl: '/help#manipulation'
    }
  ],
  exitTemplates: [
    { id: 'e1', label: 'Family emergency', message: 'Hey, I just got a call — family emergency. I need to head out right now. So sorry!', category: 'emergency' },
    { id: 'e2', label: 'Feeling unwell', message: 'I\'m really sorry but I\'m not feeling well suddenly. I think I need to head home. Can we reschedule?', category: 'polite' },
    { id: 'e3', label: 'Pet needs me', message: 'My roommate just texted — my dog/cat needs to go to the vet. I need to go. Sorry about this!', category: 'emergency' },
    { id: 'e4', label: 'Early morning', message: 'I just realized I have a really early morning tomorrow and I should probably head out. Thanks for tonight!', category: 'polite' },
    { id: 'e5', label: 'Boundary reset', message: 'I appreciate you meeting up, but I\'m going to call it a night. I hope you understand.', category: 'boundary' },
    { id: 'e6', label: 'Need to recharge', message: 'I\'ve had a lovely time but my social battery is running low. I need to head out and recharge.', category: 'boundary' },
    { id: 'e7', label: 'Work emergency', message: 'I just got an urgent work message I need to deal with. So sorry — I have to run!', category: 'emergency' },
    { id: 'e8', label: 'Honest exit', message: 'I want to be honest — I\'m not feeling a connection, but I really appreciate you coming out tonight.', category: 'boundary' },
  ],
  crisisResources: {
    us: [
      { name: '988 Lifeline', description: 'Crisis support (US)', contact: 'Call or text 988' },
      { name: 'Crisis Text Line', description: 'Text support', contact: 'Text HOME to 741741' },
      { name: 'SAMHSA', description: 'Treatment referral', contact: '1-800-662-HELP' }
    ],
    uk: [
      { name: 'Samaritans', description: '24/7 support', contact: 'Call 116 123' },
      { name: 'Mind', description: 'Mental health advice', contact: '0300 123 3393' }
    ],
    ca: [
      { name: 'Talk Suicide Canada', description: '24/7 support', contact: '1-833-456-4566' },
      { name: 'Crisis Services Canada', description: 'Text support', contact: 'Text 45645' }
    ],
    other: [
      { name: 'Local emergency services', description: 'Immediate danger', contact: 'Call local emergency number' },
      { name: 'Local crisis hotline', description: 'Find a local line', contact: 'Search: "crisis hotline + your country"' }
    ]
  }
};

export function getAppConfig(): AppConfig {
  return appConfig;
}

export function updateAppConfig(updates: Partial<AppConfig>): AppConfig {
  appConfig = { ...appConfig, ...updates };
  return appConfig;
}

let adConfig: AdConfig = {
  adsenseClientId: '',
  globalEnabled: false,
  showToFreeOnly: true,
  slots: [
    { id: 'ad-dashboard-sidebar', label: 'Dashboard Sidebar', area: 'dashboard', format: 'sidebar', adSlotId: '', enabled: false },
    { id: 'ad-messages-sidebar', label: 'Messages Sidebar', area: 'messages', format: 'sidebar', adSlotId: '', enabled: false },
    { id: 'ad-community-feed', label: 'Community In-Feed', area: 'community', format: 'in-feed', adSlotId: '', enabled: false },
    { id: 'ad-blog-banner', label: 'Blog Banner', area: 'blog', format: 'banner', adSlotId: '', enabled: false },
    { id: 'ad-games-banner', label: 'Games Banner', area: 'games', format: 'banner', adSlotId: '', enabled: false },
    { id: 'ad-landing-banner', label: 'Landing Page Banner', area: 'landing', format: 'banner', adSlotId: '', enabled: false },
  ]
};

export function getAdConfig(): AdConfig {
  return adConfig;
}

export function updateAdConfig(updates: Partial<AdConfig>): AdConfig {
  if (updates.slots) {
    adConfig.slots = updates.slots;
  }
  if (updates.adsenseClientId !== undefined) adConfig.adsenseClientId = updates.adsenseClientId;
  if (updates.globalEnabled !== undefined) adConfig.globalEnabled = updates.globalEnabled;
  if (updates.showToFreeOnly !== undefined) adConfig.showToFreeOnly = updates.showToFreeOnly;
  return adConfig;
}

let settings: AdminSettings = {
  siteName: 'NeuroNest',
  maintenanceMode: false,
  registrationEnabled: true,
  maxMatchesPerDay: 20,
  aiExplanationsEnabled: true
};

let experiments: ExperimentSettings = {
  landingHeroVariant: 'calm',
  onboardingToneVariant: 'gentle',
  discoveryIntentVariant: 'cards',
  compassCtaVariant: 'standard'
};

let n8nConfig: N8nConfig = {
  baseUrl: process.env.N8N_BASE_URL || '',
  apiKey: process.env.N8N_API_KEY || '',
  apiVersion: Number(process.env.N8N_API_VERSION) || 1,
  webhookUrl: process.env.N8N_WEBHOOK_URL || '',
  enabled: process.env.N8N_ENABLED === 'true'
};

export function getSettings(): AdminSettings {
  return settings;
}

export function updateSettings(updates: Partial<AdminSettings>): AdminSettings {
  settings = { ...settings, ...updates };
  return settings;
}

export function getExperiments(): ExperimentSettings {
  return experiments;
}

export function updateExperiments(updates: Partial<ExperimentSettings>): ExperimentSettings {
  experiments = { ...experiments, ...updates };
  return experiments;
}

export function getN8nConfig(): N8nConfig {
  return n8nConfig;
}

export function updateN8nConfig(updates: Partial<N8nConfig>): N8nConfig {
  n8nConfig = { ...n8nConfig, ...updates };
  if (updates.baseUrl !== undefined) {
    process.env.N8N_BASE_URL = updates.baseUrl;
  }
  if (updates.apiKey !== undefined) {
    process.env.N8N_API_KEY = updates.apiKey;
  }
  if (updates.apiVersion !== undefined) {
    process.env.N8N_API_VERSION = String(updates.apiVersion);
  }
  if (updates.webhookUrl !== undefined) {
    process.env.N8N_WEBHOOK_URL = updates.webhookUrl;
  }
  if (updates.enabled !== undefined) {
    process.env.N8N_ENABLED = updates.enabled ? 'true' : 'false';
  }
  return n8nConfig;
}
