import { useEffect, useState } from 'react';
import { Bell, Moon, Shield, CreditCard, Loader2, ExternalLink, Download, Trash2, AlertTriangle } from 'lucide-react';
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
import { applyA11ySettings, loadA11ySettings, saveA11ySettings, DEFAULT_SETTINGS as DEFAULT_A11Y, type A11ySettings } from '@/lib/a11y';
import { toast } from 'sonner';
import { SafetySettings } from '@/components/SafetySettings';
import { GuardianSettings } from '@/components/GuardianSettings';
import { PassportCard } from '@/components/PassportCard';
import { BoundaryEditor } from '@/components/BoundaryEditor';
import { SensoryProfileCard } from '@/components/SensoryProfileCard';
import { SelfieVerification } from '@/components/SelfieVerification';
import { MaskingTracker } from '@/components/MaskingTracker';
import { ExitToolkit } from '@/components/ExitToolkit';
import { StimSettings } from '@/components/StimSettings';
import { getSosConfig, saveSosConfig, type SosPosition, type SosVisibility } from '@/components/SosButton';

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
      allowProfileDiscovery: true,
      blockNsfwImages: user?.blockNsfwImages ?? true
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
    setA11ySettings({ ...DEFAULT_A11Y, ...user.accessibilityPreset });
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
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="block-nsfw">Block NSFW Images</Label>
                <p className="text-xs text-muted-foreground">Automatically block images marked as NSFW in messages</p>
              </div>
              <Switch
                id="block-nsfw"
                checked={settings.privacy.blockNsfwImages ?? true}
                onCheckedChange={(v) => {
                  updateSetting('privacy', 'blockNsfwImages', v);
                  updateProfile({ blockNsfwImages: v }).catch(() => toast.error('Failed to save NSFW preference'));
                }}
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
            <p className="text-sm text-muted-foreground">
              Quick toggles here. Use the <strong>Accessibility sidebar</strong> (icon in the top nav) for full controls with sliders.
            </p>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="preset-blue-light">Blue light filter</Label>
                <Switch
                  id="preset-blue-light"
                  checked={a11ySettings.blueLightFilter}
                  onCheckedChange={(value) => setA11ySettings((prev) => ({ ...prev, blueLightFilter: value }))}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <Label>Font size</Label>
                  <span className="text-xs text-muted-foreground font-mono">{a11ySettings.fontSize}%</span>
                </div>
                <Slider
                  value={[a11ySettings.fontSize]}
                  min={80} max={150} step={5}
                  onValueChange={([v]) => setA11ySettings((prev) => ({ ...prev, fontSize: v }))}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <Label>Line height</Label>
                  <span className="text-xs text-muted-foreground font-mono">{a11ySettings.lineHeight}</span>
                </div>
                <Slider
                  value={[a11ySettings.lineHeight]}
                  min={1.2} max={2.4} step={0.1}
                  onValueChange={([v]) => setA11ySettings((prev) => ({ ...prev, lineHeight: Math.round(v * 10) / 10 }))}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <Label>Saturation</Label>
                  <span className="text-xs text-muted-foreground font-mono">{a11ySettings.saturation}%</span>
                </div>
                <Slider
                  value={[a11ySettings.saturation]}
                  min={0} max={150} step={10}
                  onValueChange={([v]) => setA11ySettings((prev) => ({ ...prev, saturation: v }))}
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

        {/* Safety — Trusted Contacts & Date Plans */}
        <SafetySettings />

        {/* SOS Button Configuration */}
        <SosConfig />

        {/* AI Conversation Guardian */}
        <GuardianSettings />

        {/* Communication Style Passport */}
        {user && <PassportCard userId={user.id} editable />}

        {/* Boundary Presets */}
        <BoundaryEditor />

        {/* Sensory Profile */}
        {user && <SensoryProfileCard userId={user.id} editable />}

        {/* Selfie Verification */}
        <SelfieVerification />

        {/* Masking Fatigue Tracker */}
        <MaskingTracker />

        {/* Exit Strategy Toolkit */}
        <div id="exit-toolkit-section">
          <ExitToolkit />
        </div>

        {/* Stim-Friendly Interaction Modes */}
        <StimSettings />

        {/* Data & Privacy — GDPR / HIPAA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Data & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Security status */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
              <p className="text-sm font-medium text-emerald-800 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security & Encryption
              </p>
              <ul className="text-xs text-emerald-700 space-y-1 ml-6 list-disc">
                <li>All data encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
                <li>Health-related data (neurodivergent traits) stored with additional encryption</li>
                <li>HIPAA-aligned access controls — staff access logged and audited</li>
                <li>Session auto-locks after 15 minutes of inactivity</li>
              </ul>
            </div>

            {/* Data retention */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-medium">Data Retention Policy</p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                <li><strong>Active accounts:</strong> data retained while account is active</li>
                <li><strong>Deleted accounts:</strong> all personal data purged within 30 days; anonymised analytics kept for up to 2 years</li>
                <li><strong>Messages:</strong> deleted 90 days after both parties leave a conversation</li>
                <li><strong>Health data:</strong> erased immediately upon consent withdrawal or account deletion</li>
                <li><strong>Backups:</strong> encrypted backups purged within 90 days of deletion request</li>
              </ul>
            </div>

            {/* Health data consent */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Badge variant="secondary">GDPR Art. 9</Badge>
                Health Data Processing
              </p>
              <p className="text-xs text-muted-foreground">
                Your neurodivergent traits and communication preferences are classified as special category
                health data under GDPR and may constitute PHI under HIPAA. This data is processed solely
                for matchmaking purposes with your explicit consent. You can withdraw this consent at any time,
                which will remove your health data from our systems.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  if (confirm('Withdraw health data consent? Your neurodivergent traits and communication preferences will be erased. You can re-add them later.')) {
                    updateProfile({ neurodivergentTraits: [], communicationPreferences: { preferredToneTags: false, aiExplanations: false, voiceMessages: false } })
                      .then(() => toast.success('Health data consent withdrawn. Data erased.'))
                      .catch(() => toast.error('Failed to withdraw consent'));
                  }
                }}
              >
                Withdraw health data consent
              </Button>
            </div>

            {/* Your rights */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-medium">Your Rights (GDPR Art. 15–22)</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">✓</span>
                  <span><strong>Access</strong> — export your data below</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">✓</span>
                  <span><strong>Rectification</strong> — edit your profile anytime</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">✓</span>
                  <span><strong>Erasure</strong> — delete your account below</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">✓</span>
                  <span><strong>Portability</strong> — JSON export of all data</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">✓</span>
                  <span><strong>Restrict</strong> — pause your account to stop processing</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">✓</span>
                  <span><strong>Object</strong> — opt out of marketing via cookie settings</span>
                </div>
              </div>
            </div>

            {/* Export */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">Export your data</p>
                <p className="text-sm text-muted-foreground">Download a JSON file of your profile and activity (GDPR Art. 20).</p>
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

            {/* Cookie preferences */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">Cookie preferences</p>
                <p className="text-sm text-muted-foreground">Review and update your consent choices.</p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.dispatchEvent(new Event('neuronest:open-consent'))}
              >
                Manage cookies
              </Button>
            </div>

            {/* Delete account */}
            <div className="rounded-xl border border-red-200 bg-red-50/40 p-4 space-y-3">
              <div>
                <p className="font-medium text-red-700">Delete account (GDPR Art. 17)</p>
                <p className="text-sm text-red-600">
                  This permanently removes your profile, matches, messages, and all health data within 30 days.
                  Anonymised analytics may be retained. Type DELETE to confirm.
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

function SosConfig() {
  const [config, setConfig] = useState(getSosConfig);

  const handleChange = (updates: Partial<{ position: SosPosition; visibility: SosVisibility }>) => {
    const next = { ...config, ...updates };
    setConfig(next);
    saveSosConfig(next);
    window.dispatchEvent(new Event('sos-config-changed'));
    toast.success('SOS button updated');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          SOS Button
        </CardTitle>
        <p className="text-xs text-neutral-500">Configure the floating emergency SOS button.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-600">Visibility</p>
          <div className="flex gap-2">
            {(['always', 'date-only', 'off'] as SosVisibility[]).map((v) => (
              <button
                key={v}
                onClick={() => handleChange({ visibility: v })}
                className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                  config.visibility === v ? 'border-primary bg-primary/5 text-primary' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                {v === 'always' ? 'Always' : v === 'date-only' ? 'During dates' : 'Off'}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-600">Position</p>
          <div className="flex gap-2">
            {(['bottom-left', 'bottom-right'] as SosPosition[]).map((p) => (
              <button
                key={p}
                onClick={() => handleChange({ position: p })}
                className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                  config.position === p ? 'border-primary bg-primary/5 text-primary' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                {p === 'bottom-left' ? 'Bottom-left' : 'Bottom-right'}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
