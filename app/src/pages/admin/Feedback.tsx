import { useEffect, useState } from 'react';
import { Loader2, MessageSquare, Star, CheckCircle2, Eye, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { adminFeedbackApi, type FeedbackItem } from '@/lib/api/feedback';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'actioned', label: 'Actioned' },
];

const AREA_OPTIONS = [
  { value: 'all', label: 'All Areas' },
  { value: 'general', label: 'General' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'messages', label: 'Messages' },
  { value: 'community', label: 'Community' },
  { value: 'blog', label: 'Blog' },
  { value: 'games', label: 'Games' },
  { value: 'profile', label: 'Profile / Settings' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'safety', label: 'Safety' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'other', label: 'Other' },
];

export function AdminFeedback() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      const params: { status?: string; area?: string } = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (areaFilter !== 'all') params.area = areaFilter;
      const res = await adminFeedbackApi.list(params);
      setItems(res.feedback);
      setTotal(res.total);
    } catch {
      toast.error('Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter, areaFilter]);

  const markReviewed = async (id: string) => {
    try {
      await adminFeedbackApi.update(id, { status: 'reviewed' });
      setItems((prev) => prev.map((f) => f.id === id ? { ...f, status: 'reviewed' } : f));
      toast.success('Marked as reviewed');
    } catch {
      toast.error('Failed to update');
    }
  };

  const saveNotes = async (id: string) => {
    try {
      await adminFeedbackApi.update(id, { adminNotes: editNotes, status: 'reviewed' });
      setItems((prev) => prev.map((f) => f.id === id ? { ...f, adminNotes: editNotes, status: 'reviewed' } : f));
      setExpandedId(null);
      toast.success('Notes saved');
    } catch {
      toast.error('Failed to save notes');
    }
  };

  const statusColor = (status: string) => {
    if (status === 'new') return 'destructive';
    if (status === 'reviewed') return 'secondary';
    return 'outline';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            User Feedback
          </h1>
          <p className="text-sm text-neutral-500">{total} total submissions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-neutral-400" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AREA_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-neutral-500">
            No feedback found matching your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{item.area}</Badge>
                      <Badge variant={statusColor(item.status)} className="text-[10px]">{item.status}</Badge>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-3.5 h-3.5 ${n <= item.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm mt-2">{item.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                      <span>{item.anonymous ? 'Anonymous' : item.userName || 'Unknown user'}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    {item.adminNotes && (
                      <div className="mt-2 rounded-lg bg-neutral-50 border border-neutral-100 p-2 text-xs text-neutral-600">
                        <span className="font-medium">Notes:</span> {item.adminNotes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {item.status === 'new' && (
                      <Button size="sm" variant="outline" onClick={() => markReviewed(item.id)}>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Reviewed
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setExpandedId(expandedId === item.id ? null : item.id);
                        setEditNotes(item.adminNotes || '');
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {expandedId === item.id && (
                  <div className="border-t border-neutral-100 pt-3 space-y-2">
                    <Textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Admin notes about this feedback..."
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setExpandedId(null)}>Cancel</Button>
                      <Button size="sm" onClick={() => saveNotes(item.id)}>Save Notes</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
