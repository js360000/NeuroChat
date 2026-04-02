import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import db from '../db.js'

export const feedbackRouter = Router()

// POST /api/feedback — submit feedback
feedbackRouter.post('/', (req, res) => {
  const userId = (req as any).userId
  const { aspect, sentiment, comment } = req.body

  if (!aspect || !sentiment) return res.status(400).json({ error: 'aspect and sentiment required' })
  if (!['good', 'better'].includes(sentiment)) return res.status(400).json({ error: 'sentiment must be good or better' })

  const id = uuid()
  db.prepare('INSERT INTO user_feedback (id, user_id, aspect, sentiment, comment) VALUES (?, ?, ?, ?, ?)')
    .run(id, userId, aspect, sentiment, comment?.trim() || null)

  res.json({ ok: true, id })
})

// GET /api/feedback/mine — get my feedback history
feedbackRouter.get('/mine', (req, res) => {
  const userId = (req as any).userId
  const rows = db.prepare('SELECT * FROM user_feedback WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(userId)
  res.json({ feedback: rows })
})
