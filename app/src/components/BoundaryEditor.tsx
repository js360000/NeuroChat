import { useEffect, useState } from 'react';
import { ShieldCheck, Plus, X, Eye, EyeOff, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { safetyApi, type UserBoundary, type BoundaryPresetTemplate } from '@/lib/api/safety';
import { toast } from 'sonner';

const VISIBILITY_ICONS = {
  all: Eye,
  matches: Users,
  private: EyeOff
};

const VISIBILITY_LABELS: Record<string, string> = {
  all: 'Everyone',
  matches: 'Matches only',
  private: 'Private'
};

const CATEGORY_COLORS: Record<string, string> = {
  pacing: 'bg-blue-100 text-blue-700',
  communication: 'bg-emerald-100 text-emerald-700',
  physical: 'bg-pink-100 text-pink-700',
  emotional: 'bg-purple-100 text-purple-700',
  sensory: 'bg-amber-100 text-amber-700'
};

export function BoundaryEditor() {
  const [boundaries, setBoundaries] = useState<UserBoundary[]>([]);
  const [presets, setPresets] = useState<BoundaryPresetTemplate[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [customText, setCustomText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [boundaryRes, presetRes] = await Promise.all([
        safetyApi.getBoundaries(),
        safetyApi.getBoundaryPresets()
      ]);
      setBoundaries(boundaryRes.boundaries);
      setPresets(presetRes.presets);
    } catch {
      toast.error('Failed to load boundaries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (newBoundaries: UserBoundary[]) => {
    try {
      const res = await safetyApi.updateBoundaries(newBoundaries);
      setBoundaries(res.boundaries);
      toast.success('Boundaries updated');
    } catch {
      toast.error('Failed to update boundaries');
    }
  };

  const handleAddPreset = (preset: BoundaryPresetTemplate) => {
    if (boundaries.some((b) => b.text === preset.text)) return;
    const newBoundary: UserBoundary = {
      id: preset.id,
      text: preset.text,
      visibility: 'matches',
      isPreset: true,
      active: true
    };
    handleSave([...boundaries, newBoundary]);
  };

  const handleAddCustom = () => {
    if (!customText.trim()) return;
    const newBoundary: UserBoundary = {
      id: `custom-${Date.now()}`,
      text: customText.trim(),
      visibility: 'matches',
      isPreset: false,
      active: true
    };
    handleSave([...boundaries, newBoundary]);
    setCustomText('');
  };

  const handleRemove = (id: string) => {
    handleSave(boundaries.filter((b) => b.id !== id));
  };

  const handleToggleActive = (id: string) => {
    handleSave(boundaries.map((b) => b.id === id ? { ...b, active: !b.active } : b));
  };

  const handleCycleVisibility = (id: string) => {
    const order: UserBoundary['visibility'][] = ['matches', 'all', 'private'];
    handleSave(boundaries.map((b) => {
      if (b.id !== id) return b;
      const idx = order.indexOf(b.visibility);
      return { ...b, visibility: order[(idx + 1) % order.length] };
    }));
  };

  if (isLoading) return <p className="text-sm text-neutral-500">Loading boundaries...</p>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Boundary Presets
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowEditor(!showEditor)}>
            {showEditor ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-neutral-500">
          Set boundaries that are shown to matches before they message you.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {showEditor && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <p className="text-xs text-neutral-500 font-medium">One-tap presets:</p>
            <div className="flex flex-wrap gap-1.5">
              {presets
                .filter((p) => !boundaries.some((b) => b.text === p.text))
                .map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleAddPreset(preset)}
                    className="rounded-full bg-white border border-neutral-200 px-3 py-1 text-xs text-neutral-700 hover:bg-primary/10 hover:border-primary/30 transition-colors"
                  >
                    <Badge className={CATEGORY_COLORS[preset.category] || 'bg-neutral-100'} variant="secondary">
                      {preset.category}
                    </Badge>{' '}
                    {preset.text}
                  </button>
                ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Add a custom boundary..."
                className="text-xs h-8"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
              />
              <Button size="sm" className="h-8" onClick={handleAddCustom}>Add</Button>
            </div>
          </div>
        )}

        {boundaries.length === 0 && !showEditor && (
          <p className="text-sm text-neutral-400">No boundaries set. Add some to let matches know your preferences.</p>
        )}

        {boundaries.map((boundary) => {
          const VisIcon = VISIBILITY_ICONS[boundary.visibility] || Eye;
          return (
            <div
              key={boundary.id}
              className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-opacity ${
                boundary.active ? 'border-neutral-200 opacity-100' : 'border-neutral-100 opacity-50'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  onClick={() => handleToggleActive(boundary.id)}
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    boundary.active ? 'bg-primary border-primary text-white' : 'border-neutral-300'
                  }`}
                >
                  {boundary.active && <span className="text-[10px]">✓</span>}
                </button>
                <span className="text-sm truncate">{boundary.text}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleCycleVisibility(boundary.id)}
                  className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-neutral-500 hover:bg-neutral-100"
                  title={VISIBILITY_LABELS[boundary.visibility]}
                >
                  <VisIcon className="w-3 h-3" />
                  <span className="hidden sm:inline">{VISIBILITY_LABELS[boundary.visibility]}</span>
                </button>
                <button onClick={() => handleRemove(boundary.id)} className="p-0.5 text-neutral-400 hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
