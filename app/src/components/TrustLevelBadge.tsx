import { useState, useEffect, useRef } from 'react';
import { Shield, ShieldCheck, Lock, Unlock, ChevronDown, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { safetyApi, type TrustLevelInfo } from '@/lib/api/safety';
import { toast } from 'sonner';

interface TrustLevelBadgeProps {
  conversationId: string;
  compact?: boolean;
}

const LEVEL_COLORS = [
  'bg-neutral-100 text-neutral-600',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-green-100 text-green-700'
];

const LEVEL_ICONS = [Shield, Shield, ShieldCheck, ShieldCheck];

export function TrustLevelBadge({ conversationId, compact = false }: TrustLevelBadgeProps) {
  const [info, setInfo] = useState<TrustLevelInfo | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    loadTrustLevel();
  }, [conversationId]);

  useEffect(() => {
    if (info && prevLevelRef.current !== null && info.trustLevel > prevLevelRef.current) {
      setCelebrating(true);
      toast.success(`Trust level up! Now: ${info.features.label}`);
      const timer = setTimeout(() => setCelebrating(false), 2000);
      return () => clearTimeout(timer);
    }
    if (info) prevLevelRef.current = info.trustLevel;
  }, [info?.trustLevel]);

  const loadTrustLevel = async () => {
    try {
      const data = await safetyApi.getTrustLevel(conversationId);
      setInfo(data);
    } catch {
      // Silently fail — trust level is supplementary
    }
  };

  const handleSetLevel = async (level: number | null) => {
    setIsUpdating(true);
    try {
      const data = await safetyApi.setTrustLevel(conversationId, level);
      setInfo(data);
      toast.success(level === null ? 'Trust level reset to auto' : `Trust level set to ${data.features.label}`);
    } catch {
      toast.error('Failed to update trust level');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!info) return null;

  const level = info.trustLevel;
  const LevelIcon = LEVEL_ICONS[level - 1] || Shield;
  const colorClass = LEVEL_COLORS[level - 1] || LEVEL_COLORS[0];

  if (compact) {
    return (
      <Badge className={`${colorClass} cursor-pointer`} onClick={() => setShowDetails(!showDetails)}>
        <LevelIcon className="w-3 h-3 mr-1" />
        L{level}
      </Badge>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${colorClass} hover:opacity-80 ${celebrating ? 'animate-bounce' : ''}`}
      >
        {celebrating && <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
        <LevelIcon className="w-3.5 h-3.5" />
        {info.features.label}
        <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
      </button>

      {showDetails && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-neutral-200 bg-white p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Trust Level {level}</h4>
            {info.isOverridden && (
              <Badge variant="outline" className="text-[10px]">Manual</Badge>
            )}
          </div>

          <p className="text-xs text-neutral-500">
            {info.messageCount} messages exchanged
          </p>

          {/* Feature list */}
          <div className="space-y-1.5">
            <FeatureRow label="Text messages" unlocked={info.features.textMessages} />
            <FeatureRow label="Images & voice notes" unlocked={info.features.images} />
            <FeatureRow label="Video chat & location" unlocked={info.features.videoChat} />
            <FeatureRow label="Contact exchange" unlocked={info.features.contactExchange} />
          </div>

          {/* Next unlock hint */}
          {info.features.nextUnlock && (
            <div className="rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary">
              {info.features.nextUnlock.hint}
            </div>
          )}

          {/* Manual controls */}
          <div className="border-t border-neutral-100 pt-3 space-y-2">
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium">Adjust trust level</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((l) => (
                <Button
                  key={l}
                  size="sm"
                  variant={level === l ? 'default' : 'outline'}
                  className="flex-1 text-xs h-7"
                  disabled={isUpdating}
                  onClick={() => handleSetLevel(l)}
                >
                  {l}
                </Button>
              ))}
            </div>
            {info.isOverridden && (
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-xs text-neutral-500"
                onClick={() => handleSetLevel(null)}
                disabled={isUpdating}
              >
                Reset to auto
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureRow({ label, unlocked }: { label: string; unlocked: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {unlocked ? (
        <Unlock className="w-3 h-3 text-green-500" />
      ) : (
        <Lock className="w-3 h-3 text-neutral-300" />
      )}
      <span className={unlocked ? 'text-neutral-700' : 'text-neutral-400'}>{label}</span>
    </div>
  );
}
