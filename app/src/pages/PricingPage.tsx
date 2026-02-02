import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/lib/stores/auth';
import { paymentsApi } from '@/lib/api/payments';
import { toast } from 'sonner';

const PLANS = [
  {
    name: 'Basic',
    description: 'Perfect for getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Create a full profile',
      'Browse and match',
      'Basic messaging',
      'Community access',
      'Safety features'
    ],
    cta: 'Current Plan',
    featured: false
  },
  {
    name: 'Premium',
    description: 'Best for active daters',
    monthlyPrice: 12,
    yearlyPrice: 8,
    features: [
      'Everything in Basic',
      'AI Message Explanations',
      'Tone Tags',
      'See who liked you',
      'Unlimited likes',
      'Advanced filters',
      'Priority support',
      'Profile boosts (2/month)'
    ],
    cta: 'Upgrade to Premium',
    featured: true
  },
  {
    name: 'Pro',
    description: 'For serious connections',
    monthlyPrice: 24,
    yearlyPrice: 18,
    features: [
      'Everything in Premium',
      'Video messaging',
      'Incognito mode',
      'Travel mode',
      'Weekly boosts (4/month)',
      'Profile consultation',
      'Exclusive events'
    ],
    cta: 'Go Pro',
    featured: false
  }
];

export function PricingPage() {
  const { user } = useAuthStore();
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: string) => {
    if (plan === 'Basic') return;
    
    setIsLoading(plan);
    try {
      const response = await paymentsApi.createCheckout(
        plan.toLowerCase() as 'premium' | 'pro',
        isYearly ? 'yearly' : 'monthly'
      );
      
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error: any) {
      if (error.code === 'SUBSCRIPTION_REQUIRED') {
        toast.error('Please complete your current subscription first');
      } else {
        toast.error('Failed to start checkout');
      }
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-neutral-500 max-w-xl mx-auto">
          Upgrade to unlock AI-powered features and connect with more people
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <span className={`text-sm ${!isYearly ? 'font-medium' : 'text-neutral-500'}`}>
            Monthly
          </span>
          <Switch checked={isYearly} onCheckedChange={setIsYearly} />
          <span className={`text-sm ${isYearly ? 'font-medium' : 'text-neutral-500'}`}>
            Yearly
            <Badge className="ml-2 bg-green-100 text-green-700">Save 33%</Badge>
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {PLANS.map((plan) => {
          const isCurrentPlan = user?.subscription?.plan === plan.name.toLowerCase();
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

          return (
            <Card
              key={plan.name}
              className={`relative ${plan.featured ? 'border-2 border-primary shadow-glow' : ''}`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-white">Most Popular</Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-sm text-neutral-500">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${price}</span>
                  <span className="text-neutral-500">/month</span>
                  {isYearly && price > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      ${price * 12} billed annually
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className={`w-5 h-5 mt-0.5 ${plan.featured ? 'text-primary' : 'text-neutral-400'}`} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.featured
                      ? 'bg-primary hover:bg-primary-600'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-dark'
                  }`}
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={isCurrentPlan || isLoading === plan.name}
                >
                  {isLoading === plan.name ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    plan.cta
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
