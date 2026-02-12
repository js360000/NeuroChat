import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, optionalAuth, requireAdmin } from '../middleware/auth.js';
import { db, BlogPost, BlogComment, BlogContentBlock, findUserById } from '../db/index.js';

const router = Router();

function isAdminUser(req: Request): boolean {
  const userId = req.user?.id;
  if (!userId) return false;
  const user = findUserById(userId);
  return user?.role === 'admin';
}

function toExcerpt(content: string): string {
  const cleaned = content.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 160) return cleaned;
  return `${cleaned.slice(0, 157)}...`;
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function readingTime(content: string): number {
  const words = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function blocksToText(blocks?: BlogContentBlock[]): string {
  if (!Array.isArray(blocks)) return '';
  const parts: string[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
      case 'paragraph':
        if (block.text) parts.push(block.text);
        break;
      case 'quote':
        if (block.text) parts.push(block.text);
        if (block.author) parts.push(block.author);
        break;
      case 'callout':
        if (block.title) parts.push(block.title);
        if (block.text) parts.push(block.text);
        if (block.body) parts.push(block.body);
        break;
      case 'list':
      case 'checklist':
      case 'statGrid':
      case 'resourceGrid':
        if (Array.isArray(block.items)) {
          for (const item of block.items) {
            if (item.text) parts.push(item.text);
            if (item.label) parts.push(item.label);
            if (item.value) parts.push(item.value);
            if (item.note) parts.push(item.note);
            if (item.title) parts.push(item.title);
            if (item.description) parts.push(item.description);
          }
        }
        break;
      case 'steps':
        if (Array.isArray(block.steps)) {
          for (const step of block.steps) {
            parts.push(step.title);
            if (step.body) parts.push(step.body);
          }
        }
        break;
      case 'cta':
        if (block.title) parts.push(block.title);
        if (block.body) parts.push(block.body);
        break;
      default:
        break;
    }
  }
  return parts.join(' ');
}

function serializePost(post: BlogPost) {
  const author = findUserById(post.authorId);
  const contentForReading = post.contentBlocks && post.contentBlocks.length > 0
    ? blocksToText(post.contentBlocks) || post.content
    : post.content;
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    contentBlocks: post.contentBlocks,
    tags: post.tags,
    coverImage: post.coverImage,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    seoKeywords: post.seoKeywords,
    canonicalUrl: post.canonicalUrl,
    ogImage: post.ogImage,
    status: post.status,
    author: author
      ? { id: author.id, name: author.name, avatar: author.avatar }
      : { id: post.authorId, name: 'Unknown' },
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    publishedAt: post.publishedAt?.toISOString(),
    readingTime: readingTime(contentForReading)
  };
}

router.get('/', optionalAuth, (req: Request, res: Response) => {
  const status = (req.query.status as string) || 'published';
  const isAdmin = isAdminUser(req);
  const q = (req.query.q as string)?.toLowerCase();
  const tag = (req.query.tag as string)?.toLowerCase();
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const offset = parseInt(req.query.offset as string) || 0;

  let posts = [...db.blogPosts];
  const effectiveStatus = !isAdmin && status !== 'published' ? 'published' : status;
  if (effectiveStatus !== 'all') {
    posts = posts.filter((post) => post.status === effectiveStatus);
  }
  if (q) {
    posts = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q)
    );
  }
  if (tag) {
    posts = posts.filter((post) => post.tags.some((t) => t.toLowerCase() === tag));
  }

  posts.sort((a, b) => {
    const aTime = a.publishedAt?.getTime() || a.createdAt.getTime();
    const bTime = b.publishedAt?.getTime() || b.createdAt.getTime();
    return bTime - aTime;
  });

  const total = posts.length;
  const results = posts.slice(offset, offset + limit).map(serializePost);
  res.json({ posts: results, total });
});

router.get('/:slug', optionalAuth, (req: Request, res: Response) => {
  const slug = req.params.slug;
  const post = db.blogPosts.find((p) => p.slug === slug || p.id === slug);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  if (post.status !== 'published' && !isAdminUser(req)) {
    return res.status(403).json({ error: 'Post not available' });
  }
  res.json({ post: serializePost(post) });
});

router.post('/', authenticateToken, requireAdmin, (req: Request, res: Response) => {

  const { title, content, contentBlocks, tags, coverImage, status, seoTitle, seoDescription, seoKeywords, canonicalUrl, ogImage } = req.body;
  const parsedBlocks = Array.isArray(contentBlocks) ? (contentBlocks as BlogContentBlock[]) : undefined;
  const contentText = typeof content === 'string' && content.trim().length > 0
    ? content.trim()
    : blocksToText(parsedBlocks);
  if (!title || !contentText) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const slug = toSlug(title);
  if (db.blogPosts.some((p) => p.slug === slug)) {
    return res.status(409).json({ error: 'A post with this title already exists' });
  }

  const now = new Date();
  const post: BlogPost = {
    id: uuidv4(),
    slug,
    title,
    content: contentText,
    contentBlocks: parsedBlocks,
    excerpt: toExcerpt(contentText),
    tags: Array.isArray(tags) ? tags : [],
    coverImage,
    seoTitle,
    seoDescription,
    seoKeywords: Array.isArray(seoKeywords) ? seoKeywords : undefined,
    canonicalUrl,
    ogImage,
    status: status === 'draft' ? 'draft' : 'published',
    authorId: req.user!.id,
    createdAt: now,
    updatedAt: now,
    publishedAt: status === 'draft' ? undefined : now
  };

  db.blogPosts.push(post);
  res.status(201).json({ post: serializePost(post) });
});

router.patch('/:id', authenticateToken, requireAdmin, (req: Request, res: Response) => {

  const post = db.blogPosts.find((p) => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const { title, content, contentBlocks, tags, coverImage, status, seoTitle, seoDescription, seoKeywords, canonicalUrl, ogImage } = req.body;
  const parsedBlocks = Array.isArray(contentBlocks) ? (contentBlocks as BlogContentBlock[]) : undefined;

  if (title) {
    const newSlug = toSlug(title);
    if (newSlug !== post.slug && db.blogPosts.some((p) => p.slug === newSlug)) {
      return res.status(409).json({ error: 'A post with this title already exists' });
    }
    post.title = title;
    post.slug = newSlug;
  }
  if (content !== undefined) {
    const nextContent = typeof content === 'string' ? content : '';
    post.content = nextContent;
    post.excerpt = toExcerpt(nextContent);
  }
  if (parsedBlocks) {
    post.contentBlocks = parsedBlocks;
    if (!content) {
      const nextContent = blocksToText(parsedBlocks);
      post.content = nextContent;
      post.excerpt = toExcerpt(nextContent);
    }
  }
  if (Array.isArray(tags)) {
    post.tags = tags;
  }
  if (coverImage !== undefined) {
    post.coverImage = coverImage;
  }
  if (seoTitle !== undefined) {
    post.seoTitle = seoTitle;
  }
  if (seoDescription !== undefined) {
    post.seoDescription = seoDescription;
  }
  if (seoKeywords !== undefined) {
    post.seoKeywords = Array.isArray(seoKeywords) ? seoKeywords : [];
  }
  if (canonicalUrl !== undefined) {
    post.canonicalUrl = canonicalUrl;
  }
  if (ogImage !== undefined) {
    post.ogImage = ogImage;
  }
  if (status) {
    post.status = status === 'draft' ? 'draft' : 'published';
    if (post.status === 'published' && !post.publishedAt) {
      post.publishedAt = new Date();
    }
  }

  post.updatedAt = new Date();
  res.json({ post: serializePost(post) });
});

router.delete('/:id', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const index = db.blogPosts.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  db.blogPosts.splice(index, 1);
  res.json({ success: true });
});

router.get('/:id/comments', optionalAuth, (req: Request, res: Response) => {
  const postId = req.params.id;
  const comments = db.blogComments
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
  const post = db.blogPosts.find((p) => p.id === postId || p.slug === postId);
  if (!post || post.status !== 'published') {
    return res.status(404).json({ error: 'Post not found' });
  }
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  const now = new Date();
  const comment: BlogComment = {
    id: uuidv4(),
    postId: post.id,
    authorId: req.user!.id,
    content,
    createdAt: now,
    updatedAt: now
  };
  db.blogComments.push(comment);
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

export default router;
