/**
 * WebRTC Signalling Server — Socket.IO based
 *
 * Handles:
 *  - User presence (online/offline tracking)
 *  - Call initiation, acceptance, rejection
 *  - SDP offer/answer exchange
 *  - ICE candidate relay
 *  - Call history recording
 *  - Typing indicators (real-time)
 */

import { Server as IOServer, Socket } from 'socket.io'
import type { Server as HTTPServer } from 'http'
import db from './db.js'
import { v4 as uuid } from 'uuid'

// Map of userId → socketId for online users
const onlineUsers = new Map<string, string>()
// Map of socketId → userId for reverse lookup
const socketToUser = new Map<string, string>()
// Active calls: callId → call metadata
const activeCalls = new Map<string, { id: string; callerId: string; calleeId: string; type: 'voice' | 'video'; startedAt?: string }>()

export function initSignalling(httpServer: HTTPServer) {
  const io = new IOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/socket.io',
  })

  io.on('connection', (socket: Socket) => {
    console.log(`[WS] Client connected: ${socket.id}`)

    // ═══════════════════════════════════════════
    // Presence
    // ═══════════════════════════════════════════

    socket.on('register', (userId: string) => {
      onlineUsers.set(userId, socket.id)
      socketToUser.set(socket.id, userId)
      // Update DB
      db.prepare('UPDATE users SET is_online = 1 WHERE id = ?').run(userId)
      // Broadcast presence
      socket.broadcast.emit('user:online', { userId })
      console.log(`[WS] User registered: ${userId}`)
    })

    socket.on('disconnect', () => {
      const userId = socketToUser.get(socket.id)
      if (userId) {
        onlineUsers.delete(userId)
        socketToUser.delete(socket.id)
        db.prepare('UPDATE users SET is_online = 0 WHERE id = ?').run(userId)
        socket.broadcast.emit('user:offline', { userId })

        // End any active calls this user was in
        for (const [callId, call] of activeCalls) {
          if (call.callerId === userId || call.calleeId === userId) {
            const otherUserId = call.callerId === userId ? call.calleeId : call.callerId
            const otherSocketId = onlineUsers.get(otherUserId)
            if (otherSocketId) {
              io.to(otherSocketId).emit('call:ended', { callId, reason: 'peer_disconnected' })
            }
            endCall(callId, 'ended')
            activeCalls.delete(callId)
          }
        }
      }
      console.log(`[WS] Client disconnected: ${socket.id}`)
    })

    // ═══════════════════════════════════════════
    // Typing indicators
    // ═══════════════════════════════════════════

    socket.on('typing:start', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      socket.broadcast.emit('typing:start', { conversationId, userId })
    })

    socket.on('typing:stop', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      socket.broadcast.emit('typing:stop', { conversationId, userId })
    })

    // ═══════════════════════════════════════════
    // Messages — real-time delivery
    // ═══════════════════════════════════════════

    socket.on('message:new', (data: { conversationId: string; message: any; recipientId: string }) => {
      const recipientSocketId = onlineUsers.get(data.recipientId)
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('message:new', {
          conversationId: data.conversationId,
          message: data.message,
        })
      }
    })

    socket.on('message:read', ({ conversationId, userId, readAt }: { conversationId: string; userId: string; readAt: string }) => {
      // Notify the other participant that messages were read
      const conv = db.prepare('SELECT user1_id, user2_id FROM conversations WHERE id = ?').get(conversationId) as any
      if (!conv) return
      const otherId = conv.user1_id === userId ? conv.user2_id : conv.user1_id
      const otherSocketId = onlineUsers.get(otherId)
      if (otherSocketId) {
        io.to(otherSocketId).emit('message:read', { conversationId, userId, readAt })
      }
    })

    // ═══════════════════════════════════════════
    // Call signalling
    // ═══════════════════════════════════════════

    // Initiate a call
    socket.on('call:initiate', (data: { calleeId: string; type: 'voice' | 'video' }) => {
      const callerId = socketToUser.get(socket.id)
      if (!callerId) return

      const calleeSocketId = onlineUsers.get(data.calleeId)
      if (!calleeSocketId) {
        socket.emit('call:error', { error: 'User is offline' })
        return
      }

      const callId = uuid()
      const call = { id: callId, callerId, calleeId: data.calleeId, type: data.type }
      activeCalls.set(callId, call)

      // Record in DB
      db.prepare('INSERT INTO calls (id, caller_id, callee_id, type, status) VALUES (?, ?, ?, ?, ?)')
        .run(callId, callerId, data.calleeId, data.type, 'ringing')

      // Get caller info for the callee
      const callerUser = db.prepare('SELECT name, avatar FROM users WHERE id = ?').get(callerId) as any

      // Notify callee
      io.to(calleeSocketId).emit('call:incoming', {
        callId,
        callerId,
        callerName: callerUser?.name || 'Unknown',
        callerAvatar: callerUser?.avatar,
        type: data.type,
      })

      // Confirm to caller
      socket.emit('call:initiated', { callId })
      console.log(`[WS] Call ${callId}: ${callerId} → ${data.calleeId} (${data.type})`)
    })

    // Accept a call
    socket.on('call:accept', ({ callId }: { callId: string }) => {
      const call = activeCalls.get(callId)
      if (!call) return

      const userId = socketToUser.get(socket.id)
      if (userId !== call.calleeId) return

      call.startedAt = new Date().toISOString()
      db.prepare('UPDATE calls SET status = ?, started_at = ? WHERE id = ?')
        .run('connected', call.startedAt, callId)

      const callerSocketId = onlineUsers.get(call.callerId)
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:accepted', { callId })
      }
      console.log(`[WS] Call ${callId} accepted`)
    })

    // Decline a call
    socket.on('call:decline', ({ callId }: { callId: string }) => {
      const call = activeCalls.get(callId)
      if (!call) return

      endCall(callId, 'declined')
      activeCalls.delete(callId)

      const callerSocketId = onlineUsers.get(call.callerId)
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:declined', { callId })
      }
      console.log(`[WS] Call ${callId} declined`)
    })

    // End a call (either party)
    socket.on('call:end', ({ callId }: { callId: string }) => {
      const call = activeCalls.get(callId)
      if (!call) return

      const userId = socketToUser.get(socket.id)
      const otherUserId = call.callerId === userId ? call.calleeId : call.callerId
      const otherSocketId = onlineUsers.get(otherUserId)

      endCall(callId, 'ended')
      activeCalls.delete(callId)

      if (otherSocketId) {
        io.to(otherSocketId).emit('call:ended', { callId, reason: 'peer_ended' })
      }
      console.log(`[WS] Call ${callId} ended by ${userId}`)
    })

    // ═══════════════════════════════════════════
    // WebRTC SDP / ICE relay
    // ═══════════════════════════════════════════

    // SDP offer (caller → callee)
    socket.on('webrtc:offer', ({ callId, sdp }: { callId: string; sdp: RTCSessionDescriptionInit }) => {
      const call = activeCalls.get(callId)
      if (!call) return
      const calleeSocketId = onlineUsers.get(call.calleeId)
      if (calleeSocketId) {
        io.to(calleeSocketId).emit('webrtc:offer', { callId, sdp })
      }
    })

    // SDP answer (callee → caller)
    socket.on('webrtc:answer', ({ callId, sdp }: { callId: string; sdp: RTCSessionDescriptionInit }) => {
      const call = activeCalls.get(callId)
      if (!call) return
      const callerSocketId = onlineUsers.get(call.callerId)
      if (callerSocketId) {
        io.to(callerSocketId).emit('webrtc:answer', { callId, sdp })
      }
    })

    // ICE candidate (bidirectional)
    socket.on('webrtc:ice-candidate', ({ callId, candidate }: { callId: string; candidate: RTCIceCandidateInit }) => {
      const call = activeCalls.get(callId)
      if (!call) return
      const userId = socketToUser.get(socket.id)
      const otherUserId = call.callerId === userId ? call.calleeId : call.callerId
      const otherSocketId = onlineUsers.get(otherUserId)
      if (otherSocketId) {
        io.to(otherSocketId).emit('webrtc:ice-candidate', { callId, candidate })
      }
    })
  })

  console.log('[WS] Signalling server initialised')
  return io
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function endCall(callId: string, status: string) {
  const call = activeCalls.get(callId)
  const now = new Date().toISOString()
  let duration = 0
  if (call?.startedAt) {
    duration = Math.round((Date.now() - new Date(call.startedAt).getTime()) / 1000)
  }
  db.prepare('UPDATE calls SET status = ?, ended_at = ?, duration_seconds = ? WHERE id = ?')
    .run(status, now, duration, callId)
}
