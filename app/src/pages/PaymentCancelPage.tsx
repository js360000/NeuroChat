import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function PaymentCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-8">
        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-neutral-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>
        <p className="text-neutral-500 mb-6">
          Your payment was cancelled. You can try again anytime or continue using the free plan.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/pricing')} variant="outline">
            Back to Pricing
          </Button>
          <Button onClick={() => navigate('/dashboard')} className="bg-primary hover:bg-primary-600">
            Go to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
