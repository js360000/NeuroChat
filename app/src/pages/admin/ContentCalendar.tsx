import { useEffect, useState } from 'react';
import { Calendar, PlusCircle, Trash2 } from 'lucide-react';
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
import { adminApi, type ContentCalendarEntry } from '@/lib/api/admin';
import { toast } from 'sonner';

export function AdminContentCalendar() {
  const [entries, setEntries] = useState<ContentCalendarEntry[]>([]);
  const [channel, setChannel] = useState<'blog' | 'community'>('blog');
  const [status, setStatus] = useState<'planned' | 'draft' | 'published'>('planned');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadCalendar = async () => {
    try {
      const response = await adminApi.getContentCalendar({
        channel: filterChannel === 'all' ? undefined : filterChannel,
        status: filterStatus === 'all' ? undefined : filterStatus
      });
      setEntries(response.entries);
    } catch {
      toast.error('Failed to load content calendar');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, [filterChannel, filterStatus]);

  const handleCreate = async () => {
    if (!title || !scheduledFor) {
      toast.error('Title and schedule are required');
      return;
    }
    try {
      await adminApi.createContentCalendarEntry({
        channel,
        title,
        notes,
        status,
        scheduledFor: new Date(scheduledFor).toISOString()
      });
      setTitle('');
      setNotes('');
      setScheduledFor('');
      setStatus('planned');
      loadCalendar();
    } catch {
      toast.error('Failed to create calendar entry');
    }
  };

  const handleStatusChange = async (id: string, nextStatus: ContentCalendarEntry['status']) => {
    try {
      await adminApi.updateContentCalendarEntry(id, { status: nextStatus });
      loadCalendar();
    } catch {
      toast.error('Failed to update entry');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteContentCalendarEntry(id);
      loadCalendar();
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Content Calendar
          </h1>
          <p className="text-sm text-neutral-500">Plan blog and community content releases.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterChannel} onValueChange={setFilterChannel}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="blog">Blog</SelectItem>
              <SelectItem value="community">Community</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New calendar entry</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Channel</label>
            <Select value={channel} onValueChange={(value) => setChannel(value as 'blog' | 'community')}>
              <SelectTrigger>
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blog">Blog</SelectItem>
                <SelectItem value="community">Community</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={(value) => setStatus(value as ContentCalendarEntry['status'])}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Weekly prompt or blog idea" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Notes</label>
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional notes for the team" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Scheduled for</label>
            <Input type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={handleCreate}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Add entry
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calendar entries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-neutral-500">Loading calendar...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-neutral-500">No entries yet.</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-neutral-200 p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{entry.title}</p>
                    <p className="text-xs text-neutral-500">
                      {entry.channel} ? {new Date(entry.scheduledFor).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={entry.status} onValueChange={(value) => handleStatusChange(entry.id, value as ContentCalendarEntry['status'])}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(entry.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {entry.notes && <p className="text-sm text-neutral-600">{entry.notes}</p>}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
