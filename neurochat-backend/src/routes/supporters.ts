import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import db from '../db.js'

export const supportersRouter = Router()

// GET /api/supporters — get my supporters
supportersRouter.get('/', (req, res) => {
  const userId = (req as any).userId
  const supporters = db.prepare(`
    SELECT ts.*, u.name as supporter_name, u.avatar as supporter_avatar, u.pronouns as supporter_pronouns
    FROM trusted_supporters ts
    JOIN users u ON u.id = ts.supporter_id
    WHERE ts.user_id = ?
    ORDER BY ts.created_at DESC
  `).all(userId)

  res.json({
    supporters: supporters.map((s: any) => ({
      id: s.id,
      supporterId: s.supporter_id,
      supporterName: s.supporter_name,
      supporterAvatar: s.supporter_avatar,
      supporterPronouns: s.supporter_pronouns,
      safeguardingLevel: s.safeguarding_level,
      canViewMessages: Boolean(s.can_view_messages),
      canApproveContacts: Boolean(s.can_approve_contacts),
      canViewActivity: Boolean(s.can_view_activity),
      approvedAt: s.approved_at,
      createdAt: s.created_at,
    }))
  })
})

// GET /api/supporters/supporting — people I support
supportersRouter.get('/supporting', (req, res) => {
  const userId = (req as any).userId
  const supported = db.prepare(`
    SELECT ts.*, u.name, u.avatar, u.pronouns, u.energy_status, u.recovery_mode
    FROM trusted_supporters ts
    JOIN users u ON u.id = ts.user_id
    WHERE ts.supporter_id = ?
    ORDER BY ts.created_at DESC
  `).all(userId)

  res.json({
    supporting: supported.map((s: any) => {
      let energy
      try { energy = JSON.parse(s.energy_status || '{}') } catch { energy = {} }
      return {
        id: s.id,
        userId: s.user_id,
        name: s.name,
        avatar: s.avatar,
        pronouns: s.pronouns,
        safeguardingLevel: s.safeguarding_level,
        canViewMessages: Boolean(s.can_view_messages),
        canApproveContacts: Boolean(s.can_approve_contacts),
        canViewActivity: Boolean(s.can_view_activity),
        energy,
        recoveryMode: Boolean(s.recovery_mode),
      }
    })
  })
})

// POST /api/supporters — add a supporter (requires user consent)
supportersRouter.post('/', (req, res) => {
  const userId = (req as any).userId
  const { supporterId, safeguardingLevel } = req.body

  if (!supporterId) return res.status(400).json({ error: 'supporterId required' })
  if (supporterId === userId) return res.status(400).json({ error: 'Cannot be your own supporter' })

  const supporter = db.prepare('SELECT id FROM users WHERE id = ?').get(supporterId) as any
  if (!supporter) return res.status(404).json({ error: 'Supporter user not found' })

  const existing = db.prepare('SELECT id FROM trusted_supporters WHERE user_id = ? AND supporter_id = ?').get(userId, supporterId)
  if (existing) return res.status(400).json({ error: 'Already a supporter' })

  const level = safeguardingLevel || 'guided'
  const validLevels = ['independent', 'guided', 'supported', 'protected']
  if (!validLevels.includes(level)) return res.status(400).json({ error: 'Invalid safeguarding level' })

  const permissions: Record<string, { msg: boolean; contacts: boolean; activity: boolean }> = {
    independent: { msg: false, contacts: false, activity: false },
    guided: { msg: false, contacts: false, activity: true },
    supported: { msg: true, contacts: true, activity: true },
    protected: { msg: true, contacts: true, activity: true },
  }

  const perms = permissions[level]
  const id = uuid()

  db.prepare(`
    INSERT INTO trusted_supporters (id, user_id, supporter_id, safeguarding_level, can_view_messages, can_approve_contacts, can_view_activity, approved_at)
    VALUES (?,?,?,?,?,?,?,datetime('now'))
  `).run(id, userId, supporterId, level, perms.msg ? 1 : 0, perms.contacts ? 1 : 0, perms.activity ? 1 : 0)

  res.json({ id, safeguardingLevel: level })
})

// PATCH /api/supporters/:id — update safeguarding level
supportersRouter.patch('/:id', (req, res) => {
  const userId = (req as any).userId
  const { safeguardingLevel } = req.body

  const validLevels = ['independent', 'guided', 'supported', 'protected']
  if (!validLevels.includes(safeguardingLevel)) return res.status(400).json({ error: 'Invalid level' })

  const permissions: Record<string, { msg: boolean; contacts: boolean; activity: boolean }> = {
    independent: { msg: false, contacts: false, activity: false },
    guided: { msg: false, contacts: false, activity: true },
    supported: { msg: true, contacts: true, activity: true },
    protected: { msg: true, contacts: true, activity: true },
  }
  const perms = permissions[safeguardingLevel]

  db.prepare(`
    UPDATE trusted_supporters SET safeguarding_level = ?, can_view_messages = ?, can_approve_contacts = ?, can_view_activity = ?
    WHERE id = ? AND user_id = ?
  `).run(safeguardingLevel, perms.msg ? 1 : 0, perms.contacts ? 1 : 0, perms.activity ? 1 : 0, req.params.id, userId)

  res.json({ ok: true, safeguardingLevel })
})

// DELETE /api/supporters/:id — remove supporter
supportersRouter.delete('/:id', (req, res) => {
  const userId = (req as any).userId
  db.prepare('DELETE FROM trusted_supporters WHERE id = ? AND user_id = ?').run(req.params.id, userId)
  res.json({ ok: true })
})

// GET /api/supporters/alerts — alerts for people I support
supportersRouter.get('/alerts', (req, res) => {
  const userId = (req as any).userId
  const alerts = db.prepare(`
    SELECT sa.*, u.name as user_name FROM safety_alerts sa
    JOIN trusted_supporters ts ON ts.user_id = sa.user_id AND ts.supporter_id = ?
    JOIN users u ON u.id = sa.user_id
    WHERE sa.notified_supporter = 1
    ORDER BY sa.created_at DESC LIMIT 50
  `).all(userId)

  res.json({ alerts })
})
