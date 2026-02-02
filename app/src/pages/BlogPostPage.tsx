import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ContentWarningDialog } from '@/components/ContentWarningDialog';
import { blogApi, type BlogPost, type BlogComment } from '@/lib/api/blog';
import { scanTextForWarnings } from '@/lib/safety';
import { applySeo } from '@/lib/seo';
import { toast } from 'sonner';

export function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const [pendingComment, setPendingComment] = useState<string | null>(null);

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
    applySeo({
      title: `${post.title} — NeuroNest Blog`,
      description: post.excerpt || 'Read the latest NeuroNest blog post.',
      canonical: `https://arcane-waters-46868-5bf57db34e8e.herokuapp.com/blog/${post.slug}`,
      ogImage: '/blog_header_neural_pathways_1770055085954.png'
    });
  }, [post]);

  const handleAddComment = async () => {
    if (!post || !newComment.trim()) return;
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
    return <div className="p-6 text-center text-neutral-500">Loading post...</div>;
  }

  if (!post) {
    return <div className="p-6 text-center text-neutral-500">Post not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-primary">
        <ArrowLeft className="w-4 h-4" />
        Back to blog
      </Link>

      <div className="relative overflow-hidden rounded-2xl border border-neutral-200">
        <img
          src="/blog_header_neural_pathways_1770055085954.png"
          alt="Neural pathways"
          className="h-48 w-full object-cover"
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
        <CardContent className="p-6 whitespace-pre-line text-neutral-700">
          {post.content}
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
                  {comment.author.name} • {new Date(comment.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment"
              rows={3}
            />
            <div className="flex justify-end">
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                Post Comment
              </Button>
            </div>
          </div>
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
  );
}
