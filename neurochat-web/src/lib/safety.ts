/**
 * Client-side safety utilities — PII detection, NSFW word filter, content warnings.
 * Ported from NeuroNest's lib/safety.ts and extended.
 */

export interface SafetyWarning {
  type: 'credit_card' | 'phone' | 'email' | 'nsfw'
  message: string
  matches: string[]
}

// ═══════════════════════════════════════════
// Luhn check for credit card detection
// ═══════════════════════════════════════════

function luhnCheck(value: string): boolean {
  let sum = 0
  let shouldDouble = false
  for (let i = value.length - 1; i >= 0; i--) {
    let digit = Number(value[i])
    if (Number.isNaN(digit)) return false
    if (shouldDouble) { digit *= 2; if (digit > 9) digit -= 9 }
    sum += digit
    shouldDouble = !shouldDouble
  }
  return sum % 10 === 0
}

function uniqueMatches(matches: string[] | null): string[] {
  if (!matches) return []
  return Array.from(new Set(matches.map((m) => m.trim()))).filter(Boolean)
}

// ═══════════════════════════════════════════
// NSFW / harmful content word list (client-side pre-check)
// The backend keyword_flags table handles server-side enforcement
// This is an additional client-side layer for instant feedback
// ═══════════════════════════════════════════

const NSFW_PATTERNS = [
  // Slurs and hate speech patterns (intentionally minimal — server-side is the real filter)
  /\bn[i1]gg[ae3]r?\b/i,
  /\bf[a4]gg?[o0]t\b/i,
  /\br[e3]t[a4]rd\b/i,
  /\btr[a4]nn[yi1e3]\b/i,
  /\bk[i1]ll\s*(your|my|him|her|them)self\b/i,
  /\bsu[i1]c[i1]de\b.*\b(method|how|way)\b/i,
]

// ═══════════════════════════════════════════
// Main scanner
// ═══════════════════════════════════════════

export function scanTextForWarnings(text: string): SafetyWarning[] {
  const warnings: SafetyWarning[] = []

  // Credit card detection (Luhn-validated)
  const cardCandidateRegex = /(?:\d[ -]*?){13,19}/g
  const cardCandidates = uniqueMatches(text.match(cardCandidateRegex))
    .map((m) => m.replace(/\D/g, ''))
    .filter((d) => d.length >= 13 && d.length <= 19)
    .filter(luhnCheck)

  if (cardCandidates.length > 0) {
    warnings.push({
      type: 'credit_card',
      message: 'This looks like a credit card number. Remove it before sharing.',
      matches: cardCandidates,
    })
  }

  // Phone number detection
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g
  const phoneMatches = uniqueMatches(text.match(phoneRegex))
  if (phoneMatches.length > 0) {
    warnings.push({
      type: 'phone',
      message: 'This looks like a phone number. Only share if you trust the recipient.',
      matches: phoneMatches,
    })
  }

  // Email detection
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const emailMatches = uniqueMatches(text.match(emailRegex))
  if (emailMatches.length > 0) {
    warnings.push({
      type: 'email',
      message: 'This contains an email address. Be careful sharing personal contact info.',
      matches: emailMatches,
    })
  }

  // NSFW / harmful content
  const nsfwMatches: string[] = []
  for (const pattern of NSFW_PATTERNS) {
    const match = text.match(pattern)
    if (match) nsfwMatches.push(match[0])
  }
  if (nsfwMatches.length > 0) {
    warnings.push({
      type: 'nsfw',
      message: 'This message contains content that may violate community guidelines.',
      matches: nsfwMatches,
    })
  }

  return warnings
}

/**
 * Quick check — returns true if content has any safety issues
 */
export function hasWarnings(text: string): boolean {
  return scanTextForWarnings(text).length > 0
}

/**
 * Format warnings for display in a toast or dialog
 */
export function formatWarnings(warnings: SafetyWarning[]): string {
  return warnings.map((w) => `⚠️ ${w.message}`).join('\n')
}
