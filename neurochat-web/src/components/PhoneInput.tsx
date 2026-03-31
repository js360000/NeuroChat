import { useState, useEffect } from 'react'
import { Phone, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatE164 } from '@/lib/phone'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function PhoneInput({ value, onChange, className }: PhoneInputProps) {
  const [raw, setRaw] = useState(value || '')
  const [valid, setValid] = useState<boolean | null>(null)

  useEffect(() => {
    if (!raw.trim()) { setValid(null); return }
    const e164 = formatE164(raw)
    if (e164) {
      setValid(true)
      onChange(e164)
    } else {
      setValid(false)
    }
  }, [raw])

  // Sync external value changes
  useEffect(() => { if (value !== raw && value) setRaw(value) }, [value])

  return (
    <div className={cn('space-y-1', className)}>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
        <input
          type="tel"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="+44 7700 900000"
          className={cn(
            'w-full pl-10 pr-10 py-2.5 rounded-xl bg-muted/40 glass text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 transition-all',
            valid === true && 'focus:ring-emerald-400/50 ring-1 ring-emerald-400/30',
            valid === false && 'focus:ring-red-400/50 ring-1 ring-red-400/30',
            valid === null && 'focus:ring-primary/30',
          )}
        />
        {valid !== null && (
          <div className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center',
            valid ? 'bg-emerald-500/20' : 'bg-red-500/20'
          )}>
            {valid ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-red-400" />}
          </div>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground/60 px-1">
        Include country code, e.g. +44 7700 900000
      </p>
    </div>
  )
}
