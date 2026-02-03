import { api } from './client';

export interface AIExplanation {
  tone: string;
  confidence: number;
  hiddenMeanings: string[];
  suggestions: string[];
  socialCues: string[];
}

export interface AISummary {
  summary: string;
  highlights: string[];
}

export interface AIRephrase {
  gentle: string;
  direct: string;
}

export const aiApi = {
  explainMessage: async (message: string, toneTag?: string, context?: string) => {
    return api.post<{ explanation: AIExplanation }>('/ai/explain', {
      message,
      toneTag,
      context
    });
  },

  getSuggestions: async (userInterests: string[], myInterests: string[], previousMessages?: { sender: string; content: string }[]) => {
    return api.post<{ suggestions: string[] }>('/ai/suggestions', {
      userInterests,
      myInterests,
      previousMessages
    });
  },

  getCompatibility: async (
    user1Traits: string[],
    user1Interests: string[],
    user2Traits: string[],
    user2Interests: string[]
  ) => {
    return api.post<{
      compatibility: {
        score: number;
        commonInterests: string[];
        commonTraits: string[];
        analysis: string;
      }
    }>('/ai/compatibility', {
      user1Traits,
      user1Interests,
      user2Traits,
      user2Interests
    });
  },

  summarizeConversation: async (messages: { sender: string; content: string }[]) => {
    return api.post<{ summary: AISummary }>('/ai/summary', { messages });
  },

  rephraseMessage: async (message: string) => {
    return api.post<{ rephrase: AIRephrase }>('/ai/rephrase', { message });
  }
};
