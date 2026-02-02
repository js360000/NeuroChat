import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { blogApi, type BlogPost } from '@/lib/api/blog';
import { useAuthStore } from '@/lib/stores/auth';
import { toast } from 'sonner';

function isAdminEmail(email?: string) {
  if (!email) return false;
  return email.toLowerCase().includes('admin');
}

export function BlogPage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftTags, setDraftTags] = useState('');

  const loadPosts = async () => {
    try {
      const response = await blogApi.getPosts({
        q: query || undefined,
        tag: tagFilter || undefined
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

  const handleSearch = () => {
    setIsLoading(true);
    loadPosts();
  };

  const handleCreate = async () => {
    if (!draftTitle.trim() || !draftContent.trim()) {
      toast.error('Title and content are required');
      return;
    }
    try {
      await blogApi.createPost({
        title: draftTitle.trim(),
        content: draftContent.trim(),
        tags: draftTags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      });
      setDraftTitle('');
      setDraftContent('');
      setDraftTags('');
      setShowComposer(false);
      loadPosts();
      toast.success('Post published');
    } catch (error) {
      toast.error('Failed to publish post');
    }
  };

  const isAdmin = isAdminEmail(user?.email);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            NeuroNest Blog
          </h1>
          <p className="text-sm text-neutral-500">Guides, updates, and community insights.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowComposer((prev) => !prev)} className="bg-primary hover:bg-primary-600">
            <Plus className="w-4 h-4 mr-2" />
            {showComposer ? 'Close Editor' : 'Write Post'}
          </Button>
        )}
      </div>

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
    </div>
  );
}
