import { useEffect, useState } from 'react';
import { Bell, Moon, Shield, CreditCard, Loader2, ExternalLink, Download, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/stores/auth';
import { paymentsApi } from '@/lib/api/payments';
import { usersApi } from '@/lib/api/users';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  applyExperiencePreferences,
  DEFAULT_EXPERIENCE_PREFERENCES,
  type ExperiencePreferences
} from '@/lib/experience';
import { applyA11ySettings, loadA11ySettings, saveA11ySettings, type A11ySettings } from '@/lib/a11y';
import { toast } from 'sonner';

export function SettingsPage() {
  const { user, logout, updateProfile } = useAuthStore();
  const [billingLoading, setBillingLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [experienceSaving, setExperienceSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [visibilitySaving, setVisibilitySaving] = useState(false);
  const [a11ySaving, setA11ySaving] = useState(false);
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
  const [experience, setExperience] = useState<ExperiencePreferences>({
    calmMode: user?.experiencePreferences?.calmMode ?? DEFAULT_EXPERIENCE_PREFERENCES.calmMode,
    density: user?.experiencePreferences?.density ?? DEFAULT_EXPERIENCE_PREFERENCES.density,
    reduceMotion:
      user?.experiencePreferences?.reduceMotion ?? DEFAULT_EXPERIENCE_PREFERENCES.reduceMotion,
    reduceSaturation:
      user?.experiencePreferences?.reduceSaturation ?? DEFAULT_EXPERIENCE_PREFERENCES.reduceSaturation,
    moodTheme: user?.experiencePreferences?.moodTheme ?? 'calm'
  });
  const [quietHours, setQuietHours] = useState({
    enabled: user?.quietHours?.enabled ?? false,
    start: user?.quietHours?.start ?? '22:00',
    end: user?.quietHours?.end ?? '08:00'
  });
  const [isPaused, setIsPaused] = useState(user?.isPaused ?? false);
  const [a11ySettings, setA11ySettings] = useState<A11ySettings>(loadA11ySettings());

  useEffect(() => {
    if (!user?.experiencePreferences) return;
    setExperience({
      calmMode: user.experiencePreferences.calmMode,
      density: user.experiencePreferences.density,
      reduceMotion: user.experiencePreferences.reduceMotion,
      reduceSaturation: user.experiencePreferences.reduceSaturation,
      moodTheme: user.experiencePreferences.moodTheme ?? 'calm'
    });
  }, [user?.experiencePreferences]);

  useEffect(() => {
    applyExperiencePreferences(experience);
  }, [experience]);

  useEffect(() => {
    if (!user?.quietHours) return;
    setQuietHours({
      enabled: user.quietHours.enabled,
      start: user.quietHours.start,
      end: user.quietHours.end
    });
    setIsPaused(Boolean(user.isPaused));
  }, [user?.quietHours, user?.isPaused]);

  useEffect(() => {
    applyA11ySettings(a11ySettings);
    saveA11ySettings(a11ySettings);
  }, [a11ySettings]);

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

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const response = await usersApi.exportData();
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'neuronest-data-export.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export generated');
    } catch {
      toast.error('Failed to export data');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    setDeleteLoading(true);
    try {
      await usersApi.deleteAccount(deleteConfirm);
      await logout();
      toast.success('Account deleted');
      window.location.href = '/';
    } catch {
      toast.error('Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveVisibility = async () => {
    setVisibilitySaving(true);
    try {
      await updateProfile({ quietHours, isPaused });
      toast.success('Visibility settings saved');
    } catch {
      toast.error('Failed to save visibility settings');
    } finally {
      setVisibilitySaving(false);
    }
  };

  const handleSaveA11yPreset = async () => {
    setA11ySaving(true);
    try {
      await updateProfile({ accessibilityPreset: a11ySettings });
      toast.success('Accessibility preset saved');
    } catch {
      toast.error('Failed to save accessibility preset');
    } finally {
      setA11ySaving(false);
    }
  };

  const handleLoadA11yPreset = () => {
    if (!user?.accessibilityPreset) {
      toast.error('No accessibility preset saved yet');
      return;
    }
    setA11ySettings(user.accessibilityPreset);
    toast.success('Loaded accessibility preset');
  };

  const handleSaveExperience = async () => {
    setExperienceSaving(true);
    try {
      await updateProfile({ experiencePreferences: experience });
      toast.success('Experience preferences saved');
    } catch {
      toast.error('Failed to update experience preferences');
    } finally {
      setExperienceSaving(false);
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

        {/* Experience & Calm Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="w-5 h-5" />
              Experience & Calm Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="calm-mode">Calm mode intensity</Label>
                <Badge variant="secondary">{experience.calmMode}%</Badge>
              </div>
              <Slider
                id="calm-mode"
                value={[experience.calmMode]}
                min={0}
                max={100}
                step={5}
                onValueChange={(value) =>
                  setExperience((prev) => ({ ...prev, calmMode: value[0] }))
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Layout density</Label>
                <Select
                  value={experience.density}
                  onValueChange={(value: ExperiencePreferences['density']) =>
                    setExperience((prev) => ({ ...prev, density: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose density" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cozy">Cozy</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mood theme</Label>
                <Select
                  value={experience.moodTheme || 'calm'}
                  onValueChange={(value: 'calm' | 'warm' | 'crisp') =>
                    setExperience((prev) => ({ ...prev, moodTheme: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="crisp">Crisp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Reduce motion</p>
                  <p className="text-xs text-neutral-500">Minimize animations.</p>
                </div>
                <Switch
                  checked={experience.reduceMotion}
                  onCheckedChange={(value) =>
                    setExperience((prev) => ({ ...prev, reduceMotion: value }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
              <div>
                <p className="text-sm font-medium">Lower saturation</p>
                <p className="text-xs text-neutral-500">Soften bold colors.</p>
              </div>
              <Switch
                checked={experience.reduceSaturation}
                onCheckedChange={(value) =>
                  setExperience((prev) => ({ ...prev, reduceSaturation: value }))
                }
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-neutral-500">
                These preferences are saved to your profile.
              </p>
              <Button onClick={handleSaveExperience} disabled={experienceSaving}>
                {experienceSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save experience
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Visibility & Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Visibility & Quiet Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Pause my profile</p>
                <p className="text-sm text-neutral-500">Hide your profile without deleting your account.</p>
              </div>
              <Switch
                checked={isPaused}
                onCheckedChange={(value) => setIsPaused(value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Quiet hours</p>
                  <p className="text-xs text-neutral-500">Let people know when you are offline.</p>
                </div>
                <Switch
                  checked={quietHours.enabled}
                  onCheckedChange={(value) =>
                    setQuietHours((prev) => ({ ...prev, enabled: value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Start</Label>
                <Input
                  type="time"
                  value={quietHours.start}
                  onChange={(event) =>
                    setQuietHours((prev) => ({ ...prev, start: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input
                  type="time"
                  value={quietHours.end}
                  onChange={(event) =>
                    setQuietHours((prev) => ({ ...prev, end: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-neutral-500">These settings are visible to matches.</p>
              <Button onClick={handleSaveVisibility} disabled={visibilitySaving}>
                {visibilitySaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save visibility
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Accessibility Presets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="w-5 h-5" />
              Accessibility Preset
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="preset-high-contrast">High contrast</Label>
                <Switch
                  id="preset-high-contrast"
                  checked={a11ySettings.highContrast}
                  onCheckedChange={(value) => setA11ySettings((prev) => ({ ...prev, highContrast: value }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="preset-large-text">Large text</Label>
                <Switch
                  id="preset-large-text"
                  checked={a11ySettings.largeText}
                  onCheckedChange={(value) => setA11ySettings((prev) => ({ ...prev, largeText: value }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="preset-dyslexic">Dyslexic font</Label>
                <Switch
                  id="preset-dyslexic"
                  checked={a11ySettings.dyslexicFont}
                  onCheckedChange={(value) => setA11ySettings((prev) => ({ ...prev, dyslexicFont: value }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="preset-underline">Underline links</Label>
                <Switch
                  id="preset-underline"
                  checked={a11ySettings.underlineLinks}
                  onCheckedChange={(value) => setA11ySettings((prev) => ({ ...prev, underlineLinks: value }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="preset-motion">Reduce motion</Label>
                <Switch
                  id="preset-motion"
                  checked={a11ySettings.reduceMotion}
                  onCheckedChange={(value) => setA11ySettings((prev) => ({ ...prev, reduceMotion: value }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="preset-focus">Strong focus ring</Label>
                <Switch
                  id="preset-focus"
                  checked={a11ySettings.focusRing}
                  onCheckedChange={(value) => setA11ySettings((prev) => ({ ...prev, focusRing: value }))}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleSaveA11yPreset} disabled={a11ySaving}>
                {a11ySaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save preset to profile
              </Button>
              <Button variant="outline" onClick={handleLoadA11yPreset}>
                Load from profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Data & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">Export your data</p>
                <p className="text-sm text-neutral-500">Download a JSON file of your profile and activity.</p>
              </div>
              <Button onClick={handleExportData} disabled={exportLoading} variant="outline">
                {exportLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export data
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">Cookie preferences</p>
                <p className="text-sm text-neutral-500">Review and update your consent choices.</p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.dispatchEvent(new Event('neuronest:open-consent'))}
              >
                Manage cookies
              </Button>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50/40 p-4 space-y-3">
              <div>
                <p className="font-medium text-red-700">Delete account</p>
                <p className="text-sm text-red-600">
                  This permanently removes your profile, matches, and messages. Type DELETE to confirm.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={deleteConfirm}
                  onChange={(event) => setDeleteConfirm(event.target.value)}
                  placeholder="Type DELETE"
                  className="max-w-[180px]"
                />
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
