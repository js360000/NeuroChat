import { useEffect, useState } from 'react';
import { Shield, CheckCircle2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { adminApi, type Report } from '@/lib/api/admin';
import { toast } from 'sonner';

export function AdminModeration() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'reviewed' | 'resolved' | 'all'>('pending');

  const loadReports = async () => {
    try {
      const response = await adminApi.getReports({ status: statusFilter });
      setReports(response.reports);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const handleReview = async (id: string) => {
    try {
      await adminApi.reviewReport(id);
      loadReports();
    } catch {
      toast.error('Failed to update report');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await adminApi.resolveReport(id);
      loadReports();
    } catch {
      toast.error('Failed to resolve report');
    }
  };

  if (isLoading) {
    return <div className="p-6 text-neutral-500">Loading reports...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Moderation Queue
          </h1>
          <p className="text-sm text-neutral-500">Review reports and take action.</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
          <option value="all">All</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reports.length === 0 ? (
            <p className="text-sm text-neutral-500">No reports found.</p>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="rounded-xl border border-neutral-200 p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-neutral-600">
                    <span className="font-medium">{report.reporter?.name ?? 'Unknown'}</span> reported{' '}
                    <span className="font-medium">{report.targetType.replace('_', ' ')}</span>
                  </div>
                  <Badge variant="secondary">{report.status}</Badge>
                </div>
                <p className="text-sm text-neutral-700">{report.reason}</p>
                {report.description && <p className="text-xs text-neutral-500">{report.description}</p>}
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                  <span>Target ID: {report.targetId}</span>
                  <span>-</span>
                  <span>{new Date(report.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => handleReview(report.id)}>
                    <Eye className="w-4 h-4 mr-1" />
                    Mark Reviewed
                  </Button>
                  <Button size="sm" onClick={() => handleResolve(report.id)}>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Resolve
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
