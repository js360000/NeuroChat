import { useEffect, useState } from 'react';
import { Brain, Plus, TrendingDown, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { safetyApi, type MaskingLog, type MaskingInsights } from '@/lib/api/safety';
import { toast } from 'sonner';

const CONTEXT_OPTIONS = [
  { value: 'conversation', label: 'Conversation' },
  { value: 'date', label: 'Date' },
  { value: 'social', label: 'Social event' },
  { value: 'work', label: 'Work' },
  { value: 'other', label: 'Other' },
] as const;

const INTENSITY_LABELS = ['', 'Minimal', 'Light', 'Moderate', 'Heavy', 'Extreme'];
const INTENSITY_COLORS = ['', 'bg-green-100 text-green-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-orange-100 text-orange-700', 'bg-red-100 text-red-700'];

export function MaskingTracker() {
  const [logs, setLogs] = useState<MaskingLog[]>([]);
  const [insights, setInsights] = useState<MaskingInsights | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [context, setContext] = useState<string>('conversation');
  const [energyBefore, setEnergyBefore] = useState(60);
  const [energyAfter, setEnergyAfter] = useState(40);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [logsRes, insightsRes] = await Promise.all([
        safetyApi.getMaskingLogs(),
        safetyApi.getMaskingInsights()
      ]);
      setLogs(logsRes.logs.slice(0, 10));
      setInsights(insightsRes.insights);
    } catch {
      // Silent
    }
  };

  const handleSubmit = async () => {
    try {
      await safetyApi.createMaskingLog({
        intensity,
        context: context as MaskingLog['context'],
        energyBefore,
        energyAfter,
        notes: notes || undefined,
        tags: []
      });
      toast.success('Masking log saved');
      setShowForm(false);
      setNotes('');
      loadData();
    } catch {
      toast.error('Failed to save log');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Masking Fatigue Tracker
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-1" /> Log
          </Button>
        </div>
        <p className="text-xs text-neutral-500">Track masking intensity to understand what drains vs. energizes you.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-neutral-600">Masking intensity</p>
              <div className="flex gap-1.5">
                {([1, 2, 3, 4, 5] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setIntensity(v)}
                    className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                      intensity === v ? INTENSITY_COLORS[v] : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'
                    }`}
                  >
                    {v} - {INTENSITY_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-neutral-600">Context</p>
              <div className="flex flex-wrap gap-1.5">
                {CONTEXT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setContext(opt.value)}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      context === opt.value ? 'bg-primary text-white' : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-neutral-600">Energy before</p>
                <Input type="number" min={0} max={100} value={energyBefore} onChange={(e) => setEnergyBefore(Number(e.target.value))} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-neutral-600">Energy after</p>
                <Input type="number" min={0} max={100} value={energyAfter} onChange={(e) => setEnergyAfter(Number(e.target.value))} className="h-8 text-xs" />
              </div>
            </div>

            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)..." className="text-xs min-h-[60px]" />
            <Button size="sm" onClick={handleSubmit} className="w-full">Save log</Button>
          </div>
        )}

        {insights && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-neutral-500 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> Weekly insights
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-neutral-50 p-2 text-center">
                <p className="text-lg font-bold">{insights.totalLogs}</p>
                <p className="text-[10px] text-neutral-500">Total logs</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2 text-center">
                <p className="text-lg font-bold text-amber-600">{insights.avgIntensity}</p>
                <p className="text-[10px] text-neutral-500">Avg intensity</p>
              </div>
              <div className="rounded-lg bg-red-50 p-2 text-center">
                <p className="text-lg font-bold text-red-600">{insights.avgEnergyDrain}%</p>
                <p className="text-[10px] text-neutral-500">Avg drain</p>
              </div>
            </div>
            {insights.mostDraining && (
              <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50/50 p-2.5 text-xs">
                <TrendingDown className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <span className="text-red-700">Most draining: <strong>{insights.mostDraining.context}</strong> (avg drain {insights.mostDraining.avgDrain}%)</span>
              </div>
            )}
            {insights.leastDraining && insights.leastDraining.context !== insights.mostDraining?.context && (
              <div className="flex items-start gap-2 rounded-lg border border-green-100 bg-green-50/50 p-2.5 text-xs">
                <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-green-700">Least draining: <strong>{insights.leastDraining.context}</strong> (avg drain {insights.leastDraining.avgDrain}%)</span>
              </div>
            )}
            {insights.leastDraining && insights.mostDraining && insights.mostDraining.avgDrain > 0 && (
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-2.5 text-xs text-primary">
                {insights.leastDraining.context === 'conversation'
                  ? `Conversations drain ${insights.leastDraining.avgDrain}% on average — your lightest interaction type.`
                  : insights.mostDraining.avgDrain - insights.leastDraining.avgDrain > 15
                    ? `${insights.leastDraining.context} interactions are ${insights.mostDraining.avgDrain - insights.leastDraining.avgDrain}% less draining than ${insights.mostDraining.context}.`
                    : `Your masking levels are fairly consistent across contexts (${insights.avgIntensity}/5 avg).`}
              </div>
            )}
          </div>
        )}

        {logs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-neutral-500">Recent logs</p>
            {logs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <Badge className={INTENSITY_COLORS[log.intensity]} variant="secondary">{INTENSITY_LABELS[log.intensity]}</Badge>
                  <span className="text-neutral-600">{log.context}</span>
                </div>
                <span className="text-neutral-400">{log.energyBefore}% → {log.energyAfter}%</span>
              </div>
            ))}
          </div>
        )}

        {!insights && logs.length === 0 && !showForm && (
          <p className="text-sm text-neutral-400">No logs yet. Tap "Log" to start tracking your masking patterns.</p>
        )}
      </CardContent>
    </Card>
  );
}
