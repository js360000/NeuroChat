import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { adminApi, type N8nWorkflow, type AdminSettings as AdminSettingsType } from '@/lib/api/admin';
import { toast } from 'sonner';

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
      </div>
    </div>
  );
}
