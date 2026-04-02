import { Router } from 'express'
import { createHash } from 'crypto'
import db from '../db.js'

export const profileRouter = Router()

function safeJsonParse(val: any, fallback: any = null) {
  if (val === null || val === undefined) return fallback
  try { return JSON.parse(val) } catch { return fallback }
}

function formatUser(row: any) {
  return {
    id: row.id,
    name: row.name,
    pronouns: row.pronouns,
    bio: row.bio,
    location: row.location,
    commStyle: row.comm_style,
    interests: safeJsonParse(row.interests, []),
    avatar: row.avatar,
    isOnline: Boolean(row.is_online),
    joinedAt: row.joined_at,
    verified: Boolean(row.verified),
    // Extended onboarding fields
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    neurotype: safeJsonParse(row.neurotype, []),
    triggers: safeJsonParse(row.triggers, []),
    accommodations: safeJsonParse(row.accommodations, []),
    connectionGoals: safeJsonParse(row.connection_goals, []),
    sensoryProfile: safeJsonParse(row.sensory_profile, {}),
    communicationPrefs: safeJsonParse(row.communication_prefs, {}),
    experiencePrefs: safeJsonParse(row.experience_prefs, {}),
    safetyChecklist: safeJsonParse(row.safety_checklist, {}),
    onboardingCompleted: Boolean(row.onboarding_completed),
    onboardingCompletedAt: row.onboarding_completed_at,
    // AAC & advanced features
    aacMode: row.aac_mode || 'off',
    aacLevel: row.aac_level || 'hybrid',
    energyStatus: safeJsonParse(row.energy_status, { social: 50, sensory: 50, cognitive: 50, physical: 50 }),
    energyVisible: Boolean(row.energy_visible ?? 1),
    autoResponder: safeJsonParse(row.auto_responder, {}),
    asyncPrefs: safeJsonParse(row.async_prefs, { readReceipts: false, typingIndicator: false, maxMessagesPerHour: 0, draftAndHold: false }),
    maskingTracking: Boolean(row.masking_tracking),
    recoveryMode: Boolean(row.recovery_mode),
    phoneNumber: row.phone_number || null,
  }
}

function formatPublicUser(row: any) {
  const user = formatUser(row)
  const { phoneNumber: _, ...publicUser } = user
  return publicUser
}

// Mapping of camelCase field → DB column, with JSON serialisation flag
const FIELD_MAP: Record<string, { col: string; json?: boolean }> = {
  name: { col: 'name' },
  pronouns: { col: 'pronouns' },
  bio: { col: 'bio' },
  location: { col: 'location' },
  commStyle: { col: 'comm_style' },
  interests: { col: 'interests', json: true },
  avatar: { col: 'avatar' },
  dateOfBirth: { col: 'date_of_birth' },
  gender: { col: 'gender' },
  neurotype: { col: 'neurotype', json: true },
  triggers: { col: 'triggers', json: true },
  accommodations: { col: 'accommodations', json: true },
  connectionGoals: { col: 'connection_goals', json: true },
  sensoryProfile: { col: 'sensory_profile', json: true },
  communicationPrefs: { col: 'communication_prefs', json: true },
  experiencePrefs: { col: 'experience_prefs', json: true },
  safetyChecklist: { col: 'safety_checklist', json: true },
  onboardingCompleted: { col: 'onboarding_completed' },
  onboardingCompletedAt: { col: 'onboarding_completed_at' },
  aacMode: { col: 'aac_mode' },
  aacLevel: { col: 'aac_level' },
  energyStatus: { col: 'energy_status', json: true },
  energyVisible: { col: 'energy_visible' },
  autoResponder: { col: 'auto_responder', json: true },
  asyncPrefs: { col: 'async_prefs', json: true },
  maskingTracking: { col: 'masking_tracking' },
  recoveryMode: { col: 'recovery_mode' },
}

// GET /api/user/profile
profileRouter.get('/profile', (req, res) => {
  const userId = (req as any).userId
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any
  if (!row) return res.status(404).json({ error: 'User not found' })
  res.json({ profile: formatUser(row) })
})

// PATCH /api/user/profile — accepts any known field
profileRouter.patch('/profile', (req, res) => {
  const userId = (req as any).userId
  const updates: string[] = []
  const params: any[] = []

  // Handle phoneNumber specially — validate E.164 and compute hash
  if ('phoneNumber' in req.body) {
    const phone = req.body.phoneNumber
    if (phone === null || phone === '') {
      updates.push('phone_number = ?', 'phone_hash = ?')
      params.push(null, null)
    } else {
      if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
        return res.status(400).json({ error: 'Invalid phone number. Use E.164 format (e.g. +447700900000)' })
      }
      const hash = createHash('sha256').update(phone).digest('hex')
      updates.push('phone_number = ?', 'phone_hash = ?')
      params.push(phone, hash)
    }
  }

  for (const [key, value] of Object.entries(req.body)) {
    if (key === 'phoneNumber') continue // already handled above
    const mapping = FIELD_MAP[key]
    if (!mapping || value === undefined) continue
    updates.push(`${mapping.col} = ?`)
    params.push(mapping.json ? JSON.stringify(value) : value)
  }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })

  params.push(userId)
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params)

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any
  res.json({ profile: formatUser(row) })
})

// ═══════════════════════════════════════════
// GDPR Data Subject Rights
// ═══════════════════════════════════════════

// GET /api/user/data-export — Right of access + portability (Art. 15, 20)
profileRouter.get('/data-export', (req, res) => {
  const userId = (req as any).userId
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any
  if (!user) return res.status(404).json({ error: 'User not found' })

  const messages = db.prepare('SELECT id, content, tone_tag, aac_symbols, created_at, conversation_id FROM messages WHERE sender_id = ?').all(userId)
  const posts = db.prepare('SELECT id, content, tone_tag, content_warning, tags, created_at FROM community_posts WHERE author_id = ?').all(userId)
  const energyLogs = db.prepare('SELECT * FROM energy_logs WHERE user_id = ? ORDER BY created_at DESC').all(userId)
  const maskingLogs = db.prepare('SELECT * FROM masking_logs WHERE user_id = ? ORDER BY created_at DESC').all(userId)
  const feedback = db.prepare('SELECT * FROM user_feedback WHERE user_id = ? ORDER BY created_at DESC').all(userId)
  const safetyAlerts = db.prepare('SELECT id, alert_type, severity, description, created_at, acknowledged FROM safety_alerts WHERE user_id = ?').all(userId)
  const supporters = db.prepare('SELECT * FROM trusted_supporters WHERE user_id = ?').all(userId)
  const blocks = db.prepare('SELECT blocked_id, created_at FROM user_blocks WHERE blocker_id = ?').all(userId)
  const reports = db.prepare('SELECT reported_id, reason, details, status, created_at FROM user_reports WHERE reporter_id = ?').all(userId)

  res.json({
    exportDate: new Date().toISOString(),
    dataController: 'NeuroChat',
    subject: {
      id: user.id,
      name: user.name,
      email: user.email,
      pronouns: user.pronouns,
      bio: user.bio,
      location: user.location,
      phoneNumber: user.phone_number,
      dateOfBirth: user.date_of_birth,
      gender: user.gender,
      neurotype: safeJsonParse(user.neurotype, []),
      triggers: safeJsonParse(user.triggers, []),
      accommodations: safeJsonParse(user.accommodations, []),
      sensoryProfile: safeJsonParse(user.sensory_profile, {}),
      communicationPrefs: safeJsonParse(user.communication_prefs, {}),
      aacMode: user.aac_mode,
      aacLevel: user.aac_level,
      joinedAt: user.joined_at,
    },
    messages: messages.length,
    messagesData: messages,
    communityPosts: posts,
    energyLogs,
    maskingLogs,
    feedback,
    safetyAlerts,
    supporters,
    blocks,
    reports,
  })
})

// DELETE /api/user/account — Right to erasure (Art. 17)
profileRouter.delete('/account', (req, res) => {
  const userId = (req as any).userId

  const deleteAll = db.transaction(() => {
    // Delete all user-generated content
    db.prepare('DELETE FROM messages WHERE sender_id = ?').run(userId)
    db.prepare('DELETE FROM post_reactions WHERE user_id = ?').run(userId)
    db.prepare('DELETE FROM community_posts WHERE author_id = ?').run(userId)
    db.prepare('DELETE FROM energy_logs WHERE user_id = ?').run(userId)
    db.prepare('DELETE FROM masking_logs WHERE user_id = ?').run(userId)
    db.prepare('DELETE FROM user_feedback WHERE user_id = ?').run(userId)
    db.prepare('DELETE FROM safety_alerts WHERE user_id = ?').run(userId)
    db.prepare('DELETE FROM trusted_supporters WHERE user_id = ? OR supporter_id = ?').run(userId, userId)
    db.prepare('DELETE FROM user_blocks WHERE blocker_id = ? OR blocked_id = ?').run(userId, userId)
    db.prepare('DELETE FROM user_reports WHERE reporter_id = ?').run(userId)
    db.prepare('DELETE FROM room_participants WHERE user_id = ?').run(userId)
    db.prepare('DELETE FROM respond_later WHERE user_id = ?').run(userId)
    db.prepare('DELETE FROM communication_contracts WHERE created_by = ?').run(userId)
    // Remove from conversations
    db.prepare('DELETE FROM conversations WHERE user1_id = ? OR user2_id = ?').run(userId, userId)
    // Finally delete the user
    db.prepare('DELETE FROM users WHERE id = ?').run(userId)
  })

  deleteAll()
  res.json({ ok: true, message: 'Account and all associated data permanently deleted' })
})

// GET /api/user/consent — View current consent status
profileRouter.get('/consent', (req, res) => {
  const userId = (req as any).userId
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any
  if (!user) return res.status(404).json({ error: 'User not found' })

  res.json({
    consents: {
      accountData: { given: true, basis: 'contract', withdrawable: false, description: 'Required for account to function' },
      specialCategoryData: {
        given: Boolean(user.onboarding_completed),
        basis: 'explicit_consent',
        withdrawable: true,
        description: 'Neurotype, triggers, accommodations, sensory profile',
        fields: ['neurotype', 'triggers', 'accommodations', 'sensoryProfile', 'communicationPrefs'],
      },
      energyTracking: {
        given: Boolean(user.energy_status && user.energy_status !== '{}'),
        basis: 'consent',
        withdrawable: true,
        description: 'Social, sensory, cognitive, physical energy logging',
      },
      phoneNumber: {
        given: Boolean(user.phone_number),
        basis: 'consent',
        withdrawable: true,
        description: 'Phone number for contact discovery',
      },
      safetyScanning: {
        given: true,
        basis: 'legitimate_interest',
        withdrawable: false,
        description: 'Guardian Angel manipulation pattern detection (safeguarding)',
      },
    },
  })
})

// PATCH /api/user/consent/withdraw — Withdraw consent for specific processing
profileRouter.patch('/consent/withdraw', (req, res) => {
  const userId = (req as any).userId
  const { category } = req.body

  const clearFields: Record<string, string[]> = {
    specialCategoryData: ['neurotype', 'triggers', 'accommodations', 'sensory_profile', 'communication_prefs', 'experience_prefs', 'safety_checklist'],
    energyTracking: ['energy_status', 'masking_tracking', 'recovery_mode', 'auto_responder'],
    phoneNumber: ['phone_number', 'phone_hash'],
  }

  const fields = clearFields[category]
  if (!fields) return res.status(400).json({ error: 'Invalid consent category. Withdrawable: specialCategoryData, energyTracking, phoneNumber' })

  const updates = fields.map(f => `${f} = NULL`).join(', ')
  db.prepare(`UPDATE users SET ${updates} WHERE id = ?`).run(userId)

  // Also delete related logs
  if (category === 'energyTracking') {
    db.prepare('DELETE FROM energy_logs WHERE user_id = ?').run(userId)
    db.prepare('DELETE FROM masking_logs WHERE user_id = ?').run(userId)
  }

  res.json({ ok: true, message: `Consent withdrawn for ${category}. Associated data cleared.` })
})

// GET /api/user/:id (view another user's public profile — phone number redacted)
profileRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any
  if (!row) return res.status(404).json({ error: 'User not found' })
  res.json({ profile: formatPublicUser(row) })
})
