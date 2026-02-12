import { useEffect, useState } from 'react';
import { Shield, CheckCircle2, Eye, Ban, UserX, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { adminApi, type Report } from '@/lib/api/admin';
import { toast } from 'sonner';

export function AdminModeration() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'reviewed' | 'resolved' | 'all'>('pending');
  const [banDialog, setBanDialog] = useState<{ userId: string; userName: string } | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banning, setBanning] = useState(false);

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

  const handleBan = async () => {
    if (!banDialog || !banReason.trim()) return;
    setBanning(true);
    try {
      await adminApi.banUser(banDialog.userId, banReason);
      toast.success(`${banDialog.userName} has been banned`);
      setBanDialog(null);
      setBanReason('');
    } catch {
      toast.error('Failed to ban user');
    } finally {
      setBanning(false);
    }
  };

  const handleUnban = async (userId: string, name: string) => {
    try {
      await adminApi.unbanUser(userId);
      toast.success(`${name} has been unbanned`);
    } catch {
      toast.error('Failed to unban user');
    }
  };

  if (isLoading) {
    return <div className="p-6 text-neutral-500">Loading reports...</div>;
  }

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Moderation Queue
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-xs">{pendingCount} pending</Badge>
            )}
          </h1>
          <p className="text-sm text-neutral-500">Review reports, take action, ban or unban users.</p>
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
          <CardTitle>Reports ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reports.length === 0 ? (
            <p className="text-sm text-neutral-500">No reports found.</p>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="rounded-xl border border-neutral-200 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-neutral-600">
                    <span className="font-medium">{report.reporter?.name ?? 'Unknown'}</span> reported{' '}
                    <Badge variant="outline" className="text-[10px]">{report.targetType.replace('_', ' ')}</Badge>
                  </div>
                  <Badge
                    variant={report.status === 'pending' ? 'destructive' : report.status === 'reviewed' ? 'secondary' : 'outline'}
                  >
                    {report.status}
                  </Badge>
                </div>
                <div className="rounded-lg bg-neutral-50 p-3 space-y-1">
                  <p className="text-sm font-medium text-neutral-700">{report.reason}</p>
                  {report.description && <p className="text-xs text-neutral-500">{report.description}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                  <span>Target: <code className="bg-neutral-100 px-1 rounded text-[10px]">{report.targetId}</code></span>
                  <span>•</span>
                  <span>{new Date(report.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {report.status === 'pending' && (
                    <Button size="sm" variant="outline" onClick={() => handleReview(report.id)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Mark Reviewed
                    </Button>
                  )}
                  {report.status !== 'resolved' && (
                    <Button size="sm" variant="outline" onClick={() => handleResolve(report.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Resolve
                    </Button>
                  )}
                  {report.targetType === 'user' && (
                    <>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setBanDialog({ userId: report.targetId, userName: `User ${report.targetId.slice(0, 8)}` })}
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Ban User
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleUnban(report.targetId, `User ${report.targetId.slice(0, 8)}`)}
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Unban
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={!!banDialog} onOpenChange={(open) => { if (!open) { setBanDialog(null); setBanReason(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-500" />
              Ban User
            </DialogTitle>
            <DialogDescription>
              Banning this user will prevent them from logging in. They will see the ban reason and appeal instructions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ban Reason</label>
              <Input
                placeholder="e.g. Repeated harassment and violation of community guidelines"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
              <p className="text-xs text-neutral-400">This will be shown to the user when they attempt to log in.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setBanDialog(null); setBanReason(''); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleBan} disabled={banning || !banReason.trim()}>
              {banning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ban className="w-4 h-4 mr-2" />}
              {banning ? 'Banning...' : 'Confirm Ban'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
