import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { consentApi } from '@/lib/api/consent';

const STORAGE_KEY = 'neuronest_cookie_consent';

type ConsentState = {
  analytics: boolean;
  marketing: boolean;
};

export function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ConsentState>({
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsOpen(true);
      return;
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('neuronest:open-consent', handler);
    return () => window.removeEventListener('neuronest:open-consent', handler);
  }, []);

  const saveConsent = async (next: ConsentState) => {
    const payload = {
      ...next,
      timestamp: new Date().toISOString()
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setIsOpen(false);
    try {
      await consentApi.logConsent({ analytics: next.analytics, marketing: next.marketing });
    } catch {
      // Best-effort logging
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 px-4">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-background/95 p-6 shadow-card backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Cookies</Badge>
              <span className="text-sm font-semibold">Help us improve NeuroNest</span>
            </div>
            <p className="text-sm text-neutral-600">
              We use essential cookies for sign-in and security. Optional analytics and marketing
              cookies help us understand usage and improve outreach.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => saveConsent({ analytics: false, marketing: false })}
            >
              Necessary only
            </Button>
            <Button onClick={() => saveConsent({ analytics: true, marketing: true })}>
              Accept all
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-3">
            <p className="text-sm font-medium">Essential</p>
            <p className="text-xs text-neutral-500">Required for login, security, and preferences.</p>
            <Badge className="mt-2 bg-primary/10 text-primary">Always on</Badge>
          </div>
          <div className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Analytics</p>
              <Switch
                checked={settings.analytics}
                onCheckedChange={(value) => setSettings((prev) => ({ ...prev, analytics: value }))}
              />
            </div>
            <p className="text-xs text-neutral-500">Understand how people use the platform.</p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Marketing</p>
              <Switch
                checked={settings.marketing}
                onCheckedChange={(value) => setSettings((prev) => ({ ...prev, marketing: value }))}
              />
            </div>
            <p className="text-xs text-neutral-500">Tailor campaigns and social outreach.</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => saveConsent(settings)}>
            Save preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
