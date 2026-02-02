export type ThemeMode = 'light' | 'dark';

export interface A11ySettings {
  theme: ThemeMode;
  highContrast: boolean;
  largeText: boolean;
  dyslexicFont: boolean;
  underlineLinks: boolean;
  reduceMotion: boolean;
  focusRing: boolean;
}

const STORAGE_KEY = 'neuronest_a11y';

const DEFAULT_SETTINGS: A11ySettings = {
  theme: 'light',
  highContrast: false,
  largeText: false,
  dyslexicFont: false,
  underlineLinks: false,
  reduceMotion: false,
  focusRing: false
};

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function loadA11ySettings(): A11ySettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_SETTINGS, theme: getSystemTheme() };
    }
    const parsed = JSON.parse(stored) as Partial<A11ySettings>;
    return {
      ...DEFAULT_SETTINGS,
      theme: parsed.theme || getSystemTheme(),
      highContrast: Boolean(parsed.highContrast),
      largeText: Boolean(parsed.largeText),
      dyslexicFont: Boolean(parsed.dyslexicFont),
      underlineLinks: Boolean(parsed.underlineLinks),
      reduceMotion: Boolean(parsed.reduceMotion),
      focusRing: Boolean(parsed.focusRing)
    };
  } catch {
    return { ...DEFAULT_SETTINGS, theme: getSystemTheme() };
  }
}

export function saveA11ySettings(settings: A11ySettings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function applyA11ySettings(settings: A11ySettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', settings.theme === 'dark');
  root.classList.toggle('a11y-high-contrast', settings.highContrast);
  root.classList.toggle('a11y-large-text', settings.largeText);
  root.classList.toggle('a11y-dyslexic', settings.dyslexicFont);
  root.classList.toggle('a11y-underline-links', settings.underlineLinks);
  root.classList.toggle('a11y-reduce-motion', settings.reduceMotion);
  root.classList.toggle('a11y-focus', settings.focusRing);
  root.style.colorScheme = settings.theme;
}
