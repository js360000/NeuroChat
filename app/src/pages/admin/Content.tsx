import { useEffect, useState } from 'react';
import { FileText, EyeOff, Eye, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/api/admin';
import { toast } from 'sonner';

type CommunityPost = {
  id: string;
  title?: string;
  content: string;
  tags: string[];
  toneTag?: string;
  contentWarning?: string;
  hidden: boolean;
  sentiment?: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  };
  flaggedKeywords?: string[];
  author: { id: string; name: string; email?: string };
  createdAt: string;
};

export function AdminContent() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadPosts = async () => {
    try {
      const response = await adminApi.getCommunityPosts({ q: query || undefined });
      setPosts(response.posts);
    } catch (error) {
      toast.error('Failed to load community posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleHide = async (id: string) => {
    try {
      await adminApi.hideCommunityPost(id);
      loadPosts();
    } catch {
      toast.error('Failed to hide post');
    }
  };

  const handleUnhide = async (id: string) => {
    try {
      await adminApi.unhideCommunityPost(id);
      loadPosts();
    } catch {
      toast.error('Failed to unhide post');
    }
  };

  if (isLoading) {
    return <div className="p-6 text-neutral-500">Loading content...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Community Content
          </h1>
          <p className="text-sm text-neutral-500">Review and manage community posts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-neutral-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts"
            className="w-64"
          />
          <Button variant="outline" onClick={loadPosts}>
            Filter
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {posts.length === 0 ? (
            <p className="text-sm text-neutral-500">No posts found.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="rounded-xl border border-neutral-200 p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {post.title && <span className="font-semibold">{post.title}</span>}
                    {post.hidden && <Badge variant="destructive">Hidden</Badge>}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {new Date(post.createdAt).toLocaleString()}
                  </div>
                </div>
                <p className="text-sm text-neutral-700 line-clamp-3">{post.content}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span>Author: {post.author.name}</span>
                  {post.toneTag && <Badge variant="outline">Tone: {post.toneTag}</Badge>}
                  {post.contentWarning && <Badge variant="secondary">CW: {post.contentWarning}</Badge>}
                  {post.sentiment && (
                    <Badge variant={post.sentiment.label === 'negative' ? 'destructive' : 'outline'}>
                      Sentiment: {post.sentiment.label}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                  {post.flaggedKeywords?.map((flag) => (
                    <Badge key={flag} variant="destructive">
                      {flag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {post.hidden ? (
                    <Button size="sm" variant="outline" onClick={() => handleUnhide(post.id)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Unhide
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleHide(post.id)}>
                      <EyeOff className="w-4 h-4 mr-1" />
                      Hide
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
