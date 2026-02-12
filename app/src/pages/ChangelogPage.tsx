import { useEffect, useState } from 'react';
import { ScrollText, Loader2, Quote, Tag, MessageSquarePlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { feedbackApi, type ChangelogEntryPublic } from '@/lib/api/feedback';
import { applySeo } from '@/lib/seo';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

const categoryColor = (cat: string) => {
  if (cat === 'feature') return 'bg-blue-100 text-blue-700';
  if (cat === 'improvement') return 'bg-green-100 text-green-700';
  if (cat === 'fix') return 'bg-amber-100 text-amber-700';
  if (cat === 'feedback-driven') return 'bg-purple-100 text-purple-700';
  return 'bg-neutral-100 text-neutral-600';
};

const categoryLabel = (cat: string) => {
  if (cat === 'feedback-driven') return 'You Asked, We Built';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
};

export function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntryPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    applySeo({
      title: 'NeuroNest Changelog — What\'s New',
      description: 'See the latest updates, improvements, and features shaped by community feedback.',
      canonical: `${typeof window !== 'undefined' ? window.location.origin : ''}/changelog`
    });
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const res = await feedbackApi.getChangelog();
      setEntries(res.entries);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = filter ? entries.filter((e) => e.category === filter) : entries;

  const grouped: Record<string, ChangelogEntryPublic[]> = {};
  for (const entry of filtered) {
    const month = new Date(entry.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(entry);
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-14 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ScrollText className="w-6 h-6 text-primary" />
                <h1 className="text-3xl font-bold">Changelog</h1>
              </div>
              <p className="text-neutral-500">
                What's new in NeuroNest. Many changes are shaped directly by your feedback.
              </p>
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(null)}
          >
            All
          </Button>
          {['feature', 'improvement', 'fix', 'feedback-driven'].map((cat) => (
            <Button
              key={cat}
              variant={filter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(cat)}
            >
              {categoryLabel(cat)}
            </Button>
          ))}
        </div>

        {/* Feedback-driven callout */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-transparent">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <MessageSquarePlus className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Your feedback shapes NeuroNest</h3>
              <p className="text-sm text-neutral-600 mt-1">
                Changes tagged <Badge className="bg-purple-100 text-purple-700 text-[10px] mx-1">You Asked, We Built</Badge>
                were directly inspired by user feedback. Keep sharing your thoughts — every voice matters.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Entries */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-neutral-500 py-12">
            No changelog entries yet. Check back soon!
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([month, monthEntries]) => (
              <div key={month}>
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                  {month}
                </h2>
                <div className="space-y-3">
                  {monthEntries.map((entry) => (
                    <Card key={entry.id}>
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{entry.title}</h3>
                          <Badge className={`text-[10px] ${categoryColor(entry.category)}`}>
                            {categoryLabel(entry.category)}
                          </Badge>
                          {entry.version && (
                            <Badge variant="outline" className="text-[10px]">
                              <Tag className="w-2.5 h-2.5 mr-1" />
                              v{entry.version}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600">{entry.description}</p>
                        {entry.feedbackQuote && (
                          <div className="rounded-lg bg-purple-50 border border-purple-100 p-3">
                            <div className="flex items-center gap-1.5 text-purple-600 text-xs font-medium mb-1">
                              <Quote className="w-3 h-3" />
                              Community feedback that inspired this change
                            </div>
                            <p className="text-sm text-neutral-700 italic">"{entry.feedbackQuote}"</p>
                          </div>
                        )}
                        <p className="text-xs text-neutral-400">
                          {new Date(entry.publishedAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <PublicFooter />
    </div>
  );
}
