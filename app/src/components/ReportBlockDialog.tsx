import { useState } from 'react';
import { Flag, Ban, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usersApi } from '@/lib/api/users';
import { toast } from 'sonner';

const REPORT_REASONS = [
  'Harassment or bullying',
  'Inappropriate or explicit content',
  'Spam or scam',
  'Fake profile / catfishing',
  'Threatening behaviour',
  'Hate speech or discrimination',
  'Unsolicited NSFW content',
  'Under-age user',
  'Other',
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUserName: string;
  mode: 'report' | 'block' | 'report-and-block';
  onComplete?: () => void;
}

export function ReportBlockDialog({ open, onOpenChange, targetUserId, targetUserName, mode, onComplete }: Props) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'confirm-block'>('form');

  const showReport = mode === 'report' || mode === 'report-and-block';
  const showBlock = mode === 'block' || mode === 'report-and-block';

  const handleSubmit = async () => {
    if (showReport && !reason) {
      toast.error('Please select a reason');
      return;
    }
    setSubmitting(true);
    try {
      if (showReport) {
        await usersApi.reportUser(targetUserId, reason, details || undefined);
        toast.success('Report submitted — our moderation team will review it.');
      }
      if (showBlock) {
        await usersApi.blockUser(targetUserId);
        toast.success(`${targetUserName} has been blocked.`);
      }
      onOpenChange(false);
      setReason('');
      setDetails('');
      setStep('form');
      onComplete?.();
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlockOnly = async () => {
    setSubmitting(true);
    try {
      await usersApi.blockUser(targetUserId);
      toast.success(`${targetUserName} has been blocked.`);
      onOpenChange(false);
      setStep('form');
      onComplete?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to block user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setReason('');
      setDetails('');
      setStep('form');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {mode === 'block' && step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-500" />
                Block {targetUserName}?
              </DialogTitle>
              <DialogDescription>
                They won't be able to see your profile, message you, or appear in your discovery feed. They won't be notified.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>This action can be undone later from your Settings page.</span>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleBlockOnly} disabled={submitting}>
                <Ban className="w-4 h-4 mr-2" />
                {submitting ? 'Blocking...' : 'Block User'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" />
                {mode === 'report-and-block' ? 'Report & Block' : 'Report'} {targetUserName}
              </DialogTitle>
              <DialogDescription>
                Our moderation team will review your report. {mode === 'report-and-block' ? 'The user will also be blocked.' : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason</label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Additional details (optional)</label>
                <Textarea
                  placeholder="Provide any additional context that may help our team..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex items-start gap-2 text-xs text-neutral-500">
                <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Reports are confidential. The reported user will not know who reported them.</span>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleSubmit} disabled={submitting || !reason}>
                <Flag className="w-4 h-4 mr-2" />
                {submitting ? 'Submitting...' : mode === 'report-and-block' ? 'Report & Block' : 'Submit Report'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
