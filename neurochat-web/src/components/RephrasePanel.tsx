import { useState } from 'react'
import { Wand2, ArrowRight, Loader2 } from 'lucide-react'
import { aiApi } from '@/lib/api/ai'
import { cn } from '@/lib/utils'

interface RephrasePanelProps {
  text: string
  onSelect: (text: string) => void
  className?: string
}

export function RephrasePanel({ text, onSelect, className }: RephrasePanelProps) {
  const [gentle, setGentle] = useState('')
  const [direct, setDirect] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  async function rephrase() {
    if (!text.trim() || isLoading) return
    setIsLoading(true)
    setIsOpen(true)
    try {
      const data = await aiApi.rephraseMessage(text)
      setGentle(data.rephrase.gentle)
      setDirect(data.rephrase.direct)
    } catch {
      setGentle('')
      setDirect('')
    } finally {
      setIsLoading(false)
    }
  }

  if (!text.trim()) return null

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={rephrase}
        disabled={isLoading}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all',
          'text-muted-foreground hover:text-primary hover:bg-primary/10',
          isOpen && 'text-primary bg-primary/10'
        )}
        title="Rephrase your message with AI"
      >
        <Wand2 className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
        <span className="hidden sm:inline">Rephrase</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 p-3 rounded-xl glass-heavy shadow-lg z-50 animate-scale-in">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">
            AI Suggestions
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="ml-2 text-xs text-muted-foreground">Thinking...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {gentle && (
                <button
                  onClick={() => { onSelect(gentle); setIsOpen(false) }}
                  className="w-full text-left p-2.5 rounded-lg bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors group"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-medium text-emerald-400">Gentle</span>
                    <ArrowRight className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-foreground/80">{gentle}</p>
                </button>
              )}
              {direct && (
                <button
                  onClick={() => { onSelect(direct); setIsOpen(false) }}
                  className="w-full text-left p-2.5 rounded-lg bg-blue-500/5 hover:bg-blue-500/10 transition-colors group"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-medium text-blue-400">Direct</span>
                    <ArrowRight className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-foreground/80">{direct}</p>
                </button>
              )}
              {!gentle && !direct && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Couldn't generate alternatives. Try a longer message.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
