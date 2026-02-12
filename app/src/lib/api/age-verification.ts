import { api } from './client';

export interface AgeVerificationStatus {
  required: boolean;
  enabled: boolean;
  isVerified: boolean;
  verifiedAt: string | null;
  verificationMethod: string | null;
  withinGracePeriod: boolean;
  minimumAge: number;
  enabledMethods: string[];
  provider: string;
}

export interface AgeVerificationResult {
  verified: boolean;
  method: string;
  verifiedAt: string;
}

export const ageVerificationApi = {
  getStatus: async () => {
    return api.get<AgeVerificationStatus>('/age-verification/status');
  },

  verify: async (method: string, data?: { token?: string; cardLast4?: string; mobileNumber?: string }) => {
    return api.post<AgeVerificationResult>('/age-verification/verify', { method, ...data });
  },

  getPublicConfig: async () => {
    return api.get<{ enabled: boolean; minimumAge: number; enabledMethods: string[]; provider: string }>('/age-verification/config');
  }
};
