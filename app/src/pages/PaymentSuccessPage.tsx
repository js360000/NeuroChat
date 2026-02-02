import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Sparkles, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores/auth';
import { paymentsApi } from '@/lib/api/payments';
import { toast } from 'sonner';

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fetchUser } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [plan, setPlan] = useState<string>('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      return;
    }

    async function verifyPayment() {
      try {
        const result = await paymentsApi.verifyCheckout(sessionId!);
        
        if (result.status === 'paid') {
          setStatus('success');
          setPlan(result.plan || 'Premium');
          await fetchUser();
          toast.success(`Welcome to ${result.plan || 'Premium'}!`);
        } else {
          setStatus('error');
          toast.error('Payment verification failed');
        }
      } catch {
        setStatus('error');
        toast.error('Could not verify payment');
      }
    }

    verifyPayment();
  }, [searchParams, fetchUser]);

  if (status === 'loading') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <h1 className="text-xl font-semibold">Verifying your payment...</h1>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
          <p className="text-neutral-500 mb-6">
            We couldn't verify your payment. Please contact support if you were charged.
          </p>
          <Button onClick={() => navigate('/pricing')}>
            Back to Pricing
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-neutral-500 mb-6">
          Thank you for subscribing to {plan}! You now have access to all premium features including AI message explanations and tone tags.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Go to Dashboard
          </Button>
          <Button onClick={() => navigate('/messages')} className="bg-primary hover:bg-primary-600">
            <Sparkles className="w-4 h-4 mr-2" />
            Try AI Features
          </Button>
        </div>
      </Card>
    </div>
  );
}
