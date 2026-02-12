import { create } from 'zustand';
import { pagesApi } from '@/lib/api/pages';

interface BrandingStore {
  siteName: string;
  themeColor: string;
  loaded: boolean;
  fetchBranding: () => Promise<void>;
  setSiteName: (name: string) => void;
  setThemeColor: (color: string) => void;
}

/**
 * Convert a hex color like "#7c3aed" to an HSL string "263 91% 59%"
 * used by Tailwind CSS variables.
 */
function hexToHsl(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return `0 0% ${Math.round(l * 100)}%`;
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let hue = 0;
  if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) hue = ((b - r) / d + 2) / 6;
  else hue = ((r - g) / d + 4) / 6;

  return `${Math.round(hue * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyThemeColor(hex: string) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  const hsl = hexToHsl(hex);
  const root = document.documentElement;
  root.style.setProperty('--primary', hsl);
  root.style.setProperty('--ring', hsl);
  root.style.setProperty('--sidebar-primary', hsl);
  root.style.setProperty('--sidebar-ring', hsl);
  // Update meta theme-color for mobile browsers
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', hex);
}

export const useBrandingStore = create<BrandingStore>((set, get) => ({
  siteName: 'NeuroNest',
  themeColor: '#7c3aed',
  loaded: false,
  fetchBranding: async () => {
    if (get().loaded) return;
    try {
      const data = await pagesApi.getBranding();
      set({ siteName: data.siteName, themeColor: data.themeColor, loaded: true });
      applyThemeColor(data.themeColor);
      document.title = `${data.siteName} - Neurodivergent Dating, Friendship & Community`;
    } catch {
      set({ loaded: true });
    }
  },
  setSiteName: (name: string) => {
    set({ siteName: name });
    document.title = `${name} - Neurodivergent Dating, Friendship & Community`;
  },
  setThemeColor: (color: string) => {
    set({ themeColor: color });
    applyThemeColor(color);
  }
}));

export function useSiteName(): string {
  const { siteName, fetchBranding, loaded } = useBrandingStore();
  if (!loaded) fetchBranding();
  return siteName;
}

export function useThemeColor(): string {
  const { themeColor, fetchBranding, loaded } = useBrandingStore();
  if (!loaded) fetchBranding();
  return themeColor;
}
