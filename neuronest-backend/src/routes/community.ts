import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import {
  db,
  CommunityPost,
  CommunityComment,
  CommunityReaction,
  findUserById
} from '../db/index.js';

const router = Router();

function isAdminUser(userId?: string): boolean {
  if (!userId) return false;
  const user = findUserById(userId);
  return user?.role === 'admin';
}

function serializePost(post: CommunityPost, includeHidden = false) {
  if (post.hidden && !includeHidden) {
    return null;
  }
  const author = findUserById(post.authorId);
  const reactions = db.communityReactions.filter((r) => r.postId === post.id);
  const commentCount = db.communityComments.filter((c) => c.postId === post.id).length;

  const reactionCounts = reactions.reduce(
    (acc, reaction) => {
      acc[reaction.type] = (acc[reaction.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    id: post.id,
    type: post.type,
    title: post.title,
    content: post.content,
    tags: post.tags,
    toneTag: post.toneTag,
    contentWarning: post.contentWarning,
    hidden: post.hidden,
    author: author
      ? { id: author.id, name: author.name, avatar: author.avatar }
      : { id: post.authorId, name: 'Unknown' },
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    reactionCounts,
    commentCount
};
}

// Rooms
router.get('/rooms', authenticateToken, (_req: Request, res: Response) => {
  const rooms = db.communityRooms
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      tags: room.tags,
      resources: room.resources,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString()
    }));
  res.json({ rooms });
});

router.post('/rooms', authenticateToken, (req: Request, res: Response) => {
  const user = findUserById(req.user!.id);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  const { name, description, tags, resources } = req.body;
  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description are required' });
  }
  const now = new Date();
  const room = {
    id: uuidv4(),
    name,
    description,
    tags: Array.isArray(tags) ? tags : [],
    resources: Array.isArray(resources) ? resources : [],
    createdAt: now,
    updatedAt: now
  };
  db.communityRooms.push(room);
  res.status(201).json({
    room: { ...room, createdAt: room.createdAt.toISOString(), updatedAt: room.updatedAt.toISOString() }
  });
});

// Buddy threads
router.get('/buddies', authenticateToken, (_req: Request, res: Response) => {
  const threads = db.buddyThreads
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((thread) => ({
      id: thread.id,
      title: thread.title,
      description: thread.description,
      cadence: thread.cadence,
      members: thread.members,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString()
    }));
  res.json({ threads });
});

router.post('/buddies', authenticateToken, (req: Request, res: Response) => {
  const { title, description, cadence } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }
  const now = new Date();
  const thread = {
    id: uuidv4(),
    title,
    description,
    cadence: cadence || 'weekly',
    members: [req.user!.id],
    createdAt: now,
    updatedAt: now
  };
  db.buddyThreads.push(thread);
  res.status(201).json({
    thread: { ...thread, createdAt: thread.createdAt.toISOString(), updatedAt: thread.updatedAt.toISOString() }
  });
});

// Shared routines
router.get('/routines', authenticateToken, (_req: Request, res: Response) => {
  const routines = db.sharedRoutines
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((routine) => ({
      id: routine.id,
      title: routine.title,
      description: routine.description,
      scheduledAt: routine.scheduledAt,
      participants: routine.participants,
      createdBy: routine.createdBy,
      createdAt: routine.createdAt.toISOString(),
      updatedAt: routine.updatedAt.toISOString()
    }));
  res.json({ routines });
});

router.post('/routines', authenticateToken, (req: Request, res: Response) => {
  const { title, description, scheduledAt } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const now = new Date();
  const routine = {
    id: uuidv4(),
    title,
    description,
    scheduledAt,
    participants: [req.user!.id],
    createdBy: req.user!.id,
    createdAt: now,
    updatedAt: now
  };
  db.sharedRoutines.push(routine);
  res.status(201).json({
    routine: { ...routine, createdAt: routine.createdAt.toISOString(), updatedAt: routine.updatedAt.toISOString() }
  });
});

router.get('/', authenticateToken, (req: Request, res: Response) => {
  const q = (req.query.q as string)?.toLowerCase();
  const tag = (req.query.tag as string)?.toLowerCase();
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const offset = parseInt(req.query.offset as string) || 0;
  const includeHidden = req.query.includeHidden === 'true' && isAdminUser(req.user?.id);

  let posts = [...db.communityPosts];
  if (q) {
    posts = posts.filter(
      (post) =>
        post.title?.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q)
    );
  }
  if (tag) {
    posts = posts.filter((post) => post.tags.some((t) => t.toLowerCase() === tag));
  }

  posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = posts.length;
  const results = posts
    .slice(offset, offset + limit)
    .map((post) => serializePost(post, includeHidden))
    .filter(Boolean);
  res.json({ posts: results, total });
});

router.get('/:id', authenticateToken, (req: Request, res: Response) => {
  const post = db.communityPosts.find((p) => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  const includeHidden = isAdminUser(req.user?.id);
  const serialized = serializePost(post, includeHidden);
  if (!serialized) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json({ post: serialized });
});

router.post('/', authenticateToken, (req: Request, res: Response) => {
  const { title, content, tags, toneTag, contentWarning, type } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  const now = new Date();
  const post: CommunityPost = {
    id: uuidv4(),
    type,
    title,
    content,
    tags: Array.isArray(tags) ? tags : [],
    toneTag,
    contentWarning,
    authorId: req.user!.id,
    createdAt: now,
    updatedAt: now
  };

  db.communityPosts.push(post);
  res.status(201).json({ post: serializePost(post) });
});

router.patch('/:id', authenticateToken, (req: Request, res: Response) => {
  const post = db.communityPosts.find((p) => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  const user = findUserById(req.user!.id);
  const isAdmin = user?.role === 'admin';
  if (post.authorId !== req.user!.id && !isAdmin) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { title, content, tags, toneTag, contentWarning, type } = req.body;
  if (title !== undefined) post.title = title;
  if (content !== undefined) post.content = content;
  if (Array.isArray(tags)) post.tags = tags;
  if (toneTag !== undefined) post.toneTag = toneTag;
  if (contentWarning !== undefined) post.contentWarning = contentWarning;
  if (type !== undefined) post.type = type;

  post.updatedAt = new Date();
  res.json({ post: serializePost(post, true) });
});

router.delete('/:id', authenticateToken, (req: Request, res: Response) => {
  const index = db.communityPosts.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  const user = findUserById(req.user!.id);
  const isAdmin = user?.role === 'admin';
  if (db.communityPosts[index].authorId !== req.user!.id && !isAdmin) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  db.communityPosts.splice(index, 1);
  res.json({ success: true });
});

router.get('/:id/comments', authenticateToken, (req: Request, res: Response) => {
  const postId = req.params.id;
  const comments = db.communityComments
    .filter((c) => c.postId === postId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((comment) => {
      const author = findUserById(comment.authorId);
      return {
        id: comment.id,
        content: comment.content,
        author: author
          ? { id: author.id, name: author.name, avatar: author.avatar }
          : { id: comment.authorId, name: 'Unknown' },
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString()
      };
    });

  res.json({ comments });
});

router.post('/:id/comments', authenticateToken, (req: Request, res: Response) => {
  const postId = req.params.id;
  const post = db.communityPosts.find((p) => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  if (post.hidden) {
    return res.status(403).json({ error: 'Post is unavailable' });
  }
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  const now = new Date();
  const comment: CommunityComment = {
    id: uuidv4(),
    postId,
    authorId: req.user!.id,
    content,
    createdAt: now,
    updatedAt: now
  };
  db.communityComments.push(comment);
  const author = findUserById(comment.authorId);
  res.status(201).json({
    comment: {
      id: comment.id,
      content: comment.content,
      author: author
        ? { id: author.id, name: author.name, avatar: author.avatar }
        : { id: comment.authorId, name: 'Unknown' },
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString()
    }
  });
});

router.post('/:id/reactions', authenticateToken, (req: Request, res: Response) => {
  const postId = req.params.id;
  const post = db.communityPosts.find((p) => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  if (post.hidden) {
    return res.status(403).json({ error: 'Post is unavailable' });
  }

  const type = (req.body.type as CommunityReaction['type']) || 'like';
  const existing = db.communityReactions.find(
    (reaction) =>
      reaction.postId === postId &&
      reaction.userId === req.user!.id &&
      reaction.type === type
  );

  if (existing) {
    db.communityReactions = db.communityReactions.filter((reaction) => reaction.id !== existing.id);
  } else {
    const reaction: CommunityReaction = {
      id: uuidv4(),
      postId,
      userId: req.user!.id,
      type,
      createdAt: new Date()
    };
    db.communityReactions.push(reaction);
  }

  const reactions = db.communityReactions.filter((r) => r.postId === postId);
  const reactionCounts = reactions.reduce(
    (acc, reaction) => {
      acc[reaction.type] = (acc[reaction.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  res.json({ reactionCounts });
});

router.post('/:id/report', authenticateToken, (req: Request, res: Response) => {
  const postId = req.params.id;
  const post = db.communityPosts.find((p) => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  const { reason, details } = req.body;
  if (!reason) {
    return res.status(400).json({ error: 'Reason is required' });
  }

  db.reports.push({
    id: uuidv4(),
    reporterId: req.user!.id,
    targetType: 'community_post',
    targetId: postId,
    reason,
    description: details,
    status: 'pending',
    createdAt: new Date()
  });

  const reportCount = db.reports.filter(
    (report) => report.targetType === 'community_post' && report.targetId === postId
  ).length;
  if (reportCount >= 3) {
    post.hidden = true;
  }

  res.json({ success: true, hidden: post.hidden === true });
});

export default router;
