import { useEffect, useState } from 'react';
import {
  Loader2, ScrollText, Plus, Trash2, MessageSquare, Pencil, Quote
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  adminFeedbackApi,
  type ChangelogEntryAdmin,
  type FeedbackItem
} from '@/lib/api/feedback';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'feature', label: 'Feature' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'fix', label: 'Fix' },
  { value: 'feedback-driven', label: 'Feedback-Driven' },
];

const categoryColor = (cat: string) => {
  if (cat === 'feature') return 'bg-blue-100 text-blue-700';
  if (cat === 'improvement') return 'bg-green-100 text-green-700';
  if (cat === 'fix') return 'bg-amber-100 text-amber-700';
  if (cat === 'feedback-driven') return 'bg-purple-100 text-purple-700';
  return 'bg-neutral-100 text-neutral-600';
};

export function AdminChangelog() {
  const [entries, setEntries] = useState<ChangelogEntryAdmin[]>([]);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('improvement');
  const [version, setVersion] = useState('');
  const [feedbackId, setFeedbackId] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      const [changelogRes, feedbackRes] = await Promise.all([
        adminFeedbackApi.getChangelog(),
        adminFeedbackApi.list({ status: 'reviewed' }),
      ]);
      setEntries(changelogRes.entries);
      setFeedbackItems(feedbackRes.feedback);
    } catch {
      toast.error('Failed to load changelog');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('improvement');
    setVersion('');
    setFeedbackId('');
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (entry: ChangelogEntryAdmin) => {
    setTitle(entry.title);
    setDescription(entry.description);
    setCategory(entry.category);
    setVersion(entry.version || '');
    setFeedbackId(entry.feedbackId || '');
    setEditingId(entry.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    try {
      if (editingId) {
        await adminFeedbackApi.updateChangelog(editingId, {
          title, description, category,
          version: version || undefined,
          feedbackId: feedbackId || undefined,
        });
        toast.success('Entry updated');
      } else {
        const cat = feedbackId ? 'feedback-driven' : category;
        await adminFeedbackApi.createChangelog({
          title, description,
          category: cat,
          version: version || undefined,
          feedbackId: feedbackId || undefined,
        });
        toast.success('Entry created');
      }
      setDialogOpen(false);
      resetForm();
      load();
    } catch {
      toast.error('Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminFeedbackApi.deleteChangelog(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success('Entry deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const selectedFeedback = feedbackItems.find((f) => f.id === feedbackId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-primary" />
            Changelog
          </h1>
          <p className="text-sm text-neutral-500">
            Manage public changelog entries. Link changes to user feedback.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Entry
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-neutral-500">
            No changelog entries yet. Create one above.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{entry.title}</h3>
                      <Badge className={`text-[10px] ${categoryColor(entry.category)}`}>
                        {entry.category}
                      </Badge>
                      {entry.version && (
                        <Badge variant="outline" className="text-[10px]">v{entry.version}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">{entry.description}</p>
                    {entry.feedbackQuote && (
                      <div className="mt-2 rounded-lg bg-purple-50 border border-purple-100 p-3 text-sm">
                        <div className="flex items-center gap-1.5 text-purple-600 text-xs font-medium mb-1">
                          <Quote className="w-3 h-3" />
                          User Feedback (anonymised)
                        </div>
                        <p className="text-neutral-700 italic">"{entry.feedbackQuote}"</p>
                      </div>
                    )}
                    <p className="text-xs text-neutral-400 mt-2">
                      {new Date(entry.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(entry)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(entry.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Changelog Entry' : 'New Changelog Entry'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What changed?" />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the change in detail..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Version (optional)</Label>
                <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g. 2.1.0" />
              </div>
            </div>

            {/* Link to feedback */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Link to User Feedback (optional)
              </Label>
              <Select value={feedbackId || 'none'} onValueChange={(v) => setFeedbackId(v === 'none' ? '' : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select feedback to quote..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked feedback</SelectItem>
                  {feedbackItems.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      [{f.area}] {f.message.slice(0, 60)}{f.message.length > 60 ? '...' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFeedback && (
                <div className="rounded-lg bg-purple-50 border border-purple-100 p-3 text-sm">
                  <p className="text-xs font-medium text-purple-600 mb-1">Will be quoted anonymously:</p>
                  <p className="text-neutral-700 italic">"{selectedFeedback.message}"</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? 'Update' : 'Publish'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
