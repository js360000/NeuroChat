import { Router } from 'express'
import db from '../db.js'

export const contactsRouter = Router()

// POST /api/contacts/lookup — batch phone hash lookup (privacy-preserving)
contactsRouter.post('/lookup', (req, res) => {
  const userId = (req as any).userId
  const { phoneHashes } = req.body

  if (!Array.isArray(phoneHashes) || phoneHashes.length === 0) {
    return res.status(400).json({ error: 'phoneHashes array required' })
  }
  if (phoneHashes.length > 100) {
    return res.status(400).json({ error: 'Maximum 100 hashes per request' })
  }

  const placeholders = phoneHashes.map(() => '?').join(',')
  const rows = db.prepare(`
    SELECT id, name, avatar, pronouns, is_online
    FROM users
    WHERE phone_hash IN (${placeholders})
      AND id != ?
      AND id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = ?)
      AND id NOT IN (SELECT blocker_id FROM user_blocks WHERE blocked_id = ?)
  `).all(...phoneHashes, userId, userId, userId) as any[]

  const matches = rows.map(r => ({
    id: r.id,
    name: r.name,
    avatar: r.avatar,
    pronouns: r.pronouns,
    isOnline: Boolean(r.is_online),
  }))

  res.json({ matches })
})

// GET /api/contacts/search — unified name/phone search
contactsRouter.get('/search', (req, res) => {
  const userId = (req as any).userId
  const query = (req.query.q as string || '').trim()
  const hash = (req.query.hash as string || '').trim()

  if (!query && !hash) return res.json({ results: [] })

  let rows: any[]

  if (hash) {
    // Phone hash lookup (single)
    rows = db.prepare(`
      SELECT id, name, avatar, pronouns, bio, is_online, comm_style, interests
      FROM users
      WHERE phone_hash = ?
        AND id != ?
        AND id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = ?)
        AND id NOT IN (SELECT blocker_id FROM user_blocks WHERE blocked_id = ?)
    `).all(hash, userId, userId, userId) as any[]
  } else {
    // Name search
    const q = `%${query.toLowerCase()}%`
    rows = db.prepare(`
      SELECT id, name, avatar, pronouns, bio, is_online, comm_style, interests
      FROM users
      WHERE id != ?
        AND (LOWER(name) LIKE ? OR LOWER(bio) LIKE ?)
        AND id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = ?)
        AND id NOT IN (SELECT blocker_id FROM user_blocks WHERE blocked_id = ?)
      ORDER BY is_online DESC, name ASC
      LIMIT 20
    `).all(userId, q, q, userId, userId) as any[]
  }

  const results = rows.map(r => ({
    id: r.id,
    name: r.name,
    avatar: r.avatar,
    pronouns: r.pronouns,
    bio: r.bio,
    isOnline: Boolean(r.is_online),
    commStyle: r.comm_style,
    interests: JSON.parse(r.interests || '[]'),
    matchedByPhone: !!hash,
  }))

  res.json({ results })
})
