import { useState } from 'react'
import { FileText, Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import { aiApi } from '@/lib/api/ai'
import { cn } from '@/lib/utils'
import type { Message, AISummary } from '@/types'

interface ConversationSummaryProps {
  messages: Message[]
  className?: string
}

export function ConversationSummary({ messages, className }: ConversationSummaryProps) {
  const [summary, setSummary] = useState<AISummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  async function generateSummary() {
    if (messages.length < 3) return
    setIsLoading(true)
    try {
      const formatted = messages.slice(-20).map((m) => ({
        sender: m.sender.name,
        content: m.content,
      }))
      const data = await aiApi.summarizeConversation(formatted)
      setSummary(data.summary)
      setIsExpanded(true)
    } catch {
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }

  if (messages.length < 3) return null

  return (
    <div className={cn('', className)}>
      {!summary ? (
        <button
          onClick={generateSummary}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileText className="w-3.5 h-3.5" />
          )}
          {isLoading ? 'Summarising...' : 'Summarise chat'}
        </button>
      ) : (
        <div className="glass rounded-xl overflow-hidden animate-scale-in">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full p-3 hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium">Conversation Summary</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          {isExpanded && (
            <div className="px-3 pb-3 space-y-2 animate-fade-in">
              <p className="text-xs text-muted-foreground leading-relaxed">{summary.summary}</p>
              {summary.highlights.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {summary.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] text-primary font-medium"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={generateSummary}
                className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
              >
                Refresh summary
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
