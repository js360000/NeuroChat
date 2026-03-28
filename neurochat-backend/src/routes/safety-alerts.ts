import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import db from '../db.js'

export const safetyAlertsRouter = Router()

// Manipulation pattern detection heuristics
const MANIPULATION_PATTERNS = {
  love_bombing: {
    patterns: [
      /you'?re (?:the only|my everything|so special|perfect|amazing)/i,
      /i'?ve never (?:felt this way|met anyone like you)/i,
      /soul ?mate|destiny|meant to be|love at first/i,
      /i (?:need|can'?t live without) you/i,
    ],
    threshold: 3, // messages matching within window
    windowHours: 24,
    severity: 'warning' as const,
  },
  isolation: {
    patterns: [
      /(?:don'?t|shouldn'?t) (?:talk to|tell|trust) (?:them|anyone|your friends|your family)/i,
      /(?:they|everyone) (?:don'?t|doesn'?t) (?:understand|care about) you/i,
      /(?:only|just) (?:i|me) (?:understand|care|get) you/i,
      /(?:keep this|it'?s our) secret/i,
    ],
    threshold: 2,
    windowHours: 48,
    severity: 'critical' as const,
  },
  urgency: {
    patterns: [
      /(?:right now|immediately|hurry|urgent|quick|asap|before it'?s too late)/i,
      /(?:don'?t|can'?t) (?:wait|think about it|take time)/i,
      /(?:time is running out|last chance|now or never)/i,
    ],
    threshold: 3,
    windowHours: 6,
    severity: 'warning' as const,
  },
  financial: {
    patterns: [
      /(?:send|transfer|wire|give) (?:me |)(?:money|\$|£|€|cash|funds|bitcoin|crypto)/i,
      /(?:bank|account|routing|sort ?code) (?:number|details|info)/i,
      /(?:invest|loan|lend|borrow)/i,
      /(?:gift ?card|voucher|paypal|venmo|cash ?app)/i,
      // Card numbers: 13-19 digit sequences (Visa, Mastercard, Amex, etc.)
      /\b(?:\d[ -]*?){13,19}\b/,
      // Sort codes (UK): 6 digits in XX-XX-XX format
      /\b\d{2}[- ]\d{2}[- ]\d{2}\b/,
      // Account numbers: 8 digits preceded by context words
      /(?:account|acc|a\/c)[\s:]*\d{6,10}/i,
      // CVV / CVC / security code
      /(?:cvv|cvc|security code|csv)[\s:]*\d{3,4}/i,
      // Expiry dates on cards
      /(?:expir|exp)[\s:]*\d{2}\s*\/\s*\d{2,4}/i,
    ],
    threshold: 1,
    windowHours: 168, // 7 days
    severity: 'critical' as const,
  },
  authority: {
    patterns: [
      /(?:i'?m|i am) (?:a |an? )(?:doctor|lawyer|police|officer|staff|admin|moderator)/i,
      /(?:you (?:have to|must|need to)|it'?s (?:the |)(?:law|rules|required))/i,
    ],
    threshold: 2,
    windowHours: 48,
    severity: 'warning' as const,
  },
  grooming: {
    patterns: [
      /(?:how old|what'?s your age|you look (?:young|mature))/i,
      /(?:don'?t tell|secret between us|our little secret)/i,
      /(?:send|show) (?:me |a )(?:picture|photo|pic|selfie|video)/i,
      /(?:where do you|what'?s your address|come (?:over|to my|visit))/i,
      /(?:are you (?:home |)alone|when are.*parents)/i,
    ],
    threshold: 2,
    windowHours: 72,
    severity: 'critical' as const,
  },
  phone_sharing: {
    patterns: [
      // Requesting phone number
      /(?:what'?s|give me|send me|share) (?:your |)(?:phone|number|mobile|cell|whatsapp|telegram|signal)/i,
      /(?:call|text|message) (?:me|you) (?:on|at|outside|off)/i,
      // Phone number patterns (UK, US, international)
      /\b(?:\+?\d{1,3}[\s-]?)?\(?\d{2,5}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}\b/,
      // Moving off-platform urgency
      /(?:talk|chat|move|continue|switch) (?:on|to|over to) (?:whatsapp|telegram|signal|snapchat|insta(?:gram)?|phone|text)/i,
      /(?:this app|here) (?:is|isn'?t) (?:not safe|monitored|watching|tracking)/i,
    ],
    threshold: 1,
    windowHours: 48,
    severity: 'warning' as const,
  },
}

// Analyse a batch of messages for manipulation patterns
function analyseMessages(messages: any[], userId: string, conversationId: string) {
  const alerts: any[] = []

  for (const [alertType, config] of Object.entries(MANIPULATION_PATTERNS)) {
    const windowStart = new Date(Date.now() - config.windowHours * 60 * 60 * 1000).toISOString()
    const recentMessages = messages.filter(m => m.sender_id !== userId && m.created_at >= windowStart)

    let matchCount = 0
    const matchedIds: string[] = []

    for (const msg of recentMessages) {
      for (const pattern of config.patterns) {
        if (pattern.test(msg.content)) {
          matchCount++
          if (!matchedIds.includes(msg.id)) matchedIds.push(msg.id)
          break
        }
      }
    }

    if (matchCount >= config.threshold) {
      // Check if we already have an unacknowledged alert of this type recently
      const existing = db.prepare(`
        SELECT id FROM safety_alerts
        WHERE user_id = ? AND conversation_id = ? AND alert_type = ? AND acknowledged = 0
        AND created_at >= datetime('now', '-24 hours')
      `).get(userId, conversationId, alertType) as any

      if (!existing) {
        const id = uuid()
        const descriptions: Record<string, string> = {
          love_bombing: 'This person may be love-bombing — using excessive flattery and declarations unusually quickly. Take your time.',
          isolation: 'This person may be trying to isolate you from your support network. Healthy connections don\'t ask you to cut others off.',
          urgency: 'This person is creating urgency to pressure you into decisions. You always have time to think.',
          financial: 'This person has mentioned money or financial details. Never share financial information with someone you\'ve just met online.',
          authority: 'This person is claiming authority to influence your behaviour. Verify any claims independently.',
          grooming: 'Some messages in this conversation match patterns associated with grooming behaviour. Please be cautious about sharing personal details.',
          phone_sharing: 'Someone is asking you to share your phone number or move to a different platform. Be cautious about sharing contact details with people you don\'t know well.',
        }

        db.prepare(`
          INSERT INTO safety_alerts (id, user_id, conversation_id, alert_type, severity, description, message_ids)
          VALUES (?,?,?,?,?,?,?)
        `).run(id, userId, conversationId, alertType, config.severity, descriptions[alertType] || '', JSON.stringify(matchedIds))

        alerts.push({ id, alertType, severity: config.severity, description: descriptions[alertType] })

        // Notify supporter if applicable
        const supporter = db.prepare(`
          SELECT * FROM trusted_supporters
          WHERE user_id = ? AND safeguarding_level IN ('supported','protected')
        `).get(userId) as any

        if (supporter) {
          db.prepare('UPDATE safety_alerts SET notified_supporter = 1 WHERE id = ?').run(id)
        }
      }
    }
  }

  return alerts
}

// POST /api/safety/scan — scan a conversation for manipulation
safetyAlertsRouter.post('/scan', (req, res) => {
  const userId = (req as any).userId
  const { conversationId } = req.body
  if (!conversationId) return res.status(400).json({ error: 'conversationId required' })

  const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 200').all(conversationId)
  const alerts = analyseMessages(messages, userId, conversationId)

  res.json({ alerts, scannedCount: messages.length })
})

// GET /api/safety/alerts — get user's unacknowledged alerts
safetyAlertsRouter.get('/alerts', (req, res) => {
  const userId = (req as any).userId
  const alerts = db.prepare('SELECT * FROM safety_alerts WHERE user_id = ? AND acknowledged = 0 ORDER BY created_at DESC').all(userId)
  res.json({ alerts })
})

// POST /api/safety/alerts/:id/acknowledge
safetyAlertsRouter.post('/alerts/:id/acknowledge', (req, res) => {
  const userId = (req as any).userId
  db.prepare('UPDATE safety_alerts SET acknowledged = 1 WHERE id = ? AND user_id = ?').run(req.params.id, userId)
  res.json({ ok: true })
})

// GET /api/safety/gut-check/:conversationId — AI-style conversation summary
safetyAlertsRouter.get('/gut-check/:conversationId', (req, res) => {
  const userId = (req as any).userId
  const conversationId = req.params.conversationId
  const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conversationId) as any[]

  if (messages.length === 0) return res.json({ summary: null })

  const otherMessages = messages.filter(m => m.sender_id !== userId)
  const myMessages = messages.filter(m => m.sender_id === userId)

  // Simple heuristic analysis
  const totalOther = otherMessages.length
  const totalMine = myMessages.length
  const ratio = totalOther > 0 ? totalMine / totalOther : 0
  const avgOtherLength = totalOther > 0 ? Math.round(otherMessages.reduce((s, m) => s + m.content.length, 0) / totalOther) : 0
  const firstMessage = messages[0]
  const lastMessage = messages[messages.length - 1]
  const durationHours = (new Date(lastMessage.created_at).getTime() - new Date(firstMessage.created_at).getTime()) / (1000 * 60 * 60)

  const flags: string[] = []
  if (ratio < 0.3 && totalOther > 10) flags.push('This person is sending far more messages than you — the conversation feels one-sided.')
  if (avgOtherLength > 500) flags.push('Their messages are unusually long — this can be a tactic to overwhelm.')
  if (durationHours < 24 && totalOther > 30) flags.push('This conversation is moving very quickly. There\'s no rush — take your time.')
  if (durationHours < 48 && otherMessages.some(m => /love|forever|soul|destiny/i.test(m.content))) {
    flags.push('Emotional language is appearing very early. Healthy connections build trust gradually.')
  }
  if (otherMessages.some(m => /(?:card|account|sort ?code|bank|routing)\s*(?:number|details|info)/i.test(m.content) || /\b(?:\d[ -]*?){13,19}\b/.test(m.content))) {
    flags.push('Financial details like card or account numbers have been mentioned. Never share these with someone online.')
  }
  if (otherMessages.some(m => /(?:what'?s|give me|send) (?:your |)(?:phone|number|mobile|whatsapp|telegram)/i.test(m.content) || /(?:talk|move|switch) (?:on|to|over to) (?:whatsapp|telegram|signal|snapchat)/i.test(m.content))) {
    flags.push('This person is asking for your phone number or trying to move you off-platform. Keep conversations here where safety features protect you.')
  }

  res.json({
    summary: {
      messageCount: messages.length,
      durationHours: Math.round(durationHours),
      balanceRatio: Math.round(ratio * 100) / 100,
      avgResponseLength: avgOtherLength,
      flags,
      verdict: flags.length === 0 ? 'No concerns detected. This conversation looks healthy.' : `${flags.length} thing${flags.length > 1 ? 's' : ''} to be aware of.`,
    }
  })
})

export { analyseMessages }
