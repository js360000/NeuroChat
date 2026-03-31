import { Router } from 'express'
import db from '../db.js'
import { v4 as uuid } from 'uuid'
import { scanContent } from '../moderation.js'

export const communityRouter = Router()

function formatPost(row: any, userId: string) {
  const postId = row.id

  // Get reactions aggregated
  const reactions = db.prepare(`
    SELECT type, COUNT(*) as count,
      SUM(CASE WHEN user_id = ? THEN 1 ELSE 0 END) as reacted
    FROM post_reactions WHERE post_id = ?
    GROUP BY type
  `).all(userId, postId) as any[]

  const allTypes = ['heart', 'solidarity', 'lightbulb', 'sparkle', 'hug']
  const reactionMap = Object.fromEntries(reactions.map((r) => [r.type, { count: r.count, reacted: Boolean(r.reacted) }]))

  return {
    id: row.id,
    author: {
      id: row.author_id,
      name: row.author_name,
      pronouns: row.author_pronouns,
      avatar: row.author_avatar,
      isOnline: Boolean(row.author_online),
      verified: Boolean(row.author_verified),
      commStyle: row.author_comm_style,
    },
    content: row.content,
    toneTag: row.tone_tag,
    contentWarning: row.content_warning,
    tags: JSON.parse(row.tags || '[]'),
    pinned: Boolean(row.pinned),
    createdAt: row.created_at,
    reactions: allTypes.map((type) => ({
      type,
      count: reactionMap[type]?.count || 0,
      reacted: reactionMap[type]?.reacted || false,
    })),
    replyCount: (db.prepare('SELECT COUNT(*) as c FROM community_posts WHERE parent_id = ?').get(postId) as any).c,
    parentId: row.parent_id || null,
  }
}

// GET /api/community/posts
communityRouter.get('/posts', (req, res) => {
  const userId = (req as any).userId
  const tag = req.query.tag as string | undefined
  const limit = parseInt(req.query.limit as string) || 20
  const offset = parseInt(req.query.offset as string) || 0

  let sql = `
    SELECT p.*, u.name as author_name, u.pronouns as author_pronouns,
      u.avatar as author_avatar, u.is_online as author_online,
      u.verified as author_verified, u.comm_style as author_comm_style
    FROM community_posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.parent_id IS NULL
      AND p.author_id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = ?)
      AND p.author_id NOT IN (SELECT blocker_id FROM user_blocks WHERE blocked_id = ?)
  `
  const params: any[] = [userId, userId]

  if (tag) {
    sql += ` AND p.tags LIKE ?`
    params.push(`%"${tag}"%`)
  }

  sql += ` ORDER BY p.pinned DESC, p.created_at DESC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const rows = db.prepare(sql).all(...params) as any[]
  const posts = rows.map((row) => formatPost(row, userId))

  res.json({ posts })
})

// GET /api/community/posts/:id
communityRouter.get('/posts/:id', (req, res) => {
  const userId = (req as any).userId
  const row = db.prepare(`
    SELECT p.*, u.name as author_name, u.pronouns as author_pronouns,
      u.avatar as author_avatar, u.is_online as author_online,
      u.verified as author_verified, u.comm_style as author_comm_style
    FROM community_posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.id = ?
  `).get(req.params.id) as any

  if (!row) return res.status(404).json({ error: 'Post not found' })
  res.json({ post: formatPost(row, userId) })
})

// POST /api/community/posts
communityRouter.post('/posts', (req, res) => {
  const userId = (req as any).userId
  const { content, toneTag, contentWarning, tags } = req.body

  if (!content?.trim()) return res.status(400).json({ error: 'content required' })

  // Keyword moderation scan
  const modResult = scanContent(userId, content, 'post')
  if (modResult.banned) {
    return res.status(403).json({ error: 'Account suspended due to content violation', violations: modResult.violations })
  }

  const postId = uuid()
  const now = new Date().toISOString()

  db.prepare(`INSERT INTO community_posts (id, author_id, content, tone_tag, content_warning, tags, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(postId, userId, content.trim(), toneTag || null, contentWarning || null, JSON.stringify(tags || []), now)

  const row = db.prepare(`
    SELECT p.*, u.name as author_name, u.pronouns as author_pronouns,
      u.avatar as author_avatar, u.is_online as author_online,
      u.verified as author_verified, u.comm_style as author_comm_style
    FROM community_posts p JOIN users u ON p.author_id = u.id WHERE p.id = ?
  `).get(postId) as any

  res.json({ post: formatPost(row, userId) })
})

// POST /api/community/posts/:id/react
communityRouter.post('/posts/:id/react', (req, res) => {
  const userId = (req as any).userId
  const postId = req.params.id
  const { type } = req.body

  if (!['heart', 'solidarity', 'lightbulb', 'sparkle', 'hug'].includes(type)) {
    return res.status(400).json({ error: 'Invalid reaction type' })
  }

  const existing = db.prepare('SELECT id FROM post_reactions WHERE post_id = ? AND user_id = ? AND type = ?')
    .get(postId, userId, type) as any

  if (existing) {
    db.prepare('DELETE FROM post_reactions WHERE id = ?').run(existing.id)
  } else {
    db.prepare('INSERT INTO post_reactions (id, post_id, user_id, type) VALUES (?, ?, ?, ?)')
      .run(uuid(), postId, userId, type)
  }

  const row = db.prepare(`
    SELECT p.*, u.name as author_name, u.pronouns as author_pronouns,
      u.avatar as author_avatar, u.is_online as author_online,
      u.verified as author_verified, u.comm_style as author_comm_style
    FROM community_posts p JOIN users u ON p.author_id = u.id WHERE p.id = ?
  `).get(postId) as any

  if (!row) return res.status(404).json({ error: 'Post not found' })
  res.json({ post: formatPost(row, userId) })
})

// GET /api/community/posts/:id/replies
communityRouter.get('/posts/:id/replies', (req, res) => {
  const userId = (req as any).userId
  const parentId = req.params.id

  const rows = db.prepare(`
    SELECT p.*, u.name as author_name, u.pronouns as author_pronouns,
      u.avatar as author_avatar, u.is_online as author_online,
      u.verified as author_verified, u.comm_style as author_comm_style
    FROM community_posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.parent_id = ?
    ORDER BY p.created_at ASC
  `).all(parentId) as any[]

  res.json({ replies: rows.map(row => formatPost(row, userId)) })
})

// POST /api/community/posts/:id/reply
communityRouter.post('/posts/:id/reply', (req, res) => {
  const userId = (req as any).userId
  const parentId = req.params.id
  const { content, toneTag } = req.body

  if (!content?.trim()) return res.status(400).json({ error: 'content required' })

  const modResult = scanContent(userId, content, 'post')
  if (modResult.banned) {
    return res.status(403).json({ error: 'Account suspended', violations: modResult.violations })
  }

  const replyId = uuid()
  const now = new Date().toISOString()

  db.prepare(`INSERT INTO community_posts (id, author_id, content, tone_tag, parent_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)`)
    .run(replyId, userId, content.trim(), toneTag || null, parentId, now)

  const row = db.prepare(`
    SELECT p.*, u.name as author_name, u.pronouns as author_pronouns,
      u.avatar as author_avatar, u.is_online as author_online,
      u.verified as author_verified, u.comm_style as author_comm_style
    FROM community_posts p JOIN users u ON p.author_id = u.id WHERE p.id = ?
  `).get(replyId) as any

  res.json({ reply: formatPost(row, userId) })
})

// GET /api/community/tags
communityRouter.get('/tags', (_req, res) => {
  const rows = db.prepare('SELECT tags FROM community_posts').all() as any[]
  const tagSet = new Set<string>()
  rows.forEach((r) => {
    const parsed = JSON.parse(r.tags || '[]')
    parsed.forEach((t: string) => tagSet.add(t))
  })
  res.json({ tags: Array.from(tagSet).sort() })
})
