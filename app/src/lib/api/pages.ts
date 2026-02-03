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

export const pagesApi = {
  getPage: async (slug: string) => {
    return api.get<{ page: SitePage }>(`/pages/${slug}`);
  },

  getPages: async () => {
    return api.get<{ pages: SitePage[] }>('/pages');
  },

  getExperiments: async () => {
    return api.get<{ experiments: ExperimentSettings }>('/pages/experiments');
  }
};
