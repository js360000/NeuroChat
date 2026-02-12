import { api } from './client';

export interface SitePage {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  updatedAt: string;
}

export interface ExperimentSettings {
  landingHeroVariant: 'default' | 'calm' | 'bold';
  onboardingToneVariant: 'gentle' | 'direct';
  discoveryIntentVariant: 'cards' | 'list';
  compassCtaVariant: 'standard' | 'mentor';
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

export interface AppConfig {
  traitOptions: string[];
  interestOptions: string[];
  goalOptions: string[];
  paceOptions: string[];
  directnessOptions: string[];
  pricingPlans: PricingPlan[];
  crisisResources: Record<string, CrisisResource[]>;
}

export interface PublicAdSlot {
  id: string;
  area: string;
  format: 'banner' | 'sidebar' | 'in-feed';
  adSlotId: string;
}

export interface PublicAdConfig {
  enabled: boolean;
  clientId: string;
  showToFreeOnly: boolean;
  slots: PublicAdSlot[];
}

export const pagesApi = {
  getConfig: async () => {
    return api.get<{ config: AppConfig }>('/pages/config');
  },

  getPage: async (slug: string) => {
    return api.get<{ page: SitePage }>(`/pages/${slug}`);
  },

  getPages: async () => {
    return api.get<{ pages: SitePage[] }>('/pages');
  },

  getExperiments: async () => {
    return api.get<{ experiments: ExperimentSettings }>('/pages/experiments');
  },

  getAds: async () => {
    return api.get<PublicAdConfig>('/pages/ads');
  },

  getBranding: async () => {
    return api.get<{ siteName: string; themeColor: string }>('/pages/branding');
  }
};
