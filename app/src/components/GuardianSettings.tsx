import { useEffect, useState } from 'react';
import { ShieldAlert, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { safetyApi, type GuardianReport } from '@/lib/api/safety';
import { toast } from 'sonner';

const SENSITIVITY_OPTIONS: { value: 'off' | 'subtle' | 'active'; label: string; desc: string }[] = [
  { value: 'off', label: 'Off', desc: 'No pattern scanning' },
  { value: 'subtle', label: 'Subtle', desc: 'Flag only high-confidence patterns' },
  { value: 'active', label: 'Active', desc: 'Flag even mild patterns — more alerts, more protection' }
];

const PATTERN_LABELS: Record<string, string> = {
  'love-bombing': 'Love bombing',
  'gaslighting': 'Gaslighting',
  'negging': 'Negging',
  'coercion': 'Coercion',
  'pressure': 'Pressure',
  'manipulation': 'Manipulation'
};

export function GuardianSettings() {
  const [sensitivity, setSensitivity] = useState<'off' | 'subtle' | 'active'>('subtle');
  const [report, setReport] = useState<GuardianReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, reportRes] = await Promise.all([
        safetyApi.getGuardianSettings(),
        safetyApi.getGuardianReport()
      ]);
      setSensitivity(settingsRes.sensitivity);
      setReport(reportRes);
    } catch {
      // Silent
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeSensitivity = async (value: 'off' | 'subtle' | 'active') => {
    try {
      await safetyApi.updateGuardianSettings(value);
      setSensitivity(value);
      toast.success(`Guardian sensitivity set to ${value}`);
    } catch {
      toast.error('Failed to update');
    }
  };

  if (isLoading) return <p className="text-sm text-neutral-500">Loading guardian settings...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          AI Conversation Guardian
        </CardTitle>
        <p className="text-xs text-neutral-500">
          Scans incoming messages for manipulation patterns like love-bombing, gaslighting, and coercion.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sensitivity selector */}
        <div className="space-y-2">
          <p className="text-xs text-neutral-500 font-medium">Sensitivity level</p>
          <div className="grid grid-cols-3 gap-2">
            {SENSITIVITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleChangeSensitivity(opt.value)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  sensitivity === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-[10px] text-neutral-500">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Aggregate report */}
        {report && report.total > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-neutral-500 font-medium flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> Pattern report
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-neutral-50 p-2 text-center">
                <p className="text-lg font-bold">{report.total}</p>
                <p className="text-[10px] text-neutral-500">Total flags</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2 text-center">
                <p className="text-lg font-bold text-amber-600">{report.active}</p>
                <p className="text-[10px] text-neutral-500">Active</p>
              </div>
              <div className="rounded-lg bg-green-50 p-2 text-center">
                <p className="text-lg font-bold text-green-600">{report.dismissed}</p>
                <p className="text-[10px] text-neutral-500">Dismissed</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(report.byType).map(([type, count]) => (
                <Badge key={type} variant="outline" className="text-[10px]">
                  {PATTERN_LABELS[type] || type}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {report && report.total === 0 && (
          <p className="text-xs text-neutral-400">No patterns flagged yet. The guardian is watching quietly.</p>
        )}
      </CardContent>
    </Card>
  );
}
