import { useEffect, useMemo, useState } from 'react';
import { LifeBuoy, PhoneCall, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useAuthStore } from '@/lib/stores/auth';
import { useAppConfig } from '@/lib/stores/config';

const REGION_LABELS: Record<string, string> = {
  us: 'United States',
  uk: 'United Kingdom',
  ca: 'Canada',
  au: 'Australia',
  other: 'Other'
};

export function HelpPage() {
  const appConfig = useAppConfig();
  const RESOURCE_MAP = appConfig.crisisResources;
  const regionKeys = Object.keys(RESOURCE_MAP);
  const [region, setRegion] = useState('us');
  const { user, updateProfile } = useAuthStore();

  const resources = useMemo(() => RESOURCE_MAP[region] || RESOURCE_MAP.other || [], [region, RESOURCE_MAP]);

  useEffect(() => {
    if (!user || user.safetyChecklist?.resourcesViewed) return;
    const nextChecklist = {
      boundariesSet: user.safetyChecklist?.boundariesSet ?? false,
      filtersSet: user.safetyChecklist?.filtersSet ?? false,
      resourcesViewed: true,
      completed: user.safetyChecklist?.completed ?? false
    };
    updateProfile({ safetyChecklist: nextChecklist });
  }, [user, updateProfile]);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-primary" />
            I need help
          </h1>
          <p className="text-sm text-neutral-500">
            Immediate support resources and calm check-in steps.
          </p>
        </div>

        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <p className="text-sm text-neutral-600">
                If you are in immediate danger, call your local emergency number.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-500">Region</span>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regionKeys.map((key) => (
                    <SelectItem key={key} value={key}>
                      {REGION_LABELS[key] || key.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {resources.map((resource) => (
            <Card key={resource.name}>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold">{resource.name}</h2>
                </div>
                <p className="text-sm text-neutral-600">{resource.description}</p>
                <Button variant="outline" size="sm">
                  {resource.contact}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

