import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentWarningDialog } from '@/components/ContentWarningDialog';
import { blogApi, type BlogPost } from '@/lib/api/blog';
import { useAuthStore } from '@/lib/stores/auth';
import { scanTextForWarnings } from '@/lib/safety';
import { applySeo } from '@/lib/seo';
import { toast } from 'sonner';

function isAdminEmail(email?: string) {
  if (!email) return false;
  return email.toLowerCase().includes('admin');
}

export function BlogPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || isAdminEmail(user?.email);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'published' | 'draft' | 'all'>('published');
  const [showComposer, setShowComposer] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftTags, setDraftTags] = useState('');
  const [draftStatus, setDraftStatus] = useState<'published' | 'draft'>('published');
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [pendingPost, setPendingPost] = useState<{
    title: string;
    content: string;
    tags: string[];
    status: 'draft' | 'published';
  } | null>(null);

  const loadPosts = async () => {
    try {
      const response = await blogApi.getPosts({
        q: query || undefined,
        tag: tagFilter || undefined,
        status: statusFilter
      });
      setPosts(response.posts);
    } catch (error) {
      toast.error('Failed to load blog posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    applySeo({
      title: 'NeuroNest Blog — Guides & Stories',
      description:
        'Read NeuroNest blog posts on neurodivergent dating, communication tools, and community stories.',
      canonical: 'https://arcane-waters-46868-5bf57db34e8e.herokuapp.com/blog',
      ogImage: '/blog_header_neural_pathways_1770055085954.png'
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadPosts();
    }
  }, [statusFilter, isAdmin]);

  const handleSearch = () => {
    setIsLoading(true);
    loadPosts();
  };

  const handleCreate = async () => {
    if (isOffline) {
      toast.error('You are offline. Blog posts are read-only right now.');
      return;
    }
    if (!draftTitle.trim() || !draftContent.trim()) {
      toast.error('Title and content are required');
      return;
    }
    try {
      const payload = {
        title: draftTitle.trim(),
        content: draftContent.trim(),
        tags: draftTags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        status: draftStatus
      };

      const warnings = scanTextForWarnings(`${payload.title} ${payload.content}`);
      if (warnings.length > 0) {
        setWarningMessages(warnings.map((warning) => warning.message));
        setPendingPost(payload);
        setWarningOpen(true);
        return;
      }

      await blogApi.createPost(payload);
      setDraftTitle('');
      setDraftContent('');
      setDraftTags('');
      setDraftStatus('published');
      setShowComposer(false);
      loadPosts();
      toast.success('Post published');
    } catch (error) {
      toast.error('Failed to publish post');
    }
  };

  useEffect(() => {
    if (isAdmin) {
      setStatusFilter('all');
    }
  }, [isAdmin]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      {/* Blog Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-accent-violet text-white h-[300px] flex flex-col items-center justify-center text-center p-8">
        <div className="absolute inset-0">
          <img
            src="/blog_header_neural_pathways_1770055085954.png"
            alt="Neural Pathways"
            className="w-full h-full object-cover mix-blend-overlay opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
        </div>
        <div className="relative z-10 space-y-4">
          <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 px-4 py-1">
            <BookOpen className="w-4 h-4 mr-2" />
            NeuroNest Blog
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Insights for the <br /><span className="text-peach">Neurodivergent</span> Mind</h1>
          <p className="text-white/80 max-w-xl mx-auto text-lg">
            Guides, updates, and community stories built by ND people, for ND people.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div>
          <h2 className="text-2xl font-bold">Latest Articles</h2>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowComposer((prev) => !prev)}
            className="bg-primary hover:bg-primary-600"
            disabled={isOffline}
          >
            <Plus className="w-4 h-4 mr-2" />
            {showComposer ? 'Close Editor' : 'Write Post'}
          </Button>
        )}
      </div>

      {isOffline && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="p-4 text-sm text-amber-800">
            You are offline. Blog posts are read-only, but cached posts are available.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-neutral-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles"
            />
          </div>
          <Input
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            placeholder="Tag filter"
            className="sm:w-48"
          />
          {isAdmin && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'published' | 'draft' | 'all')}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          )}
          <Button variant="outline" onClick={handleSearch}>
            Filter
          </Button>
        </CardContent>
      </Card>

      {showComposer && (
        <Card>
          <CardHeader>
            <CardTitle>Publish a new post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Post title"
            />
            <Textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              placeholder="Write the post content..."
              rows={6}
            />
            <Input
              value={draftTags}
              onChange={(e) => setDraftTags(e.target.value)}
              placeholder="Tags (comma separated)"
            />
            <div className="flex items-center justify-between">
              <label className="text-sm text-neutral-500">Status</label>
              <select
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value as 'draft' | 'published')}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreate} className="bg-primary hover:bg-primary-600">
                Publish
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center text-neutral-500">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center text-neutral-500">No posts yet.</div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-card transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                  {post.status === 'draft' && (
                    <Badge variant="outline">Draft</Badge>
                  )}
                </div>
                <Link to={`/blog/${post.slug}`} className="block">
                  <h2 className="text-xl font-semibold hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                </Link>
                <p className="text-neutral-600">{post.excerpt}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                  <span>By {post.author.name}</span>
                  <span>{post.readingTime} min read</span>
                  {post.publishedAt && (
                    <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ContentWarningDialog
        open={warningOpen}
        warnings={warningMessages}
        onCancel={() => {
          setWarningOpen(false);
          setPendingPost(null);
        }}
        onConfirm={async () => {
          if (!pendingPost) {
            setWarningOpen(false);
            return;
          }
          setWarningOpen(false);
          try {
            await blogApi.createPost(pendingPost);
            setDraftTitle('');
            setDraftContent('');
            setDraftTags('');
            setDraftStatus('published');
            setShowComposer(false);
            loadPosts();
            toast.success('Post published');
          } catch {
            toast.error('Failed to publish post');
          } finally {
            setPendingPost(null);
          }
        }}
        confirmLabel="Publish anyway"
      />
    </div>
  );
}
