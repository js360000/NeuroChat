import { Router } from 'express'
import db from '../db.js'

export const discoverRouter = Router()

// GET /api/discover/profiles
discoverRouter.get('/profiles', (req, res) => {
  const userId = (req as any).userId
  const query = (req.query.q as string || '').trim().toLowerCase()

  let sql = `SELECT * FROM users WHERE id != ?
    AND id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = ?)
    AND id NOT IN (SELECT blocker_id FROM user_blocks WHERE blocked_id = ?)`
  const params: any[] = [userId, userId, userId]

  if (query) {
    sql += ` AND (LOWER(name) LIKE ? OR LOWER(bio) LIKE ? OR LOWER(interests) LIKE ?)`
    const q = `%${query}%`
    params.push(q, q, q)
  }

  sql += ` ORDER BY is_online DESC, joined_at DESC`

  const rows = db.prepare(sql).all(...params) as any[]

  // Calculate simple compatibility score based on shared interests
  const currentUser = db.prepare('SELECT interests FROM users WHERE id = ?').get(userId) as any
  const myInterests: string[] = JSON.parse(currentUser?.interests || '[]')

  const profiles = rows.map((row) => {
    const theirInterests: string[] = JSON.parse(row.interests || '[]')
    const shared = myInterests.filter((i) => theirInterests.includes(i)).length
    const total = new Set([...myInterests, ...theirInterests]).size
    const compatibility = total > 0 ? Math.round((shared / total) * 100 + 50 + Math.random() * 10) : 50
    return {
      id: row.id,
      name: row.name,
      pronouns: row.pronouns,
      bio: row.bio,
      location: row.location,
      commStyle: row.comm_style,
      interests: JSON.parse(row.interests || '[]'),
      avatar: row.avatar,
      isOnline: Boolean(row.is_online),
      joinedAt: row.joined_at,
      verified: Boolean(row.verified),
      compatibility: Math.min(99, compatibility),
    }
  })

  res.json({ profiles })
})
