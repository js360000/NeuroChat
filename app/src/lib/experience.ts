export type CalmDensity = 'cozy' | 'balanced' | 'compact';

export interface ExperiencePreferences {
  calmMode: number;
  density: CalmDensity;
  reduceMotion: boolean;
  reduceSaturation: boolean;
  moodTheme?: 'calm' | 'warm' | 'crisp';
}

export const DEFAULT_EXPERIENCE_PREFERENCES: ExperiencePreferences = {
  calmMode: 20,
  density: 'balanced',
  reduceMotion: false,
  reduceSaturation: false,
  moodTheme: 'calm'
};

export function normalizeExperiencePreferences(
  preferences?: Partial<ExperiencePreferences>
): ExperiencePreferences {
  const calmValue = Math.max(0, Math.min(100, preferences?.calmMode ?? DEFAULT_EXPERIENCE_PREFERENCES.calmMode));
  return {
    calmMode: calmValue,
    density: preferences?.density ?? DEFAULT_EXPERIENCE_PREFERENCES.density,
    reduceMotion: Boolean(preferences?.reduceMotion),
    reduceSaturation: Boolean(preferences?.reduceSaturation),
    moodTheme: preferences?.moodTheme ?? DEFAULT_EXPERIENCE_PREFERENCES.moodTheme
  };
}

export function applyExperiencePreferences(preferences?: Partial<ExperiencePreferences>) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const resolved = normalizeExperiencePreferences(preferences);
  const calmLevel = resolved.calmMode / 100;

  root.style.setProperty('--calm-level', String(calmLevel));
  root.style.setProperty('--calm-level-percent', String(resolved.calmMode));

  root.classList.toggle('calm-mode', resolved.calmMode > 0);
  root.classList.toggle('calm-density-cozy', resolved.density === 'cozy');
  root.classList.toggle('calm-density-compact', resolved.density === 'compact');
  root.classList.toggle('calm-density-balanced', resolved.density === 'balanced');
  root.classList.toggle('calm-reduce-motion', resolved.reduceMotion);
  root.classList.toggle('calm-low-sat', resolved.reduceSaturation);
  root.classList.toggle('mood-calm', resolved.moodTheme === 'calm');
  root.classList.toggle('mood-warm', resolved.moodTheme === 'warm');
  root.classList.toggle('mood-crisp', resolved.moodTheme === 'crisp');
}
