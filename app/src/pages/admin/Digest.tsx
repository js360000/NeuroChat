import { useEffect, useState } from 'react';
import { CalendarClock, Send, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { adminApi, type DigestEntry } from '@/lib/api/admin';
import { toast } from 'sonner';

export function AdminDigest() {
  const [digests, setDigests] = useState<DigestEntry[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [scheduledFor, setScheduledFor] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadDigests = async () => {
    try {
      const response = await adminApi.getDigestQueue({ status: statusFilter === 'all' ? undefined : statusFilter });
      setDigests(response.digests);
    } catch {
      toast.error('Failed to load digest queue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDigests();
  }, [statusFilter]);

  const handleCreate = async () => {
    if (!scheduledFor) {
      toast.error('Pick a scheduled date/time');
      return;
    }
    try {
      await adminApi.createDigestEntry(new Date(scheduledFor).toISOString());
      setScheduledFor('');
      loadDigests();
    } catch {
      toast.error('Failed to create digest entry');
    }
  };

  const handleMarkSent = async (id: string) => {
    try {
      await adminApi.updateDigestEntry(id, { status: 'sent' });
      loadDigests();
    } catch {
      toast.error('Failed to update digest');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            Weekly Digest Queue
          </h1>
          <p className="text-sm text-neutral-500">Schedule and track gentle digest sends.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule a digest</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            type="datetime-local"
            value={scheduledFor}
            onChange={(event) => setScheduledFor(event.target.value)}
            className="sm:max-w-xs"
          />
          <Button onClick={handleCreate} className="sm:w-auto">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add to queue
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming digests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-neutral-500">Loading digests...</p>
          ) : digests.length === 0 ? (
            <p className="text-sm text-neutral-500">No digests scheduled yet.</p>
          ) : (
            digests.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-neutral-200 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{new Date(entry.scheduledFor).toLocaleString()}</p>
                  <p className="text-xs text-neutral-500">Status: {entry.status}</p>
                </div>
                {entry.status === 'queued' ? (
                  <Button size="sm" variant="outline" onClick={() => handleMarkSent(entry.id)}>
                    <Send className="w-4 h-4 mr-1" />
                    Mark sent
                  </Button>
                ) : (
                  <span className="text-xs text-emerald-600">Sent</span>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
