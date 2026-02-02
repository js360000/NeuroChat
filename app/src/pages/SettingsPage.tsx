import { useState } from 'react';
import { Bell, Moon, Shield, CreditCard, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/stores/auth';
import { paymentsApi } from '@/lib/api/payments';
import { toast } from 'sonner';

export function SettingsPage() {
  const { user } = useAuthStore();
  const [billingLoading, setBillingLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      newMatches: true,
      newMessages: true,
      profileViews: false,
      marketingEmails: false
    },
    privacy: {
      showOnlineStatus: true,
      showLastActive: true,
      allowProfileDiscovery: true
    },
    appearance: {
      darkMode: false,
      reducedMotion: false
    }
  });

  const updateSetting = (category: string, key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
    toast.success('Setting updated');
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const { url } = await paymentsApi.createPortalSession();
      window.location.href = url;
    } catch {
      toast.error('Failed to open billing portal');
    } finally {
      setBillingLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }
    setCancelLoading(true);
    try {
      await paymentsApi.cancelSubscription();
      toast.success('Subscription cancelled. You will retain access until the end of your billing period.');
    } catch {
      toast.error('Failed to cancel subscription');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Billing & Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Billing & Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Plan</p>
                <p className="text-sm text-neutral-500">
                  {user?.subscription?.plan === 'free' 
                    ? 'Free plan with basic features'
                    : `${user?.subscription?.plan?.charAt(0).toUpperCase()}${user?.subscription?.plan?.slice(1)} plan`}
                </p>
              </div>
              <Badge variant={user?.subscription?.plan === 'free' ? 'secondary' : 'default'}>
                {user?.subscription?.plan?.toUpperCase()}
              </Badge>
            </div>
            
            {user?.subscription?.plan !== 'free' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Status</p>
                    <p className="text-sm text-neutral-500">
                      {user?.subscription?.status === 'active' && 'Active subscription'}
                      {user?.subscription?.status === 'cancelled' && 'Cancels at period end'}
                      {user?.subscription?.status === 'past_due' && 'Payment past due'}
                    </p>
                  </div>
                  <Badge variant={user?.subscription?.status === 'active' ? 'default' : 'destructive'}>
                    {user?.subscription?.status?.toUpperCase()}
                  </Badge>
                </div>

                {user?.subscription?.expiresAt && (
                  <div>
                    <p className="font-medium">Next billing date</p>
                    <p className="text-sm text-neutral-500">
                      {new Date(user.subscription.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={handleManageBilling}
                    disabled={billingLoading}
                  >
                    {billingLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4 mr-2" />
                    )}
                    Manage Billing
                  </Button>
                  
                  {user?.subscription?.status === 'active' && (
                    <Button 
                      variant="destructive" 
                      onClick={handleCancelSubscription}
                      disabled={cancelLoading}
                    >
                      {cancelLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </>
            )}

            {user?.subscription?.plan === 'free' && (
              <Button onClick={() => window.location.href = '/pricing'}>
                Upgrade to Premium
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-matches">New Matches</Label>
              <Switch
                id="new-matches"
                checked={settings.notifications.newMatches}
                onCheckedChange={(v) => updateSetting('notifications', 'newMatches', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="new-messages">New Messages</Label>
              <Switch
                id="new-messages"
                checked={settings.notifications.newMessages}
                onCheckedChange={(v) => updateSetting('notifications', 'newMessages', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="profile-views">Profile Views</Label>
              <Switch
                id="profile-views"
                checked={settings.notifications.profileViews}
                onCheckedChange={(v) => updateSetting('notifications', 'profileViews', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="online-status">Show Online Status</Label>
              <Switch
                id="online-status"
                checked={settings.privacy.showOnlineStatus}
                onCheckedChange={(v) => updateSetting('privacy', 'showOnlineStatus', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="last-active">Show Last Active</Label>
              <Switch
                id="last-active"
                checked={settings.privacy.showLastActive}
                onCheckedChange={(v) => updateSetting('privacy', 'showLastActive', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="w-5 h-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <Switch
                id="dark-mode"
                checked={settings.appearance.darkMode}
                onCheckedChange={(v) => updateSetting('appearance', 'darkMode', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="reduced-motion">Reduced Motion</Label>
              <Switch
                id="reduced-motion"
                checked={settings.appearance.reducedMotion}
                onCheckedChange={(v) => updateSetting('appearance', 'reducedMotion', v)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
