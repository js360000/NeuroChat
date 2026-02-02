import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OfflineNotice() {
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-50 px-4">
      <div className="mx-auto max-w-3xl rounded-xl border border-border bg-background/95 px-4 py-2 shadow-card backdrop-blur flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <WifiOff className="w-4 h-4 text-neutral-500" />
          You are offline. Some features may be unavailable.
        </div>
        <Button size="sm" variant="outline" onClick={() => setOffline(!navigator.onLine)}>
          Retry
        </Button>
      </div>
    </div>
  );
}
