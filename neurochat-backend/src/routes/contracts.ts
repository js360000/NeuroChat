import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import db from '../db.js'

export const contractsRouter = Router()

// GET /api/contracts/:conversationId — get contract for a conversation
contractsRouter.get('/:conversationId', (req, res) => {
  const contract = db.prepare(
    'SELECT * FROM communication_contracts WHERE conversation_id = ? ORDER BY updated_at DESC LIMIT 1'
  ).get(req.params.conversationId) as any

  if (!contract) return res.json({ contract: null })

  res.json({
    contract: {
      id: contract.id,
      conversationId: contract.conversation_id,
      createdBy: contract.created_by,
      rules: JSON.parse(contract.rules || '[]'),
      acceptedBy: JSON.parse(contract.accepted_by || '[]'),
      createdAt: contract.created_at,
      updatedAt: contract.updated_at,
    },
  })
})

// POST /api/contracts — create or update a contract
contractsRouter.post('/', (req, res) => {
  const userId = (req as any).userId
  const { conversationId, rules } = req.body

  if (!conversationId || !Array.isArray(rules)) {
    return res.status(400).json({ error: 'conversationId and rules array required' })
  }

  // Check if contract exists for this conversation
  const existing = db.prepare(
    'SELECT id FROM communication_contracts WHERE conversation_id = ?'
  ).get(conversationId) as any

  const now = new Date().toISOString()

  if (existing) {
    db.prepare(
      'UPDATE communication_contracts SET rules = ?, updated_at = ?, accepted_by = ? WHERE id = ?'
    ).run(JSON.stringify(rules), now, JSON.stringify([userId]), existing.id)
    res.json({ ok: true, id: existing.id })
  } else {
    const id = uuid()
    db.prepare(
      'INSERT INTO communication_contracts (id, conversation_id, created_by, rules, accepted_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, conversationId, userId, JSON.stringify(rules), JSON.stringify([userId]), now, now)
    res.json({ ok: true, id })
  }
})

// POST /api/contracts/:id/accept — accept a contract
contractsRouter.post('/:id/accept', (req, res) => {
  const userId = (req as any).userId
  const contract = db.prepare('SELECT * FROM communication_contracts WHERE id = ?').get(req.params.id) as any
  if (!contract) return res.status(404).json({ error: 'Contract not found' })

  const acceptedBy = JSON.parse(contract.accepted_by || '[]')
  if (!acceptedBy.includes(userId)) {
    acceptedBy.push(userId)
    db.prepare('UPDATE communication_contracts SET accepted_by = ? WHERE id = ?').run(JSON.stringify(acceptedBy), contract.id)
  }

  res.json({ ok: true })
})
