// Phone number utilities — E.164 validation, SHA-256 hashing, display formatting

const E164_REGEX = /^\+[1-9]\d{1,14}$/

export function isValidE164(value: string): boolean {
  return E164_REGEX.test(value)
}

/** Normalize raw input to E.164 — returns null if not valid */
export function formatE164(raw: string): string | null {
  const cleaned = raw.replace(/[\s\-().]/g, '')
  if (isValidE164(cleaned)) return cleaned
  // If starts with 0 and is ~11 digits, assume UK and prefix +44
  if (/^0\d{10}$/.test(cleaned)) return '+44' + cleaned.slice(1)
  return null
}

/** SHA-256 hash of an E.164 phone number using Web Crypto API */
export async function hashPhoneNumber(e164: string): Promise<string> {
  const encoded = new TextEncoder().encode(e164)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Pretty-print an E.164 number for display */
export function formatPhoneDisplay(e164: string): string {
  if (!e164) return ''
  // UK: +44 7XXX XXX XXX
  if (e164.startsWith('+44') && e164.length === 13) {
    return `+44 ${e164.slice(3, 7)} ${e164.slice(7, 10)} ${e164.slice(10)}`
  }
  // US: +1 (XXX) XXX-XXXX
  if (e164.startsWith('+1') && e164.length === 12) {
    return `+1 (${e164.slice(2, 5)}) ${e164.slice(5, 8)}-${e164.slice(8)}`
  }
  // Generic: insert space after country code
  return e164.replace(/^(\+\d{1,3})(\d+)$/, '$1 $2')
}

/** Detect if input looks like a phone number (starts with + or all digits) */
export function looksLikePhoneNumber(input: string): boolean {
  const trimmed = input.trim()
  return trimmed.startsWith('+') || /^\d{7,}$/.test(trimmed.replace(/[\s\-()]/g, ''))
}
