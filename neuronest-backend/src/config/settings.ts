export interface AdminSettings {
  siteName: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxMatchesPerDay: number;
  aiExplanationsEnabled: boolean;
}

let settings: AdminSettings = {
  siteName: 'NeuroNest',
  maintenanceMode: false,
  registrationEnabled: true,
  maxMatchesPerDay: 20,
  aiExplanationsEnabled: true
};

export function getSettings(): AdminSettings {
  return settings;
}

export function updateSettings(updates: Partial<AdminSettings>): AdminSettings {
  settings = { ...settings, ...updates };
  return settings;
}
