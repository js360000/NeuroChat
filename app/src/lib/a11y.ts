export type ThemeMode = 'light' | 'dark';

export interface A11ySettings {
  theme: ThemeMode;
  highContrast: boolean;
  largeText: boolean;
  dyslexicFont: boolean;
  underlineLinks: boolean;
  reduceMotion: boolean;
  focusRing: boolean;
  fontSize: number;        // 80–150 (percentage)
  lineHeight: number;      // 1.2–2.4
  letterSpacing: number;   // 0–0.2 (em)
  blueLightFilter: boolean;
  saturation: number;      // 0–150 (percentage)
  cursorSize: number;      // 1–3 (multiplier)
}

const STORAGE_KEY = 'neuronest_a11y';

export const DEFAULT_SETTINGS: A11ySettings = {
  theme: 'light',
  highContrast: false,
  largeText: false,
  dyslexicFont: false,
  underlineLinks: false,
  reduceMotion: false,
  focusRing: false,
  fontSize: 100,
  lineHeight: 1.6,
  letterSpacing: 0,
  blueLightFilter: false,
  saturation: 100,
  cursorSize: 1
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
      focusRing: Boolean(parsed.focusRing),
      fontSize: parsed.fontSize ?? DEFAULT_SETTINGS.fontSize,
      lineHeight: parsed.lineHeight ?? DEFAULT_SETTINGS.lineHeight,
      letterSpacing: parsed.letterSpacing ?? DEFAULT_SETTINGS.letterSpacing,
      blueLightFilter: Boolean(parsed.blueLightFilter),
      saturation: parsed.saturation ?? DEFAULT_SETTINGS.saturation,
      cursorSize: parsed.cursorSize ?? DEFAULT_SETTINGS.cursorSize
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

  // Boolean toggles
  root.classList.toggle('dark', settings.theme === 'dark');
  root.classList.toggle('a11y-high-contrast', settings.highContrast);
  root.classList.toggle('a11y-large-text', settings.largeText);
  root.classList.toggle('a11y-dyslexic', settings.dyslexicFont);
  root.classList.toggle('a11y-underline-links', settings.underlineLinks);
  root.classList.toggle('a11y-reduce-motion', settings.reduceMotion);
  root.classList.toggle('a11y-focus', settings.focusRing);
  root.classList.toggle('a11y-blue-light', settings.blueLightFilter);
  root.style.colorScheme = settings.theme;

  // CSS custom property–driven sliders
  root.style.setProperty('--a11y-font-size', `${settings.fontSize}%`);
  root.style.setProperty('--a11y-line-height', `${settings.lineHeight}`);
  root.style.setProperty('--a11y-letter-spacing', `${settings.letterSpacing}em`);
  root.style.setProperty('--a11y-saturation', `${settings.saturation}%`);
  root.style.setProperty('--a11y-cursor-size', `${settings.cursorSize}`);
}
