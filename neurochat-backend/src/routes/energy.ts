import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import db from '../db.js'

export const energyRouter = Router()

// GET /api/energy — current energy + recent logs
energyRouter.get('/', (req, res) => {
  const userId = (req as any).userId
  const user = db.prepare('SELECT energy_status, energy_visible, recovery_mode, auto_responder FROM users WHERE id = ?').get(userId) as any
  if (!user) return res.status(404).json({ error: 'User not found' })

  const logs = db.prepare('SELECT * FROM energy_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(userId)

  let status
  try { status = JSON.parse(user.energy_status || '{}') } catch { status = { social: 50, sensory: 50, cognitive: 50, physical: 50 } }
  let autoResponder
  try { autoResponder = JSON.parse(user.auto_responder || '{}') } catch { autoResponder = {} }

  res.json({
    energy: status,
    visible: Boolean(user.energy_visible),
    recoveryMode: Boolean(user.recovery_mode),
    autoResponder,
    logs,
  })
})

// POST /api/energy — log energy levels
energyRouter.post('/', (req, res) => {
  const userId = (req as any).userId
  const { social, sensory, cognitive, physical, note } = req.body

  const id = uuid()
  const energyObj = {
    social: Math.max(0, Math.min(100, social ?? 50)),
    sensory: Math.max(0, Math.min(100, sensory ?? 50)),
    cognitive: Math.max(0, Math.min(100, cognitive ?? 50)),
    physical: Math.max(0, Math.min(100, physical ?? 50)),
  }

  db.prepare('INSERT INTO energy_logs (id, user_id, social, sensory, cognitive, physical, note) VALUES (?,?,?,?,?,?,?)').run(
    id, userId, energyObj.social, energyObj.sensory, energyObj.cognitive, energyObj.physical, note || null
  )

  // Update user's current status
  const overall = Math.round((energyObj.social + energyObj.sensory + energyObj.cognitive + energyObj.physical) / 4)
  const isRecovery = overall <= 20

  db.prepare('UPDATE users SET energy_status = ?, recovery_mode = ? WHERE id = ?').run(
    JSON.stringify(energyObj), isRecovery ? 1 : 0, userId
  )

  res.json({ energy: energyObj, recoveryMode: isRecovery, logId: id })
})

// PATCH /api/energy/auto-responder — configure auto-responder
energyRouter.patch('/auto-responder', (req, res) => {
  const userId = (req as any).userId
  const { enabled, message, threshold } = req.body
  const config = { enabled: Boolean(enabled), message: message || "I'm resting right now — I'll reply when my energy is back up.", threshold: threshold ?? 25 }
  db.prepare('UPDATE users SET auto_responder = ? WHERE id = ?').run(JSON.stringify(config), userId)
  res.json({ autoResponder: config })
})

// PATCH /api/energy/visibility — toggle energy visibility
energyRouter.patch('/visibility', (req, res) => {
  const userId = (req as any).userId
  const { visible } = req.body
  db.prepare('UPDATE users SET energy_visible = ? WHERE id = ?').run(visible ? 1 : 0, userId)
  res.json({ visible: Boolean(visible) })
})
