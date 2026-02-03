import { useEffect, useState } from 'react';
import { Activity, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminApi, type ExperienceStats } from '@/lib/api/admin';
import { toast } from 'sonner';

export function AdminExperience() {
  const [stats, setStats] = useState<ExperienceStats['stats'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    try {
      const response = await adminApi.getExperienceStats();
      setStats(response.stats);
    } catch {
      toast.error('Failed to load experience metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading) {
    return <div className="p-6 text-neutral-500">Loading experience metrics...</div>;
  }

  if (!stats) {
    return <div className="p-6 text-neutral-500">No data available.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Experience Health
        </h1>
        <p className="text-sm text-neutral-500">Calm mode adoption, onboarding, and consent signals.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Calm Mode Adoption
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold">{stats.calmAdoptionRate}%</p>
            <p className="text-sm text-neutral-500">Users who enabled calm mode.</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">Reduce motion: {stats.reduceMotionRate}%</Badge>
              <Badge variant="secondary">Lower saturation: {stats.reduceSaturationRate}%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Density Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Cozy</span>
              <Badge variant="outline">{stats.densityBreakdown.cozy}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Balanced</span>
              <Badge variant="outline">{stats.densityBreakdown.balanced}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Compact</span>
              <Badge variant="outline">{stats.densityBreakdown.compact}</Badge>
            </div>
          </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding Completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-3xl font-bold">{stats.onboardingCompleted}</p>
          <p className="text-sm text-neutral-500">
            {stats.onboardingIncomplete} users still onboarding.
          </p>
          <div className="pt-3 space-y-2">
            {Object.entries(stats.onboardingSteps).map(([step, count]) => (
              <div key={step} className="flex items-center justify-between text-sm">
                <span>Step {step}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Consent Signals
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-neutral-500">Total logs</p>
            <p className="text-2xl font-bold">{stats.consent.total}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Analytics consent</p>
            <p className="text-2xl font-bold">{stats.consent.analytics}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Marketing consent</p>
            <p className="text-2xl font-bold">{stats.consent.marketing}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
