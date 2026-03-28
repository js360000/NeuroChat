import { Router } from 'express'
import db from '../db.js'

export const preferencesRouter = Router()

// GET /api/user/preferences/:category
preferencesRouter.get('/:category', (req, res) => {
  const userId = (req as any).userId
  const category = req.params.category

  const rows = db.prepare('SELECT key, value FROM preferences WHERE user_id = ? AND key LIKE ?')
    .all(userId, `${category}.%`) as any[]

  const prefs: Record<string, any> = {}
  for (const row of rows) {
    const key = row.key.replace(`${category}.`, '')
    try { prefs[key] = JSON.parse(row.value) } catch { prefs[key] = row.value }
  }

  res.json({ preferences: prefs })
})

// PATCH /api/user/preferences/:category
preferencesRouter.patch('/:category', (req, res) => {
  const userId = (req as any).userId
  const category = req.params.category
  const data = req.body

  const upsert = db.prepare(`
    INSERT INTO preferences (user_id, key, value) VALUES (?, ?, ?)
    ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value
  `)

  const save = db.transaction(() => {
    for (const [key, value] of Object.entries(data)) {
      upsert.run(userId, `${category}.${key}`, JSON.stringify(value))
    }
  })
  save()

  res.json({ ok: true })
})
