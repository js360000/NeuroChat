import OpenAI from 'openai'
import db from './db.js'

// ═══════════════════════════════════════════
// AI Provider — switches between OpenAI GPT 5.4 Mini and heuristic fallback
// Config is read from site_config table, controlled via admin panel
// ═══════════════════════════════════════════

function getConfig(key: string): any {
  const row = db.prepare('SELECT value FROM site_config WHERE key = ?').get(key) as any
  if (!row) return null
  try { return JSON.parse(row.value) } catch { return row.value }
}

function getOpenAIClient(): OpenAI | null {
  const apiKey = getConfig('ai.openai_api_key')
  if (!apiKey) return null
  return new OpenAI({ apiKey })
}

function isAIEnabled(): boolean {
  return getConfig('ai.enabled') === true
}

function getProvider(): 'openai' | 'heuristic' {
  return getConfig('ai.provider') || 'heuristic'
}

function getModel(): string {
  return getConfig('ai.model') || 'gpt-5.4-mini'
}

// ═══════════════════════════════════════════
// Heuristic fallbacks (original logic)
// ═══════════════════════════════════════════

function heuristicExplain(message: string, toneTag?: string) {
  const isQuestion = message?.includes('?')
  const isShort = (message?.length || 0) < 30
  return {
    tone: toneTag === '/j' ? 'Playful / Humorous' : toneTag === '/srs' ? 'Serious / Direct' : toneTag === '/gen' ? 'Genuine / Sincere' : isQuestion ? 'Curious / Inquisitive' : 'Friendly / Casual',
    confidence: toneTag ? 0.92 : isShort ? 0.65 : 0.78,
    hiddenMeanings: isQuestion
      ? ['They seem genuinely interested in your perspective', 'This is likely an invitation to share more']
      : ['The message appears straightforward', 'No obvious hidden subtext detected'],
    suggestions: ['Share something personal in return', 'Ask a follow-up question to show interest', 'Acknowledge what they said before changing topic'],
    socialCues: toneTag === '/j'
      ? ['Light-hearted tone', 'Not meant to be taken literally', 'Playful banter']
      : ['Open body language', 'Engagement signal', 'Comfortable conversation'],
  }
}

function heuristicSuggestions(lastMsg: string) {
  const isQuestion = lastMsg.includes('?')
  return isQuestion
    ? ["That's a great question, let me think...", "I'd say it depends on the context!", "Honestly, I'm not sure but I'd love to explore that"]
    : ["That's really interesting, tell me more!", "I appreciate you sharing that", "I feel the same way about that", "What made you think of that?"]
}

function heuristicSummary(messages: { sender: string; content: string }[]) {
  const count = messages?.length || 0
  const topics = new Set<string>()
  for (const msg of messages || []) {
    const c = (msg.content || '').toLowerCase()
    if (c.includes('music') || c.includes('album')) topics.add('Music')
    if (c.includes('code') || c.includes('typescript')) topics.add('Coding')
    if (c.includes('space') || c.includes('star')) topics.add('Astronomy')
    if (c.includes('game')) topics.add('Gaming')
    if (c.includes('art') || c.includes('design')) topics.add('Creative arts')
  }
  return {
    summary: `This conversation spans ${count} messages and covers a warm, friendly exchange. The tone has been predominantly positive and genuine throughout.`,
    highlights: Array.from(topics).slice(0, 4),
  }
}

function heuristicRephrase(message: string) {
  return {
    gentle: `I wanted to share something with you — ${message.toLowerCase().replace(/^i /i, 'I ')}. I hope that comes across the way I mean it.`,
    direct: message.charAt(0).toUpperCase() + message.slice(1).replace(/\.$/, '') + '.',
  }
}

// ═══════════════════════════════════════════
// OpenAI GPT 5.4 Mini implementations
// ═══════════════════════════════════════════

async function aiExplain(client: OpenAI, model: string, message: string, toneTag?: string, context?: string) {
  const systemPrompt = `You are a neurodivergent-friendly communication assistant. Analyse the following message and return JSON with these fields:
- tone: string (e.g. "Playful / Humorous", "Serious / Direct", "Genuine / Sincere")
- confidence: number 0-1
- hiddenMeanings: string[] (subtle implications or subtext, max 3)
- suggestions: string[] (3 suggested responses)
- socialCues: string[] (3 social cues detected)
Return ONLY valid JSON, no markdown.`

  const userPrompt = `Message: "${message}"${toneTag ? `\nTone tag: ${toneTag}` : ''}${context ? `\nConversation context:\n${context}` : ''}`

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    response_format: { type: 'json_object' },
    max_tokens: 500,
    temperature: 0.7,
  })

  return JSON.parse(response.choices[0].message.content || '{}')
}

async function aiSuggestions(client: OpenAI, model: string, messages: { sender: string; content: string }[]) {
  const lastMsg = messages[messages.length - 1]
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: 'You are a neurodivergent-friendly communication assistant. Generate 3-4 warm, natural reply suggestions. Return JSON: { "suggestions": string[] }' },
      { role: 'user', content: `Last message from ${lastMsg.sender}: "${lastMsg.content}"\nSuggest replies:` },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 300,
    temperature: 0.8,
  })
  return JSON.parse(response.choices[0].message.content || '{"suggestions":[]}')
}

async function aiSummary(client: OpenAI, model: string, messages: { sender: string; content: string }[]) {
  const formatted = messages.map(m => `${m.sender}: ${m.content}`).join('\n')
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: 'Summarise this conversation warmly and concisely. Return JSON: { "summary": string, "highlights": string[] (max 4 key topics) }' },
      { role: 'user', content: formatted },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 400,
    temperature: 0.5,
  })
  return JSON.parse(response.choices[0].message.content || '{}')
}

async function aiRephrase(client: OpenAI, model: string, message: string) {
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: 'Rephrase the message in two styles. Return JSON: { "gentle": string (soft, empathetic version), "direct": string (clear, concise version) }' },
      { role: 'user', content: message },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 300,
    temperature: 0.7,
  })
  return JSON.parse(response.choices[0].message.content || '{}')
}

// ═══════════════════════════════════════════
// Exported provider functions (auto-fallback)
// ═══════════════════════════════════════════

export async function explain(message: string, toneTag?: string, context?: string) {
  if (!isAIEnabled() || getProvider() === 'heuristic') {
    return heuristicExplain(message, toneTag)
  }
  const client = getOpenAIClient()
  if (!client) return heuristicExplain(message, toneTag)
  try {
    return await aiExplain(client, getModel(), message, toneTag, context)
  } catch (err) {
    console.error('OpenAI explain failed, falling back to heuristic:', err)
    return heuristicExplain(message, toneTag)
  }
}

export async function suggestions(messages: { sender: string; content: string }[]) {
  if (!isAIEnabled() || getProvider() === 'heuristic') {
    return { suggestions: heuristicSuggestions(messages[messages.length - 1]?.content || '') }
  }
  const client = getOpenAIClient()
  if (!client) return { suggestions: heuristicSuggestions(messages[messages.length - 1]?.content || '') }
  try {
    return await aiSuggestions(client, getModel(), messages)
  } catch (err) {
    console.error('OpenAI suggestions failed, falling back:', err)
    return { suggestions: heuristicSuggestions(messages[messages.length - 1]?.content || '') }
  }
}

export async function summarize(messages: { sender: string; content: string }[]) {
  if (!isAIEnabled() || getProvider() === 'heuristic') {
    return heuristicSummary(messages)
  }
  const client = getOpenAIClient()
  if (!client) return heuristicSummary(messages)
  try {
    return await aiSummary(client, getModel(), messages)
  } catch (err) {
    console.error('OpenAI summary failed, falling back:', err)
    return heuristicSummary(messages)
  }
}

export async function rephrase(message: string) {
  if (!isAIEnabled() || getProvider() === 'heuristic') {
    return heuristicRephrase(message)
  }
  const client = getOpenAIClient()
  if (!client) return heuristicRephrase(message)
  try {
    return await aiRephrase(client, getModel(), message)
  } catch (err) {
    console.error('OpenAI rephrase failed, falling back:', err)
    return heuristicRephrase(message)
  }
}
