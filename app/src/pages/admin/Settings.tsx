import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, Brain, Key, Clock, Palette, Type } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { adminApi, type N8nWorkflow, type AdminSettings as AdminSettingsType } from '@/lib/api/admin';
import { useBrandingStore } from '@/lib/stores/branding';
import { toast } from 'sonner';

const COLOR_PRESETS = [
  { label: 'Purple', hex: '#7c3aed' },
  { label: 'Blue', hex: '#2563eb' },
  { label: 'Teal', hex: '#0d9488' },
  { label: 'Green', hex: '#16a34a' },
  { label: 'Rose', hex: '#e11d48' },
  { label: 'Orange', hex: '#ea580c' },
  { label: 'Amber', hex: '#d97706' },
  { label: 'Pink', hex: '#db2777' },
  { label: 'Indigo', hex: '#4f46e5' },
  { label: 'Slate', hex: '#475569' },
];

type Integration = N8nWorkflow;

export function AdminSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<AdminSettingsType | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [integrationsResponse, settingsResponse] = await Promise.all([
        adminApi.getIntegrations(),
        adminApi.getSettings()
      ]);
      setIntegrations(integrationsResponse.integrations);
      setSettings(settingsResponse.settings);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (updates: Partial<AdminSettingsType>) => {
    if (!settings) return;
    const next = { ...settings, ...updates };
    setSettings(next);
    try {
      await adminApi.updateSettings(updates);
    } catch (error) {
      toast.error('Failed to update settings');
      setSettings(settings);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Site Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Site Branding
            </CardTitle>
            <CardDescription>Change the site name and primary colour scheme across the entire platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" />
                Site Title
              </Label>
              <div className="flex gap-2">
                <Input
                  value={settings?.siteName ?? ''}
                  onChange={(e) => setSettings((prev) => prev ? { ...prev, siteName: e.target.value } : prev)}
                  placeholder="NeuroNest"
                  maxLength={40}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (settings?.siteName) {
                      updateSetting({ siteName: settings.siteName });
                      useBrandingStore.getState().setSiteName(settings.siteName);
                      toast.success('Site title updated');
                    }
                  }}
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-neutral-400">Appears in navigation, footer, login page, and browser tab.</p>
            </div>

            <div className="border-t border-neutral-100 pt-4 space-y-3">
              <Label>Primary Colour</Label>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl border-2 border-neutral-200 shadow-sm cursor-pointer relative overflow-hidden"
                  style={{ backgroundColor: settings?.themeColor || '#7c3aed' }}
                >
                  <input
                    type="color"
                    value={settings?.themeColor || '#7c3aed'}
                    onChange={(e) => {
                      setSettings((prev) => prev ? { ...prev, themeColor: e.target.value } : prev);
                      useBrandingStore.getState().setThemeColor(e.target.value);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                <Input
                  value={settings?.themeColor || '#7c3aed'}
                  onChange={(e) => {
                    setSettings((prev) => prev ? { ...prev, themeColor: e.target.value } : prev);
                    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                      useBrandingStore.getState().setThemeColor(e.target.value);
                    }
                  }}
                  placeholder="#7c3aed"
                  className="max-w-[140px] font-mono text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (settings?.themeColor) {
                      updateSetting({ themeColor: settings.themeColor });
                      toast.success('Theme colour saved');
                    }
                  }}
                >
                  Save
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    onClick={() => {
                      setSettings((prev) => prev ? { ...prev, themeColor: preset.hex } : prev);
                      useBrandingStore.getState().setThemeColor(preset.hex);
                    }}
                    className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                      settings?.themeColor === preset.hex ? 'border-foreground ring-2 ring-offset-1 ring-foreground/20' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                    title={preset.label}
                  />
                ))}
              </div>
              <p className="text-xs text-neutral-400">Applies to buttons, links, badges, and accents in both light and dark mode. Click a preset or use the picker.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {integrations.map((integration) => (
                <div
                  key={integration.name}
                  className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      integration.status === 'connected' ? 'bg-green-100' : 'bg-neutral-100'
                    }`}>
                      {integration.status === 'connected' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-sm text-neutral-500">{integration.description}</p>
                    </div>
                  </div>
                  <Badge className={integration.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}>
                    {integration.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">AI Explanations</p>
                <p className="text-sm text-neutral-500">Enable AI-powered message analysis</p>
              </div>
              <Switch
                checked={settings?.aiExplanationsEnabled ?? false}
                onCheckedChange={(value) => updateSetting({ aiExplanationsEnabled: value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tone Tags</p>
                <p className="text-sm text-neutral-500">Allow users to add tone indicators</p>
              </div>
              <Switch checked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Voice Messages</p>
                <p className="text-sm text-neutral-500">Enable voice message sending</p>
              </div>
              <Switch checked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Registration</p>
                <p className="text-sm text-neutral-500">Allow new user registrations</p>
              </div>
              <Switch
                checked={settings?.registrationEnabled ?? false}
                onCheckedChange={(value) => updateSetting({ registrationEnabled: value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Maintenance Mode</p>
                <p className="text-sm text-neutral-500">Temporarily disable the app</p>
              </div>
              <Switch
                checked={settings?.maintenanceMode ?? false}
                onCheckedChange={(value) => updateSetting({ maintenanceMode: value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Gemini AI Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Gemini AI Configuration
            </CardTitle>
            <CardDescription>Configure the Gemini 3 Flash API for the Explain feature and other AI-powered tools.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                Gemini API Key
              </Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={settings?.geminiApiKey ?? ''}
                  onChange={(e) => setSettings((prev) => prev ? { ...prev, geminiApiKey: e.target.value } : prev)}
                  placeholder="Enter your Gemini API key..."
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (settings?.geminiApiKey) {
                      updateSetting({ geminiApiKey: settings.geminiApiKey });
                      toast.success('API key saved');
                    }
                  }}
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-neutral-400">Get your key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>. Uses model: <code className="text-[11px] bg-neutral-100 px-1 py-0.5 rounded">gemini-3-flash-preview</code></p>
            </div>

            <div className="border-t border-neutral-100 pt-4 space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Explain Feature Usage Limits
              </h4>
              <p className="text-xs text-neutral-500">Control how often each user can use the AI Explain feature on received messages.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Max uses per user</Label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={settings?.explainLimits?.maxPerUser ?? 20}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setSettings((prev) => prev ? { ...prev, explainLimits: { ...prev.explainLimits, maxPerUser: val } } : prev);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Time window (minutes)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={1440}
                    value={settings?.explainLimits?.windowMinutes ?? 60}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setSettings((prev) => prev ? { ...prev, explainLimits: { ...prev.explainLimits, windowMinutes: val } } : prev);
                    }}
                  />
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (settings?.explainLimits) {
                    updateSetting({ explainLimits: settings.explainLimits });
                    toast.success('Explain limits saved');
                  }
                }}
              >
                Save Limits
              </Button>
              <p className="text-xs text-neutral-400">Current: {settings?.explainLimits?.maxPerUser ?? 20} uses per {settings?.explainLimits?.windowMinutes ?? 60} minute(s)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
