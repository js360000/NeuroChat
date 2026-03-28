import { Router } from 'express'
import * as ai from '../ai-provider.js'

export const aiRouter = Router()

// POST /api/ai/explain
aiRouter.post('/explain', async (req, res) => {
  const { message, toneTag, context } = req.body
  try {
    const explanation = await ai.explain(message, toneTag, context)
    res.json({ explanation })
  } catch (err) {
    console.error('AI explain error:', err)
    res.status(500).json({ error: 'AI analysis failed' })
  }
})

// POST /api/ai/suggestions
aiRouter.post('/suggestions', async (req, res) => {
  const { previousMessages } = req.body
  try {
    const result = await ai.suggestions(previousMessages || [])
    res.json(result)
  } catch (err) {
    console.error('AI suggestions error:', err)
    res.status(500).json({ error: 'AI suggestions failed' })
  }
})

// POST /api/ai/summary
aiRouter.post('/summary', async (req, res) => {
  const { messages } = req.body
  try {
    const summary = await ai.summarize(messages || [])
    res.json({ summary })
  } catch (err) {
    console.error('AI summary error:', err)
    res.status(500).json({ error: 'AI summary failed' })
  }
})

// POST /api/ai/rephrase
aiRouter.post('/rephrase', async (req, res) => {
  const { message } = req.body
  if (!message?.trim()) return res.status(400).json({ error: 'message required' })
  try {
    const rephrase = await ai.rephrase(message)
    res.json({ rephrase })
  } catch (err) {
    console.error('AI rephrase error:', err)
    res.status(500).json({ error: 'AI rephrase failed' })
  }
})

// POST /api/ai/compatibility
aiRouter.post('/compatibility', (req, res) => {
  const { user1Interests, user2Interests, user1Traits, user2Traits } = req.body
  const commonInterests = (user1Interests || []).filter((i: string) => (user2Interests || []).includes(i))
  const commonTraits = (user1Traits || []).filter((t: string) => (user2Traits || []).includes(t))
  const total = new Set([...(user1Interests || []), ...(user2Interests || [])]).size

  res.json({
    compatibility: {
      score: total > 0 ? Math.round((commonInterests.length / total) * 100) : 50,
      commonInterests,
      commonTraits,
      analysis: `You share ${commonInterests.length} interests and ${commonTraits.length} traits, suggesting a good foundation for connection.`,
    }
  })
})
