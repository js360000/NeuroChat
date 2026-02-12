import { useEffect, useRef, useState } from 'react';
import { Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/lib/stores/auth';
import { pagesApi, type PublicAdConfig } from '@/lib/api/pages';
import { cn } from '@/lib/utils';

let cachedAdConfig: PublicAdConfig | null = null;
let configPromise: Promise<PublicAdConfig> | null = null;
let adsenseScriptLoaded = false;

function loadAdConfig(): Promise<PublicAdConfig> {
  if (cachedAdConfig) return Promise.resolve(cachedAdConfig);
  if (configPromise) return configPromise;
  configPromise = pagesApi.getAds().then((data: PublicAdConfig) => {
    cachedAdConfig = data;
    return cachedAdConfig;
  }).catch(() => {
    const fallback: PublicAdConfig = { enabled: false, clientId: '', showToFreeOnly: true, slots: [] };
    cachedAdConfig = fallback;
    return fallback;
  });
  return configPromise;
}

function ensureAdsenseScript(clientId: string) {
  if (adsenseScriptLoaded || !clientId) return;
  adsenseScriptLoaded = true;
  const script = document.createElement('script');
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
  script.async = true;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

interface AdBannerProps {
  area: string;
  className?: string;
}

export function AdBanner({ area, className }: AdBannerProps) {
  const { user } = useAuthStore();
  const [config, setConfig] = useState<PublicAdConfig | null>(cachedAdConfig);
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    loadAdConfig().then(setConfig);
  }, []);

  useEffect(() => {
    if (!config?.enabled || !config.clientId) return;
    ensureAdsenseScript(config.clientId);
  }, [config]);

  const slot = config?.slots.find((s) => s.area === area);

  // Don't render if ads disabled, no matching slot, or premium user with showToFreeOnly
  const isPremium = user?.subscription?.plan === 'premium' || user?.subscription?.plan === 'pro';
  if (!config?.enabled || !slot) return null;
  if (config.showToFreeOnly && isPremium) return null;

  // Push the ad unit after render
  useEffect(() => {
    if (pushed.current || !adRef.current || !slot) return;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded yet — safe to ignore
    }
  }, [slot]);

  const formatClass = slot.format === 'sidebar'
    ? 'min-h-[250px]'
    : slot.format === 'in-feed'
      ? 'min-h-[100px]'
      : 'min-h-[90px]';

  return (
    <div className={cn('relative rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden', formatClass, className)}>
      <ins
        ref={adRef}
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={config.clientId}
        data-ad-slot={slot.adSlotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <div className="absolute bottom-1 right-2 flex items-center gap-1.5 text-[10px] text-neutral-400">
        <span>Ad</span>
        {!isPremium && (
          <Link to="/pricing" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Crown className="w-3 h-3" />
            Go ad-free
          </Link>
        )}
      </div>
    </div>
  );
}
