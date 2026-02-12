import { useState } from 'react';
import { MapPin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { safetyApi, type VenueSuggestion } from '@/lib/api/safety';
import { useAuthStore } from '@/lib/stores/auth';
import { toast } from 'sonner';

interface VenueSuggestionsProps {
  matchUserId: string;
}

export function VenueSuggestions({ matchUserId }: VenueSuggestionsProps) {
  const { user } = useAuthStore();
  const [suggestions, setSuggestions] = useState<VenueSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleLoad = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await safetyApi.getVenueSuggestions(user.id, matchUserId);
      setSuggestions(res.suggestions);
      setLoaded(true);
    } catch {
      toast.error('Failed to get venue suggestions');
    } finally {
      setLoading(false);
    }
  };

  if (!loaded) {
    return (
      <Button size="sm" variant="outline" className="text-xs h-7 w-full" onClick={handleLoad} disabled={loading}>
        <MapPin className="w-3 h-3 mr-1" />
        {loading ? 'Loading...' : 'Suggest date venues'}
      </Button>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-neutral-500 flex items-center gap-1">
        <Sparkles className="w-3 h-3" /> Venue ideas (based on sensory profiles)
      </p>
      {suggestions.map((s, i) => (
        <div key={i} className="flex items-start gap-2 rounded-md bg-blue-50 px-2.5 py-1.5 text-[11px]">
          <MapPin className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-blue-700">{s.venue}</span>
            <span className="text-blue-500 ml-1">— {s.reason}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
