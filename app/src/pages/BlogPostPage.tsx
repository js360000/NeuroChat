import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ContentWarningDialog } from '@/components/ContentWarningDialog';
import { BlogContentRenderer } from '@/components/blog/BlogContentRenderer';
import { blogApi, type BlogPost, type BlogComment } from '@/lib/api/blog';
import { useAuthStore } from '@/lib/stores/auth';
import { scanTextForWarnings } from '@/lib/safety';
import { applySeo } from '@/lib/seo';
import { toast } from 'sonner';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { Navigation } from '@/components/Navigation';

export function BlogPostPage() {
  const { slug } = useParams();
  const { user } = useAuthStore();
  const isAuthenticated = !!user;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const [pendingComment, setPendingComment] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  const loadPost = async () => {
    if (!slug) return;
    try {
      const response = await blogApi.getPost(slug);
      setPost(response.post);
      const commentResponse = await blogApi.getComments(response.post.id);
      setComments(commentResponse.comments);
    } catch (error) {
      toast.error('Failed to load post');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPost();
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const canonical = post.canonicalUrl || (origin ? `${origin}/blog/${post.slug}` : undefined);
    const seoTitle = post.seoTitle || `${post.title} - NeuroNest Blog`;
    const seoDescription = post.seoDescription || post.excerpt || 'Read the latest NeuroNest blog post.';
    const ogImage = post.ogImage || post.coverImage || '/blog_header_neural_pathways_1770055085954.png';
    applySeo({
      title: seoTitle,
      description: seoDescription,
      canonical,
      ogImage,
      keywords: post.seoKeywords,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: seoTitle,
        description: seoDescription,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        author: { '@type': 'Person', name: post.author.name },
        image: ogImage ? [ogImage] : undefined,
        mainEntityOfPage: canonical,
        publisher: { '@type': 'Organization', name: 'NeuroNest' }
      }
    });
  }, [post]);

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

  const handleAddComment = async () => {
    if (!post || !newComment.trim()) return;
    if (isOffline) {
      toast.error('You are offline. Comments are read-only for now.');
      return;
    }
    const warnings = scanTextForWarnings(newComment);
    if (warnings.length > 0) {
      setWarningMessages(warnings.map((warning) => warning.message));
      setPendingComment(newComment.trim());
      setWarningOpen(true);
      return;
    }
    try {
      const response = await blogApi.addComment(post.id, newComment.trim());
      setComments((prev) => [...prev, response.comment]);
      setNewComment('');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {isAuthenticated ? <Navigation /> : <PublicNav />}
        <div className="p-6 pt-24 text-center text-neutral-500">Loading post...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        {isAuthenticated ? <Navigation /> : <PublicNav />}
        <div className="p-6 pt-24 text-center text-neutral-500">Post not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isAuthenticated ? <Navigation /> : <PublicNav />}
      <div className={`max-w-4xl mx-auto p-6 space-y-6 ${isAuthenticated ? 'pt-20' : 'pt-24'}`}>
      <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-primary">
        <ArrowLeft className="w-4 h-4" />
        Back to blog
      </Link>

      {isOffline && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="p-4 text-sm text-amber-800">
            You are offline. Comments are read-only, but cached content is available.
          </CardContent>
        </Card>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-neutral-200">
        <img
          src={post.coverImage || post.ogImage || '/blog_header_neural_pathways_1770055085954.png'}
          alt={post.title}
          className="w-full aspect-[5/2] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60" />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <div className="text-sm text-neutral-500 flex flex-wrap gap-3">
          <span>By {post.author.name}</span>
          <span>{post.readingTime} min read</span>
          {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString()}</span>}
        </div>
      </div>

      <Card>
        <CardContent className="p-6 text-neutral-700">
          {post.contentBlocks && post.contentBlocks.length > 0 ? (
            <BlogContentRenderer blocks={post.contentBlocks} />
          ) : (
            <div className="whitespace-pre-line">{post.content}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <MessageCircle className="w-4 h-4" />
            {comments.length} comments
          </div>

          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b border-neutral-100 pb-3">
                <p className="text-sm text-neutral-700">{comment.content}</p>
                <p className="text-xs text-neutral-400 mt-1">
                  {comment.author.name} - {new Date(comment.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          {isAuthenticated ? (
            <div className="space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment"
                rows={3}
                disabled={isOffline}
              />
              <div className="flex justify-end">
                <Button onClick={handleAddComment} disabled={!newComment.trim() || isOffline}>
                  Post Comment
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-neutral-50 p-4 text-center space-y-2">
              <p className="text-sm text-neutral-500">Log in to join the conversation.</p>
              <Link to="/login">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <LogIn className="w-3.5 h-3.5" />
                  Log in to comment
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <ContentWarningDialog
        open={warningOpen}
        warnings={warningMessages}
        onCancel={() => {
          setWarningOpen(false);
          setPendingComment(null);
        }}
        onConfirm={async () => {
          if (!post || !pendingComment) {
            setWarningOpen(false);
            return;
          }
          setWarningOpen(false);
          try {
            const response = await blogApi.addComment(post.id, pendingComment);
            setComments((prev) => [...prev, response.comment]);
            setNewComment('');
          } catch {
            toast.error('Failed to add comment');
          } finally {
            setPendingComment(null);
          }
        }}
        confirmLabel="Post anyway"
      />
      </div>
      {!isAuthenticated && <PublicFooter />}
    </div>
  );
}



