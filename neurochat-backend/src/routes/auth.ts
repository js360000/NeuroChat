import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import db from '../db.js'

export const authRouter = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'neurochat-dev-secret'
const TOKEN_EXPIRY = '7d'

function signToken(userId: string, email: string) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

// POST /api/auth/register
authRouter.post('/register', (req, res) => {
  const { email, password, displayName } = req.body
  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'Email, password, and display name are required' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' })
  }

  const id = uuid()
  const passwordHash = bcrypt.hashSync(password, 10)

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, joined_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(id, displayName, email, passwordHash)

  const token = signToken(id, email)
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any

  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    },
  })
})

// POST /api/auth/login
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any
  if (!user || !user.password_hash) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = signToken(user.id, user.email)

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    },
  })
})

// GET /api/auth/me
authRouter.get('/me', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: string }
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId) as any
    if (!user) return res.status(404).json({ error: 'User not found' })

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        pronouns: user.pronouns,
        bio: user.bio,
        aacMode: user.aac_mode,
        aacLevel: user.aac_level,
        onboardingCompleted: Boolean(user.onboarding_completed),
      },
    })
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
})

export { JWT_SECRET }
