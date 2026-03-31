import { Router } from 'express'
import db from '../db.js'
import { v4 as uuid } from 'uuid'
import { scanContent } from '../moderation.js'
import { isBlocked } from './moderation.js'

export const messagesRouter = Router()

function formatUser(row: any) {
  return {
    id: row.id ?? row.user_id,
    name: row.name ?? row.user_name,
    pronouns: row.pronouns ?? row.user_pronouns,
    avatar: row.avatar ?? row.user_avatar,
    isOnline: Boolean(row.is_online ?? row.user_online),
    bio: row.bio,
    interests: row.interests ? JSON.parse(row.interests) : [],
    commStyle: row.comm_style,
  }
}

// GET /api/messages/conversations
messagesRouter.get('/conversations', (req, res) => {
  const userId = (req as any).userId

  const rows = db.prepare(`
    SELECT c.id as conv_id, c.updated_at,
      u.id as user_id, u.name as user_name, u.pronouns as user_pronouns,
      u.avatar as user_avatar, u.is_online as user_online,
      m.id as msg_id, m.content as msg_content, m.tone_tag as msg_tone,
      m.created_at as msg_created, m.sender_id as msg_sender,
      (SELECT COUNT(*) FROM messages m2
       WHERE m2.conversation_id = c.id
       AND m2.sender_id != ?
       AND m2.created_at > COALESCE(
         (SELECT MAX(m3.created_at) FROM messages m3
          WHERE m3.conversation_id = c.id AND m3.sender_id = ?), '1970-01-01'
       )
      ) as unread_count
    FROM conversations c
    JOIN users u ON (CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END) = u.id
    LEFT JOIN messages m ON m.id = (
      SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1
    )
    WHERE (c.user1_id = ? OR c.user2_id = ?)
      AND u.id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = ?)
      AND u.id NOT IN (SELECT blocker_id FROM user_blocks WHERE blocked_id = ?)
    ORDER BY c.updated_at DESC
  `).all(userId, userId, userId, userId, userId, userId, userId) as any[]

  const conversations = rows.map((row) => {
    const sender = row.msg_sender === userId
      ? { id: userId, name: 'You' }
      : { id: row.user_id, name: row.user_name }

    return {
      id: row.conv_id,
      user: {
        id: row.user_id,
        name: row.user_name,
        pronouns: row.user_pronouns,
        avatar: row.user_avatar,
        isOnline: Boolean(row.user_online),
      },
      lastMessage: row.msg_id ? {
        id: row.msg_id,
        content: row.msg_content,
        toneTag: row.msg_tone,
        sender,
        createdAt: row.msg_created,
        isMe: row.msg_sender === userId,
      } : undefined,
      unreadCount: row.unread_count || 0,
      updatedAt: row.updated_at,
    }
  })

  res.json({ conversations })
})

// GET /api/messages/conversations/:id
messagesRouter.get('/conversations/:id', (req, res) => {
  const userId = (req as any).userId
  const convId = req.params.id

  const rows = db.prepare(`
    SELECT m.id, m.content, m.tone_tag, m.created_at, m.sender_id,
      u.name as sender_name, u.pronouns as sender_pronouns, u.avatar as sender_avatar, u.is_online as sender_online
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = ?
    ORDER BY m.created_at ASC
  `).all(convId) as any[]

  const messages = rows.map((row) => ({
    id: row.id,
    content: row.content,
    toneTag: row.tone_tag,
    sender: {
      id: row.sender_id,
      name: row.sender_name,
      pronouns: row.sender_pronouns,
      avatar: row.sender_avatar,
      isOnline: Boolean(row.sender_online),
    },
    createdAt: row.created_at,
    isMe: row.sender_id === userId,
  }))

  res.json({ messages })
})

// POST /api/messages/conversations — get or create a conversation with a user
messagesRouter.post('/conversations', (req, res) => {
  const userId = (req as any).userId
  const { userId: targetId } = req.body

  if (!targetId) return res.status(400).json({ error: 'userId required' })
  if (targetId === userId) return res.status(400).json({ error: 'Cannot start a conversation with yourself' })

  // Verify target user exists
  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId) as any
  if (!targetUser) return res.status(404).json({ error: 'User not found' })

  // Block check
  if (isBlocked(userId, targetId)) {
    return res.status(403).json({ error: 'Cannot message this user' })
  }

  // Check for existing conversation (either direction)
  let conv = db.prepare(
    'SELECT * FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)'
  ).get(userId, targetId, targetId, userId) as any

  if (!conv) {
    const convId = uuid()
    const now = new Date().toISOString()
    db.prepare('INSERT INTO conversations (id, user1_id, user2_id, updated_at) VALUES (?, ?, ?, ?)').run(convId, userId, targetId, now)
    conv = { id: convId, user1_id: userId, user2_id: targetId, updated_at: now }
  }

  res.json({
    conversation: {
      id: conv.id,
      user: formatUser(targetUser),
      updatedAt: conv.updated_at,
    },
  })
})

// POST /api/messages
messagesRouter.post('/', (req, res) => {
  const userId = (req as any).userId
  const { conversationId, content, toneTag } = req.body

  if (!conversationId || !content?.trim()) {
    return res.status(400).json({ error: 'conversationId and content required' })
  }

  // Block check — find other user in conversation
  const conv = db.prepare('SELECT user1_id, user2_id FROM conversations WHERE id = ?').get(conversationId) as any
  if (conv) {
    const otherId = conv.user1_id === userId ? conv.user2_id : conv.user1_id
    if (isBlocked(userId, otherId)) {
      return res.status(403).json({ error: 'Cannot send messages to this user' })
    }
  }

  // Keyword moderation scan
  const modResult = scanContent(userId, content, 'message')
  if (modResult.banned) {
    return res.status(403).json({ error: 'Account suspended due to content violation', violations: modResult.violations })
  }

  const msgId = uuid()
  const now = new Date().toISOString()

  db.prepare(`INSERT INTO messages (id, conversation_id, sender_id, content, tone_tag, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(msgId, conversationId, userId, content.trim(), toneTag || null, now)

  db.prepare(`UPDATE conversations SET updated_at = ? WHERE id = ?`)
    .run(now, conversationId)

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any

  res.json({
    message: {
      id: msgId,
      content: content.trim(),
      toneTag: toneTag || undefined,
      sender: formatUser(user),
      createdAt: now,
      isMe: true,
    }
  })
})

// POST /api/messages/conversations/:id/read
messagesRouter.post('/conversations/:id/read', (_req, res) => {
  // In a real app, update a read cursor. For now just acknowledge.
  res.json({ ok: true })
})

// DELETE /api/messages/:id
messagesRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})
