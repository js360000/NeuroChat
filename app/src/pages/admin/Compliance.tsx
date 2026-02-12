import { useEffect, useState } from 'react';
import { Download, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { adminApi, type ConsentLog } from '@/lib/api/admin';
import { toast } from 'sonner';

export function AdminCompliance() {
  const [logs, setLogs] = useState<ConsentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ analytics: false, marketing: false });

  useEffect(() => {
    loadLogs();
  }, [filters.analytics, filters.marketing]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getConsentLogs({
        analytics: filters.analytics ? 'true' : undefined,
        marketing: filters.marketing ? 'true' : undefined,
        limit: 100
      });
      setLogs(response.logs);
    } catch {
      toast.error('Failed to load consent logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await adminApi.exportConsentLogs();
      const blob = new Blob([JSON.stringify(response.logs, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cookie-consent-logs.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export logs');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Compliance
          </h1>
          <p className="text-sm text-neutral-500">Review cookie consent logs and data preferences.</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export JSON
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consent filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={filters.analytics}
              onCheckedChange={(value) => setFilters((prev) => ({ ...prev, analytics: value }))}
            />
            <span className="text-sm text-neutral-600">Analytics enabled</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={filters.marketing}
              onCheckedChange={(value) => setFilters((prev) => ({ ...prev, marketing: value }))}
            />
            <span className="text-sm text-neutral-600">Marketing enabled</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consent logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-neutral-500">Loading logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-neutral-500">No consent logs yet.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="rounded-xl border border-neutral-200 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium">{new Date(log.createdAt).toLocaleString()}</div>
                  <div className="flex items-center gap-2">
                    <Badge className={log.analytics ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}>
                      Analytics {log.analytics ? 'On' : 'Off'}
                    </Badge>
                    <Badge className={log.marketing ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}>
                      Marketing {log.marketing ? 'On' : 'Off'}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-neutral-500">
                  {log.ip} • {log.userAgent}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
