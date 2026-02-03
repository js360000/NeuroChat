import { useEffect, useState } from 'react';
import { MessageSquareQuote, Plus, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { testimonialsApi, type Testimonial } from '@/lib/api';
import { toast } from 'sonner';

const STATUS_OPTIONS: Array<'draft' | 'published'> = ['draft', 'published'];

const createDraft = (): Omit<Testimonial, 'id'> => ({
  quote: '',
  author: '',
  role: '',
  avatar: '',
  micro: '',
  featured: true,
  status: 'published'
});

export function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [draft, setDraft] = useState<Omit<Testimonial, 'id'>>(createDraft());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadTestimonials = async () => {
    setIsLoading(true);
    try {
      const response = await testimonialsApi.listAdmin({
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      setTestimonials(response.testimonials);
    } catch {
      toast.error('Failed to load testimonials');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, [statusFilter]);

  const handleCreate = async () => {
    if (!draft.quote.trim() || !draft.author.trim()) {
      toast.error('Quote and author are required');
      return;
    }
    setIsSaving(true);
    try {
      await testimonialsApi.create({
        quote: draft.quote.trim(),
        author: draft.author.trim(),
        role: draft.role?.trim() || undefined,
        avatar: draft.avatar?.trim() || undefined,
        micro: draft.micro?.trim() || undefined,
        featured: draft.featured ?? true,
        status: draft.status || 'published'
      });
      toast.success('Testimonial created');
      setDraft(createDraft());
      loadTestimonials();
    } catch {
      toast.error('Failed to create testimonial');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (item: Testimonial) => {
    setIsSaving(true);
    try {
      await testimonialsApi.update(item.id, {
        quote: item.quote,
        author: item.author,
        role: item.role,
        avatar: item.avatar,
        micro: item.micro,
        featured: item.featured,
        status: item.status
      });
      toast.success('Testimonial updated');
      loadTestimonials();
    } catch {
      toast.error('Failed to update testimonial');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    setIsSaving(true);
    try {
      await testimonialsApi.remove(id);
      toast.success('Testimonial deleted');
      loadTestimonials();
    } catch {
      toast.error('Failed to delete testimonial');
    } finally {
      setIsSaving(false);
    }
  };

  const updateItem = (id: string, updates: Partial<Testimonial>) => {
    setTestimonials((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  if (isLoading) {
    return <div className="p-6 text-neutral-500">Loading testimonials...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquareQuote className="w-5 h-5 text-primary" />
            Testimonials
          </h1>
          <p className="text-sm text-neutral-500">
            Manage landing page testimonials and micro-stories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{testimonials.length} total</Badge>
          <Select
            value={statusFilter}
            onValueChange={(value: 'all' | 'draft' | 'published') => setStatusFilter(value)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create new testimonial</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Quote</label>
            <Textarea
              value={draft.quote}
              onChange={(event) => setDraft((prev) => ({ ...prev, quote: event.target.value }))}
              placeholder="Share the story..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Micro story</label>
            <Textarea
              value={draft.micro}
              onChange={(event) => setDraft((prev) => ({ ...prev, micro: event.target.value }))}
              placeholder="Short highlight for the hero ticker"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Author</label>
            <Input
              value={draft.author}
              onChange={(event) => setDraft((prev) => ({ ...prev, author: event.target.value }))}
              placeholder="Name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Role / identity</label>
            <Input
              value={draft.role}
              onChange={(event) => setDraft((prev) => ({ ...prev, role: event.target.value }))}
              placeholder="Autistic & ADHD"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Avatar URL</label>
            <Input
              value={draft.avatar}
              onChange={(event) => setDraft((prev) => ({ ...prev, avatar: event.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={draft.featured}
                onCheckedChange={(value) => setDraft((prev) => ({ ...prev, featured: value }))}
              />
              <span className="text-sm">Featured</span>
            </div>
            <Select
              value={draft.status}
              onValueChange={(value: 'draft' | 'published') =>
                setDraft((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Button onClick={handleCreate} disabled={isSaving}>
              <Plus className="w-4 h-4 mr-2" />
              Add testimonial
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {testimonials.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{item.author}</h3>
                  <p className="text-sm text-neutral-500">{item.role || 'No role provided'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>
                    {item.status}
                  </Badge>
                  {item.featured && <Badge variant="outline">Featured</Badge>}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs uppercase text-neutral-400">Quote</label>
                  <Textarea
                    value={item.quote}
                    onChange={(event) => updateItem(item.id, { quote: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase text-neutral-400">Micro story</label>
                  <Textarea
                    value={item.micro || ''}
                    onChange={(event) => updateItem(item.id, { micro: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase text-neutral-400">Author</label>
                  <Input
                    value={item.author}
                    onChange={(event) => updateItem(item.id, { author: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase text-neutral-400">Role / identity</label>
                  <Input
                    value={item.role || ''}
                    onChange={(event) => updateItem(item.id, { role: event.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs uppercase text-neutral-400">Avatar URL</label>
                  <Input
                    value={item.avatar || ''}
                    onChange={(event) => updateItem(item.id, { avatar: event.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.featured}
                      onCheckedChange={(value) => updateItem(item.id, { featured: value })}
                    />
                    <span className="text-sm">Featured</span>
                  </div>
                  <Select
                    value={item.status || 'published'}
                    onValueChange={(value: 'draft' | 'published') => updateItem(item.id, { status: value })}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleUpdate(item)} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)} disabled={isSaving}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
