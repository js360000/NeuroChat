import { useEffect, useState } from 'react';
import { Battery, BatteryLow, BatteryMedium, BatteryFull, BatteryCharging, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { safetyApi, type SocialEnergy } from '@/lib/api/safety';
import { useAuthStore } from '@/lib/stores/auth';
import { toast } from 'sonner';

const ENERGY_ICONS = {
  full: BatteryFull,
  medium: BatteryMedium,
  low: BatteryLow,
  recharging: BatteryCharging
};

const ENERGY_COLORS = {
  full: 'text-green-600',
  medium: 'text-amber-500',
  low: 'text-red-500',
  recharging: 'text-violet-500'
};

const ENERGY_BG = {
  full: 'bg-green-50',
  medium: 'bg-amber-50',
  low: 'bg-red-50',
  recharging: 'bg-violet-50'
};

export function EnergyMeter() {
  const { user } = useAuthStore();
  const [energy, setEnergy] = useState<SocialEnergy | null>(null);
  const [showPause, setShowPause] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [rechargeReminder, setRechargeReminder] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recharge-reminder') || 'false'); } catch { return false; }
  });

  useEffect(() => {
    if (!user) return;
    safetyApi.getEnergy().then((res) => setEnergy(res.energy)).catch(() => {});
  }, [user]);

  if (!user || !energy) return null;

  const Icon = ENERGY_ICONS[energy.label] || Battery;
  const color = ENERGY_COLORS[energy.label] || 'text-neutral-500';
  const bg = ENERGY_BG[energy.label] || 'bg-neutral-50';

  const handleQuickSet = async (label: SocialEnergy['label'], level: number) => {
    try {
      const res = await safetyApi.updateEnergy({ label, level });
      setEnergy(res.energy);
      if (res.autoPauseSuggested) {
        setShowPause(true);
      }
    } catch {
      toast.error('Failed to update energy');
    }
  };

  const handleAcceptPause = async () => {
    try {
      const res = await safetyApi.acceptAutoPause();
      toast.success(res.message);
      setShowPause(false);
    } catch {
      toast.error('Failed to pause');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${bg} ${color} hover:opacity-80`}
      >
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline capitalize">{energy.label}</span>
      </button>

      {expanded && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-neutral-200 bg-white p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Social Energy</h4>
            <span className={`text-xs font-medium ${color}`}>{energy.level}%</span>
          </div>

          {/* Energy bar */}
          <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                energy.label === 'full' ? 'bg-green-500' :
                energy.label === 'medium' ? 'bg-amber-400' :
                energy.label === 'low' ? 'bg-red-400' : 'bg-violet-400'
              }`}
              style={{ width: `${energy.level}%` }}
            />
          </div>

          {/* Quick-set buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {([
              { label: 'full' as const, level: 100, icon: '🔋' },
              { label: 'medium' as const, level: 60, icon: '⚡' },
              { label: 'low' as const, level: 25, icon: '🪫' },
              { label: 'recharging' as const, level: 10, icon: '🔌' },
            ]).map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleQuickSet(opt.label, opt.level)}
                className={`rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors ${
                  energy.label === opt.label
                    ? 'bg-primary text-white'
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          {/* Toggles */}
          <div className="space-y-2 border-t border-neutral-100 pt-2">
            <label className="flex items-center justify-between text-[10px]">
              <span className="text-neutral-600">Show on profile</span>
              <input
                type="checkbox"
                checked={energy.showOnProfile}
                onChange={async (e) => {
                  try {
                    const res = await safetyApi.updateEnergy({ showOnProfile: e.target.checked });
                    setEnergy(res.energy);
                  } catch {}
                }}
                className="rounded accent-primary"
              />
            </label>
            <label className="flex items-center justify-between text-[10px]">
              <span className="text-neutral-600">Recharge reminders</span>
              <input
                type="checkbox"
                checked={rechargeReminder}
                onChange={async (e) => {
                  setRechargeReminder(e.target.checked);
                  localStorage.setItem('recharge-reminder', JSON.stringify(e.target.checked));
                }}
                className="rounded accent-primary"
              />
            </label>
          </div>

          {/* Auto-pause suggestion */}
          {showPause && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
              <p className="text-xs text-amber-700">
                Your energy is low. Want to pause discovery so you can recharge?
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={handleAcceptPause}>
                  <Pause className="w-3 h-3 mr-1" /> Pause
                </Button>
                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowPause(false)}>
                  Not now
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
