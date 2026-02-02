import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, RefreshCcw, Rocket, Workflow, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { adminApi } from '@/lib/api/admin';
import { toast } from 'sonner';

interface N8nConfig {
  baseUrl: string;
  apiVersion: number;
  webhookUrl: string;
  enabled: boolean;
  apiKeyMasked?: string;
}

interface WorkflowSummary {
  id: string;
  name: string;
  active: boolean;
}

const CHANNELS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' }
];

const TEMPLATE_COPY: Record<string, { title: string; description: string; tags: string[] }> = {
  instagram: {
    title: 'Instagram post & Reel scheduler',
    description:
      'Queue captions, media URLs, and hashtags for n8n workflows that post via Meta APIs.',
    tags: ['Graph API', 'Content queue', 'Reels']
  },
  facebook: {
    title: 'Facebook page scheduling',
    description:
      'Publish to a page with caption, link, and asset payloads using n8n social workflows.',
    tags: ['Page post', 'Link share', 'Auto-comments']
  },
  youtube: {
    title: 'YouTube upload & community post',
    description:
      'Send video metadata, description, and publish time to an n8n workflow.',
    tags: ['Upload', 'Metadata', 'Premiere']
  }
};

export function AdminAutomation() {
  const [config, setConfig] = useState<N8nConfig | null>(null);
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('instagram');
  const [payload, setPayload] = useState({
    title: '',
    caption: '',
    description: '',
    mediaUrl: '',
    scheduledAt: ''
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const statusBadge = useMemo(() => {
    if (!config?.enabled) return { label: 'Disabled', className: 'bg-neutral-100 text-neutral-600' };
    if (!config?.baseUrl || !config?.apiKeyMasked) {
      return { label: 'Needs setup', className: 'bg-amber-100 text-amber-700' };
    }
    return { label: 'Configured', className: 'bg-green-100 text-green-700' };
  }, [config]);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getN8nConfig();
      setConfig(response.config);
    } catch (error) {
      toast.error('Failed to load n8n configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkflows = async () => {
    try {
      const response = await adminApi.getN8nWorkflows();
      const list = (response.workflows || []).map((workflow: any) => ({
        id: workflow.id?.toString?.() ?? workflow.id,
        name: workflow.name,
        active: workflow.active ?? false
      }));
      setWorkflows(list);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to load workflows');
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const response = await adminApi.updateN8nConfig({
        baseUrl: config.baseUrl,
        apiVersion: config.apiVersion,
        webhookUrl: config.webhookUrl,
        enabled: config.enabled,
        apiKey: apiKeyDraft
      });
      setConfig(response.config);
      setApiKeyDraft('');
      toast.success('n8n configuration saved');
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const sendPayload = async () => {
    try {
      await adminApi.triggerN8nWebhook({
        event: 'social_schedule',
        channel: selectedChannel,
        payload
      });
      toast.success('Payload sent to n8n');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to send payload');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-neutral-500">
            Loading automation settings...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automation</h1>
          <p className="text-sm text-neutral-500">
            Connect n8n to schedule NeuroNest social posts and orchestrate campaigns.
          </p>
        </div>
        <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            n8n Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input
                value={config?.baseUrl || ''}
                onChange={(event) => setConfig((prev) => prev ? { ...prev, baseUrl: event.target.value } : prev)}
                placeholder="https://n8n.yourdomain.com"
              />
            </div>
            <div className="space-y-2">
              <Label>API Version</Label>
              <Input
                type="number"
                value={config?.apiVersion ?? 1}
                onChange={(event) => setConfig((prev) => prev ? { ...prev, apiVersion: Number(event.target.value) } : prev)}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input
                value={config?.webhookUrl || ''}
                onChange={(event) => setConfig((prev) => prev ? { ...prev, webhookUrl: event.target.value } : prev)}
                placeholder="https://n8n.yourdomain.com/webhook/social-scheduler"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={apiKeyDraft}
                onChange={(event) => setApiKeyDraft(event.target.value)}
                placeholder={config?.apiKeyMasked ? `Saved key: ${config.apiKeyMasked}` : 'Paste API key'}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable n8n</p>
              <p className="text-sm text-neutral-500">Toggle the integration on or off.</p>
            </div>
            <Switch
              checked={config?.enabled ?? false}
              onCheckedChange={(value) => setConfig((prev) => prev ? { ...prev, enabled: value } : prev)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={saveConfig} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save settings'}
            </Button>
            <Button variant="outline" onClick={loadWorkflows}>
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh workflows
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-primary" />
            Workflow status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <p className="text-sm text-neutral-500">No workflows loaded yet. Refresh to pull from n8n.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="flex items-center justify-between border border-neutral-200 rounded-xl p-3"
                >
                  <div>
                    <p className="font-medium">{workflow.name}</p>
                    <p className="text-xs text-neutral-500">ID {workflow.id}</p>
                  </div>
                  <Badge className={workflow.active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}>
                    {workflow.active ? 'Active' : 'Paused'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Social scheduler payload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-[200px,1fr] gap-4 items-start">
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((channel) => (
                    <SelectItem key={channel.value} value={channel.value}>
                      {channel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="rounded-xl border border-neutral-200 p-3 space-y-2">
                <p className="text-sm font-medium">{TEMPLATE_COPY[selectedChannel].title}</p>
                <p className="text-xs text-neutral-500">{TEMPLATE_COPY[selectedChannel].description}</p>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_COPY[selectedChannel].tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={payload.title}
                    onChange={(event) => setPayload((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Campaign title or video name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scheduled at</Label>
                  <Input
                    type="datetime-local"
                    value={payload.scheduledAt}
                    onChange={(event) => setPayload((prev) => ({ ...prev, scheduledAt: event.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Media URL</Label>
                  <Input
                    value={payload.mediaUrl}
                    onChange={(event) => setPayload((prev) => ({ ...prev, mediaUrl: event.target.value }))}
                    placeholder="https://cdn.neuronest.com/media/post.mp4"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Caption</Label>
                <Textarea
                  value={payload.caption}
                  onChange={(event) => setPayload((prev) => ({ ...prev, caption: event.target.value }))}
                  placeholder="Write your caption or post copy..."
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={payload.description}
                  onChange={(event) => setPayload((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Optional extended description for YouTube or Facebook."
                />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={sendPayload}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Send to n8n
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPayload({ title: '', caption: '', description: '', mediaUrl: '', scheduledAt: '' })}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
