import { api } from './client';

export interface Subscription {
  plan: 'free' | 'premium' | 'pro';
  status: 'active' | 'cancelled' | 'past_due';
  expiresAt?: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  created: string;
}

export const paymentsApi = {
  createCheckout: async (plan: 'premium' | 'pro', billing: 'monthly' | 'yearly') => {
    return api.post<{ sessionId: string; url: string }>('/payments/checkout', {
      plan,
      billing
    });
  },

  verifyCheckout: async (sessionId: string) => {
    return api.get<{ status: string; plan?: string }>(`/payments/checkout/${sessionId}`);
  },

  getSubscription: async () => {
    return api.get<{ subscription: Subscription }>('/payments/subscription');
  },

  createPortalSession: async () => {
    return api.post<{ url: string }>('/payments/portal', {});
  },

  cancelSubscription: async () => {
    return api.post<{ success: boolean; message: string }>('/payments/cancel', {});
  },

  getPaymentHistory: async () => {
    return api.get<{ payments: Payment[] }>('/payments/history');
  }
};
