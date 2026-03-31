import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import db from '../db.js'

export const moderationRouter = Router()

// ═══════════════════════════════════════════
// Block
// ═══════════════════════════════════════════

// POST /api/users/:id/block
moderationRouter.post('/:id/block', (req, res) => {
  const userId = (req as any).userId
  const targetId = req.params.id

  if (userId === targetId) return res.status(400).json({ error: 'Cannot block yourself' })

  const existing = db.prepare('SELECT id FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?').get(userId, targetId)
  if (existing) return res.json({ ok: true, alreadyBlocked: true })

  db.prepare('INSERT INTO user_blocks (id, blocker_id, blocked_id) VALUES (?, ?, ?)').run(uuid(), userId, targetId)
  res.json({ ok: true })
})

// DELETE /api/users/:id/block
moderationRouter.delete('/:id/block', (req, res) => {
  const userId = (req as any).userId
  const targetId = req.params.id
  db.prepare('DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?').run(userId, targetId)
  res.json({ ok: true })
})

// GET /api/users/blocked — list blocked users
moderationRouter.get('/blocked', (req, res) => {
  const userId = (req as any).userId
  const rows = db.prepare(`
    SELECT b.blocked_id, u.name, u.avatar, b.created_at
    FROM user_blocks b JOIN users u ON u.id = b.blocked_id
    WHERE b.blocker_id = ?
    ORDER BY b.created_at DESC
  `).all(userId)
  res.json({ blocked: rows })
})

// ═══════════════════════════════════════════
// Report
// ═══════════════════════════════════════════

// POST /api/users/:id/report
moderationRouter.post('/:id/report', (req, res) => {
  const userId = (req as any).userId
  const targetId = req.params.id
  const { reason, details } = req.body

  if (!reason) return res.status(400).json({ error: 'Reason is required' })
  if (userId === targetId) return res.status(400).json({ error: 'Cannot report yourself' })

  const id = uuid()
  db.prepare('INSERT INTO user_reports (id, reporter_id, reported_id, reason, details) VALUES (?, ?, ?, ?, ?)').run(id, userId, targetId, reason, details || null)
  res.json({ ok: true, reportId: id })
})

// ═══════════════════════════════════════════
// Block check helper (exported for use in other routes)
// ═══════════════════════════════════════════

export function isBlocked(userId: string, targetId: string): boolean {
  const row = db.prepare(
    'SELECT id FROM user_blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)'
  ).get(userId, targetId, targetId, userId)
  return !!row
}
