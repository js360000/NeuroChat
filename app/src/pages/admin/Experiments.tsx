import { useEffect, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { adminApi, type ExperimentSettings } from '@/lib/api/admin';
import { toast } from 'sonner';

const DEFAULT_EXPERIMENTS: ExperimentSettings = {
  landingHeroVariant: 'calm',
  onboardingToneVariant: 'gentle',
  discoveryIntentVariant: 'cards',
  compassCtaVariant: 'standard'
};

export function AdminExperiments() {
  const [experiments, setExperiments] = useState<ExperimentSettings>(DEFAULT_EXPERIMENTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadExperiments = async () => {
    try {
      const response = await adminApi.getExperiments();
      setExperiments(response.experiments);
    } catch {
      toast.error('Failed to load experiments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExperiments();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await adminApi.updateExperiments(experiments);
      setExperiments(response.experiments);
      toast.success('Experiments updated');
    } catch {
      toast.error('Failed to update experiments');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-neutral-500">Loading experiments...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          Experiment Controls
        </h1>
        <p className="text-sm text-neutral-500">Toggle copy variants for landing and onboarding.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Landing hero variant</label>
            <Select
              value={experiments.landingHeroVariant}
              onValueChange={(value) =>
                setExperiments((prev) => ({ ...prev, landingHeroVariant: value as ExperimentSettings['landingHeroVariant'] }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select variant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="calm">Calm</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Onboarding tone</label>
            <Select
              value={experiments.onboardingToneVariant}
              onValueChange={(value) =>
                setExperiments((prev) => ({ ...prev, onboardingToneVariant: value as ExperimentSettings['onboardingToneVariant'] }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gentle">Gentle</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Discovery intent layout</label>
            <Select
              value={experiments.discoveryIntentVariant}
              onValueChange={(value) =>
                setExperiments((prev) => ({ ...prev, discoveryIntentVariant: value as ExperimentSettings['discoveryIntentVariant'] }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cards">Cards</SelectItem>
                <SelectItem value="list">List</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Compass CTA copy</label>
            <Select
              value={experiments.compassCtaVariant}
              onValueChange={(value) =>
                setExperiments((prev) => ({ ...prev, compassCtaVariant: value as ExperimentSettings['compassCtaVariant'] }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select CTA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="mentor">Mentor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}
