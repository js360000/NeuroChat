import { useEffect, useState } from 'react';
import { Shield, Save, Loader2, CreditCard, Smartphone, ScanFace, FileCheck, Landmark, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { adminApi, type AgeVerificationConfig, type AgeVerificationMethod } from '@/lib/api/admin';
import { toast } from 'sonner';

const METHOD_INFO: Record<AgeVerificationMethod, { label: string; icon: typeof CreditCard; description: string }> = {
  credit_card: {
    label: 'Credit Card',
    icon: CreditCard,
    description: 'Verifies a valid credit card via a temporary £0 authorisation. UK law requires applicants to be 18+ for credit cards.'
  },
  mobile: {
    label: 'Mobile Network',
    icon: Smartphone,
    description: 'Checks with the mobile network operator whether the phone number has age restriction filters. No filters = confirmed 18+.'
  },
  facial_age_estimation: {
    label: 'Facial Age Estimation',
    icon: ScanFace,
    description: 'AI analyses a selfie or video to estimate the user\'s age. No document required.'
  },
  photo_id: {
    label: 'Photo ID',
    icon: FileCheck,
    description: 'User uploads government ID (passport, driving licence) and a selfie. Document is matched to confirm identity and age.'
  },
  open_banking: {
    label: 'Open Banking',
    icon: Landmark,
    description: 'User authorises their bank to securely confirm they are over 18 via the Open Banking API.'
  }
};

export function AdminAgeVerification() {
  const [config, setConfig] = useState<AgeVerificationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await adminApi.getAgeVerificationConfig();
      setConfig(data);
    } catch {
      toast.error('Failed to load age verification config');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const updated = await adminApi.updateAgeVerificationConfig(config);
      setConfig(updated);
      toast.success('Age verification settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleMethod = (method: AgeVerificationMethod) => {
    if (!config) return;
    const methods = config.enabledMethods.includes(method)
      ? config.enabledMethods.filter((m) => m !== method)
      : [...config.enabledMethods, method];
    setConfig({ ...config, enabledMethods: methods });
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Age Verification</h1>
          <p className="text-sm text-neutral-500 mt-1">
            UK Online Safety Act compliance. Configure age checks for your users.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">Enable Age Verification</h2>
              </div>
              <p className="text-sm text-neutral-500">
                When enabled, users must verify their age before accessing the platform.
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => setConfig({ ...config, enabled })}
            />
          </div>

          {!config.enabled && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Currently disabled</p>
                <p className="mt-1">Age verification is switched off. Users can access the platform without verifying their age. Enable this to comply with UK Online Safety Act requirements.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-5">
          <h2 className="font-semibold">Provider Settings</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Provider</label>
              <Select
                value={config.provider}
                onValueChange={(provider: 'yoti' | 'agechecked' | 'manual') => setConfig({ ...config, provider })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yoti">Yoti (Recommended)</SelectItem>
                  <SelectItem value="agechecked">AgeChecked</SelectItem>
                  <SelectItem value="manual">Manual / Demo Mode</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-neutral-400">
                Yoti is the most widely used UK age verification provider, certified by Ofcom.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Age</label>
              <Input
                type="number"
                min={13}
                max={25}
                value={config.minimumAge}
                onChange={(e) => setConfig({ ...config, minimumAge: Number(e.target.value) })}
              />
            </div>
          </div>

          {config.provider === 'yoti' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium">Yoti API Credentials</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-neutral-500">Client SDK ID</label>
                  <Input
                    value={config.yotiClientSdkId}
                    onChange={(e) => setConfig({ ...config, yotiClientSdkId: e.target.value })}
                    placeholder="your-client-sdk-id"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-neutral-500">Scenario ID</label>
                  <Input
                    value={config.yotiScenarioId}
                    onChange={(e) => setConfig({ ...config, yotiScenarioId: e.target.value })}
                    placeholder="your-scenario-id"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-neutral-500">API Key</label>
                <Input
                  type="password"
                  value={config.yotiApiKey}
                  onChange={(e) => setConfig({ ...config, yotiApiKey: e.target.value })}
                  placeholder="your-api-key"
                />
              </div>
              <p className="text-xs text-neutral-400">
                Get your credentials from the{' '}
                <a href="https://developers.yoti.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Yoti Developer Portal
                </a>
                . Without valid credentials, the system runs in demo/manual mode.
              </p>
            </div>
          )}

          {config.provider === 'manual' && (
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Manual / Demo Mode</p>
                <p className="mt-1">Users will see the verification gate and can self-declare their age. This is for testing only and does not constitute real age verification under the Online Safety Act.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-5">
          <h2 className="font-semibold">Verification Methods</h2>
          <p className="text-sm text-neutral-500">
            Choose which methods users can use to prove their age. Per Ofcom guidance, these must be
            "technically accurate, robust, reliable and fair."
          </p>

          <div className="space-y-3">
            {(Object.entries(METHOD_INFO) as [AgeVerificationMethod, typeof METHOD_INFO[AgeVerificationMethod]][]).map(
              ([method, info]) => {
                const Icon = info.icon;
                const isEnabled = config.enabledMethods.includes(method);
                return (
                  <div
                    key={method}
                    className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                      isEnabled ? 'border-primary/30 bg-primary/5' : 'border-neutral-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 ${isEnabled ? 'text-primary' : 'text-neutral-400'}`} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{info.label}</span>
                        {isEnabled && <Badge variant="secondary" className="text-[10px]">Enabled</Badge>}
                      </div>
                      <p className="text-xs text-neutral-500">{info.description}</p>
                    </div>
                    <Switch checked={isEnabled} onCheckedChange={() => toggleMethod(method)} />
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-5">
          <h2 className="font-semibold">Enforcement Settings</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Enforce on Registration</label>
                <p className="text-xs text-neutral-500">Require age verification immediately during sign-up.</p>
              </div>
              <Switch
                checked={config.enforceOnRegistration}
                onCheckedChange={(enforceOnRegistration) => setConfig({ ...config, enforceOnRegistration })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Bypass for Existing Users</label>
                <p className="text-xs text-neutral-500">Don't require verification for users who registered before this was enabled.</p>
              </div>
              <Switch
                checked={config.bypassForExistingUsers}
                onCheckedChange={(bypassForExistingUsers) => setConfig({ ...config, bypassForExistingUsers })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Grace Period (hours)</label>
              <Input
                type="number"
                min={0}
                max={720}
                value={config.gracePeriodHours}
                onChange={(e) => setConfig({ ...config, gracePeriodHours: Number(e.target.value) })}
              />
              <p className="text-xs text-neutral-500">
                Allow new users this many hours after sign-up before requiring verification. Set to 0 for immediate enforcement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
