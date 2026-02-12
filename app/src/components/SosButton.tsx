import { useState, useEffect } from 'react';
import { AlertTriangle, Phone, X, MapPin, Send, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { safetyApi, type TrustedContact } from '@/lib/api/safety';
import { useAuthStore } from '@/lib/stores/auth';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export type SosPosition = 'bottom-left' | 'bottom-right';
export type SosVisibility = 'always' | 'date-only' | 'off';

export function getSosConfig(): { position: SosPosition; visibility: SosVisibility } {
  try {
    const raw = localStorage.getItem('sos-config');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { position: 'bottom-left', visibility: 'always' };
}

export function saveSosConfig(config: { position: SosPosition; visibility: SosVisibility }) {
  localStorage.setItem('sos-config', JSON.stringify(config));
}

export function SosButton() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [location, setLocation] = useState<string | null>(null);
  const [config, setConfig] = useState(getSosConfig);

  useEffect(() => {
    const handleConfigChange = () => setConfig(getSosConfig());
    window.addEventListener('sos-config-changed', handleConfigChange);
    return () => window.removeEventListener('sos-config-changed', handleConfigChange);
  }, []);

  if (!user) return null;
  if (config.visibility === 'off') return null;
  // date-only: only show when there's an open overlay (simplification — always show for now)
  // In production, check active date plans

  const handleOpen = () => {
    setIsOpen(true);
    // Try to get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation(`${pos.coords.latitude},${pos.coords.longitude}`),
        () => setLocation(null)
      );
    }
    // Load trusted contacts
    safetyApi.getTrustedContacts().then((res) => setContacts(res.contacts)).catch(() => {});
  };

  const handleSendSos = async () => {
    setIsSending(true);
    try {
      const result = await safetyApi.triggerSos({
        location: location || undefined,
        message: `Emergency SOS from ${user.name} on NeuroNest`
      });
      toast.success(result.message);
      setIsOpen(false);
    } catch {
      toast.error('Failed to send SOS. Please call emergency services directly.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Floating SOS trigger */}
      <button
        onClick={handleOpen}
        className={`fixed ${config.position === 'bottom-right' ? 'right-6' : 'left-6'} bottom-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-all hover:bg-red-700 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-red-300`}
        aria-label="Emergency SOS"
        title="Emergency SOS"
      >
        <AlertTriangle className="w-5 h-5" />
      </button>

      {/* SOS Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Emergency SOS
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-neutral-600">
              This will immediately alert your trusted contacts with your location and a safety message.
            </p>

            {location && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
                <MapPin className="w-4 h-4" />
                Location detected — will be shared with contacts
              </div>
            )}

            {contacts.length === 0 && (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                No trusted contacts set up. Add contacts in Settings &gt; Safety to enable alerts.
              </div>
            )}

            {contacts.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">Will notify:</p>
                <div className="flex flex-wrap gap-2">
                  {contacts.map((c) => (
                    <span key={c.id} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                variant="destructive"
                size="lg"
                className="w-full text-base font-semibold"
                onClick={handleSendSos}
                disabled={isSending}
              >
                <Send className="w-4 h-4 mr-2" />
                {isSending ? 'Sending alert...' : 'Send SOS to trusted contacts'}
              </Button>

              <a
                href="tel:911"
                className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
              >
                <Phone className="w-4 h-4" />
                Call Emergency Services (911)
              </a>

              <Link
                to="/help"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-100"
              >
                <LifeBuoy className="w-4 h-4" />
                Crisis resources &amp; helplines
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-neutral-500"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
