import { useEffect, useState } from 'react';
import { Ear, Sun, Utensils, Users, Hand, Wind } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { safetyApi, type SensoryProfile } from '@/lib/api/safety';
import { toast } from 'sonner';

interface SensoryProfileCardProps {
  userId: string;
  editable?: boolean;
  compact?: boolean;
}

const SENSORY_FIELDS: Array<{
  key: keyof SensoryProfile;
  label: string;
  icon: typeof Ear;
  lowLabel: string;
  highLabel: string;
}> = [
  { key: 'noise', label: 'Noise', icon: Ear, lowLabel: 'Very sensitive', highLabel: 'Comfortable' },
  { key: 'light', label: 'Light', icon: Sun, lowLabel: 'Prefer dim', highLabel: 'Bright is fine' },
  { key: 'foodTexture', label: 'Food texture', icon: Utensils, lowLabel: 'Very particular', highLabel: 'Flexible' },
  { key: 'crowds', label: 'Crowds', icon: Users, lowLabel: 'Avoid crowds', highLabel: 'Crowd-friendly' },
  { key: 'touch', label: 'Touch', icon: Hand, lowLabel: 'Need space', highLabel: 'Touch-comfortable' },
  { key: 'scents', label: 'Scents', icon: Wind, lowLabel: 'Very sensitive', highLabel: 'Not bothered' },
];

function getSensitivityColor(value: number): string {
  if (value < 30) return 'text-red-500';
  if (value < 50) return 'text-amber-500';
  if (value < 70) return 'text-emerald-500';
  return 'text-green-600';
}

function getBarColor(value: number): string {
  if (value < 30) return 'bg-red-400';
  if (value < 50) return 'bg-amber-400';
  if (value < 70) return 'bg-emerald-400';
  return 'bg-green-500';
}

export function SensoryProfileCard({ userId, editable = false, compact = false }: SensoryProfileCardProps) {
  const [profile, setProfile] = useState<SensoryProfile>({ noise: 50, light: 50, foodTexture: 50, crowds: 50, touch: 50, scents: 50 });
  const [userName, setUserName] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    safetyApi.getSensoryProfile(userId).then((res) => {
      setProfile(res.sensoryProfile);
      setUserName(res.userName);
    }).catch(() => {});
  }, [userId]);

  const handleChange = (key: keyof SensoryProfile, val: number) => {
    setProfile((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      const res = await safetyApi.updateSensoryProfile(profile);
      setProfile(res.sensoryProfile);
      setDirty(false);
      toast.success('Sensory profile saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  if (compact) {
    const sensitive = SENSORY_FIELDS.filter((f) => profile[f.key] < 35);
    if (sensitive.length === 0) return null;
    return (
      <div className="space-y-1.5">
        <p className="text-xs text-neutral-500 flex items-center gap-1">
          <Ear className="w-3 h-3" /> Sensory notes
        </p>
        <div className="flex flex-wrap gap-1">
          {sensitive.map((f) => {
            const Icon = f.icon;
            return (
              <span key={f.key} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] text-red-600">
                <Icon className="w-3 h-3" /> {f.lowLabel}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Ear className="w-5 h-5 text-primary" />
          {editable ? 'My Sensory Profile' : `${userName}'s Sensory Profile`}
        </CardTitle>
        <p className="text-xs text-neutral-500">
          {editable ? 'Lower values = more sensitive. Adjust to reflect your needs.' : 'Understanding sensory preferences helps plan better dates.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {SENSORY_FIELDS.map((field) => {
          const Icon = field.icon;
          const value = profile[field.key];
          return (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${getSensitivityColor(value)}`} />
                  <span className="text-sm font-medium">{field.label}</span>
                </div>
                <span className={`text-xs font-medium ${getSensitivityColor(value)}`}>
                  {value < 30 ? field.lowLabel : value < 70 ? 'Moderate' : field.highLabel}
                </span>
              </div>
              {editable ? (
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={value}
                  onChange={(e) => handleChange(field.key, Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary bg-neutral-200"
                />
              ) : (
                <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                  <div className={`h-full rounded-full ${getBarColor(value)}`} style={{ width: `${value}%` }} />
                </div>
              )}
            </div>
          );
        })}
        {editable && dirty && (
          <Button onClick={handleSave} size="sm" className="w-full">Save sensory profile</Button>
        )}
      </CardContent>
    </Card>
  );
}
