import { useEffect, useState } from 'react';
import { Camera, ShieldCheck, ShieldX, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { safetyApi, type SelfieVerification as SelfieVerificationType } from '@/lib/api/safety';
import { toast } from 'sonner';

export function SelfieVerification() {
  const [status, setStatus] = useState<SelfieVerificationType>({ status: 'none' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [poseStep, setPoseStep] = useState<'idle' | 'posing' | 'done'>('idle');

  useEffect(() => {
    safetyApi.getVerificationStatus().then((res) => {
      setStatus(res.selfieVerification);
    }).catch(() => {});
  }, []);

  const handleStartVerification = () => {
    setPoseStep('posing');
  };

  const handleCapture = async () => {
    setPoseStep('done');
    setIsSubmitting(true);
    try {
      // Stub: In production, capture actual camera frame
      const stubDataUrl = 'data:image/png;base64,stub-selfie-data';
      const res = await safetyApi.submitSelfieVerification(stubDataUrl, true);
      setStatus({
        status: res.status as SelfieVerificationType['status'],
        authenticityScore: res.authenticityScore
      });
      if (res.status === 'pending') {
        toast.info(res.message);
      } else if (res.status === 'verified') {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
      setPoseStep('idle');
    }
  };

  const statusConfig = {
    none: { icon: Camera, color: 'text-neutral-400', bg: 'bg-neutral-50', label: 'Not verified' },
    pending: { icon: Loader2, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Pending review' },
    verified: { icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50', label: 'Verified' },
    rejected: { icon: ShieldX, color: 'text-red-500', bg: 'bg-red-50', label: 'Not passed' },
  };

  const cfg = statusConfig[status.status];
  const StatusIcon = cfg.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          Selfie Verification
        </CardTitle>
        <p className="text-xs text-neutral-500">
          Verify your identity with a live selfie. Verified profiles get a trust shield badge.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current status */}
        <div className={`flex items-center gap-3 rounded-xl ${cfg.bg} p-4`}>
          <StatusIcon className={`w-8 h-8 ${cfg.color} ${status.status === 'pending' ? 'animate-spin' : ''}`} />
          <div>
            <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
            {status.authenticityScore !== undefined && (
              <p className="text-xs text-neutral-500">Authenticity score: {status.authenticityScore}%</p>
            )}
            {status.verifiedAt && (
              <p className="text-xs text-neutral-400">Verified {new Date(status.verifiedAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>

        {/* Pending review notice */}
        {status.status === 'pending' && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
            Your selfie is being reviewed by an admin. You'll be notified once it's approved.
          </div>
        )}

        {/* Verification flow */}
        {status.status !== 'verified' && status.status !== 'pending' && (
          <>
            {poseStep === 'idle' && (
              <>
                <Button onClick={handleStartVerification} className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  {status.status === 'rejected' ? 'Try again' : 'Start verification'}
                </Button>
                {status.status === 'rejected' && status.reviewNotes && (
                  <p className="text-xs text-red-500 mt-1">Reason: {status.reviewNotes}</p>
                )}
              </>
            )}

            {poseStep === 'posing' && (
              <div className="space-y-3">
                <div className="aspect-square max-w-[240px] mx-auto rounded-2xl bg-neutral-900 flex flex-col items-center justify-center text-white">
                  <Camera className="w-12 h-12 mb-3 opacity-60" />
                  <p className="text-sm font-medium">Camera preview</p>
                  <p className="text-xs text-neutral-400 mt-1">Look straight at the camera</p>
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-xs text-neutral-500">Follow the pose prompt:</p>
                  <Badge variant="outline" className="text-sm px-4 py-1">Turn your head slightly left</Badge>
                </div>
                <Button onClick={handleCapture} className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                  ) : (
                    <><Camera className="w-4 h-4 mr-2" /> Capture &amp; verify</>
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {status.status === 'verified' && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-700">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Your profile displays a trust shield badge visible to all matches.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
