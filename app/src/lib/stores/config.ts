import { create } from 'zustand';
import { pagesApi, type AppConfig } from '@/lib/api/pages';

interface ConfigStore {
  config: AppConfig | null;
  isLoading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
}

const FALLBACK: AppConfig = {
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
      name: 'Basic', description: 'Perfect for getting started',
      monthlyPrice: 0, yearlyPrice: 0,
      features: ['Create a full profile', 'Browse and match', 'Basic messaging', 'Community access', 'Safety features'],
      cta: 'Current Plan', featured: false
    },
    {
      name: 'Premium', description: 'Best for active daters',
      monthlyPrice: 12, yearlyPrice: 8,
      features: ['Everything in Basic', 'AI Message Explanations', 'Tone Tags', 'See who liked you', 'Unlimited likes', 'Advanced filters', 'Priority support', 'Profile boosts (2/month)'],
      cta: 'Upgrade to Premium', featured: true
    },
    {
      name: 'Pro', description: 'For serious connections',
      monthlyPrice: 24, yearlyPrice: 18,
      features: ['Everything in Premium', 'Video messaging', 'Incognito mode', 'Travel mode', 'Weekly boosts (4/month)', 'Profile consultation', 'Exclusive events'],
      cta: 'Go Pro', featured: false
    }
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

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: null,
  isLoading: false,
  error: null,
  fetchConfig: async () => {
    if (get().config || get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const response = await pagesApi.getConfig();
      set({ config: response.config, isLoading: false });
    } catch {
      set({ config: FALLBACK, isLoading: false, error: 'Using offline defaults' });
    }
  }
}));

export function useAppConfig(): AppConfig {
  const { config, fetchConfig } = useConfigStore();
  if (!config) {
    fetchConfig();
    return FALLBACK;
  }
  return config;
}
