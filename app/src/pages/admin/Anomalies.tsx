import { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/api/admin';
import { toast } from 'sonner';

type AnomalyData = {
  totals: { totalReports: number; pending: number; last24h: number };
  topReporters: { id: string; name: string; count: number }[];
  topTargets: { id: string; count: number }[];
  reasons: { reason: string; count: number }[];
  suspiciousReporters: { id: string; name: string; count: number }[];
  suspiciousTargets: { id: string; count: number }[];
};

export function AdminAnomalies() {
  const [data, setData] = useState<AnomalyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnomalies = async () => {
    try {
      const response = await adminApi.getAnomalies();
      setData(response);
    } catch {
      toast.error('Failed to load anomaly signals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnomalies();
  }, []);

  if (isLoading) {
    return <div className="p-6 text-neutral-500">Loading anomaly signals...</div>;
  }

  if (!data) {
    return <div className="p-6 text-neutral-500">No data available.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          Abuse Anomaly Signals
        </h1>
        <p className="text-sm text-neutral-500">Early warning signals from reports and moderation activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total reports</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{data.totals.totalReports}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending reports</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{data.totals.pending}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Last 24h</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{data.totals.last24h}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top reporters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topReporters.length === 0 ? (
              <p className="text-sm text-neutral-500">No reports yet.</p>
            ) : (
              data.topReporters.map((reporter) => (
                <div key={reporter.id} className="flex items-center justify-between">
                  <span>{reporter.name}</span>
                  <Badge variant="secondary">{reporter.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top targets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topTargets.length === 0 ? (
              <p className="text-sm text-neutral-500">No report targets yet.</p>
            ) : (
              data.topTargets.map((target) => (
                <div key={target.id} className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">{target.id}</span>
                  <Badge variant="secondary">{target.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reason breakdown</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {data.reasons.length === 0 ? (
            <p className="text-sm text-neutral-500">No report reasons available.</p>
          ) : (
            data.reasons.map((reason) => (
              <Badge key={reason.reason} variant="outline">
                {reason.reason}: {reason.count}
              </Badge>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Suspicious reporters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.suspiciousReporters.length === 0 ? (
              <p className="text-sm text-neutral-500">No flagged reporters.</p>
            ) : (
              data.suspiciousReporters.map((reporter) => (
                <div key={reporter.id} className="flex items-center justify-between">
                  <span>{reporter.name}</span>
                  <Badge variant="destructive">{reporter.count} reports</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Suspicious targets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.suspiciousTargets.length === 0 ? (
              <p className="text-sm text-neutral-500">No flagged targets.</p>
            ) : (
              data.suspiciousTargets.map((target) => (
                <div key={target.id} className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">{target.id}</span>
                  <Badge variant="destructive">{target.count} reports</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
