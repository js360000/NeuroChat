import { Router } from 'express'
import db from '../db.js'

export const callsRouter = Router()

// GET /api/calls/history — get call history for current user
callsRouter.get('/history', (req, res) => {
  const userId = (req as any).userId

  const rows = db.prepare(`
    SELECT c.*,
      caller.name as caller_name, caller.avatar as caller_avatar,
      callee.name as callee_name, callee.avatar as callee_avatar
    FROM calls c
    JOIN users caller ON c.caller_id = caller.id
    JOIN users callee ON c.callee_id = callee.id
    WHERE c.caller_id = ? OR c.callee_id = ?
    ORDER BY c.created_at DESC
    LIMIT 50
  `).all(userId, userId) as any[]

  const calls = rows.map(r => ({
    id: r.id,
    type: r.type,
    status: r.status,
    isOutgoing: r.caller_id === userId,
    peer: {
      id: r.caller_id === userId ? r.callee_id : r.caller_id,
      name: r.caller_id === userId ? r.callee_name : r.caller_name,
      avatar: r.caller_id === userId ? r.callee_avatar : r.caller_avatar,
    },
    startedAt: r.started_at,
    endedAt: r.ended_at,
    durationSeconds: r.duration_seconds,
    createdAt: r.created_at,
  }))

  res.json({ calls })
})

// GET /api/calls/active — check if there's an active call for the user
callsRouter.get('/active', (req, res) => {
  const userId = (req as any).userId

  const row = db.prepare(`
    SELECT c.*, caller.name as caller_name, callee.name as callee_name
    FROM calls c
    JOIN users caller ON c.caller_id = caller.id
    JOIN users callee ON c.callee_id = callee.id
    WHERE (c.caller_id = ? OR c.callee_id = ?)
    AND c.status IN ('ringing', 'connecting', 'connected')
    ORDER BY c.created_at DESC LIMIT 1
  `).get(userId, userId) as any

  if (!row) return res.json({ activeCall: null })

  res.json({
    activeCall: {
      id: row.id,
      type: row.type,
      status: row.status,
      isOutgoing: row.caller_id === userId,
      peerName: row.caller_id === userId ? row.callee_name : row.caller_name,
      createdAt: row.created_at,
    }
  })
})

// GET /api/calls/ice-servers — return TURN/STUN config
// In production, generate short-lived TURN credentials here
callsRouter.get('/ice-servers', (_req, res) => {
  res.json({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      // In production, add TURN servers with short-lived credentials:
      // { urls: 'turn:turn.example.com:3478', username: '<generated>', credential: '<generated>' }
    ]
  })
})
