import { useState } from 'react';

export type CurrencyCode = 'USD' | 'GBP';

interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  rate: number; // multiplier from USD base prices
}

const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', rate: 1 },
  GBP: { code: 'GBP', symbol: '£', rate: 0.79 },
};

/**
 * Auto-detect whether the user is likely in the UK based on timezone,
 * language, or navigator locale.
 */
function detectCurrency(): CurrencyCode {
  try {
    // Check timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.startsWith('Europe/London') || tz.startsWith('Europe/Belfast')) {
      return 'GBP';
    }

    // Check navigator language
    const lang = navigator.language || '';
    if (lang === 'en-GB') {
      return 'GBP';
    }

    // Check locale currency
    const parts = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'GBP' })
      .resolvedOptions();
    if (parts.locale?.startsWith('en-GB')) {
      return 'GBP';
    }
  } catch {
    // Fallback
  }
  return 'USD';
}

export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyCode>(() => detectCurrency());

  const info = CURRENCIES[currency];

  const formatPrice = (usdPrice: number): string => {
    const converted = Math.round(usdPrice * info.rate);
    return `${info.symbol}${converted}`;
  };

  const toggle = () => {
    setCurrency((prev) => (prev === 'USD' ? 'GBP' : 'USD'));
  };

  return { currency, setCurrency, symbol: info.symbol, rate: info.rate, formatPrice, toggle };
}
