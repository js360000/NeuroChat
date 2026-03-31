import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import db from './db.js'
import { messagesRouter } from './routes/messages.js'
import { communityRouter } from './routes/community.js'
import { profileRouter } from './routes/profile.js'
import { discoverRouter } from './routes/discover.js'
import { preferencesRouter } from './routes/preferences.js'
import { aiRouter } from './routes/ai.js'
import { adminRouter } from './routes/admin.js'
import { callsRouter } from './routes/calls.js'
import { energyRouter } from './routes/energy.js'
import { roomsRouter } from './routes/rooms.js'
import { venuesRouter } from './routes/venues.js'
import { safetyAlertsRouter } from './routes/safety-alerts.js'
import { supportersRouter } from './routes/supporters.js'
import { authRouter, JWT_SECRET } from './routes/auth.js'
import { moderationRouter } from './routes/moderation.js'
import { uploadsRouter } from './routes/uploads.js'
import { contactsRouter } from './routes/contacts.js'
import { contractsRouter } from './routes/contracts.js'
import { isUserBanned } from './moderation.js'
import { initSignalling } from './signalling.js'
import jwt from 'jsonwebtoken'

const app = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' })) // Increased for base64 image payloads

// Auth routes (no token required)
app.use('/api/auth', authRouter)

// JWT auth middleware — skip for public routes
const PUBLIC_PATHS = ['/api/auth', '/api/health']
app.use('/api', (req, res, next) => {
  if (PUBLIC_PATHS.some(p => req.path.startsWith(p.replace('/api', '')))) return next()

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: string }
    ;(req as any).userId = payload.userId
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
})

// Ban check middleware — blocks banned users from non-admin routes
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/admin')) return next()
  const userId = (req as any).userId
  if (!userId) return next()
  const banCheck = isUserBanned(userId)
  if (banCheck.banned) {
    return res.status(403).json({ error: 'Account suspended', reason: banCheck.reason, expiresAt: banCheck.expiresAt })
  }
  next()
})

// Routes
app.use('/api/messages', messagesRouter)
app.use('/api/community', communityRouter)
app.use('/api/user', profileRouter)
app.use('/api/discover', discoverRouter)
app.use('/api/user/preferences', preferencesRouter)
app.use('/api/ai', aiRouter)
app.use('/api/admin', adminRouter)
app.use('/api/calls', callsRouter)
app.use('/api/energy', energyRouter)
app.use('/api/rooms', roomsRouter)
app.use('/api/venues', venuesRouter)
app.use('/api/safety', safetyAlertsRouter)
app.use('/api/supporters', supportersRouter)
app.use('/api/users', moderationRouter)
app.use('/api/uploads', uploadsRouter)
app.use('/api/contacts', contactsRouter)
app.use('/api/contracts', contractsRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Initialise WebRTC signalling over Socket.IO
initSignalling(httpServer)

// Auto-seed if DB is empty
const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count
if (userCount === 0) {
  console.log('Empty database detected, running seed...')
  await import('./seed.js')
}

// Use httpServer.listen (not app.listen) so Socket.IO shares the same port
httpServer.listen(PORT, () => {
  console.log(`NeuroChat API + WebSocket signalling running on http://localhost:${PORT}`)
})
