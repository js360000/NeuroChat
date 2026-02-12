import { api } from './client';

export interface TrustedContact {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  relationship: string;
  createdAt: string;
}

export interface DatePlan {
  id: string;
  userId: string;
  matchName: string;
  location: string;
  scheduledAt: string;
  durationMinutes: number;
  trustedContactIds: string[];
  status: 'upcoming' | 'active' | 'checked-in' | 'alert-sent' | 'completed' | 'cancelled';
  checkInBy?: string;
  checkedInAt?: string;
  moodCheckIn?: 'great' | 'okay' | 'not-great' | 'need-support';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SosEvent {
  id: string;
  userId: string;
  location?: string;
  datePlanId?: string;
  message?: string;
  contactsNotified: string[];
  createdAt: string;
}

export interface TrustLevelInfo {
  trustLevel: number;
  autoLevel: number;
  isOverridden: boolean;
  messageCount: number;
  features: {
    textMessages: boolean;
    images: boolean;
    voiceNotes: boolean;
    videoChat: boolean;
    locationSharing: boolean;
    contactExchange: boolean;
    label: string;
    nextUnlock: {
      level: number;
      features: string[];
      hint: string;
    } | null;
  };
}

export const safetyApi = {
  // Trusted Contacts
  getTrustedContacts: async () => {
    return api.get<{ contacts: TrustedContact[] }>('/safety/trusted-contacts');
  },

  addTrustedContact: async (data: { name: string; phone?: string; email?: string; relationship: string }) => {
    return api.post<{ contact: TrustedContact }>('/safety/trusted-contacts', data);
  },

  removeTrustedContact: async (id: string) => {
    return api.delete(`/safety/trusted-contacts/${id}`);
  },

  // Date Plans
  getDatePlans: async () => {
    return api.get<{ plans: DatePlan[] }>('/safety/date-plans');
  },

  createDatePlan: async (data: {
    matchName: string;
    location: string;
    scheduledAt: string;
    durationMinutes: number;
    trustedContactIds?: string[];
    notes?: string;
  }) => {
    return api.post<{ plan: DatePlan }>('/safety/date-plans', data);
  },

  checkInDatePlan: async (id: string, mood?: string) => {
    return api.patch<{ plan: DatePlan }>(`/safety/date-plans/${id}/check-in`, { mood });
  },

  completeDatePlan: async (id: string, mood?: string) => {
    return api.patch<{ plan: DatePlan }>(`/safety/date-plans/${id}/complete`, { mood });
  },

  cancelDatePlan: async (id: string) => {
    return api.patch<{ plan: DatePlan }>(`/safety/date-plans/${id}/cancel`, {});
  },

  // SOS
  triggerSos: async (data: { location?: string; datePlanId?: string; message?: string }) => {
    return api.post<{
      sosEvent: SosEvent;
      contactsNotified: { id: string; name: string }[];
      message: string;
    }>('/safety/sos', data);
  },

  getSosHistory: async () => {
    return api.get<{ events: SosEvent[] }>('/safety/sos/history');
  },

  // Trust Levels
  getTrustLevel: async (conversationId: string) => {
    return api.get<TrustLevelInfo>(`/safety/trust-level/${conversationId}`);
  },

  setTrustLevel: async (conversationId: string, level: number | null) => {
    return api.patch<TrustLevelInfo>(`/safety/trust-level/${conversationId}`, { level });
  },

  // ─── AI Conversation Guardian ───────────────────────────────
  getGuardianSettings: async () => {
    return api.get<{ sensitivity: 'off' | 'subtle' | 'active' }>('/safety/guardian/settings');
  },

  updateGuardianSettings: async (sensitivity: 'off' | 'subtle' | 'active') => {
    return api.patch<{ sensitivity: string }>('/safety/guardian/settings', { sensitivity });
  },

  getGuardianFlags: async () => {
    return api.get<{ flags: MessageFlagEnriched[] }>('/safety/guardian/flags');
  },

  dismissGuardianFlag: async (id: string) => {
    return api.patch<{ success: boolean }>(`/safety/guardian/flags/${id}/dismiss`, {});
  },

  getGuardianReport: async () => {
    return api.get<GuardianReport>('/safety/guardian/report');
  },

  // ─── Social Energy Meter ────────────────────────────────────
  getEnergy: async () => {
    return api.get<{ energy: SocialEnergy }>('/safety/energy');
  },

  updateEnergy: async (data: Partial<SocialEnergy>) => {
    return api.patch<{ energy: SocialEnergy; autoPauseSuggested: boolean }>('/safety/energy', data);
  },

  acceptAutoPause: async () => {
    return api.post<{ paused: boolean; message: string }>('/safety/energy/auto-pause', {});
  },

  // ─── Communication Style Passport ──────────────────────────
  getPassportPresets: async () => {
    return api.get<{ presets: PassportPreset[] }>('/safety/passport/presets');
  },

  getPassport: async (userId: string) => {
    return api.get<{ items: PassportItemEnriched[]; userName: string }>(`/safety/passport/${userId}`);
  },

  updatePassport: async (items: PassportItem[]) => {
    return api.put<{ items: PassportItem[] }>('/safety/passport', { items });
  },

  endorsePassportItem: async (userId: string, passportItemId: string) => {
    return api.post<{ endorsement: { id: string } }>(`/safety/passport/${userId}/endorse`, { passportItemId });
  },

  // ─── Boundary Presets & Templates ──────────────────────────
  getBoundaryPresets: async () => {
    return api.get<{ presets: BoundaryPresetTemplate[] }>('/safety/boundaries/presets');
  },

  getBoundaries: async () => {
    return api.get<{ boundaries: UserBoundary[] }>('/safety/boundaries');
  },

  updateBoundaries: async (boundaries: UserBoundary[]) => {
    return api.put<{ boundaries: UserBoundary[] }>('/safety/boundaries', { boundaries });
  },

  getBoundariesFor: async (userId: string) => {
    return api.get<{ boundaries: { text: string; visibility: string }[]; userName: string }>(`/safety/boundaries/for/${userId}`);
  },

  checkBoundaries: async (targetUserId: string, content: string) => {
    return api.post<{ nudges: BoundaryNudge[] }>('/safety/boundaries/check', { targetUserId, content });
  },

  // ─── P2: Sensory Profile ──────────────────────────────────────
  getSensoryProfile: async (userId: string) => {
    return api.get<{ sensoryProfile: SensoryProfile; userName: string }>(`/safety/sensory/${userId}`);
  },

  updateSensoryProfile: async (data: Partial<SensoryProfile>) => {
    return api.put<{ sensoryProfile: SensoryProfile }>('/safety/sensory', data);
  },

  getVenueSuggestions: async (userId1: string, userId2: string) => {
    return api.post<{ suggestions: VenueSuggestion[] }>('/safety/sensory/venue-suggestions', { userId1, userId2 });
  },

  // ─── P2: Selfie Verification ─────────────────────────────────
  submitSelfieVerification: async (selfieDataUrl: string, poseCompleted: boolean) => {
    return api.post<{ status: string; authenticityScore: number; message: string }>('/safety/verification/selfie', { selfieDataUrl, poseCompleted });
  },

  getVerificationStatus: async () => {
    return api.get<{ selfieVerification: SelfieVerification; verification: Record<string, boolean> }>('/safety/verification/status');
  },

  // ─── P2: Masking Fatigue Tracker ──────────────────────────────
  createMaskingLog: async (data: MaskingLogInput) => {
    return api.post<{ log: MaskingLog }>('/safety/masking/log', data);
  },

  getMaskingLogs: async () => {
    return api.get<{ logs: MaskingLog[] }>('/safety/masking/logs');
  },

  getMaskingInsights: async () => {
    return api.get<{ insights: MaskingInsights | null; message?: string }>('/safety/masking/insights');
  },

  // ─── P2: Exit Strategy Toolkit ────────────────────────────────
  getExitTemplates: async () => {
    return api.get<{ templates: ExitTemplate[] }>('/safety/exit/templates');
  },

  sendExitText: async (data: { templateId?: string; customMessage?: string; recipientType?: string }) => {
    return api.post<{ sent: boolean; message: string; to: string }>('/safety/exit/send', data);
  },

  scheduleRescueCall: async (data: { scheduledAt: string; message?: string; datePlanId?: string }) => {
    return api.post<{ call: RescueCall }>('/safety/exit/rescue-call', data);
  },

  getRescueCalls: async () => {
    return api.get<{ calls: RescueCall[] }>('/safety/exit/rescue-calls');
  },

  cancelRescueCall: async (id: string) => {
    return api.patch<{ call: RescueCall }>(`/safety/exit/rescue-call/${id}/cancel`, {});
  },

  // ─── P2: Stim-Friendly Interaction ────────────────────────────
  getStimPreferences: async () => {
    return api.get<{ stimPreferences: StimPreferences }>('/safety/stim/preferences');
  },

  updateStimPreferences: async (data: Partial<StimPreferences>) => {
    return api.patch<{ stimPreferences: StimPreferences }>('/safety/stim/preferences', data);
  },

  sendDoodle: async (conversationId: string, dataUrl: string) => {
    return api.post<{ doodle: DoodleEntry }>('/safety/stim/doodle', { conversationId, dataUrl });
  },

  getDoodles: async (conversationId: string) => {
    return api.get<{ doodles: DoodleEntry[] }>(`/safety/stim/doodles/${conversationId}`);
  },

  voiceToText: async (audioDataUrl: string) => {
    return api.post<{ text: string; detectedTone: string; suggestedToneTag: string }>('/safety/stim/voice-to-text', { audioDataUrl });
  }
};

// ─── P1 Types ─────────────────────────────────────────────────

export interface MessageFlagEnriched {
  id: string;
  messageId: string;
  conversationId: string;
  recipientId: string;
  patternType: string;
  confidence: number;
  snippet: string;
  dismissed: boolean;
  description: string;
  learnMoreUrl: string;
  createdAt: string;
}

export interface GuardianReport {
  total: number;
  dismissed: number;
  active: number;
  byType: Record<string, number>;
}

export interface SocialEnergy {
  level: number;
  label: 'full' | 'medium' | 'low' | 'recharging';
  showOnProfile: boolean;
  autoPauseThreshold: number;
  updatedAt?: string;
}

export interface PassportPreset {
  id: string;
  text: string;
  category: string;
}

export interface PassportItem {
  id: string;
  text: string;
  category: string;
  isPreset: boolean;
  endorsements: number;
}

export interface PassportItemEnriched extends PassportItem {
  endorsedBy: { name: string; id: string }[];
}

export interface BoundaryPresetTemplate {
  id: string;
  text: string;
  category: string;
}

export interface UserBoundary {
  id: string;
  text: string;
  visibility: 'all' | 'matches' | 'private';
  isPreset: boolean;
  active: boolean;
}

export interface BoundaryNudge {
  boundary: string;
  hint: string;
}

// ─── P2 Types ─────────────────────────────────────────────────

export interface SensoryProfile {
  noise: number;
  light: number;
  foodTexture: number;
  crowds: number;
  touch: number;
  scents: number;
}

export interface VenueSuggestion {
  venue: string;
  reason: string;
  score: number;
}

export interface SelfieVerification {
  status: 'none' | 'pending' | 'verified' | 'rejected';
  authenticityScore?: number;
  verifiedAt?: string;
  reviewNotes?: string;
}

export interface MaskingLogInput {
  intensity: 1 | 2 | 3 | 4 | 5;
  context: 'conversation' | 'date' | 'social' | 'work' | 'other';
  contextRef?: string;
  energyBefore: number;
  energyAfter: number;
  notes?: string;
  tags?: string[];
}

export interface MaskingLog extends MaskingLogInput {
  id: string;
  userId: string;
  tags: string[];
  createdAt: string;
}

export interface MaskingInsights {
  totalLogs: number;
  recentLogs: number;
  avgIntensity: number;
  avgEnergyDrain: number;
  byContext: Record<string, { count: number; avgIntensity: number; avgDrain: number }>;
  mostDraining: { context: string; count: number; avgIntensity: number; avgDrain: number } | null;
  leastDraining: { context: string; count: number; avgIntensity: number; avgDrain: number } | null;
}

export interface ExitTemplate {
  id: string;
  label: string;
  message: string;
  category: 'emergency' | 'polite' | 'boundary' | 'custom';
}

export interface RescueCall {
  id: string;
  userId: string;
  datePlanId?: string;
  scheduledAt: string;
  message: string;
  status: 'scheduled' | 'fired' | 'cancelled';
  createdAt: string;
}

export interface StimPreferences {
  hapticIntensity: 'off' | 'light' | 'medium' | 'strong';
  doodleMode: boolean;
  fidgetReactions: boolean;
  voiceToText: boolean;
}

export interface DoodleEntry {
  id: string;
  conversationId: string;
  senderId: string;
  dataUrl: string;
  createdAt: string;
}
