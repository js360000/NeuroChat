import { useEffect, useState } from 'react';
import { IdCard, ThumbsUp, Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { safetyApi, type PassportItemEnriched, type PassportPreset, type PassportItem } from '@/lib/api/safety';
import { useAuthStore } from '@/lib/stores/auth';
import { toast } from 'sonner';

interface PassportCardProps {
  userId: string;
  editable?: boolean;
  compact?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  literal: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  tone: 'bg-emerald-100 text-emerald-700',
  pacing: 'bg-amber-100 text-amber-700',
  sensory: 'bg-pink-100 text-pink-700',
  custom: 'bg-neutral-100 text-neutral-600'
};

export function PassportCard({ userId, editable = false, compact = false }: PassportCardProps) {
  const { user } = useAuthStore();
  const [items, setItems] = useState<PassportItemEnriched[]>([]);
  const [presets, setPresets] = useState<PassportPreset[]>([]);
  const [userName, setUserName] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [customText, setCustomText] = useState('');

  useEffect(() => {
    loadPassport();
    if (editable) loadPresets();
  }, [userId]);

  const loadPassport = async () => {
    try {
      const res = await safetyApi.getPassport(userId);
      setItems(res.items);
      setUserName(res.userName);
    } catch {
      // Silent
    }
  };

  const loadPresets = async () => {
    try {
      const res = await safetyApi.getPassportPresets();
      setPresets(res.presets);
    } catch {
      // Silent
    }
  };

  const handleSave = async (newItems: PassportItem[]) => {
    try {
      const res = await safetyApi.updatePassport(newItems);
      setItems(res.items.map((i) => ({ ...i, endorsedBy: [] })));
      toast.success('Passport updated');
    } catch {
      toast.error('Failed to update passport');
    }
  };

  const handleAddPreset = (preset: PassportPreset) => {
    if (items.some((i) => i.text === preset.text)) return;
    const newItem: PassportItem = {
      id: preset.id,
      text: preset.text,
      category: preset.category,
      isPreset: true,
      endorsements: 0
    };
    const newItems = [...items, newItem];
    handleSave(newItems);
  };

  const handleAddCustom = () => {
    if (!customText.trim()) return;
    const newItem: PassportItem = {
      id: `custom-${Date.now()}`,
      text: customText.trim(),
      category: 'custom',
      isPreset: false,
      endorsements: 0
    };
    const newItems = [...items, newItem];
    handleSave(newItems);
    setCustomText('');
  };

  const handleRemove = (id: string) => {
    const newItems = items.filter((i) => i.id !== id);
    handleSave(newItems);
  };

  const handleEndorse = async (itemId: string) => {
    try {
      await safetyApi.endorsePassportItem(userId, itemId);
      toast.success('Endorsed!');
      loadPassport();
    } catch {
      toast.error('Could not endorse');
    }
  };

  if (items.length === 0 && !editable) return null;

  if (compact) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs text-neutral-500 flex items-center gap-1">
          <IdCard className="w-3 h-3" /> Communication style
        </p>
        <div className="flex flex-wrap gap-1.5">
          {items.slice(0, 4).map((item) => (
            <Badge key={item.id} variant="outline" className="text-[10px]">
              {item.text}
            </Badge>
          ))}
          {items.length > 4 && (
            <Badge variant="outline" className="text-[10px]">+{items.length - 4} more</Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <IdCard className="w-5 h-5 text-primary" />
            {editable ? 'My Communication Passport' : `${userName}'s Communication Style`}
          </CardTitle>
          {editable && (
            <Button size="sm" variant="outline" onClick={() => setShowEditor(!showEditor)}>
              {showEditor ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showEditor && editable && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <p className="text-xs text-neutral-500 font-medium">Add from presets:</p>
            <div className="flex flex-wrap gap-1.5">
              {presets
                .filter((p) => !items.some((i) => i.text === p.text))
                .map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleAddPreset(preset)}
                    className="rounded-full bg-white border border-neutral-200 px-3 py-1 text-xs text-neutral-700 hover:bg-primary/10 hover:border-primary/30 transition-colors"
                  >
                    + {preset.text}
                  </button>
                ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Add your own..."
                className="text-xs h-8"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
              />
              <Button size="sm" className="h-8" onClick={handleAddCustom}>Add</Button>
            </div>
          </div>
        )}

        {items.length === 0 && (
          <p className="text-sm text-neutral-400">
            {editable ? 'Add items to your passport to help others understand your communication style.' : 'No passport items yet.'}
          </p>
        )}

        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between rounded-lg border border-neutral-200 px-3 py-2.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className={CATEGORY_COLORS[item.category] || CATEGORY_COLORS.custom} variant="secondary">
                  {item.category}
                </Badge>
                <span className="text-sm">{item.text}</span>
              </div>
              {item.endorsedBy && item.endorsedBy.length > 0 && (
                <p className="text-[10px] text-neutral-400">
                  Confirmed by {item.endorsedBy.map((e) => e.name).join(', ')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {!editable && user?.id !== userId && (
                <button
                  onClick={() => handleEndorse(item.id)}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] text-neutral-500 hover:bg-green-50 hover:text-green-600 transition-colors"
                >
                  <ThumbsUp className="w-3 h-3" /> Confirm
                </button>
              )}
              {editable && (
                <button onClick={() => handleRemove(item.id)} className="p-0.5 text-neutral-400 hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
