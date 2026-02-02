export interface AdminSettings {
  siteName: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxMatchesPerDay: number;
  aiExplanationsEnabled: boolean;
}

export interface N8nConfig {
  baseUrl: string;
  apiKey: string;
  apiVersion: number;
  webhookUrl: string;
  enabled: boolean;
}

let settings: AdminSettings = {
  siteName: 'NeuroNest',
  maintenanceMode: false,
  registrationEnabled: true,
  maxMatchesPerDay: 20,
  aiExplanationsEnabled: true
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
