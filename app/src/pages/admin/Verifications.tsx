import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldX, Clock, RotateCcw, Eye, CheckCircle, XCircle } from 'lucide-react';
import { adminApi, type SelfieVerificationEntry } from '@/lib/api/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

type FilterStatus = 'all' | 'pending' | 'verified' | 'rejected';

export function AdminVerifications() {
  const [verifications, setVerifications] = useState<SelfieVerificationEntry[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadVerifications();
  }, [filter]);

  const loadVerifications = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getVerifications(filter === 'all' ? undefined : filter);
      setVerifications(res.verifications);
      setPendingCount(res.pending);
    } catch {
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminApi.approveVerification(userId, reviewNotes || undefined);
      toast.success('Verification approved');
      setSelectedUserId(null);
      setReviewNotes('');
      loadVerifications();
    } catch {
      toast.error('Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminApi.rejectVerification(userId, reviewNotes || undefined);
      toast.success('Verification rejected');
      setSelectedUserId(null);
      setReviewNotes('');
      loadVerifications();
    } catch {
      toast.error('Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReset = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminApi.resetVerification(userId);
      toast.success('Verification reset — user can re-submit');
      setSelectedUserId(null);
      loadVerifications();
    } catch {
      toast.error('Failed to reset');
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'verified':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><ShieldCheck className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><ShieldX className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const selected = selectedUserId ? verifications.find((v) => v.userId === selectedUserId) : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Selfie Verifications</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Review and approve user selfie verification requests
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-yellow-500 text-white text-sm px-3 py-1">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'pending', 'verified', 'rejected'] as FilterStatus[]).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? 'default' : 'outline'}
            onClick={() => setFilter(s)}
            className="capitalize"
          >
            {s}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <Card><CardContent className="p-8 text-center text-neutral-500">Loading...</CardContent></Card>
          ) : verifications.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-neutral-500">No verifications found.</CardContent></Card>
          ) : (
            verifications.map((v) => (
              <Card
                key={v.userId}
                className={`cursor-pointer transition-shadow hover:shadow-md ${selectedUserId === v.userId ? 'ring-2 ring-primary' : ''}`}
                onClick={() => { setSelectedUserId(v.userId); setReviewNotes(''); }}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={v.avatar} />
                    <AvatarFallback>{v.userName?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{v.userName}</span>
                      {statusBadge(v.status)}
                    </div>
                    <p className="text-xs text-neutral-500 truncate">{v.email}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                      {v.authenticityScore !== undefined && (
                        <span>Score: <strong className={v.authenticityScore >= 70 ? 'text-green-600' : 'text-red-600'}>{v.authenticityScore}%</strong></span>
                      )}
                      {v.submittedAt && (
                        <span>Submitted: {new Date(v.submittedAt).toLocaleDateString()}</span>
                      )}
                      {v.verifiedAt && (
                        <span>Verified: {new Date(v.verifiedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedUserId(v.userId); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Detail / Review Panel */}
        <div className="lg:col-span-1">
          {selected ? (
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Review Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selected.avatar} />
                    <AvatarFallback>{selected.userName?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selected.userName}</p>
                    <p className="text-xs text-neutral-500">{selected.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">Status:</span>
                  {statusBadge(selected.status)}
                </div>

                {selected.authenticityScore !== undefined && (
                  <div>
                    <span className="text-sm text-neutral-600">AI Authenticity Score:</span>
                    <div className="mt-1 h-3 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${selected.authenticityScore >= 70 ? 'bg-green-500' : selected.authenticityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${selected.authenticityScore}%` }}
                      />
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">{selected.authenticityScore}% match confidence</p>
                  </div>
                )}

                {/* Selfie preview */}
                {selected.selfieDataUrl && (
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Submitted Selfie:</p>
                    <img
                      src={selected.selfieDataUrl}
                      alt="Selfie verification"
                      className="w-full rounded-lg border border-neutral-200"
                    />
                  </div>
                )}

                {selected.submittedAt && (
                  <p className="text-xs text-neutral-500">
                    Submitted: {new Date(selected.submittedAt).toLocaleString()}
                  </p>
                )}

                {selected.reviewNotes && (
                  <div className="rounded-md bg-neutral-50 border border-neutral-200 p-2.5 text-xs text-neutral-600">
                    <strong>Review notes:</strong> {selected.reviewNotes}
                  </div>
                )}

                {selected.reviewedBy && selected.verifiedAt && (
                  <p className="text-xs text-neutral-500">
                    Reviewed on {new Date(selected.verifiedAt).toLocaleString()}
                  </p>
                )}

                {/* Admin actions */}
                {selected.status === 'pending' && (
                  <div className="space-y-3 pt-2 border-t">
                    <textarea
                      className="w-full text-sm border border-neutral-200 rounded-md p-2 resize-none"
                      rows={2}
                      placeholder="Review notes (optional)"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        disabled={actionLoading === selected.userId}
                        onClick={() => handleApprove(selected.userId)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        disabled={actionLoading === selected.userId}
                        onClick={() => handleReject(selected.userId)}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                )}

                {(selected.status === 'verified' || selected.status === 'rejected') && (
                  <div className="pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={actionLoading === selected.userId}
                      onClick={() => handleReset(selected.userId)}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" /> Reset (allow re-submission)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-neutral-500 text-sm">
                Select a verification to review
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
