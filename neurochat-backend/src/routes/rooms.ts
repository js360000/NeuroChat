import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import db from '../db.js'

export const roomsRouter = Router()

function formatRoom(room: any) {
  const participants = db.prepare(`
    SELECT rp.*, u.name, u.avatar, u.pronouns FROM room_participants rp
    JOIN users u ON u.id = rp.user_id
    WHERE rp.room_id = ?
  `).all(room.id)

  return {
    id: room.id,
    name: room.name,
    activity: room.activity,
    roomType: room.room_type || 'together',
    interestTag: room.interest_tag || null,
    description: room.description || null,
    allowChat: Boolean(room.allow_chat),
    createdBy: room.created_by,
    maxParticipants: room.max_participants,
    isActive: Boolean(room.is_active),
    createdAt: room.created_at,
    participants: participants.map((p: any) => ({
      userId: p.user_id,
      name: p.name,
      avatar: p.avatar,
      pronouns: p.pronouns,
      status: p.status,
      activity: p.activity,
      joinedAt: p.joined_at,
    })),
  }
}

// GET /api/rooms — list active rooms (optional ?type=together|interest&tag=...)
roomsRouter.get('/', (req, res) => {
  const roomType = (req.query.type as string) || null
  const tag = (req.query.tag as string) || null

  let sql = 'SELECT * FROM together_rooms WHERE is_active = 1'
  const params: any[] = []
  if (roomType) { sql += ' AND room_type = ?'; params.push(roomType) }
  if (tag) { sql += ' AND interest_tag = ?'; params.push(tag) }
  sql += ' ORDER BY created_at DESC'

  const rooms = db.prepare(sql).all(...params)
  res.json({ rooms: rooms.map(formatRoom) })
})

// POST /api/rooms — create room
roomsRouter.post('/', (req, res) => {
  const userId = (req as any).userId
  const { name, activity, maxParticipants, roomType, interestTag, description, allowChat } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Room name required' })

  const id = uuid()
  db.prepare('INSERT INTO together_rooms (id, name, activity, created_by, max_participants, room_type, interest_tag, description, allow_chat) VALUES (?,?,?,?,?,?,?,?,?)').run(
    id, name.trim(), activity || null, userId, maxParticipants || 6,
    roomType || 'together', interestTag || null, description || null, allowChat ? 1 : 0
  )
  // Auto-join creator
  db.prepare('INSERT INTO room_participants (room_id, user_id, status, activity) VALUES (?,?,?,?)').run(id, userId, 'present', activity || null)

  const room = db.prepare('SELECT * FROM together_rooms WHERE id = ?').get(id)
  res.json({ room: formatRoom(room) })
})

// POST /api/rooms/:id/join
roomsRouter.post('/:id/join', (req, res) => {
  const userId = (req as any).userId
  const room = db.prepare('SELECT * FROM together_rooms WHERE id = ? AND is_active = 1').get(req.params.id) as any
  if (!room) return res.status(404).json({ error: 'Room not found' })

  const count = (db.prepare('SELECT COUNT(*) as c FROM room_participants WHERE room_id = ?').get(room.id) as any).c
  if (count >= room.max_participants) return res.status(400).json({ error: 'Room is full' })

  db.prepare('INSERT OR REPLACE INTO room_participants (room_id, user_id, status) VALUES (?,?,?)').run(room.id, userId, 'present')
  res.json({ room: formatRoom(room) })
})

// POST /api/rooms/:id/leave
roomsRouter.post('/:id/leave', (req, res) => {
  const userId = (req as any).userId
  db.prepare('DELETE FROM room_participants WHERE room_id = ? AND user_id = ?').run(req.params.id, userId)

  // If no participants left, deactivate room
  const count = (db.prepare('SELECT COUNT(*) as c FROM room_participants WHERE room_id = ?').get(req.params.id) as any).c
  if (count === 0) {
    db.prepare('UPDATE together_rooms SET is_active = 0 WHERE id = ?').run(req.params.id)
  }
  res.json({ ok: true })
})

// PATCH /api/rooms/:id/status — update your status in a room
roomsRouter.patch('/:id/status', (req, res) => {
  const userId = (req as any).userId
  const { status, activity } = req.body
  const validStatuses = ['present', 'away', 'focused', 'resting']
  if (status && !validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' })

  if (status) db.prepare('UPDATE room_participants SET status = ? WHERE room_id = ? AND user_id = ?').run(status, req.params.id, userId)
  if (activity !== undefined) db.prepare('UPDATE room_participants SET activity = ? WHERE room_id = ? AND user_id = ?').run(activity, req.params.id, userId)

  const room = db.prepare('SELECT * FROM together_rooms WHERE id = ?').get(req.params.id)
  res.json({ room: formatRoom(room) })
})
