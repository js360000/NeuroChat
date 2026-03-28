import { Router } from 'express'
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
  }
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

  for (const [key, value] of Object.entries(req.body)) {
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

// GET /api/user/:id (view another user's profile)
profileRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any
  if (!row) return res.status(404).json({ error: 'User not found' })
  res.json({ profile: formatUser(row) })
})
