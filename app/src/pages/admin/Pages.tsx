import { useEffect, useState } from 'react';
import { FileText, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { adminApi, type AdminSitePage } from '@/lib/api/admin';
import { toast } from 'sonner';

export function AdminPages() {
  const [pages, setPages] = useState<AdminSitePage[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [page, setPage] = useState<AdminSitePage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getSitePages();
      setPages(response.pages);
      if (response.pages.length > 0) {
        const defaultSlug = response.pages[0].slug;
        setSelectedSlug(defaultSlug);
        await loadPage(defaultSlug);
      }
    } catch {
      toast.error('Failed to load pages');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPage = async (slug: string) => {
    try {
      const response = await adminApi.getSitePage(slug);
      setPage(response.page);
    } catch {
      toast.error('Failed to load page details');
    }
  };

  const handleSelect = async (slug: string) => {
    setSelectedSlug(slug);
    await loadPage(slug);
  };

  const updatePage = async () => {
    if (!page) return;
    setIsSaving(true);
    try {
      const response = await adminApi.updateSitePage(page.slug, {
        title: page.title,
        summary: page.summary,
        body: page.body
      });
      setPage(response.page);
      setPages((prev) =>
        prev.map((item) =>
          item.slug === page.slug
            ? { ...item, title: response.page.title, summary: response.page.summary, updatedAt: response.page.updatedAt }
            : item
        )
      );
      toast.success('Page updated');
    } catch {
      toast.error('Failed to save page');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-neutral-500">Loading pages...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Site Pages
          </h1>
          <p className="text-sm text-neutral-500">Edit public content pages like About, Contact, and policies.</p>
        </div>
        <Button onClick={updatePage} disabled={!page || isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save page'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-[240px,1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pages.map((item) => (
              <button
                key={item.slug}
                onClick={() => handleSelect(item.slug)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                  selectedSlug === item.slug
                    ? 'bg-primary/10 text-primary'
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-neutral-400">/{item.slug}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{page?.title || 'Page content'}</span>
              {page?.updatedAt && (
                <Badge variant="secondary">
                  Updated {new Date(page.updatedAt).toLocaleDateString()}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={page?.title || ''}
                onChange={(event) => setPage((prev) => prev ? { ...prev, title: event.target.value } : prev)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Summary</label>
              <Textarea
                value={page?.summary || ''}
                onChange={(event) => setPage((prev) => prev ? { ...prev, summary: event.target.value } : prev)}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Body</label>
              <Textarea
                value={page?.body || ''}
                onChange={(event) => setPage((prev) => prev ? { ...prev, body: event.target.value } : prev)}
                rows={12}
              />
              <p className="text-xs text-neutral-400 mt-2">
                Tip: separate paragraphs with a blank line. Use lines starting with "-" to create lists.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
