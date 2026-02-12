import { useEffect, useState } from 'react';
import { ShieldAlert, X, ExternalLink } from 'lucide-react';
import { safetyApi, type MessageFlagEnriched } from '@/lib/api/safety';
import { useAuthStore } from '@/lib/stores/auth';

interface GuardianNudgeProps {
  conversationId?: string;
}

export function GuardianNudge({ conversationId }: GuardianNudgeProps) {
  const { user } = useAuthStore();
  const [flags, setFlags] = useState<MessageFlagEnriched[]>([]);

  useEffect(() => {
    if (!user) return;
    loadFlags();
  }, [user, conversationId]);

  const loadFlags = async () => {
    try {
      const res = await safetyApi.getGuardianFlags();
      const filtered = conversationId
        ? res.flags.filter((f) => f.conversationId === conversationId)
        : res.flags;
      setFlags(filtered.slice(0, 3));
    } catch {
      // Silent fail
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await safetyApi.dismissGuardianFlag(id);
      setFlags((prev) => prev.filter((f) => f.id !== id));
    } catch {
      // Silent fail
    }
  };

  if (flags.length === 0) return null;

  return (
    <div className="space-y-2">
      {flags.map((flag) => (
        <div
          key={flag.id}
          className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2.5 text-xs"
        >
          <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1 space-y-1">
            <p className="text-amber-800 font-medium">
              Heads up — possible {flag.patternType.replace('-', ' ')} detected
            </p>
            <p className="text-amber-700/80">{flag.description}</p>
            {flag.learnMoreUrl && (
              <a
                href={flag.learnMoreUrl}
                className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-800 underline"
              >
                Learn more <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <button
            onClick={() => handleDismiss(flag.id)}
            className="rounded p-0.5 text-amber-400 hover:text-amber-600"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
