import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/lib/stores/auth';
import { useAppConfig } from '@/lib/stores/config';
import { useCurrency } from '@/lib/hooks/useCurrency';
import { paymentsApi } from '@/lib/api/payments';
import { toast } from 'sonner';

export function PricingPage() {
  const PLANS = useAppConfig().pricingPlans;
  const { user } = useAuthStore();
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { currency, setCurrency, formatPrice } = useCurrency();

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

        {/* Billing & Currency Toggles */}
        <div className="flex flex-col items-center gap-3 mt-6">
          <div className="flex items-center gap-4">
            <span className={`text-sm ${!isYearly ? 'font-medium' : 'text-neutral-500'}`}>
              Monthly
            </span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={`text-sm ${isYearly ? 'font-medium' : 'text-neutral-500'}`}>
              Yearly
              <Badge className="ml-2 bg-green-100 text-green-700">Save 33%</Badge>
            </span>
          </div>
          <div className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 p-0.5 text-sm">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1 rounded-full transition-colors ${currency === 'USD' ? 'bg-primary text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              $ USD
            </button>
            <button
              onClick={() => setCurrency('GBP')}
              className={`px-3 py-1 rounded-full transition-colors ${currency === 'GBP' ? 'bg-primary text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              £ GBP
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {PLANS.map((plan) => {
          const isCurrentPlan = user?.subscription?.plan === plan.name.toLowerCase();
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

          return (
            <Card
              key={plan.name}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-card-hover ${
                plan.featured
                  ? 'border-2 border-primary shadow-glow md:scale-105 md:-my-4 z-10'
                  : 'hover:-translate-y-1'
              }`}
            >
              {plan.featured && (
                <>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent-violet to-accent-pink" />
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-white shadow-lg px-4 py-1">Most Popular</Badge>
                  </div>
                </>
              )}

              <CardHeader className={plan.featured ? 'pt-8' : ''}>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-4">
                  <span className={`text-4xl font-bold ${plan.featured ? 'text-primary' : ''}`}>{formatPrice(price)}</span>
                  <span className="text-muted-foreground">/month</span>
                  {isYearly && price > 0 && (
                    <p className="text-sm text-green-600 mt-1 font-medium">
                      {formatPrice(price * 12)} billed annually
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.featured ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  className={`w-full ${
                    plan.featured
                      ? 'bg-primary hover:bg-primary-600 shadow-glow'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
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
