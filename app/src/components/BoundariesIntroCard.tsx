import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { safetyApi } from '@/lib/api/safety';

interface BoundariesIntroCardProps {
  userId: string;
}

export function BoundariesIntroCard({ userId }: BoundariesIntroCardProps) {
  const [boundaries, setBoundaries] = useState<{ text: string; visibility: string }[]>([]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    safetyApi.getBoundariesFor(userId).then((res) => {
      setBoundaries(res.boundaries);
      setUserName(res.userName);
    }).catch(() => {});
  }, [userId]);

  if (boundaries.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-neutral-500 flex items-center gap-1">
        <ShieldCheck className="w-3 h-3" /> {userName}'s boundaries
      </p>
      <div className="space-y-1">
        {boundaries.slice(0, 3).map((b, i) => (
          <div key={i} className="rounded-md bg-purple-50 px-2.5 py-1 text-[10px] text-purple-700">
            {b.text}
          </div>
        ))}
        {boundaries.length > 3 && (
          <p className="text-[10px] text-neutral-400">+{boundaries.length - 3} more</p>
        )}
      </div>
    </div>
  );
}
