import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { consentApi } from '@/lib/api/consent';

const STORAGE_KEY = 'neuronest_cookie_consent';
const CONSENT_VERSION = '2.0';

type ConsentState = {
  analytics: boolean;
  marketing: boolean;
};

export type StoredConsent = ConsentState & {
  version: string;
  timestamp: string;
};

export function getStoredConsent(): StoredConsent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredConsent;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ConsentState>({
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored || stored.version !== CONSENT_VERSION) {
      setIsOpen(true);
      if (stored) {
        setSettings({ analytics: stored.analytics, marketing: stored.marketing });
      }
      return;
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('neuronest:open-consent', handler);
    return () => window.removeEventListener('neuronest:open-consent', handler);
  }, []);

  const saveConsent = async (next: ConsentState) => {
    const payload: StoredConsent = {
      ...next,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString()
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setIsOpen(false);
    try {
      await consentApi.logConsent({
        analytics: next.analytics,
        marketing: next.marketing,
        version: CONSENT_VERSION
      });
    } catch {
      // Best-effort logging
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 px-4" role="dialog" aria-label="Cookie consent">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-background/95 p-6 shadow-card backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Your Privacy Matters</span>
              <Badge variant="secondary">GDPR</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              We use essential cookies for authentication and security (legal basis: legitimate interest).
              Optional cookies require your explicit consent under GDPR Art. 6(1)(a).
              You can change your preferences anytime.{' '}
              <Link to="/privacy" className="text-primary hover:underline font-medium">
                Privacy Policy
              </Link>
              {' · '}
              <Link to="/terms" className="text-primary hover:underline font-medium">
                Terms of Service
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => saveConsent({ analytics: false, marketing: false })}
            >
              Reject optional
            </Button>
            <Button onClick={() => saveConsent({ analytics: true, marketing: true })}>
              Accept all
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-3">
            <p className="text-sm font-medium">Essential</p>
            <p className="text-xs text-muted-foreground">
              Authentication, CSRF protection, session management, and your saved preferences. Cannot be disabled.
            </p>
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
            <p className="text-xs text-muted-foreground">
              Anonymised usage data to improve features. No personal data shared with third parties.
            </p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Marketing</p>
              <Switch
                checked={settings.marketing}
                onCheckedChange={(value) => setSettings((prev) => ({ ...prev, marketing: value }))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Personalised outreach via email or social. You can unsubscribe anytime.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Consent v{CONSENT_VERSION} · Logged server-side for audit compliance
          </p>
          <Button variant="outline" onClick={() => saveConsent(settings)}>
            Save preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
