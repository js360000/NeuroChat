import { useEffect, useState } from 'react';
import { Loader2, DollarSign, ToggleLeft, ToggleRight, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { adminApi, type AdConfig, type AdSlot } from '@/lib/api/admin';
import { toast } from 'sonner';

export function AdminAdvertising() {
  const [config, setConfig] = useState<AdConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await adminApi.getAdConfig();
      setConfig(res.adConfig);
    } catch {
      toast.error('Failed to load ad configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const save = async (updates: Partial<AdConfig>) => {
    if (!config) return;
    const next = { ...config, ...updates };
    setConfig(next);
    setSaving(true);
    try {
      const res = await adminApi.updateAdConfig(updates);
      setConfig(res.adConfig);
      toast.success('Ad settings saved');
    } catch {
      toast.error('Failed to save ad settings');
      setConfig(config);
    } finally {
      setSaving(false);
    }
  };

  const updateSlot = (slotId: string, field: keyof AdSlot, value: string | boolean) => {
    if (!config) return;
    const updatedSlots = config.slots.map((s) =>
      s.id === slotId ? { ...s, [field]: value } : s
    );
    save({ slots: updatedSlots });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-6">
        <p className="text-neutral-500">Failed to load ad configuration.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Advertising
          </h1>
          <p className="text-sm text-neutral-500">
            Manage Google AdSense integration and ad placements across the site.
          </p>
        </div>
        {saving && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving...
          </Badge>
        )}
      </div>

      {/* Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AdSense Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adsense-client">AdSense Publisher ID</Label>
            <div className="flex gap-2">
              <Input
                id="adsense-client"
                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                value={config.adsenseClientId}
                onChange={(e) => setConfig({ ...config, adsenseClientId: e.target.value })}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={() => save({ adsenseClientId: config.adsenseClientId })}
              >
                Save
              </Button>
            </div>
            <p className="text-xs text-neutral-500">
              Your Google AdSense publisher ID. Find it in your AdSense dashboard under Account &gt; Account information.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Global Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Global Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {config.globalEnabled ? (
                  <ToggleRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-neutral-400" />
                )}
                <Label className="font-medium">Enable Ads Globally</Label>
              </div>
              <p className="text-xs text-neutral-500">
                Master switch. When off, no ads are shown anywhere on the site.
              </p>
            </div>
            <Switch
              checked={config.globalEnabled}
              onCheckedChange={(v) => save({ globalEnabled: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <Label className="font-medium">Free Users Only</Label>
              </div>
              <p className="text-xs text-neutral-500">
                When on, ads are only shown to users on the free plan. Premium and Pro users see an ad-free experience.
              </p>
            </div>
            <Switch
              checked={config.showToFreeOnly}
              onCheckedChange={(v) => save({ showToFreeOnly: v })}
            />
          </div>

          {!config.adsenseClientId && config.globalEnabled && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              Ads are enabled but no Publisher ID is set. Ads will not render until you provide your AdSense credentials above.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ad Placements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ad Placements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-neutral-500">
            Configure individual ad slots. Each placement corresponds to a specific area of the site.
            Ads are positioned respectfully — never overlapping content, never blocking interactions.
          </p>

          <div className="divide-y divide-neutral-100">
            {config.slots.map((slot) => (
              <div key={slot.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{slot.label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px]">{slot.area}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{slot.format}</Badge>
                    </div>
                  </div>
                  <Switch
                    checked={slot.enabled}
                    onCheckedChange={(v) => updateSlot(slot.id, 'enabled', v)}
                  />
                </div>

                {slot.enabled && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-neutral-500">Ad Slot ID (data-ad-slot)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="1234567890"
                        value={slot.adSlotId}
                        onChange={(e) => {
                          const updatedSlots = config.slots.map((s) =>
                            s.id === slot.id ? { ...s, adSlotId: e.target.value } : s
                          );
                          setConfig({ ...config, slots: updatedSlots });
                        }}
                        className="font-mono text-sm max-w-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => save({ slots: config.slots })}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ad Philosophy Note */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5 space-y-2">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Crown className="w-4 h-4 text-primary" />
            Our Ad Philosophy
          </h3>
          <p className="text-sm text-neutral-600">
            NeuroNest is committed to respectful, non-intrusive advertising. Ads are:
          </p>
          <ul className="text-sm text-neutral-600 space-y-1 list-disc list-inside">
            <li>Never placed over content or blocking interactions</li>
            <li>Positioned in dedicated sidebar or between-content slots only</li>
            <li>Hidden during sensitive moments (safety features, crisis resources)</li>
            <li>Completely removed for Premium and Pro subscribers</li>
          </ul>
          <p className="text-xs text-neutral-500 pt-1">
            This philosophy is prominently communicated on our landing page and pricing sections to build trust.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
