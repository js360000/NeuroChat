import { Router, type Request, type Response, type NextFunction } from 'express'
import db from '../db.js'
import { v4 as uuid } from 'uuid'

export const adminRouter = Router()

// ═══════════════════════════════════════════
// Admin auth middleware
// ═══════════════════════════════════════════

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

adminRouter.use(requireAdmin)

// ═══════════════════════════════════════════
// Dashboard stats
// ═══════════════════════════════════════════

adminRouter.get('/stats', (_req, res) => {
  const users = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c
  const online = (db.prepare('SELECT COUNT(*) as c FROM users WHERE is_online = 1').get() as any).c
  const messages = (db.prepare('SELECT COUNT(*) as c FROM messages').get() as any).c
  const posts = (db.prepare('SELECT COUNT(*) as c FROM community_posts').get() as any).c
  const activeBans = (db.prepare('SELECT COUNT(*) as c FROM bans WHERE active = 1').get() as any).c
  const violations24h = (db.prepare("SELECT COUNT(*) as c FROM keyword_violations WHERE created_at > datetime('now', '-1 day')").get() as any).c
  const messagestoday = (db.prepare("SELECT COUNT(*) as c FROM messages WHERE created_at > datetime('now', '-1 day')").get() as any).c
  const poststoday = (db.prepare("SELECT COUNT(*) as c FROM community_posts WHERE created_at > datetime('now', '-1 day')").get() as any).c

  res.json({
    stats: {
      totalUsers: users,
      onlineUsers: online,
      totalMessages: messages,
      totalPosts: posts,
      activeBans,
      violationsLast24h: violations24h,
      messagesToday: messagestoday,
      postsToday: poststoday,
    }
  })
})

// ═══════════════════════════════════════════
// User management
// ═══════════════════════════════════════════

adminRouter.get('/users', (req, res) => {
  const search = (req.query.q as string || '').trim().toLowerCase()
  const role = req.query.role as string
  const banned = req.query.banned === 'true'
  const limit = parseInt(req.query.limit as string) || 50
  const offset = parseInt(req.query.offset as string) || 0

  let sql = 'SELECT * FROM users WHERE 1=1'
  const params: any[] = []

  if (search) {
    sql += ' AND (LOWER(name) LIKE ? OR LOWER(bio) LIKE ? OR id = ?)'
    params.push(`%${search}%`, `%${search}%`, search)
  }
  if (role) { sql += ' AND role = ?'; params.push(role) }
  if (banned) { sql += " AND ban_status IS NOT NULL AND ban_status != ''" }

  sql += ' ORDER BY joined_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const rows = db.prepare(sql).all(...params) as any[]
  const users = rows.map(r => ({
    id: r.id,
    name: r.name,
    pronouns: r.pronouns,
    bio: r.bio,
    location: r.location,
    commStyle: r.comm_style,
    interests: JSON.parse(r.interests || '[]'),
    isOnline: Boolean(r.is_online),
    joinedAt: r.joined_at,
    verified: Boolean(r.verified),
    role: r.role || 'user',
    banStatus: r.ban_status,
  }))

  const total = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c
  res.json({ users, total })
})

adminRouter.patch('/users/:id', (req, res) => {
  const { role, verified, name } = req.body
  const targetId = req.params.id
  const adminId = (req as any).userId

  const updates: string[] = []
  const params: any[] = []

  if (role !== undefined) { updates.push('role = ?'); params.push(role) }
  if (verified !== undefined) { updates.push('verified = ?'); params.push(verified ? 1 : 0) }
  if (name !== undefined) { updates.push('name = ?'); params.push(name) }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })

  params.push(targetId)
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params)

  // Audit log
  db.prepare('INSERT INTO audit_log (id, action, target_user_id, admin_user_id, details) VALUES (?, ?, ?, ?, ?)')
    .run(uuid(), 'user.update', targetId, adminId, JSON.stringify(req.body))

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId) as any
  res.json({ user: { ...row, interests: JSON.parse(row.interests || '[]'), isOnline: Boolean(row.is_online), verified: Boolean(row.verified) } })
})

// ═══════════════════════════════════════════
// Banning
// ═══════════════════════════════════════════

adminRouter.post('/users/:id/ban', (req, res) => {
  const targetId = req.params.id
  const adminId = (req as any).userId
  const { type, reason, durationHours } = req.body

  if (!['temporary', 'permanent'].includes(type)) return res.status(400).json({ error: 'type must be temporary or permanent' })

  // Prevent banning yourself or other admins
  const target = db.prepare('SELECT role FROM users WHERE id = ?').get(targetId) as any
  if (!target) return res.status(404).json({ error: 'User not found' })
  if (target.role === 'admin') return res.status(400).json({ error: 'Cannot ban an admin' })

  const banId = uuid()
  const expiresAt = type === 'temporary' && durationHours
    ? new Date(Date.now() + durationHours * 3600000).toISOString()
    : null

  db.prepare('INSERT INTO bans (id, user_id, type, reason, issued_by, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(banId, targetId, type, reason || null, adminId, expiresAt)

  db.prepare('UPDATE users SET ban_status = ? WHERE id = ?')
    .run(type, targetId)

  db.prepare('INSERT INTO audit_log (id, action, target_user_id, admin_user_id, details) VALUES (?, ?, ?, ?, ?)')
    .run(uuid(), 'user.ban', targetId, adminId, JSON.stringify({ type, reason, durationHours }))

  res.json({ ban: { id: banId, userId: targetId, type, reason, expiresAt, active: true } })
})

adminRouter.post('/users/:id/unban', (req, res) => {
  const targetId = req.params.id
  const adminId = (req as any).userId

  db.prepare('UPDATE bans SET active = 0 WHERE user_id = ? AND active = 1').run(targetId)
  db.prepare('UPDATE users SET ban_status = NULL WHERE id = ?').run(targetId)

  db.prepare('INSERT INTO audit_log (id, action, target_user_id, admin_user_id, details) VALUES (?, ?, ?, ?, ?)')
    .run(uuid(), 'user.unban', targetId, adminId, '{}')

  res.json({ ok: true })
})

adminRouter.get('/bans', (_req, res) => {
  const rows = db.prepare(`
    SELECT b.*, u.name as user_name
    FROM bans b JOIN users u ON b.user_id = u.id
    ORDER BY b.issued_at DESC LIMIT 100
  `).all() as any[]

  res.json({
    bans: rows.map(r => ({
      id: r.id, userId: r.user_id, userName: r.user_name,
      type: r.type, reason: r.reason, issuedBy: r.issued_by,
      issuedAt: r.issued_at, expiresAt: r.expires_at, active: Boolean(r.active),
    }))
  })
})

// ═══════════════════════════════════════════
// Keyword moderation
// ═══════════════════════════════════════════

adminRouter.get('/keywords', (_req, res) => {
  const rows = db.prepare('SELECT * FROM keyword_flags ORDER BY created_at DESC').all() as any[]
  res.json({
    keywords: rows.map(r => ({ id: r.id, keyword: r.keyword, severity: r.severity, createdAt: r.created_at }))
  })
})

adminRouter.post('/keywords', (req, res) => {
  const adminId = (req as any).userId
  const { keyword, severity } = req.body
  if (!keyword?.trim()) return res.status(400).json({ error: 'keyword required' })
  if (!['warn', 'mute', 'ban'].includes(severity)) return res.status(400).json({ error: 'severity must be warn, mute, or ban' })

  const id = uuid()
  try {
    db.prepare('INSERT INTO keyword_flags (id, keyword, severity) VALUES (?, ?, ?)').run(id, keyword.trim().toLowerCase(), severity)
  } catch {
    return res.status(409).json({ error: 'Keyword already exists' })
  }

  db.prepare('INSERT INTO audit_log (id, action, target_user_id, admin_user_id, details) VALUES (?, ?, ?, ?, ?)')
    .run(uuid(), 'keyword.add', null, adminId, JSON.stringify({ keyword, severity }))

  res.json({ keyword: { id, keyword: keyword.trim().toLowerCase(), severity } })
})

adminRouter.delete('/keywords/:id', (req, res) => {
  const adminId = (req as any).userId
  const row = db.prepare('SELECT * FROM keyword_flags WHERE id = ?').get(req.params.id) as any
  if (!row) return res.status(404).json({ error: 'Keyword not found' })

  db.prepare('DELETE FROM keyword_flags WHERE id = ?').run(req.params.id)

  db.prepare('INSERT INTO audit_log (id, action, target_user_id, admin_user_id, details) VALUES (?, ?, ?, ?, ?)')
    .run(uuid(), 'keyword.remove', null, adminId, JSON.stringify({ keyword: row.keyword }))

  res.json({ ok: true })
})

adminRouter.get('/violations', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50
  const rows = db.prepare(`
    SELECT v.*, u.name as user_name, k.keyword
    FROM keyword_violations v
    JOIN users u ON v.user_id = u.id
    JOIN keyword_flags k ON v.keyword_id = k.id
    ORDER BY v.created_at DESC LIMIT ?
  `).all(limit) as any[]

  res.json({
    violations: rows.map(r => ({
      id: r.id, userId: r.user_id, userName: r.user_name,
      keyword: r.keyword, contentSnippet: r.content_snippet,
      source: r.source, createdAt: r.created_at,
    }))
  })
})

// ═══════════════════════════════════════════
// Site config (includes AI settings)
// ═══════════════════════════════════════════

adminRouter.get('/config', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM site_config').all() as any[]
  const config: Record<string, any> = {}
  for (const row of rows) {
    try { config[row.key] = JSON.parse(row.value) } catch { config[row.key] = row.value }
  }
  res.json({ config })
})

adminRouter.patch('/config', (req, res) => {
  const adminId = (req as any).userId
  const updates = req.body

  const upsert = db.prepare(`
    INSERT INTO site_config (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `)

  const save = db.transaction(() => {
    for (const [key, value] of Object.entries(updates)) {
      upsert.run(key, JSON.stringify(value))
    }
  })
  save()

  db.prepare('INSERT INTO audit_log (id, action, target_user_id, admin_user_id, details) VALUES (?, ?, ?, ?, ?)')
    .run(uuid(), 'config.update', null, adminId, JSON.stringify(Object.keys(updates)))

  // Return updated config
  const rows = db.prepare('SELECT key, value FROM site_config').all() as any[]
  const config: Record<string, any> = {}
  for (const row of rows) {
    try { config[row.key] = JSON.parse(row.value) } catch { config[row.key] = row.value }
  }
  res.json({ config })
})

// ═══════════════════════════════════════════
// Audit log
// ═══════════════════════════════════════════

adminRouter.get('/audit', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50
  const rows = db.prepare(`
    SELECT a.*, u.name as admin_name
    FROM audit_log a
    LEFT JOIN users u ON a.admin_user_id = u.id
    ORDER BY a.created_at DESC LIMIT ?
  `).all(limit) as any[]

  res.json({
    entries: rows.map(r => ({
      id: r.id, action: r.action, targetUserId: r.target_user_id,
      adminUserId: r.admin_user_id, adminName: r.admin_name,
      details: r.details, createdAt: r.created_at,
    }))
  })
})

// ═══════════════════════════════════════════
// Content moderation — delete posts/messages
// ═══════════════════════════════════════════

adminRouter.delete('/posts/:id', (req, res) => {
  const adminId = (req as any).userId
  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id) as any
  if (!post) return res.status(404).json({ error: 'Post not found' })

  db.prepare('DELETE FROM post_reactions WHERE post_id = ?').run(req.params.id)
  db.prepare('DELETE FROM community_posts WHERE id = ?').run(req.params.id)

  db.prepare('INSERT INTO audit_log (id, action, target_user_id, admin_user_id, details) VALUES (?, ?, ?, ?, ?)')
    .run(uuid(), 'post.delete', post.author_id, adminId, JSON.stringify({ postId: req.params.id, content: post.content.slice(0, 100) }))

  res.json({ ok: true })
})

adminRouter.delete('/messages/:id', (req, res) => {
  const adminId = (req as any).userId
  db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id)

  db.prepare('INSERT INTO audit_log (id, action, target_user_id, admin_user_id, details) VALUES (?, ?, ?, ?, ?)')
    .run(uuid(), 'message.delete', null, adminId, JSON.stringify({ messageId: req.params.id }))

  res.json({ ok: true })
})

// ═══════════════════════════════════════════
// Feedback (admin view)
// ═══════════════════════════════════════════

adminRouter.get('/feedback', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100
  const aspect = req.query.aspect as string || null
  const sentiment = req.query.sentiment as string || null

  let sql = `
    SELECT f.*, u.name as user_name
    FROM user_feedback f JOIN users u ON f.user_id = u.id
    WHERE 1=1
  `
  const params: any[] = []
  if (aspect) { sql += ' AND f.aspect = ?'; params.push(aspect) }
  if (sentiment) { sql += ' AND f.sentiment = ?'; params.push(sentiment) }
  sql += ' ORDER BY f.created_at DESC LIMIT ?'
  params.push(limit)

  const rows = db.prepare(sql).all(...params) as any[]

  // Summary stats
  const totalGood = (db.prepare("SELECT COUNT(*) as c FROM user_feedback WHERE sentiment = 'good'").get() as any).c
  const totalBetter = (db.prepare("SELECT COUNT(*) as c FROM user_feedback WHERE sentiment = 'better'").get() as any).c
  const aspects = db.prepare("SELECT aspect, sentiment, COUNT(*) as c FROM user_feedback GROUP BY aspect, sentiment ORDER BY c DESC").all() as any[]

  res.json({
    feedback: rows.map(r => ({
      id: r.id, userId: r.user_id, userName: r.user_name,
      aspect: r.aspect, sentiment: r.sentiment,
      comment: r.comment, createdAt: r.created_at,
    })),
    summary: { totalGood, totalBetter, aspects },
  })
})

// ═══════════════════════════════════════════
// Reports (admin view)
// ═══════════════════════════════════════════

adminRouter.get('/reports', (req, res) => {
  const status = (req.query.status as string) || 'pending'
  const rows = db.prepare(`
    SELECT r.*, reporter.name as reporter_name, reported.name as reported_name
    FROM user_reports r
    JOIN users reporter ON r.reporter_id = reporter.id
    JOIN users reported ON r.reported_id = reported.id
    WHERE r.status = ?
    ORDER BY r.created_at DESC LIMIT 100
  `).all(status) as any[]

  res.json({
    reports: rows.map(r => ({
      id: r.id, reporterId: r.reporter_id, reporterName: r.reporter_name,
      reportedId: r.reported_id, reportedName: r.reported_name,
      reason: r.reason, details: r.details, status: r.status, createdAt: r.created_at,
    })),
  })
})

adminRouter.patch('/reports/:id', (req, res) => {
  const adminId = (req as any).userId
  const { status } = req.body
  if (!['reviewed', 'actioned', 'dismissed'].includes(status)) return res.status(400).json({ error: 'Invalid status' })

  db.prepare('UPDATE user_reports SET status = ? WHERE id = ?').run(status, req.params.id)

  db.prepare('INSERT INTO audit_log (id, action, target_user_id, admin_user_id, details) VALUES (?, ?, ?, ?, ?)')
    .run(uuid(), 'report.update', null, adminId, JSON.stringify({ reportId: req.params.id, status }))

  res.json({ ok: true })
})
