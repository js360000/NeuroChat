import { useEffect, useState } from 'react';
import { MessageCircle, ThumbsUp, Plus, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentWarningDialog } from '@/components/ContentWarningDialog';
import { communityApi, type CommunityPost, type CommunityComment } from '@/lib/api/community';
import { scanTextForWarnings } from '@/lib/safety';
import { toast } from 'sonner';

export function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [toneTag, setToneTag] = useState('');
  const [contentWarning, setContentWarning] = useState('');
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [revealedPosts, setRevealedPosts] = useState<Record<string, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommunityComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<
    | { type: 'post'; payload: { title?: string; content: string; tags?: string[]; toneTag?: string; contentWarning?: string } }
    | { type: 'comment'; postId: string; content: string }
    | null
  >(null);

  const loadFeed = async () => {
    try {
      const response = await communityApi.getFeed({
        q: query || undefined,
        tag: tagFilter || undefined
      });
      setPosts(response.posts);
    } catch (error) {
      toast.error('Failed to load community feed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleCreatePost = async () => {
    if (!content.trim()) {
      toast.error('Post content is required');
      return;
    }

    const payload = {
      title: title.trim() || undefined,
      content: content.trim(),
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      toneTag: toneTag.trim() || undefined,
      contentWarning: contentWarning.trim() || undefined
    };

    const warnings = scanTextForWarnings(`${payload.title || ''} ${payload.content}`);
    if (warnings.length > 0) {
      setWarningMessages(warnings.map((warning) => warning.message));
      setPendingAction({ type: 'post', payload });
      setWarningOpen(true);
      return;
    }

    try {
      const response = await communityApi.createPost(payload);
      setPosts((prev) => [response.post, ...prev]);
      setTitle('');
      setContent('');
      setTags('');
      setToneTag('');
      setContentWarning('');
      toast.success('Post published');
    } catch (error) {
      toast.error('Failed to publish post');
    }
  };

  const toggleComments = async (postId: string) => {
    setExpandedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
    if (!commentsByPost[postId]) {
      try {
        const response = await communityApi.getComments(postId);
        setCommentsByPost((prev) => ({ ...prev, [postId]: response.comments }));
      } catch (error) {
        toast.error('Failed to load comments');
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    const draft = commentDrafts[postId];
    if (!draft?.trim()) return;

    const warnings = scanTextForWarnings(draft);
    if (warnings.length > 0) {
      setWarningMessages(warnings.map((warning) => warning.message));
      setPendingAction({ type: 'comment', postId, content: draft.trim() });
      setWarningOpen(true);
      return;
    }

    try {
      const response = await communityApi.addComment(postId, draft.trim());
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), response.comment]
      }));
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post
        )
      );
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleReaction = async (postId: string, type: 'like' | 'support' | 'insightful') => {
    try {
      const response = await communityApi.toggleReaction(postId, type);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, reactionCounts: response.reactionCounts } : post
        )
      );
    } catch (error) {
      toast.error('Failed to update reaction');
    }
  };

  const handleFilter = () => {
    setIsLoading(true);
    loadFeed();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Community Feed</h1>
          <p className="text-sm text-neutral-500">Share updates, ask questions, and connect.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Create a post
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share what's on your mind..."
            rows={4}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={toneTag}
              onChange={(e) => setToneTag(e.target.value)}
              placeholder="Tone tag (optional)"
            />
            <Input
              value={contentWarning}
              onChange={(e) => setContentWarning(e.target.value)}
              placeholder="Content warning (optional)"
            />
          </div>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma separated)"
          />
          <div className="flex justify-end">
            <Button onClick={handleCreatePost} className="bg-primary hover:bg-primary-600">
              Post
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts"
            className="flex-1"
          />
          <Input
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            placeholder="Tag filter"
            className="sm:w-48"
          />
          <Button variant="outline" onClick={handleFilter}>
            Filter
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center text-neutral-500">Loading feed...</div>
      ) : posts.length === 0 ? (
        <div className="text-center text-neutral-500">No posts yet.</div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                  {post.toneTag && (
                    <Badge variant="outline">Tone: {post.toneTag}</Badge>
                  )}
                  {post.contentWarning && (
                    <Badge variant="destructive">CW: {post.contentWarning}</Badge>
                  )}
                </div>
                {post.title && <h3 className="text-lg font-semibold">{post.title}</h3>}
                {post.contentWarning && !revealedPosts[post.id] ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <p className="font-medium">Content warning</p>
                    <p className="mt-1">{post.contentWarning}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        setRevealedPosts((prev) => ({ ...prev, [post.id]: true }))
                      }
                    >
                      Show content
                    </Button>
                  </div>
                ) : (
                  <p className="text-neutral-700">{post.content}</p>
                )}
                <div className="text-xs text-neutral-500">
                  {post.author.name} • {new Date(post.createdAt).toLocaleDateString()}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                  <button
                    className="flex items-center gap-1 hover:text-primary"
                    onClick={() => handleReaction(post.id, 'like')}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {post.reactionCounts.like || 0}
                  </button>
                  <button
                    className="flex items-center gap-1 hover:text-primary"
                    onClick={() => handleReaction(post.id, 'support')}
                  >
                    <Heart className="w-4 h-4" />
                    {post.reactionCounts.support || 0}
                  </button>
                  <button
                    className="flex items-center gap-1 hover:text-primary"
                    onClick={() => handleReaction(post.id, 'insightful')}
                  >
                    <Sparkles className="w-4 h-4" />
                    {post.reactionCounts.insightful || 0}
                  </button>
                  <button
                    className="flex items-center gap-1 hover:text-primary"
                    onClick={() => toggleComments(post.id)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {post.commentCount}
                  </button>
                </div>

                {expandedPosts[post.id] && (
                  <div className="space-y-3 pt-3 border-t border-neutral-100">
                    <div className="space-y-2">
                      {(commentsByPost[post.id] || []).map((comment) => (
                        <div key={comment.id} className="text-sm text-neutral-700">
                          <span className="font-medium">{comment.author.name}:</span> {comment.content}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={commentDrafts[post.id] || ''}
                        onChange={(e) =>
                          setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        placeholder="Write a comment"
                      />
                      <Button onClick={() => handleAddComment(post.id)}>Reply</Button>
                    </div>
                  </div>
                )}
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
          setPendingAction(null);
        }}
        onConfirm={async () => {
          if (!pendingAction) {
            setWarningOpen(false);
            return;
          }
          setWarningOpen(false);
          if (pendingAction.type === 'post') {
            try {
              const response = await communityApi.createPost(pendingAction.payload);
              setPosts((prev) => [response.post, ...prev]);
              setTitle('');
              setContent('');
              setTags('');
              setToneTag('');
              setContentWarning('');
              toast.success('Post published');
            } catch {
              toast.error('Failed to publish post');
            } finally {
              setPendingAction(null);
            }
          }
          if (pendingAction.type === 'comment') {
            try {
              const response = await communityApi.addComment(
                pendingAction.postId,
                pendingAction.content
              );
              setCommentsByPost((prev) => ({
                ...prev,
                [pendingAction.postId]: [
                  ...(prev[pendingAction.postId] || []),
                  response.comment
                ]
              }));
              setCommentDrafts((prev) => ({ ...prev, [pendingAction.postId]: '' }));
              setPosts((prev) =>
                prev.map((post) =>
                  post.id === pendingAction.postId
                    ? { ...post, commentCount: post.commentCount + 1 }
                    : post
                )
              );
            } catch {
              toast.error('Failed to add comment');
            } finally {
              setPendingAction(null);
            }
          }
        }}
        confirmLabel="Post anyway"
      />
    </div>
  );
}
