import { api } from './client';

export interface ConsentPayload {
  analytics: boolean;
  marketing: boolean;
  version: string;
  healthDataConsent?: boolean;
}

export const consentApi = {
  logConsent: async (payload: ConsentPayload) => {
    return api.post('/consent', payload);
  }
};
