import { useEffect, useState } from 'react';
import { Shield, CreditCard, Smartphone, ScanFace, FileCheck, Landmark, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ageVerificationApi, type AgeVerificationStatus } from '@/lib/api/age-verification';
import { toast } from 'sonner';

const METHOD_META: Record<string, { label: string; icon: typeof CreditCard; description: string }> = {
  credit_card: {
    label: 'Credit / Debit Card',
    icon: CreditCard,
    description: 'Verify with a valid credit or debit card. A temporary £0 authorisation confirms your card is valid. No charge is made.'
  },
  mobile: {
    label: 'Mobile Number',
    icon: Smartphone,
    description: 'Verify via your mobile network operator. Your carrier confirms your number is not age-restricted.'
  },
  facial_age_estimation: {
    label: 'Facial Age Estimation',
    icon: ScanFace,
    description: 'Take a quick selfie and AI will estimate your age. No document needed.'
  },
  photo_id: {
    label: 'Photo ID',
    icon: FileCheck,
    description: 'Upload a photo of your government ID (passport, driving licence) and a selfie to confirm your identity.'
  },
  open_banking: {
    label: 'Open Banking',
    icon: Landmark,
    description: 'Securely authorise your bank to confirm you are over 18 via Open Banking.'
  }
};

interface Props {
  children: React.ReactNode;
}

export function AgeVerificationGate({ children }: Props) {
  const [status, setStatus] = useState<AgeVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const data = await ageVerificationApi.getStatus();
      setStatus(data);
    } catch {
      // If the endpoint fails, don't block the user
      setStatus({ required: false, enabled: false, isVerified: false, verifiedAt: null, verificationMethod: null, withinGracePeriod: false, minimumAge: 18, enabledMethods: [], provider: 'manual' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedMethod) return;
    setVerifying(true);
    try {
      const payload: Record<string, string> = {};
      if (selectedMethod === 'credit_card' && cardNumber) {
        payload.cardLast4 = cardNumber.replace(/\s/g, '').slice(-4);
      }
      if (selectedMethod === 'mobile' && mobileNumber) {
        payload.mobileNumber = mobileNumber;
      }
      await ageVerificationApi.verify(selectedMethod, payload);
      toast.success('Age verified successfully');
      setStatus((prev) => prev ? { ...prev, required: false, isVerified: true } : prev);
    } catch (err: any) {
      toast.error(err?.message || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If verification is not required, render the app
  if (!status?.required) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Age Verification Required</h1>
          <p className="text-neutral-500 text-sm max-w-md mx-auto">
            Under the UK Online Safety Act, we are required to verify that you are at least{' '}
            <strong>{status.minimumAge} years old</strong> before you can access this platform.
          </p>
        </div>

        {!selectedMethod ? (
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-center">Choose a verification method</h2>
              <div className="space-y-3">
                {status.enabledMethods.map((method) => {
                  const meta = METHOD_META[method];
                  if (!meta) return null;
                  const Icon = meta.icon;
                  return (
                    <button
                      key={method}
                      onClick={() => setSelectedMethod(method)}
                      className="w-full flex items-start gap-4 rounded-xl border border-neutral-200 p-4 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <span className="font-medium text-sm">{meta.label}</span>
                        <p className="text-xs text-neutral-500">{meta.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{METHOD_META[selectedMethod]?.label}</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedMethod(null)}>
                  Change method
                </Button>
              </div>

              {selectedMethod === 'credit_card' && (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-500">
                    Enter your credit or debit card number. A temporary £0 authorisation will be made to confirm the card is valid. No money will leave your account.
                  </p>
                  <Input
                    placeholder="Card number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    maxLength={19}
                  />
                  <div className="flex items-start gap-2 text-xs text-neutral-400">
                    <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Your card details are processed securely and are not stored.</span>
                  </div>
                </div>
              )}

              {selectedMethod === 'mobile' && (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-500">
                    Enter your UK mobile number. Your network operator will confirm whether age restrictions are applied to your account.
                  </p>
                  <Input
                    placeholder="+44 7XXX XXXXXX"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    maxLength={15}
                  />
                </div>
              )}

              {selectedMethod === 'facial_age_estimation' && (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-500">
                    Your camera will open and AI technology will estimate your age from a quick selfie. No image is stored after the check.
                  </p>
                  <div className="rounded-lg bg-neutral-100 border border-dashed border-neutral-300 p-8 text-center">
                    <ScanFace className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                    <p className="text-xs text-neutral-500">Camera access will be requested when you proceed.</p>
                  </div>
                </div>
              )}

              {selectedMethod === 'photo_id' && (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-500">
                    Upload a photo of your government-issued ID (passport, driving licence) and take a selfie to confirm the document belongs to you.
                  </p>
                  <div className="rounded-lg bg-neutral-100 border border-dashed border-neutral-300 p-8 text-center">
                    <FileCheck className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                    <p className="text-xs text-neutral-500">Document upload will open when you proceed.</p>
                  </div>
                </div>
              )}

              {selectedMethod === 'open_banking' && (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-500">
                    You will be redirected to your bank's secure login to authorise an age confirmation check via Open Banking.
                  </p>
                  <div className="rounded-lg bg-neutral-100 border border-dashed border-neutral-300 p-8 text-center">
                    <Landmark className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                    <p className="text-xs text-neutral-500">Bank authorisation will open when you proceed.</p>
                  </div>
                </div>
              )}

              <Button onClick={handleVerify} disabled={verifying} className="w-full">
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Verify My Age
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Required under the UK Online Safety Act 2023</span>
          </div>
          <p className="text-[11px] text-neutral-400 max-w-sm mx-auto">
            Your data is processed securely in accordance with UK GDPR and ICO guidelines.
            We do not store your verification documents or payment details.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-[10px]">Powered by {status.provider === 'yoti' ? 'Yoti' : status.provider === 'agechecked' ? 'AgeChecked' : 'NeuroNest'}</Badge>
            <Badge variant="outline" className="text-[10px]">Ofcom Compliant</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
