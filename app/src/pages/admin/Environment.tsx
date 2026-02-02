import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/api/admin';
import { toast } from 'sonner';

interface EnvVar {
  key: string;
  description: string;
  isSecret: boolean;
  restartRequired: boolean;
  isSet: boolean;
  valueMasked: string;
}

export function AdminEnvironment() {
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEnvVars();
  }, []);

  const loadEnvVars = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getEnvVars();
      setEnvVars(response.vars);
    } catch (error) {
      toast.error('Failed to load environment variables');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (key: string) => {
    const value = drafts[key] ?? '';
    try {
      const response = await adminApi.updateEnvVar(key, value);
      setEnvVars((prev) =>
        prev.map((item) =>
          item.key === key
            ? {
                ...item,
                valueMasked: response.valueMasked,
                isSet: response.isSet,
                restartRequired: response.restartRequired
              }
            : item
        )
      );
      toast.success(`${key} updated`);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to update environment variable');
    }
  };

  const restartNotice = useMemo(
    () => envVars.some((envVar) => envVar.restartRequired),
    [envVars]
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-neutral-500">
            Loading environment variables...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Environment</h1>
          <p className="text-sm text-neutral-500">
            View and update runtime environment variables for integrations and platform services.
          </p>
        </div>
        {restartNotice && (
          <Badge className="bg-amber-100 text-amber-700">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Some changes require restart
          </Badge>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {envVars.map((envVar) => (
          <Card key={envVar.key}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{envVar.key}</span>
                <Badge className={envVar.isSet ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}>
                  {envVar.isSet ? 'Set' : 'Empty'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-neutral-500">{envVar.description}</p>
              <div className="space-y-2">
                <Label>Value</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type={envVar.isSecret && !reveal[envVar.key] ? 'password' : 'text'}
                    placeholder={envVar.valueMasked || 'Not set'}
                    value={drafts[envVar.key] ?? ''}
                    onChange={(event) =>
                      setDrafts((prev) => ({ ...prev, [envVar.key]: event.target.value }))
                    }
                  />
                  {envVar.isSecret && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setReveal((prev) => ({ ...prev, [envVar.key]: !prev[envVar.key] }))
                      }
                    >
                      {reveal[envVar.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-neutral-500">
                  {envVar.restartRequired ? 'Restart required to apply.' : 'Applies immediately.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => handleSave(envVar.key)}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDrafts((prev) => ({ ...prev, [envVar.key]: '' }))}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
