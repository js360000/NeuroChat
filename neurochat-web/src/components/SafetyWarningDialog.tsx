import { AlertTriangle, X } from 'lucide-react'
import type { SafetyWarning } from '@/lib/safety'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  warnings: SafetyWarning[]
  onConfirm: () => void
  onCancel: () => void
}

const TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  credit_card: { color: 'text-red-400', label: 'Financial data' },
  phone: { color: 'text-amber-400', label: 'Phone number' },
  email: { color: 'text-amber-400', label: 'Email address' },
  nsfw: { color: 'text-red-400', label: 'Harmful content' },
}

export function SafetyWarningDialog({ open, warnings, onConfirm, onCancel }: Props) {
  if (!open || warnings.length === 0) return null

  const hasNsfw = warnings.some((w) => w.type === 'nsfw')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="glass-heavy rounded-2xl p-6 max-w-sm w-full space-y-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="font-semibold">Content warning</h3>
          </div>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-muted/50"><X className="w-4 h-4" /></button>
        </div>

        <p className="text-xs text-muted-foreground">
          We detected content that might contain personal or sensitive information.
        </p>

        <div className="space-y-2">
          {warnings.map((w, i) => {
            const config = TYPE_CONFIG[w.type] || { color: 'text-amber-400', label: 'Warning' }
            return (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/20">
                <span className={cn('text-[10px] font-bold uppercase px-1.5 py-0.5 rounded', config.color, 'bg-current/10')}>
                  {config.label}
                </span>
                <p className="text-xs text-muted-foreground flex-1">{w.message}</p>
              </div>
            )
          })}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-all">
            Edit message
          </button>
          {!hasNsfw && (
            <button onClick={onConfirm}
              className="flex-1 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-all">
              Send anyway
            </button>
          )}
        </div>

        {hasNsfw && (
          <p className="text-[10px] text-red-400 text-center">
            Messages containing harmful content cannot be sent.
          </p>
        )}
      </div>
    </div>
  )
}
