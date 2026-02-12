import { useEffect, useState } from 'react';
import { MessageCircle, ThumbsUp, Plus, Heart, Sparkles, Calendar, Users, Flag, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ContentWarningDialog } from '@/components/ContentWarningDialog';
import { AdBanner } from '@/components/AdBanner';
import { communityApi, type CommunityPost, type CommunityComment, type CommunityRoom, type BuddyThread, type SharedRoutine } from '@/lib/api/community';
import { scanTextForWarnings } from '@/lib/safety';
import { applySeo } from '@/lib/seo';
import { ReportBlockDialog } from '@/components/ReportBlockDialog';
import { toast } from 'sonner';

const POST_TYPES: Array<'ask' | 'share' | 'resource' | 'event'> = ['ask', 'share', 'resource', 'event'];

const SENSITIVE_TOPICS = [
  { id: 'trauma', label: 'Trauma', keywords: ['trauma', 'ptsd', 'cptsd', 'flashback'] },
  { id: 'self_harm', label: 'Self-harm', keywords: ['self-harm', 'self harm', 'suicide', 'suicidal'] },
  { id: 'abuse', label: 'Abuse', keywords: ['abuse', 'assault', 'harassment', 'violence'] },
  { id: 'substances', label: 'Substances', keywords: ['addiction', 'substance', 'overdose', 'alcohol'] },
  { id: 'burnout', label: 'Burnout', keywords: ['burnout', 'overwhelmed', 'shutdown'] }
];

function detectSensitiveTopics(text: string): string[] {
  const lower = text.toLowerCase();
  return SENSITIVE_TOPICS.filter((topic) =>
    topic.keywords.some((keyword) => lower.includes(keyword))
  ).map((topic) => topic.id);
}

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
  const [postType, setPostType] = useState<'ask' | 'share' | 'resource' | 'event'>('share');
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [revealedPosts, setRevealedPosts] = useState<Record<string, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommunityComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [gentleMode, setGentleMode] = useState(false);
  const [gentleLimit, setGentleLimit] = useState(5);
  const [contentFilters, setContentFilters] = useState<Record<string, boolean>>(
    Object.fromEntries(SENSITIVE_TOPICS.map((topic) => [topic.id, false]))
  );
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [queuedPosts, setQueuedPosts] = useState<
    Array<{ id: string; payload: { title?: string; content: string; tags?: string[]; toneTag?: string; contentWarning?: string } }>
  >([]);
  const [queuedComments, setQueuedComments] = useState<
    Array<{ id: string; postId: string; content: string }>
  >([]);
  const [rooms, setRooms] = useState<CommunityRoom[]>([]);
  const [buddyThreads, setBuddyThreads] = useState<BuddyThread[]>([]);
  const [routines, setRoutines] = useState<SharedRoutine[]>([]);
  const [newBuddyTitle, setNewBuddyTitle] = useState('');
  const [newBuddyDesc, setNewBuddyDesc] = useState('');
  const [newBuddyCadence, setNewBuddyCadence] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [newRoutineTitle, setNewRoutineTitle] = useState('');
  const [newRoutineDesc, setNewRoutineDesc] = useState('');
  const [newRoutineTime, setNewRoutineTime] = useState('');
  const [warningOpen, setWarningOpen] = useState(false);
  const [communityReportTarget, setCommunityReportTarget] = useState<{ id: string; name: string; mode: 'report' | 'block' | 'report-and-block' } | null>(null);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<
    | { type: 'post'; payload: { type?: 'ask' | 'share' | 'resource' | 'event'; title?: string; content: string; tags?: string[]; toneTag?: string; contentWarning?: string } }
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
    loadRooms();
    loadBuddyThreads();
    loadRoutines();
  }, []);

  useEffect(() => {
    applySeo({
      title: 'NeuroNest Community — Safe Neurodivergent Space',
      description:
        'Join the NeuroNest community feed to share experiences, ask questions, and connect with neurodivergent peers.',
      canonical: 'https://arcane-waters-46868-5bf57db34e8e.herokuapp.com/community',
      ogImage: '/safe_verified_illustration_1770055050348.png'
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('neuronest_offline_queue');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setQueuedPosts(parsed.posts || []);
        setQueuedComments(parsed.comments || []);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = JSON.stringify({ posts: queuedPosts, comments: queuedComments });
    window.localStorage.setItem('neuronest_offline_queue', payload);
  }, [queuedPosts, queuedComments]);

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
    if (!gentleMode) {
      setGentleLimit(5);
    }
  }, [gentleMode, posts.length]);

  const flushQueue = async () => {
    if (isOffline) return;
    if (queuedPosts.length === 0 && queuedComments.length === 0) return;
    let postsQueue = [...queuedPosts];
    let commentsQueue = [...queuedComments];

    for (const item of queuedPosts) {
      try {
        await communityApi.createPost(item.payload);
        postsQueue = postsQueue.filter((queued) => queued.id !== item.id);
      } catch {
        // keep in queue
      }
    }

    for (const item of queuedComments) {
      try {
        await communityApi.addComment(item.postId, item.content);
        commentsQueue = commentsQueue.filter((queued) => queued.id !== item.id);
      } catch {
        // keep in queue
      }
    }

    setQueuedPosts(postsQueue);
    setQueuedComments(commentsQueue);
    if (postsQueue.length !== queuedPosts.length || commentsQueue.length !== queuedComments.length) {
      loadFeed();
    }
  };

  useEffect(() => {
    if (!isOffline) {
      flushQueue();
    }
  }, [isOffline]);

  const handleCreatePost = async () => {
    if (!content.trim()) {
      toast.error('Post content is required');
      return;
    }

    const payload = {
      type: postType,
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

    if (isOffline) {
      const queuedId = `queued-${Date.now()}`;
      setQueuedPosts((prev) => [{ id: queuedId, payload }, ...prev]);
      setTitle('');
      setContent('');
      setTags('');
      setToneTag('');
      setContentWarning('');
      setPostType('share');
      toast.success('Post queued. It will sync when you are back online.');
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
      setPostType('share');
      toast.success('Post published');
    } catch (error) {
      toast.error('Failed to publish post');
    }
  };

  const loadRooms = async () => {
    try {
      const response = await communityApi.getRooms();
      setRooms(response.rooms);
    } catch {
      // ignore
    }
  };

  const loadBuddyThreads = async () => {
    try {
      const response = await communityApi.getBuddyThreads();
      setBuddyThreads(response.threads);
    } catch {
      // ignore
    }
  };

  const loadRoutines = async () => {
    try {
      const response = await communityApi.getRoutines();
      setRoutines(response.routines);
    } catch {
      // ignore
    }
  };

  const handleCreateBuddy = async () => {
    if (!newBuddyTitle.trim() || !newBuddyDesc.trim()) {
      toast.error('Title and description are required');
      return;
    }
    try {
      await communityApi.createBuddyThread({
        title: newBuddyTitle.trim(),
        description: newBuddyDesc.trim(),
        cadence: newBuddyCadence
      });
      setNewBuddyTitle('');
      setNewBuddyDesc('');
      setNewBuddyCadence('weekly');
      loadBuddyThreads();
      toast.success('Buddy thread created');
    } catch {
      toast.error('Failed to create buddy thread');
    }
  };

  const handleCreateRoutine = async () => {
    if (!newRoutineTitle.trim()) {
      toast.error('Routine title is required');
      return;
    }
    try {
      await communityApi.createRoutine({
        title: newRoutineTitle.trim(),
        description: newRoutineDesc.trim() || undefined,
        scheduledAt: newRoutineTime || undefined
      });
      setNewRoutineTitle('');
      setNewRoutineDesc('');
      setNewRoutineTime('');
      loadRoutines();
      toast.success('Routine scheduled');
    } catch {
      toast.error('Failed to schedule routine');
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

    if (isOffline) {
      const queuedId = `queued-${Date.now()}`;
      setQueuedComments((prev) => [{ id: queuedId, postId, content: draft.trim() }, ...prev]);
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      toast.success('Comment queued. It will sync when you are back online.');
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

  const visiblePosts = gentleMode ? posts.slice(0, gentleLimit) : posts;
  const activeFilters = Object.entries(contentFilters)
    .filter(([, enabled]) => enabled)
    .map(([id]) => id);
  const filteredPosts = visiblePosts.filter((post) => {
    if (activeFilters.length === 0) return true;
    const topics = detectSensitiveTopics(
      `${post.title || ''} ${post.content} ${post.contentWarning || ''}`
    );
    return !topics.some((topic) => contentFilters[topic]);
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      {/* Community Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-accent-violet to-primary text-white h-[250px] flex flex-col items-center justify-center text-center p-8">
        <img
          src="/safe_verified_illustration_1770055050348.png"
          alt="Safe community illustration"
          className="absolute -right-6 top-6 w-44 opacity-30 sm:w-56"
        />
        <div className="relative z-10 space-y-4">
          <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 px-4 py-1">
            <Sparkles className="w-4 h-4 mr-2" />
            NeuroNest Community
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight">Your Safe Space to <span className="text-peach">Belong</span></h1>
          <p className="text-white/80 max-w-xl mx-auto text-lg leading-relaxed">
            Connect with people who get it. Share your world, ask questions, and find your people.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div>
          <h2 className="text-2xl font-bold">Community Feed</h2>
          <p className="text-sm text-neutral-500 italic">Real connections, zero judgment.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Topic Rooms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rooms.length === 0 ? (
              <p className="text-sm text-neutral-500">Rooms will appear here soon.</p>
            ) : (
              rooms.slice(0, 3).map((room) => (
                <div key={room.id} className="rounded-xl border border-neutral-200 p-3">
                  <p className="font-medium">{room.name}</p>
                  <p className="text-xs text-neutral-500">{room.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {room.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Buddy Threads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {buddyThreads.length === 0 ? (
              <p className="text-sm text-neutral-500">Start the first buddy thread.</p>
            ) : (
              buddyThreads.slice(0, 3).map((thread) => (
                <div key={thread.id} className="rounded-xl border border-neutral-200 p-3">
                  <p className="font-medium">{thread.title}</p>
                  <p className="text-xs text-neutral-500">{thread.description}</p>
                  <Badge variant="outline" className="mt-2">
                    {thread.cadence}
                  </Badge>
                </div>
              ))
            )}
            <div className="space-y-2 pt-2">
              <Input
                value={newBuddyTitle}
                onChange={(e) => setNewBuddyTitle(e.target.value)}
                placeholder="Buddy thread title"
              />
              <Textarea
                value={newBuddyDesc}
                onChange={(e) => setNewBuddyDesc(e.target.value)}
                placeholder="Short description"
                rows={2}
              />
              <div className="flex flex-wrap gap-2">
                {(['weekly', 'biweekly', 'monthly'] as const).map((cadence) => (
                  <Button
                    key={cadence}
                    size="sm"
                    variant={newBuddyCadence === cadence ? 'default' : 'outline'}
                    onClick={() => setNewBuddyCadence(cadence)}
                  >
                    {cadence}
                  </Button>
                ))}
              </div>
              <Button onClick={handleCreateBuddy} variant="outline">
                Create buddy thread
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Shared Routines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {routines.length === 0 ? (
              <p className="text-sm text-neutral-500">Schedule a gentle routine.</p>
            ) : (
              routines.slice(0, 3).map((routine) => (
                <div key={routine.id} className="rounded-xl border border-neutral-200 p-3">
                  <p className="font-medium">{routine.title}</p>
                  {routine.description && (
                    <p className="text-xs text-neutral-500">{routine.description}</p>
                  )}
                  {routine.scheduledAt && (
                    <p className="text-xs text-neutral-400 mt-1">
                      {new Date(routine.scheduledAt).toLocaleString()}
                    </p>
                  )}
                </div>
              ))
            )}
            <div className="space-y-2 pt-2">
              <Input
                value={newRoutineTitle}
                onChange={(e) => setNewRoutineTitle(e.target.value)}
                placeholder="Routine title"
              />
              <Textarea
                value={newRoutineDesc}
                onChange={(e) => setNewRoutineDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
              />
              <Input
                type="datetime-local"
                value={newRoutineTime}
                onChange={(e) => setNewRoutineTime(e.target.value)}
              />
              <Button onClick={handleCreateRoutine} variant="outline">
                Schedule routine
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {isOffline && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="p-4 text-sm text-amber-800">
            You are offline. Community is in read-only mode, but new posts and comments will queue and sync once you reconnect.
          </CardContent>
        </Card>
      )}

      {queuedPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Queued posts ({queuedPosts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {queuedPosts.map((queued) => (
              <div key={queued.id} className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
                {queued.payload.title && (
                  <p className="font-medium text-dark">{queued.payload.title}</p>
                )}
                <p className="text-sm text-neutral-600">{queued.payload.content}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">Queued</Badge>
                  {queued.payload.toneTag && (
                    <Badge variant="outline">Tone: {queued.payload.toneTag}</Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Create a post
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {POST_TYPES.map((type) => (
              <Button
                key={type}
                size="sm"
                variant={postType === type ? 'default' : 'outline'}
                onClick={() => setPostType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
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
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-sm text-neutral-500">Gentle mode</span>
            <Switch checked={gentleMode} onCheckedChange={setGentleMode} />
          </div>
        </CardContent>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-neutral-400">Content filters</span>
            {SENSITIVE_TOPICS.map((topic) => (
              <Button
                key={topic.id}
                size="sm"
                variant={contentFilters[topic.id] ? 'default' : 'outline'}
                onClick={() =>
                  setContentFilters((prev) => ({ ...prev, [topic.id]: !prev[topic.id] }))
                }
              >
                Hide {topic.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <AdBanner area="community" />

      {isLoading ? (
        <div className="text-center text-neutral-500">Loading feed...</div>
      ) : posts.length === 0 ? (
        <div className="text-center text-neutral-500">No posts yet.</div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const sensitiveTopics = detectSensitiveTopics(
              `${post.title || ''} ${post.content} ${post.contentWarning || ''}`
            );
            return (
              <Card key={post.id}>
                <CardContent className={gentleMode ? 'p-6 space-y-4' : 'p-5 space-y-3'}>
                  <div className="flex flex-wrap gap-2">
                    {post.type && (
                      <Badge variant="outline">
                        {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                      </Badge>
                    )}
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
                    {sensitiveTopics.map((topic) => (
                      <Badge key={topic} variant="outline">
                        Sensitive: {SENSITIVE_TOPICS.find((item) => item.id === topic)?.label}
                      </Badge>
                    ))}
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
                  <p className={`text-neutral-700 ${gentleMode ? 'leading-relaxed' : ''}`}>{post.content}</p>
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
                  <button
                    className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-500"
                    onClick={() => setCommunityReportTarget({ id: post.author.id, name: post.author.name, mode: 'report' })}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Report
                  </button>
                  <button
                    className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-500"
                    onClick={() => setCommunityReportTarget({ id: post.author.id, name: post.author.name, mode: 'block' })}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Block
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
            );
          })}
          {gentleMode && visiblePosts.length < posts.length && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setGentleLimit((prev) => prev + 5)}>
                Load more
              </Button>
            </div>
          )}
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
              if (isOffline) {
                const queuedId = `queued-${Date.now()}`;
                setQueuedPosts((prev) => [{ id: queuedId, payload: pendingAction.payload }, ...prev]);
                setTitle('');
                setContent('');
                setTags('');
                setToneTag('');
                setContentWarning('');
                toast.success('Post queued. It will sync when you are back online.');
              } else {
                const response = await communityApi.createPost(pendingAction.payload);
                setPosts((prev) => [response.post, ...prev]);
                setTitle('');
                setContent('');
                setTags('');
                setToneTag('');
                setContentWarning('');
                toast.success('Post published');
              }
            } catch {
              toast.error('Failed to publish post');
            } finally {
              setPendingAction(null);
            }
          }
          if (pendingAction.type === 'comment') {
            try {
              if (isOffline) {
                const queuedId = `queued-${Date.now()}`;
                setQueuedComments((prev) => [
                  { id: queuedId, postId: pendingAction.postId, content: pendingAction.content },
                  ...prev
                ]);
                setCommentDrafts((prev) => ({ ...prev, [pendingAction.postId]: '' }));
                toast.success('Comment queued. It will sync when you are back online.');
              } else {
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
              }
            } catch {
              toast.error('Failed to add comment');
            } finally {
              setPendingAction(null);
            }
          }
        }}
        confirmLabel="Post anyway"
      />
      {communityReportTarget && (
        <ReportBlockDialog
          open={!!communityReportTarget}
          onOpenChange={(open) => !open && setCommunityReportTarget(null)}
          targetUserId={communityReportTarget.id}
          targetUserName={communityReportTarget.name}
          mode={communityReportTarget.mode}
          onComplete={() => {
            if (communityReportTarget.mode === 'block' || communityReportTarget.mode === 'report-and-block') {
              loadFeed();
            }
          }}
        />
      )}
    </div>
  );
}
