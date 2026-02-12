import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { applySeo } from '@/lib/seo';
import { pagesApi, type SitePage } from '@/lib/api/pages';

interface StaticPageProps {
  slug?: string;
}

function renderBody(body: string) {
  const blocks = body.split('\n\n').map((block) => block.trim()).filter(Boolean);
  return blocks.map((block, index) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    const isList = lines.length > 1 && lines.every((line) => line.startsWith('- '));
    if (isList) {
      return (
        <ul key={`list-${index}`} className="list-disc pl-6 space-y-2 text-neutral-600">
          {lines.map((line, itemIndex) => (
            <li key={`item-${itemIndex}`}>{line.replace(/^-\\s*/, '')}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={`para-${index}`} className="text-neutral-600 leading-relaxed">
        {block}
      </p>
    );
  });
}

export function StaticPage({ slug }: StaticPageProps) {
  const params = useParams();
  const resolvedSlug = slug || params.slug || '';
  const [page, setPage] = useState<SitePage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const response = await pagesApi.getPage(resolvedSlug);
        setPage(response.page);
      } catch {
        setPage(null);
      } finally {
        setIsLoading(false);
      }
    };
    if (resolvedSlug) {
      loadPage();
    }
  }, [resolvedSlug]);

  useEffect(() => {
    if (!page) return;
    applySeo({
      title: `${page.title} - NeuroNest`,
      description: page.summary,
      canonical: `${window.location.origin}/${page.slug}`
    });
  }, [page]);

  const content = useMemo(() => (page ? renderBody(page.body) : null), [page]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Page not found</p>
          <p className="text-sm text-neutral-500">The content you are looking for is unavailable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <div className="space-y-3">
          <Badge className="bg-primary/10 text-primary">{page.slug.toUpperCase()}</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-dark">{page.title}</h1>
          <p className="text-neutral-500 text-lg">{page.summary}</p>
        </div>

        <Card className="border border-border">
          <CardContent className="p-6 space-y-4">{content}</CardContent>
        </Card>
      </div>
    </div>
  );
}
