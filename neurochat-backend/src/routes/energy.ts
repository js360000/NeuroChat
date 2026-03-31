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

// GET /api/energy/budget — spoon budget planner (weekly forecast)
energyRouter.get('/budget', (req, res) => {
  const userId = (req as any).userId

  // Get 14 days of energy logs to build patterns
  const logs = db.prepare(`
    SELECT social, sensory, cognitive, physical, created_at
    FROM energy_logs WHERE user_id = ? AND created_at >= datetime('now', '-14 days')
    ORDER BY created_at ASC
  `).all(userId) as any[]

  // Get upcoming social interactions (conversations with messages in last 3 days)
  const activeConversations = (db.prepare(`
    SELECT COUNT(DISTINCT c.id) as count FROM conversations c
    JOIN messages m ON m.conversation_id = c.id
    WHERE (c.user1_id = ? OR c.user2_id = ?) AND m.created_at >= datetime('now', '-3 days')
  `).get(userId, userId) as any).count

  // Calculate daily averages per dimension
  const dayMap: Record<string, { social: number[]; sensory: number[]; cognitive: number[]; physical: number[] }> = {}
  for (const log of logs) {
    const day = log.created_at.slice(0, 10) // YYYY-MM-DD
    if (!dayMap[day]) dayMap[day] = { social: [], sensory: [], cognitive: [], physical: [] }
    dayMap[day].social.push(log.social)
    dayMap[day].sensory.push(log.sensory)
    dayMap[day].cognitive.push(log.cognitive)
    dayMap[day].physical.push(log.physical)
  }

  const dailyAverages = Object.entries(dayMap).map(([date, dims]) => ({
    date,
    social: Math.round(dims.social.reduce((a, b) => a + b, 0) / dims.social.length),
    sensory: Math.round(dims.sensory.reduce((a, b) => a + b, 0) / dims.sensory.length),
    cognitive: Math.round(dims.cognitive.reduce((a, b) => a + b, 0) / dims.cognitive.length),
    physical: Math.round(dims.physical.reduce((a, b) => a + b, 0) / dims.physical.length),
  }))

  // Calculate overall weekly average
  const avgEnergy = dailyAverages.length > 0
    ? Math.round(dailyAverages.reduce((s, d) => s + (d.social + d.sensory + d.cognitive + d.physical) / 4, 0) / dailyAverages.length)
    : 50

  // Predict crash risk
  const lowDays = dailyAverages.filter(d => (d.social + d.sensory + d.cognitive + d.physical) / 4 < 30).length
  const crashRisk = lowDays >= 3 ? 'high' : lowDays >= 1 ? 'moderate' : 'low'

  // Generate recommendations
  const recommendations: string[] = []
  const socialAvg = dailyAverages.length > 0 ? Math.round(dailyAverages.reduce((s, d) => s + d.social, 0) / dailyAverages.length) : 50
  if (activeConversations > 3 && socialAvg < 40) recommendations.push(`You have ${activeConversations} active conversations but your social energy averages ${socialAvg}%. Consider pausing some chats.`)
  if (crashRisk === 'high') recommendations.push('You crashed 3+ days this week. Pre-set auto-responders for tomorrow to protect your energy.')
  if (socialAvg < 25) recommendations.push('Your social energy is very low. Consider a Together Room instead of active conversations.')
  const sensoryAvg = dailyAverages.length > 0 ? Math.round(dailyAverages.reduce((s, d) => s + d.sensory, 0) / dailyAverages.length) : 50
  if (sensoryAvg < 30) recommendations.push('Sensory energy is consistently low. The Stim Widget and sensory breaks may help.')

  // Estimate spoon capacity (simplified: avg energy / 20 = spoons per day)
  const spoonsPerDay = Math.max(1, Math.round(avgEnergy / 20))
  const spoonsThisWeek = spoonsPerDay * 7
  const spoonsUsedEstimate = activeConversations * 2 + lowDays * 3

  res.json({
    budget: {
      spoonsPerDay,
      spoonsThisWeek,
      spoonsUsedEstimate,
      avgEnergy,
      crashRisk,
      activeConversations,
      dailyAverages,
      recommendations,
      lowDays,
      daysTracked: dailyAverages.length,
    }
  })
})

// PATCH /api/energy/visibility — toggle energy visibility
energyRouter.patch('/visibility', (req, res) => {
  const userId = (req as any).userId
  const { visible } = req.body
  db.prepare('UPDATE users SET energy_visible = ? WHERE id = ?').run(visible ? 1 : 0, userId)
  res.json({ visible: Boolean(visible) })
})
