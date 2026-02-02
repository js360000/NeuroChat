export interface SafetyWarning {
  type: 'credit_card' | 'phone';
  message: string;
  matches: string[];
}

function luhnCheck(value: string): boolean {
  let sum = 0;
  let shouldDouble = false;

  for (let i = value.length - 1; i >= 0; i -= 1) {
    let digit = Number(value[i]);
    if (Number.isNaN(digit)) {
      return false;
    }
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function uniqueMatches(matches: string[] | null): string[] {
  if (!matches) return [];
  return Array.from(new Set(matches.map((match) => match.trim()))).filter(Boolean);
}

export function scanTextForWarnings(text: string): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];
  const cardCandidateRegex = /(?:\d[ -]*?){13,19}/g;
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g;

  const cardCandidates = uniqueMatches(text.match(cardCandidateRegex))
    .map((match) => match.replace(/\D/g, ''))
    .filter((digits) => digits.length >= 13 && digits.length <= 19)
    .filter((digits) => luhnCheck(digits));

  if (cardCandidates.length > 0) {
    warnings.push({
      type: 'credit_card',
      message: 'This looks like a credit card number. Consider removing it before sharing.',
      matches: cardCandidates
    });
  }

  const phoneMatches = uniqueMatches(text.match(phoneRegex));
  if (phoneMatches.length > 0) {
    warnings.push({
      type: 'phone',
      message: 'This looks like a phone number. Only share if you trust the recipient.',
      matches: phoneMatches
    });
  }

  return warnings;
}
