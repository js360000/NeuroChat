import db from './db.js'
import { v4 as uuid } from 'uuid'

/**
 * Scans content against keyword flags and records violations.
 * If a user exceeds the auto-ban threshold, bans them automatically.
 */
export function scanContent(userId: string, content: string, source: 'message' | 'post'): {
  flagged: boolean
  violations: string[]
  banned: boolean
} {
  const keywords = db.prepare('SELECT * FROM keyword_flags').all() as any[]
  if (keywords.length === 0) return { flagged: false, violations: [], banned: false }

  const lower = content.toLowerCase()
  const violations: string[] = []
  let maxSeverity: 'warn' | 'mute' | 'ban' = 'warn'

  for (const kw of keywords) {
    if (lower.includes(kw.keyword.toLowerCase())) {
      violations.push(kw.keyword)

      // Record violation
      db.prepare('INSERT INTO keyword_violations (id, user_id, keyword_id, content_snippet, source) VALUES (?, ?, ?, ?, ?)')
        .run(uuid(), userId, kw.id, content.slice(0, 200), source)

      if (kw.severity === 'ban') maxSeverity = 'ban'
      else if (kw.severity === 'mute' && maxSeverity !== 'ban') maxSeverity = 'mute'
    }
  }

  if (violations.length === 0) return { flagged: false, violations: [], banned: false }

  // Check if auto-ban should trigger
  let banned = false
  if (maxSeverity === 'ban') {
    // Immediate auto-ban for 'ban' severity keywords
    autoBanUser(userId, `Automatic ban: used banned keyword "${violations[0]}"`)
    banned = true
  } else {
    // Check threshold-based auto-ban
    banned = checkAutobanThreshold(userId)
  }

  return { flagged: true, violations, banned }
}

function checkAutobanThreshold(userId: string): boolean {
  const enabled = getModConfig('moderation.auto_ban_enabled')
  if (!enabled) return false

  const threshold = getModConfig('moderation.auto_ban_threshold') || 5
  const windowHours = getModConfig('moderation.auto_ban_window_hours') || 24

  const count = (db.prepare(`
    SELECT COUNT(*) as c FROM keyword_violations
    WHERE user_id = ? AND created_at > datetime('now', '-${windowHours} hours')
  `).get(userId) as any).c

  if (count >= threshold) {
    const durationHours = getModConfig('moderation.auto_ban_duration_hours') || 48
    autoBanUser(userId, `Automatic ban: ${count} keyword violations in ${windowHours}h (threshold: ${threshold})`, durationHours)
    return true
  }

  return false
}

function autoBanUser(userId: string, reason: string, durationHours?: number) {
  // Don't ban admins
  const user = db.prepare('SELECT role, ban_status FROM users WHERE id = ?').get(userId) as any
  if (!user || user.role === 'admin') return
  if (user.ban_status === 'permanent') return // already permanently banned

  const banId = uuid()
  const expiresAt = durationHours
    ? new Date(Date.now() + durationHours * 3600000).toISOString()
    : null

  const type = durationHours ? 'automatic' : 'permanent'

  db.prepare('INSERT INTO bans (id, user_id, type, reason, issued_by, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(banId, userId, type, reason, 'system', expiresAt)

  db.prepare('UPDATE users SET ban_status = ? WHERE id = ?')
    .run(type === 'permanent' ? 'permanent' : 'automatic', userId)

  db.prepare('INSERT INTO audit_log (id, action, target_user_id, admin_user_id, details) VALUES (?, ?, ?, ?, ?)')
    .run(uuid(), 'user.autoban', userId, 'system', JSON.stringify({ reason, durationHours }))

  console.log(`[MODERATION] Auto-banned user ${userId}: ${reason}`)
}

function getModConfig(key: string): any {
  const row = db.prepare('SELECT value FROM site_config WHERE key = ?').get(key) as any
  if (!row) return null
  try { return JSON.parse(row.value) } catch { return row.value }
}

/**
 * Check if a user is currently banned. Also expires temp bans.
 */
export function isUserBanned(userId: string): { banned: boolean; reason?: string; expiresAt?: string } {
  const activeBans = db.prepare('SELECT * FROM bans WHERE user_id = ? AND active = 1 ORDER BY issued_at DESC').all(userId) as any[]

  for (const ban of activeBans) {
    if (ban.type === 'permanent') {
      return { banned: true, reason: ban.reason, expiresAt: undefined }
    }
    if (ban.expires_at) {
      if (new Date(ban.expires_at) > new Date()) {
        return { banned: true, reason: ban.reason, expiresAt: ban.expires_at }
      } else {
        // Expired — deactivate
        db.prepare('UPDATE bans SET active = 0 WHERE id = ?').run(ban.id)
        db.prepare('UPDATE users SET ban_status = NULL WHERE id = ?').run(userId)
      }
    }
  }

  return { banned: false }
}
