import { useEffect, useState } from 'react';
import { Vibrate, Pencil, Mic, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { safetyApi, type StimPreferences } from '@/lib/api/safety';
import { toast } from 'sonner';

const HAPTIC_OPTIONS: Array<{ value: StimPreferences['hapticIntensity']; label: string }> = [
  { value: 'off', label: 'Off' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'strong', label: 'Strong' },
];

export function StimSettings() {
  const [prefs, setPrefs] = useState<StimPreferences>({
    hapticIntensity: 'off',
    doodleMode: false,
    fidgetReactions: false,
    voiceToText: false
  });

  useEffect(() => {
    safetyApi.getStimPreferences().then((res) => {
      setPrefs(res.stimPreferences);
    }).catch(() => {});
  }, []);

  const handleUpdate = async (updates: Partial<StimPreferences>) => {
    try {
      const res = await safetyApi.updateStimPreferences(updates);
      setPrefs(res.stimPreferences);
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Stim-Friendly Interactions
        </CardTitle>
        <p className="text-xs text-neutral-500">
          Customize interaction modes for a more comfortable messaging experience.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Haptic intensity */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Vibrate className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-medium">Haptic feedback</span>
          </div>
          <div className="flex gap-1.5">
            {HAPTIC_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleUpdate({ hapticIntensity: opt.value })}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                  prefs.hapticIntensity === opt.value
                    ? 'bg-primary text-white'
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-neutral-500" />
              <div>
                <p className="text-sm font-medium">Doodle mode</p>
                <p className="text-[10px] text-neutral-400">Send sketches instead of words in chat</p>
              </div>
            </div>
            <Switch checked={prefs.doodleMode} onCheckedChange={(v) => handleUpdate({ doodleMode: v })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neutral-500" />
              <div>
                <p className="text-sm font-medium">Fidget reactions</p>
                <p className="text-[10px] text-neutral-400">Drag, swipe, and hold message reactions</p>
              </div>
            </div>
            <Switch checked={prefs.fidgetReactions} onCheckedChange={(v) => handleUpdate({ fidgetReactions: v })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-neutral-500" />
              <div>
                <p className="text-sm font-medium">Voice-to-text</p>
                <p className="text-[10px] text-neutral-400">Transcribe voice with auto tone tag detection</p>
              </div>
            </div>
            <Switch checked={prefs.voiceToText} onCheckedChange={(v) => handleUpdate({ voiceToText: v })} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
