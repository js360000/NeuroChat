import { api } from './client';

export const consentApi = {
  logConsent: async (payload: { analytics: boolean; marketing: boolean }) => {
    return api.post('/consent', payload);
  }
};
